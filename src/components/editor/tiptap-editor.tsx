'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import ImageExtension from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
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
  Layers,
  Library,
  FileUp,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { micromark } from 'micromark';
import { gfmTable, gfmTableHtml } from 'micromark-extension-gfm-table';
import TurndownService from 'turndown';
import { GameItemEmbed, TierlistBlock, SmartMention, SmartMentionHighlight } from './extensions';
import { MediaLibrary } from '@/components/ui/media-library';

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  bulletListMarker: '-',
});

type TiptapEditorProps = {
  content: string;
  onChange: (text: string) => void;
  placeholder?: string;
  articleId?: string;
  tenantId?: string;
};

export default function TiptapEditor({ content, onChange, placeholder, articleId, tenantId }: TiptapEditorProps) {
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
      SmartMention,
      SmartMentionHighlight,
    ],
    content: parseInitialContent(content),
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const md = turndown.turndown(html);
      onChange(md);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[300px] px-4 py-3',
      },
    },
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [importingFile, setImportingFile] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [slug, setSlug] = useState('');
  const [showLibrary, setShowLibrary] = useState(false);

  useEffect(() => {
    const parts = window.location.pathname.split('/');
    const dashIdx = parts.indexOf('dashboard');
    if (dashIdx !== -1 && parts[dashIdx + 1]) {
      setSlug(parts[dashIdx + 1]);
    }
  }, []);

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
  }, [editor, articleId, slug]);

  const handleImportFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      const { toast } = await import('@/hooks/use-toast');
      toast({ variant: 'destructive', title: 'Erro', description: 'Arquivo muito grande. Máximo 10MB.' });
      if (importInputRef.current) importInputRef.current.value = '';
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'text/x-markdown',
    ];
    const allowedExts = ['.pdf', '.doc', '.docx', '.txt', '.md'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExts.includes(ext) && !allowedTypes.includes(file.type)) {
      const { toast } = await import('@/hooks/use-toast');
      toast({ variant: 'destructive', title: 'Erro', description: 'Tipo de arquivo não suportado. Use PDF, DOC, DOCX, TXT ou MD.' });
      if (importInputRef.current) importInputRef.current.value = '';
      return;
    }

    setImportingFile(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const fileDataUri = reader.result as string;
        const { extractTextFromFile } = await import('@/ai/flows/extract-text-from-file-flow');
        const result = await extractTextFromFile({ fileDataUri, extractionType: 'markdown' });

        if (result.extractedText) {
          const html = micromark(result.extractedText, {
            allowDangerousHtml: true,
            extensions: [gfmTable()],
            htmlExtensions: [gfmTableHtml()],
          });
          editor.chain().focus().insertContent(html).run();
          const { toast } = await import('@/hooks/use-toast');
          toast({ title: 'Conteúdo Importado!', description: 'O conteúdo foi extraído e inserido no editor.' });
        } else {
          throw new Error('A IA não retornou texto.');
        }
      };
      reader.onerror = () => {
        throw new Error('Erro ao ler o arquivo.');
      };
    } catch (error) {
      console.error('Erro ao importar arquivo:', error);
      const { toast } = await import('@/hooks/use-toast');
      toast({ variant: 'destructive', title: 'Erro na Importação', description: 'Não foi possível extrair o conteúdo do arquivo.' });
    } finally {
      setImportingFile(false);
      if (importInputRef.current) importInputRef.current.value = '';
    }
  }, [editor]);

  const handleLinkAdd = useCallback(() => {
    const url = window.prompt('URL do link:');
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  if (!editor) return null;

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
        {(tenantId || slug) && (
          <ToolbarButton onClick={() => setShowLibrary(true)}>
            <Library className="h-4 w-4" />
          </ToolbarButton>
        )}
        <ToolbarButton onClick={handleLinkAdd} active={editor.isActive('link')}>
          <Link className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        <input
          type="file"
          ref={importInputRef}
          onChange={handleImportFile}
          style={{ display: 'none' }}
          accept=".pdf,.doc,.docx,.txt,.md"
        />
        <ToolbarButton onClick={() => importInputRef.current?.click()}>
          {importingFile ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
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
      <MediaLibrary
        open={showLibrary}
        onOpenChange={setShowLibrary}
        tenantId={tenantId || slug}
        onSelect={(url) => {
          if (editor) {
            editor.chain().focus().setImage({ src: url }).run();
          }
        }}
      />
    </div>
  );
}

function ToolbarButton({ onClick, active, children }: any) {
  return (
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
}

function Divider() {
  return <div className="w-px h-5 bg-border mx-1" />;
}

function parseInitialContent(content: string): any {
  if (!content) return '';

  // Try parsing as TipTap JSON
  try {
    const parsed = JSON.parse(content);
    if (parsed && parsed.type === 'doc') return parsed;
  } catch {
    // Not JSON
  }

  // If it looks like HTML, use it directly
  if (content.trim().startsWith('<')) {
    return content;
  }

  // Convert markdown to HTML for proper rendering in TipTap
  try {
    return micromark(content, {
      allowDangerousHtml: true,
      extensions: [gfmTable()],
      htmlExtensions: [gfmTableHtml()],
    });
  } catch {
    return content;
  }
}
