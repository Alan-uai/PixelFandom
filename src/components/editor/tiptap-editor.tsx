'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import ImageExtension from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Code,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Image,
  Link,
  Undo,
  Redo,
  Upload,
  Loader2,
  Gamepad2,
  Layers,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { GameItemEmbed, TierlistBlock } from './extensions';
import { GameItemSelector } from './game-item-selector';

type TiptapEditorProps = {
  content: string;
  onChange: (html: string, json: string) => void;
  placeholder?: string;
  articleId?: string;
};

export default function TiptapEditor({ content, onChange, placeholder, articleId }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({ placeholder: placeholder || 'Escreva seu conteúdo aqui...' }),
      ImageExtension,
      LinkExtension.configure({ openOnClick: false }),
      Underline,
      GameItemEmbed,
      TierlistBlock,
    ],
    content: parseInitialContent(content),
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const json = JSON.stringify(editor.getJSON());
      onChange(html, json);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[300px] px-4 py-3',
      },
    },
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [slug, setSlug] = useState('');
  const [showGameItemSelector, setShowGameItemSelector] = useState(false);

  useEffect(() => {
    const parts = window.location.pathname.split('/');
    const dashIdx = parts.indexOf('dashboard');
    if (dashIdx !== -1 && parts[dashIdx + 1]) {
      setSlug(parts[dashIdx + 1]);
    }
  }, []);

  const handleGameItemSelect = useCallback((table: string, itemId: string, itemName: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent({
      type: 'gameItemEmbed',
      attrs: { table, itemId, itemName },
    }).run();
  }, [editor]);

  const handleInsertTierlist = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().insertContent({
      type: 'tierlistBlock',
      attrs: {
        table: '',
        title: 'Nova Tierlist',
        tiers: JSON.stringify([
          { label: 'S', color: 'red', itemIds: [] },
          { label: 'A', color: 'orange', itemIds: [] },
          { label: 'B', color: 'yellow', itemIds: [] },
          { label: 'C', color: 'green', itemIds: [] },
          { label: 'D', color: 'blue', itemIds: [] },
          { label: 'F', color: 'gray', itemIds: [] },
        ]),
      },
    }).run();
  }, [editor]);

  const handleImageUpload = useCallback(() => {
    const url = window.prompt('URL da imagem:');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const handleImageFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    setUploadingImage(true);
    try {
      const { ensureStorageBuckets } = await import('@/lib/storage');
      const { supabase } = await import('@/supabase');
      await ensureStorageBuckets();
      const filePath = `${slug}/content/${articleId || 'no-article'}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('wiki-assets')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from('wiki-assets')
        .getPublicUrl(filePath);
      editor.chain().focus().setImage({ src: publicUrl }).run();
    } catch (err: any) {
      console.error('Erro ao enviar imagem:', err);
      const { toast } = await import('@/hooks/use-toast');
      toast({ variant: 'destructive', title: 'Erro no upload', description: 'Não foi possível enviar a imagem para o editor.' });
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  }, [editor, articleId]);

  const handleLinkAdd = useCallback(() => {
    const url = window.prompt('URL do link:');
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  if (!editor) return null;

  const ToolbarButton = ({ onClick, active, children }: any) => (
    <button
      type="button"
      onClick={onClick}
      className={`p-1.5 rounded hover:bg-muted transition-colors ${
        active ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
      }`}
    >
      {children}
    </button>
  );

  const Divider = () => <div className="w-px h-5 bg-border mx-1" />;

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b bg-muted/30">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')}>
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')}>
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')}>
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')}>
          <Code className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })}>
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })}>
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })}>
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')}>
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')}>
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')}>
          <Quote className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton onClick={() => setShowGameItemSelector(true)}>
          <Gamepad2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={handleInsertTierlist}>
          <Layers className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        <input
          type="file"
          ref={imageInputRef}
          onChange={handleImageFileUpload}
          style={{ display: 'none' }}
          accept="image/*"
        />
        <ToolbarButton onClick={() => imageInputRef.current?.click()}>
          {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        </ToolbarButton>
        <ToolbarButton onClick={handleImageUpload}>
          <Image className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={handleLinkAdd} active={editor.isActive('link')}>
          <Link className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton onClick={() => editor.chain().focus().undo().run()}>
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()}>
          <Redo className="h-4 w-4" />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
      {slug && (
        <GameItemSelector
          open={showGameItemSelector}
          onClose={() => setShowGameItemSelector(false)}
          onSelect={handleGameItemSelect}
          tenantId={slug}
        />
      )}
    </div>
  );
}

function parseInitialContent(content: string): any {
  if (!content) return '';

  // Try parsing as TipTap JSON
  try {
    const parsed = JSON.parse(content);
    if (parsed && parsed.type === 'doc') return parsed;
  } catch {
    // Not JSON — treat as HTML or markdown
  }

  // If it looks like HTML, use it directly
  if (content.trim().startsWith('<')) {
    return content;
  }

  // Otherwise return as plain text (TipTap will wrap in paragraph)
  return content;
}
