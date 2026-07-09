import { Label } from '@beat/ui'
import { useEffect, useRef } from 'react'

export interface EventDescriptionEditorProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

type FormatCommand =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'insertOrderedList'
  | 'insertUnorderedList'

const TOOLBAR_ITEMS: Array<{ command: FormatCommand; label: string }> = [
  { command: 'bold', label: 'B' },
  { command: 'italic', label: 'I' },
  { command: 'underline', label: 'U' },
  { command: 'insertOrderedList', label: '1.' },
  { command: 'insertUnorderedList', label: '•' },
]

export function EventDescriptionEditor({
  id,
  label,
  value,
  onChange,
  placeholder,
}: EventDescriptionEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const editor = editorRef.current
    if (!editor || editor.innerHTML === value) {
      return
    }
    editor.innerHTML = value
  }, [value])

  const syncValue = () => {
    onChange(editorRef.current?.innerHTML ?? '')
  }

  const applyFormat = (command: FormatCommand) => {
    editorRef.current?.focus()
    document.execCommand(command, false)
    syncValue()
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="overflow-hidden rounded-md border border-input bg-transparent shadow-sm focus-within:ring-1 focus-within:ring-ring">
        <div className="flex items-center gap-1 border-b border-input px-2 py-1.5">
          {TOOLBAR_ITEMS.map((item) => (
            <button
              key={item.command}
              type="button"
              aria-label={item.command}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => applyFormat(item.command)}
              className="flex h-8 min-w-8 items-center justify-center rounded px-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <span
                className={
                  item.command === 'bold'
                    ? 'font-bold'
                    : item.command === 'italic'
                      ? 'italic'
                      : item.command === 'underline'
                        ? 'underline'
                        : ''
                }
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>
        <div
          id={id}
          ref={editorRef}
          role="textbox"
          aria-multiline="true"
          contentEditable
          suppressContentEditableWarning
          data-placeholder={placeholder}
          onInput={syncValue}
          className="min-h-[160px] px-3 py-2 text-sm outline-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]"
        />
      </div>
    </div>
  )
}
