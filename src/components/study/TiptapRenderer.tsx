import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';

type Props = {
  content: any;
};

export const TiptapRenderer = ({ content }: Props) => {
  const editor = useEditor({
    editable: false,
    extensions: [
      StarterKit,
      Image.configure({
        inline: false,
        allowBase64: true, // jeśli zapisujesz base64
      }),
    ],
    content,
  });

  if (!editor) return null;

  return <EditorContent editor={editor} />;
};