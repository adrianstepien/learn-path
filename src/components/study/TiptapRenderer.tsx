import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { InlineImageResize } from '@/components/texteditor/InlineImageResize';

type Props = {
  content: string;
};

export const TiptapRenderer = ({ content }: Props) => {
  const editor = useEditor({
    editable: false,
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      InlineImageResize,
    ],
    content,
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content ?? '', { emitUpdate: false });
    }
  }, [content, editor]);

  if (!editor) return null;

  return <EditorContent editor={editor} />;
};