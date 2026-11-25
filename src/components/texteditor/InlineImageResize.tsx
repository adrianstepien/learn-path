import { Node, mergeAttributes } from '@tiptap/core';
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  type NodeViewProps,
} from '@tiptap/react';
import { useEffect, useRef, useState } from 'react';

type ResizeDirection =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | null;

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    inlineImage: {
      setInlineImage: (options: {
        src: string;
        alt?: string;
        title?: string;
        width?: number;
      }) => ReturnType;
    };
  }
}

const isSafeImageSrc = (src: unknown): src is string => {
  if (typeof src !== 'string') return false;
  const trimmed = src.trim();
  return (
    /^https?:\/\//i.test(trimmed) ||
    /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(trimmed)
  );
};

const parseWidth = (value: unknown, fallback = 200): number => {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? Math.round(num) : fallback;
};

const InlineImageComponent = ({
  node,
  updateAttributes,
  editor,
}: NodeViewProps) => {
  const isEditable = editor.isEditable;
  const [activeHandle, setActiveHandle] = useState<ResizeDirection>(null);
  const [isSelected, setIsSelected] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const startResize = (
    e: React.MouseEvent | React.TouchEvent,
    direction: ResizeDirection
  ) => {
    if (!isEditable) return;
    if ('touches' in e && e.touches.length === 0) return;

    e.preventDefault();
    e.stopPropagation();
    setActiveHandle(direction);

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    startXRef.current = clientX;
    startWidthRef.current = parseWidth(
      node.attrs.width,
      imgRef.current?.offsetWidth || 200
    );
  };

  useEffect(() => {
    if (!activeHandle || !isEditable) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      let clientX: number;
      if ('touches' in e) {
        if (e.touches.length === 0) return;
        e.preventDefault();
        clientX = e.touches[0].clientX;
      } else {
        clientX = e.clientX;
      }

      const diff = clientX - startXRef.current;

      // Ciągnięcie za lewe rogi w lewo (ujemny diff) powiększa obrazek
      let newWidth =
        activeHandle === 'top-left' || activeHandle === 'bottom-left'
          ? startWidthRef.current - diff
          : startWidthRef.current + diff;

      const containerWidth =
        imgRef.current?.parentElement?.parentElement?.offsetWidth || 1000;
      newWidth = Math.round(Math.max(50, Math.min(newWidth, containerWidth)));

      updateAttributes({ width: newWidth });
    };

    const handleEnd = () => {
      setActiveHandle(null);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [activeHandle, isEditable, updateAttributes]);

  if (!isSafeImageSrc(node.attrs.src)) {
    return null;
  }

  const width = parseWidth(node.attrs.width, 200);
  const height = node.attrs.height || 'auto';
  const isResizing = activeHandle !== null;
  const showHandles = isEditable && (isSelected || isResizing);

  const handleClasses =
    'absolute w-3 h-3 bg-primary border border-background rounded-full shadow-sm z-10 transition-transform hover:scale-125';

  return (
    <NodeViewWrapper
      as="span"
      className="inline-image-wrapper"
      style={{
        display: 'inline-block',
        position: 'relative',
        verticalAlign: 'middle',
        margin: '0 2px',
        lineHeight: 0,
        cursor: isEditable && isResizing ? 'ew-resize' : 'default',
      }}
      onMouseEnter={() => isEditable && setIsSelected(true)}
      onMouseLeave={() => !isResizing && setIsSelected(false)}
    >
      <img
        ref={imgRef}
        src={node.attrs.src}
        alt={node.attrs.alt || ''}
        title={node.attrs.title || ''}
        className={showHandles ? 'ring-2 ring-primary' : ''}
        style={{
          margin: 0,
          width: `${width}px`,
          height: height === 'auto' ? 'auto' : `${height}px`,
          display: 'block',
          maxWidth: '100%',
          userSelect: 'none',
          pointerEvents: isResizing ? 'none' : 'auto',
          borderRadius: '4px',
        }}
        draggable={false}
      />

      {showHandles && (
        <>
          <div
            onMouseDown={(e) => startResize(e, 'top-left')}
            onTouchStart={(e) => startResize(e, 'top-left')}
            className={`${handleClasses} -top-1.5 -left-1.5 cursor-nwse-resize`}
          />
          <div
            onMouseDown={(e) => startResize(e, 'top-right')}
            onTouchStart={(e) => startResize(e, 'top-right')}
            className={`${handleClasses} -top-1.5 -right-1.5 cursor-nesw-resize`}
          />
          <div
            onMouseDown={(e) => startResize(e, 'bottom-left')}
            onTouchStart={(e) => startResize(e, 'bottom-left')}
            className={`${handleClasses} -bottom-1.5 -left-1.5 cursor-nesw-resize`}
          />
          <div
            onMouseDown={(e) => startResize(e, 'bottom-right')}
            onTouchStart={(e) => startResize(e, 'bottom-right')}
            className={`${handleClasses} -bottom-1.5 -right-1.5 cursor-nwse-resize`}
          />
        </>
      )}
    </NodeViewWrapper>
  );
};

export const InlineImageResize = Node.create({
  name: 'inlineImage',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      width: {
        default: 200,
      },
      height: {
        default: 'auto',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]:not([data-block-image])',
        getAttrs: (dom) => {
          const element = dom as HTMLElement;
          const src = element.getAttribute('src');
          if (!isSafeImageSrc(src)) return false;

          return {
            src: src.trim(),
            alt: element.getAttribute('alt'),
            title: element.getAttribute('title'),
            width: parseWidth(element.getAttribute('width'), 200),
            height: element.getAttribute('height') || 'auto',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(InlineImageComponent);
  },

  addCommands() {
    return {
      setInlineImage:
        (options) =>
        ({ commands }) => {
          if (!isSafeImageSrc(options.src)) return false;
          return commands.insertContent({
            type: this.name,
            attrs: {
              ...options,
              width: parseWidth(options.width, 200),
            },
          });
        },
    };
  },
});