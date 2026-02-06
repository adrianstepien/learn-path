import { useEffect, useRef, useCallback, memo } from 'react';
import EditorJS, { OutputData } from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import ImageTool from '@editorjs/image';
import { cn } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/api/config';

interface EditorJsComponentProps {
  data?: OutputData;
  onChange: (data: OutputData) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  editorId: string; // unique id to avoid conflicts when multiple editors
}

const EditorJsComponent = memo(({
  data,
  onChange,
  placeholder = 'Zacznij pisać...',
  readOnly = false,
  className,
  editorId,
}: EditorJsComponentProps) => {
  const editorRef = useRef<EditorJS | null>(null);
  const holderRef = useRef<HTMLDivElement>(null);
  const isReady = useRef(false);
  const initialData = useRef(data);

  const initEditor = useCallback(async () => {
    if (!holderRef.current || editorRef.current) return;

    const editor = new EditorJS({
      holder: holderRef.current,
      data: initialData.current || { blocks: [] },
      readOnly,
      placeholder,
      autofocus: false,
      tools: {
        header: {
          class: Header as any,
          config: {
            levels: [1, 2, 3],
            defaultLevel: 2,
          },
        },
        list: {
          class: List as any,
          inlineToolbar: true,
          config: {
            defaultStyle: 'unordered',
          },
        },
        image: {
          class: ImageTool as any,
          config: {
            endpoints: {
              byFile: `${API_BASE_URL}/api/images/upload`,
            },
            field: 'file',
            types: 'image/*',
            captionPlaceholder: 'Podpis obrazu',
            buttonContent: 'Wybierz obraz',
          },
        },
      },
      onChange: async () => {
        if (!editorRef.current || !isReady.current) return;
        try {
          const savedData = await editorRef.current.save();
          onChange(savedData);
        } catch (error) {
          console.error('EditorJS save error:', error);
        }
      },
      onReady: () => {
        isReady.current = true;
      },
    });

    editorRef.current = editor;
  }, [onChange, placeholder, readOnly]);

  useEffect(() => {
    initEditor();

    return () => {
      if (editorRef.current && isReady.current) {
        editorRef.current.destroy();
        editorRef.current = null;
        isReady.current = false;
      }
    };
  }, [initEditor]);

  // Update editor data when prop changes (for edit mode)
  useEffect(() => {
    const updateData = async () => {
      if (editorRef.current && isReady.current && data) {
        // Only update if data is different from current
        try {
          await editorRef.current.render(data);
        } catch (error) {
          console.error('EditorJS render error:', error);
        }
      }
    };

    // Wait a bit for editor to be ready
    const timeout = setTimeout(updateData, 100);
    return () => clearTimeout(timeout);
  }, [data]);

  return (
    <div
      className={cn(
        'rounded-md border border-input bg-background p-4 min-h-[150px]',
        'prose prose-sm dark:prose-invert max-w-none',
        'prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1',
        '[&_.ce-block]:mb-2',
        '[&_.ce-toolbar__content]:max-w-none',
        '[&_.ce-block__content]:max-w-none',
        '[&_.codex-editor__redactor]:pb-4',
        className
      )}
    >
      <div ref={holderRef} id={editorId} />
    </div>
  );
});

EditorJsComponent.displayName = 'EditorJsComponent';

export { EditorJsComponent };
export type { OutputData };
