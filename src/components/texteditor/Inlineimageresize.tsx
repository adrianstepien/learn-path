import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { useEffect, useRef, useState } from 'react';

// Custom NodeView Component for Inline Resizable Images
const InlineImageComponent = ({ node, updateAttributes, deleteNode }: any) => {
  const [isResizing, setIsResizing] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = node.attrs.width || imgRef.current?.offsetWidth || 200;
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - startXRef.current;
      const newWidth = Math.max(50, Math.min(1000, startWidthRef.current + diff));
      updateAttributes({ width: newWidth });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, updateAttributes]);

  const width = node.attrs.width || 200;
  const height = node.attrs.height || 'auto';

  return (
    <NodeViewWrapper
      as="span"
      className="inline-image-wrapper"
      style={{
        display: 'inline-block',
        position: 'relative',
        verticalAlign: 'middle',
        margin: '0 2px',
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
        style={{
          width: `${width}px`,
          height: height === 'auto' ? 'auto' : `${height}px`,
          display: 'block',
          maxWidth: '100%',
          userSelect: 'none',
        }}
        draggable={false}
      />

      {/* Resize Handles - Only show on hover/select */}
      {isSelected && (
        <>
          {/* Left Handle */}
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsResizing(true);
              startXRef.current = e.clientX;
              startWidthRef.current = node.attrs.width || imgRef.current?.offsetWidth || 200;
              // For left handle, we need to adjust differently
              const originalMouseMove = (ev: MouseEvent) => {
                const diff = startXRef.current - ev.clientX; // Reversed
                const newWidth = Math.max(50, Math.min(1000, startWidthRef.current + diff));
                updateAttributes({ width: newWidth });
              };
              const originalMouseUp = () => {
                setIsResizing(false);
                document.removeEventListener('mousemove', originalMouseMove);
                document.removeEventListener('mouseup', originalMouseUp);
              };
              document.addEventListener('mousemove', originalMouseMove);
              document.addEventListener('mouseup', originalMouseUp);
            }}
            style={{
              position: 'absolute',
              left: '-4px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '8px',
              height: '40px',
              backgroundColor: '#3b82f6',
              borderRadius: '4px',
              cursor: 'ew-resize',
              zIndex: 10,
            }}
          />

          {/* Right Handle */}
          <div
            onMouseDown={handleMouseDown}
            style={{
              position: 'absolute',
              right: '-4px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '8px',
              height: '40px',
              backgroundColor: '#3b82f6',
              borderRadius: '4px',
              cursor: 'ew-resize',
              zIndex: 10,
            }}
          />

          {/* Corner Handles */}
          <div
            onMouseDown={handleMouseDown}
            style={{
              position: 'absolute',
              right: '-4px',
              bottom: '-4px',
              width: '12px',
              height: '12px',
              backgroundColor: '#3b82f6',
              borderRadius: '50%',
              cursor: 'nwse-resize',
              zIndex: 10,
            }}
          />
          <div
            onMouseDown={handleMouseDown}
            style={{
              position: 'absolute',
              left: '-4px',
              bottom: '-4px',
              width: '12px',
              height: '12px',
              backgroundColor: '#3b82f6',
              borderRadius: '50%',
              cursor: 'nesw-resize',
              zIndex: 10,
            }}
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