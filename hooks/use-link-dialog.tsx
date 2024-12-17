// hooks/use-link-dialog.tsx
import { useState, useCallback } from "react";
import { Editor } from "@tiptap/react";

export function useLinkDialog(editor: Editor) {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState("");

  const openDialog = useCallback(() => {
    const previousUrl = editor.getAttributes("link").href;
    setUrl(previousUrl || "");
    setIsOpen(true);
  }, [editor]);

  const closeDialog = useCallback(() => {
    setUrl("");
    setIsOpen(false);
  }, []);

  const saveLink = useCallback(() => {
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    } else {
      editor.chain().focus().unsetLink().run();
    }
    closeDialog();
  }, [url, editor, closeDialog]);

  const removeLink = useCallback(() => {
    editor.chain().focus().unsetLink().run();
    closeDialog();
  }, [editor, closeDialog]);

  return {
    isOpen,
    url,
    setUrl,
    openDialog,
    closeDialog,
    saveLink,
    removeLink,
  };
}
