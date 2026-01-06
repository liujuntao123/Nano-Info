import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip } from '@/components/ui/tooltip'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useAppStore } from '@/stores/useAppStore'
import { getStyleById } from '@/data/visualStyles'
import { generateImage } from '@/utils/imageGeneration'
import { Loader2, Copy, Check, Download, RotateCcw, FileText, ImageIcon, Sparkles, Pencil } from 'lucide-react'

export function ContentBlocksSection() {
  const {
    contentBlocks,
    updateContentBlockText,
    updateContentBlockTitle,
    setBlockGenerating,
    setBlockImage,
    setBlockShowImage,
    isProcessing,
    error,
    selectedStyleId,
    aspectRatio,
    resolution,
    useStyleReference,
    imageApiConfig
  } = useAppStore()
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingTitleIndex, setEditingTitleIndex] = useState<number | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const selectedStyle = selectedStyleId ? getStyleById(selectedStyleId) : null

  const generateFullPrompt = (content: string, title?: string): string => {
    if (!selectedStyle) {
      return content
    }

    const promptObj: Record<string, string> = {
      title: title || '',
      background: selectedStyle.background,
      visual_style: selectedStyle.visual_style,
      word_style: selectedStyle.word_style,
      content_principle: selectedStyle.content_principle,
      negative_space: selectedStyle.negative_space,
      aspect_ratio: aspectRatio,
      resolution: resolution,
      "Crucial_requirement": "All text, titles, labels, and captions within the generated image must be rendered exclusively in Simplified Chinese characters as specified in the prompt.",
      content: content,
    }

    if (useStyleReference) {
      promptObj.style_reference = "参考截图里的视觉风格，但可以灵活调整内容和布局"
    }


    return JSON.stringify(promptObj)
  }

  const handleCopy = async (content: string, index: number) => {
    try {
      const block = contentBlocks[index]
      const prompt = generateFullPrompt(content, block?.title)
      await navigator.clipboard.writeText(prompt)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  // 获取参考图的 base64 数据
  const getReferenceImageBase64 = async (): Promise<string | undefined> => {
    if (!useStyleReference || !selectedStyle) return undefined

    try {
      const response = await fetch(selectedStyle.preview)
      const blob = await response.blob()
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1]
          resolve(base64)
        }
        reader.readAsDataURL(blob)
      })
    } catch {
      return undefined
    }
  }

  // 生成图像
  const handleGenerateImage = async (index: number) => {
    const block = contentBlocks[index]
    if (!block || !selectedStyle) return

    setBlockGenerating(index, true)

    try {
      const prompt = generateFullPrompt(block.text, block.title)
      const referenceImage = await getReferenceImageBase64()

      const result = await generateImage(imageApiConfig, {
        prompt,
        aspectRatio,
        resolution,
        referenceImage
      })

      if (result.success && result.image) {
        setBlockImage(index, result.image)
      } else {
        console.error('图像生成失败:', result.error)
      }
    } catch (err) {
      console.error('图像生成失败:', err)
    } finally {
      setBlockGenerating(index, false)
    }
  }

  // 下载图片
  const handleDownload = (index: number) => {
    const block = contentBlocks[index]
    if (!block?.generatedImage) return

    const link = document.createElement('a')
    link.href = `data:image/png;base64,${block.generatedImage}`
    const fileName = block.title || `generated-image-${index + 1}`
    link.download = `${fileName}.png`
    link.click()
  }

  // 重新生成
  const handleRegenerate = (index: number) => {
    handleGenerateImage(index)
  }

  // 切换显示模式
  const handleToggleView = (index: number) => {
    const block = contentBlocks[index]
    setBlockShowImage(index, !block.showImage)
  }

  if (isProcessing) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
        <p className="text-sm font-medium text-foreground">AI 正在处理内容...</p>
        <p className="text-[11px] mt-1.5 text-muted-foreground">这可能需要一些时间，请耐心等待</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 m-4">
        <p className="font-medium text-sm text-destructive">处理出错</p>
        <p className="text-[11px] mt-1 text-destructive/80">{error}</p>
      </div>
    )
  }

  if (contentBlocks.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <ImageIcon className="h-6 w-6 text-muted-foreground/60" />
        </div>
        <p className="text-sm font-medium text-foreground/80">尚无内容块</p>
        <p className="text-[11px] mt-1.5 text-muted-foreground">输入内容并点击"生成绘图信息"</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {contentBlocks.map((block, index) => (
          <div
            key={index}
            className="group relative bg-background rounded-2xl p-3 shadow-sm hover:shadow-xl transition-all duration-500 border border-border/40"
          >
            {/* 图片/内容区域 */}
            <div
              className="relative rounded-xl overflow-hidden bg-muted/30"
              style={{ aspectRatio: '16/9' }}
            >
              {/* 生成中遮罩 */}
              {block.isGenerating && (
                <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
                  <p className="text-[11px] text-muted-foreground">生成中...</p>
                </div>
              )}

              {/* 内容显示 */}
              {block.showImage && block.generatedImage ? (
                <img
                  src={`data:image/jpg;base64,${block.generatedImage}`}
                  alt={`生成的图像 ${index + 1}`}
                  className="w-full h-full object-contain cursor-zoom-in"
                  onClick={() => setPreviewImage(block.generatedImage!)}
                />
              ) : editingIndex === index ? (
                <Textarea
                  value={block.text}
                  onChange={(e) => updateContentBlockText(index, e.target.value)}
                  onBlur={() => setEditingIndex(null)}
                  autoFocus
                  className="absolute inset-0 w-full h-full resize-none border-0 rounded-xl text-xs p-3 overflow-y-auto bg-transparent focus:ring-0 focus-visible:ring-0"
                  placeholder="编辑此内容块..."
                />
              ) : (
                <div className="absolute inset-0 w-full h-full p-3 overflow-y-auto text-xs text-foreground whitespace-pre-wrap">
                  {block.text || <span className="text-muted-foreground">暂无内容</span>}
                </div>
              )}
            </div>

            {/* 底部信息和工具栏 */}
            <div className="mt-3 px-1 flex items-center justify-between">
              <div className="group/title flex items-center gap-1 min-w-0">
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground font-medium tracking-wide">
                    #{String(index + 1).padStart(2, '0')}
                  </p>
                  {editingTitleIndex === index ? (
                    <input
                      type="text"
                      value={block.title}
                      onChange={(e) => updateContentBlockTitle(index, e.target.value)}
                      onBlur={() => setEditingTitleIndex(null)}
                      onKeyDown={(e) => e.key === 'Enter' && setEditingTitleIndex(null)}
                      autoFocus
                      className="text-sm font-semibold text-foreground bg-transparent border-b border-primary outline-none w-full max-w-[200px]"
                      placeholder="输入标题..."
                    />
                  ) : (
                    <h4 className="text-sm font-semibold text-foreground truncate max-w-[200px]">
                      {block.title || `内容块 ${index + 1}`}
                    </h4>
                  )}
                </div>
                {editingTitleIndex !== index && (
                  <button
                    onClick={() => setEditingTitleIndex(index)}
                    className="opacity-0 group-hover/title:opacity-100 transition-opacity w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* 工具栏按钮 */}
              <div className="flex items-center gap-1">
                {block.showImage && block.generatedImage ? (
                  <>
                    <Tooltip content="下载图片">
                      <button
                        onClick={() => handleDownload(index)}
                        className="w-8 h-8 rounded-lg bg-muted/50 hover:bg-muted text-foreground/70 hover:text-foreground transition-all flex items-center justify-center"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </Tooltip>
                    <Tooltip content="重新生成">
                      <button
                        onClick={() => handleRegenerate(index)}
                        disabled={block.isGenerating}
                        className="w-8 h-8 rounded-lg bg-muted/50 hover:bg-muted text-foreground/70 hover:text-foreground transition-all flex items-center justify-center disabled:opacity-50"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    </Tooltip>
                    <Tooltip content="查看文字">
                      <button
                        onClick={() => handleToggleView(index)}
                        className="w-8 h-8 rounded-lg bg-muted/50 hover:bg-muted text-foreground/70 hover:text-foreground transition-all flex items-center justify-center"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                    </Tooltip>
                  </>
                ) : (
                  <>
                    <Tooltip content="编辑">
                      <button
                        onClick={() => setEditingIndex(index)}
                        className="w-8 h-8 rounded-lg bg-muted/50 hover:bg-muted text-foreground/70 hover:text-foreground transition-all flex items-center justify-center"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </Tooltip>
                    <Tooltip content={copiedIndex === index ? "已复制" : "复制提示词"}>
                      <button
                        onClick={() => handleCopy(block.text, index)}
                        disabled={!selectedStyle}
                        className="w-8 h-8 rounded-lg bg-muted/50 hover:bg-muted text-foreground/70 hover:text-foreground transition-all flex items-center justify-center disabled:opacity-50"
                      >
                        {copiedIndex === index ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </Tooltip>
                    {!block.generatedImage && (
                      <Tooltip content="生成图片">
                        <button
                          onClick={() => handleGenerateImage(index)}
                          disabled={!selectedStyle || block.isGenerating || !imageApiConfig.apiKey}
                          className="w-8 h-8 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-all flex items-center justify-center disabled:opacity-50"
                        >
                          <Sparkles className="h-4 w-4" />
                        </button>
                      </Tooltip>
                    )}
                    {block.generatedImage && (
                      <Tooltip content="查看图片">
                        <button
                          onClick={() => handleToggleView(index)}
                          className="w-8 h-8 rounded-lg bg-muted/50 hover:bg-muted text-foreground/70 hover:text-foreground transition-all flex items-center justify-center"
                        >
                          <ImageIcon className="h-4 w-4" />
                        </button>
                      </Tooltip>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {!selectedStyle && contentBlocks.length > 0 && (
        <p className="text-[11px] text-muted-foreground text-center py-4">
          请先选择视觉风格，然后才能复制完整提示词或生成图像
        </p>
      )}

      {/* 图片预览 Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl p-2">
          {previewImage && (
            <img src={`data:image/jpg;base64,${previewImage}`} alt="预览" className="w-full h-auto rounded" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
