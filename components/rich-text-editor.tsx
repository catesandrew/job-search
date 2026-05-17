'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import { InputRule, PasteRule } from '@tiptap/core'
import { Bold, Underline as UnderlineIcon, Italic, List, ListOrdered, Link as LinkIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const mdLinkHandler = ({ state, range, match }: { state: Parameters<ConstructorParameters<typeof InputRule>[0]['handler']>[0]['state'], range: { from: number; to: number }, match: RegExpMatchArray }) => {
  const [, text, href] = match
  const linkMark = state.schema.marks.link.create({ href })
  state.tr.replaceWith(range.from, range.to, state.schema.text(text, [linkMark]))
}

// Extend Link before configure so the input/paste rules are baked in
const LinkWithMarkdown = Link.extend({
  addInputRules() {
    return [
      new InputRule({
        find: /\[([^\]]+)\]\(([^)]+)\)$/,
        handler: mdLinkHandler,
      }),
    ]
  },
  addPasteRules() {
    return [
      new PasteRule({
        find: /\[([^\]]+)\]\(([^)]+)\)/g,
        handler: mdLinkHandler,
      }),
    ]
  },
})

interface RichTextEditorProps {
  value?: string
  onChange?: (html: string) => void
  onBlur?: (html: string) => void
  placeholder?: string
  className?: string
  minHeight?: string
}

export function RichTextEditor({
  value,
  onChange,
  onBlur,
  placeholder,
  className,
  minHeight = '120px',
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({
        placeholder: placeholder ?? '',
      }),
      LinkWithMarkdown.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
    onBlur: ({ editor }) => onBlur?.(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'outline-none p-3 text-sm prose prose-invert prose-sm max-w-none',
        style: `min-height: ${minHeight}`,
      },
    },
  })

  if (!editor) return null

  const btn = (active: boolean) =>
    cn('p-1.5 rounded hover:bg-white/10 transition-colors', active && 'bg-white/15 text-white')

  const insertLink = () => {
    const url = window.prompt('URL')
    if (!url) return
    if (editor.state.selection.empty) {
      const text = window.prompt('Link text') || url
      editor.chain().focus().insertContent(`<a href="${url}">${text}</a>`).run()
    } else {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  return (
    <div className={cn('rounded-md border border-border bg-background overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive('bold'))}>
          <Bold size={14} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive('italic'))}>
          <Italic size={14} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btn(editor.isActive('underline'))}>
          <UnderlineIcon size={14} />
        </button>
        <div className="w-px h-4 bg-border mx-1" />
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(editor.isActive('bulletList'))}>
          <List size={14} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn(editor.isActive('orderedList'))}>
          <ListOrdered size={14} />
        </button>
        <div className="w-px h-4 bg-border mx-1" />
        <button type="button" onClick={insertLink} className={btn(editor.isActive('link'))}>
          <LinkIcon size={14} />
        </button>
        <div className="flex-1" />
        <span className="text-[10px] text-muted-foreground/50 pr-1 select-none">
          **bold** _italic_ [text](url)
        </span>
      </div>

      {/* Editor */}
      <style>{`
        .tiptap-rte .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: hsl(var(--muted-foreground));
          opacity: 0.5;
          pointer-events: none;
          height: 0;
        }
        .tiptap-rte .ProseMirror:focus { outline: none; }
        .tiptap-rte .ProseMirror ul { list-style: disc; padding-left: 1.25rem; }
        .tiptap-rte .ProseMirror ol { list-style: decimal; padding-left: 1.25rem; }
        .tiptap-rte .ProseMirror li { margin-bottom: 0.125rem; }
        .tiptap-rte .ProseMirror a { color: #6ee7b7; text-decoration: underline; cursor: pointer; }
      `}</style>
      <div className="tiptap-rte">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
