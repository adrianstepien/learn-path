import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { useEffect, useRef, useState } from 'react';

type ResizeDirection = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | null;

const InlineImageComponent = ({ node, updateAttributes }: any) => {
  const [activeHandle, setActiveHandle] = useState<ResizeDirection>(null);
  const [isSelected, setIsSelected] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const startResize = (e: React.MouseEvent | React.TouchEvent, direction: ResizeDirection) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveHandle(direction);

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    startXRef.current = clientX;
    startWidthRef.current = node.attrs.width || imgRef.current?.offsetWidth || 200;
  };

  useEffect(() => {
    if (!activeHandle) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const diff = clientX - startXRef.current;

      let newWidth = startWidthRef.current;

      // Ciągnięcie za lewe rogi w lewo (ujemny diff) powiększa obrazek
      if (activeHandle === 'top-left' || activeHandle === 'bottom-left') {
        newWidth = startWidthRef.current - diff;
      } else {
        // Ciągnięcie za prawe rogi w prawo (dodatni diff) powiększa obrazek
        newWidth = startWidthRef.current + diff;
      }

    const containerWidth = imgRef.current?.parentElement?.parentElement?.offsetWidth || 1000;
      newWidth = Math.max(50, Math.min(newWidth, containerWidth));

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
  }, [activeHandle, updateAttributes]);

  const width = node.attrs.width || 200;
  const height = node.attrs.height || 'auto';
  const isResizing = activeHandle !== null;

  const handleClasses = "absolute w-3 h-3 bg-primary border border-background rounded-full shadow-sm z-10 transition-transform hover:scale-125";

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
        cursor: isResizing ? 'ew-resize' : 'default',
      }}
      onMouseEnter={() => setIsSelected(true)}
      onMouseLeave={() => !isResizing && setIsSelected(false)}
    >
      <img
        ref={imgRef}
        src={node.attrs.src}
        alt={node.attrs.alt || ''}
        title={node.attrs.title || ''}
        className={(isSelected || isResizing) ? 'ring-2 ring-primary' : ''}
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

      {(isSelected || isResizing) && (
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

// Custom Inline Image Extension
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
          return {
            src: element.getAttribute('src'),
            alt: element.getAttribute('alt'),
            title: element.getAttribute('title'),
            width: element.getAttribute('width') || 200,
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
        (options: { src: string; alt?: string; title?: string; width?: number }) =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});