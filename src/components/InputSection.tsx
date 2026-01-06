import { useRef } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useAppStore } from '@/stores/useAppStore'
import type { InputMode } from '@/types'
import { Upload, X, FileText } from 'lucide-react'

export function InputSection() {
  const {
    inputMode,
    setInputMode,
    textContent,
    setTextContent,
    fileName,
    setFileName,
  } = useAppStore()

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleTabChange = (value: string) => {
    setInputMode(value as InputMode)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)

    // 对于简单的文本文件，直接读取
    if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      const text = await file.text()
      setTextContent(text)
      return
    }

    // 对于 PDF 和 Word 文件，需要使用专门的解析库
    // 这里先设置文件名，实际解析在 fileParser.ts 中处理
    setTextContent(`[文件已上传: ${file.name}，正在解析...]`)

    // 触发文件解析事件
    window.dispatchEvent(
      new CustomEvent('file-upload', { detail: { file } })
    )
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && fileInputRef.current) {
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)
      fileInputRef.current.files = dataTransfer.files
      fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }))
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-foreground">内容输入</label>
        <Tabs value={inputMode} onValueChange={handleTabChange}>
          <TabsList className="h-7 p-0.5 bg-muted/60 rounded-md">
            <TabsTrigger
              value="input"
              className="h-6 px-3 text-[11px] rounded data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              文字输入
            </TabsTrigger>
            <TabsTrigger
              value="upload"
              className="h-6 px-3 text-[11px] rounded data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              文件上传
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {inputMode === 'input' ? (
        <div className="relative group">
          <Textarea
            id="user-input"
            placeholder="粘贴文章或指令指令..."
            className="h-40 resize-none bg-muted/30 border-border/60 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            maxLength={10000}
          />
          <div className="absolute bottom-3 right-3 text-[10px] text-muted-foreground font-mono">
            {textContent.length} / 10000
          </div>
        </div>
      ) : fileName ? (
        <div className="flex items-center gap-2 p-2 border border-border/60 rounded-lg bg-muted/30">
          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <span className="text-xs text-foreground font-medium truncate flex-1">{fileName}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setFileName('')
              setTextContent('')
              if (fileInputRef.current) fileInputRef.current.value = ''
            }}
            className="w-6 h-6 rounded-md hover:bg-muted flex items-center justify-center flex-shrink-0 transition-colors"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-[11px] text-primary hover:text-primary/80 font-medium px-2 flex-shrink-0"
          >
            更换
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.md"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      ) : (
        <div
          className="border-2 border-dashed border-border/60 rounded-xl p-6 text-center hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer group"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.md"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/10 transition-colors">
            <Upload className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <p className="text-sm text-foreground/80 mb-1">拖拽文件到此处，或点击上传</p>
          <p className="text-[11px] text-muted-foreground">支持 PDF、Word、Markdown、TXT</p>
        </div>
      )}

      {textContent && fileName && inputMode === 'upload' && (
        <div className="space-y-2">
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">文件内容预览</label>
          <Textarea
            className="min-h-[100px] max-h-[100px] resize-y bg-muted/30 border-border/60 rounded-xl text-xs"
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
          />
        </div>
      )}
    </div>
  )
}
