import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { InputSection } from '@/components/InputSection'
import { ContentBlocksSection } from '@/components/ContentBlocksSection'
import { StyleSelector } from '@/components/StyleSelector'
import { AspectRatioSelector } from '@/components/AspectRatioSelector'
import { ResolutionSelector } from '@/components/ResolutionSelector'
import { ImageCountInput } from '@/components/ImageCountInput'
import { APISettings } from '@/components/APISettings'
import { useAppStore } from '@/stores/useAppStore'
import { parseFile } from '@/utils/fileParser'
import { callAIWorkflow, determineInstructionType } from '@/utils/aiWorkflow'
import { Settings, Sparkles, PanelLeftClose, PanelLeft, Github } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import type { ContentBlockState } from '@/types'

function App() {
  const [showSettings, setShowSettings] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [showWechat, setShowWechat] = useState(false)
  const {
    textContent,
    splitCount,
    inputMode,
    apiConfig,
    setTextContent,
    setIsProcessing,
    setContentBlocks,
    setError,
    isProcessing,
  } = useAppStore()

  // 监听文件上传事件
  const handleFileUpload = useCallback(
    async (event: CustomEvent<{ file: File }>) => {
      try {
        const { file } = event.detail
        const text = await parseFile(file)
        setTextContent(text)
      } catch (err) {
        setError(err instanceof Error ? err.message : '文件解析失败')
      }
    },
    [setTextContent, setError]
  )

  useEffect(() => {
    const handler = handleFileUpload as unknown as EventListener
    window.addEventListener('file-upload', handler)
    return () => {
      window.removeEventListener('file-upload', handler)
    }
  }, [handleFileUpload])

  const handleProcess = async () => {
    if (!textContent.trim()) {
      setError('请先输入内容')
      return
    }

    if (!apiConfig.baseUrl || !apiConfig.apiKey) {
      setShowSettings(true)
      setError('请先配置 API')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const instructionType = determineInstructionType(textContent, inputMode)
      const wordCount = splitCount * 1000

      const blocks = await callAIWorkflow(apiConfig, {
        instruction_type: instructionType,
        instruction: textContent,
        split_number: splitCount,
        word_count: wordCount,
      })

      // 将 AIContentBlock 数组转换为 ContentBlockState 数组
      const blockStates: ContentBlockState[] = blocks.map((block) => ({
        title: block.title,
        text: block.content,
        generatedImage: null,
        isGenerating: false,
        showImage: false,
      }))

      setContentBlocks(blockStates)
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理失败')
    } finally {
      setIsProcessing(false)
    }
  }

  const isConfigured = apiConfig.baseUrl && apiConfig.apiKey

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="h-14 border-b border-border/60 bg-background flex items-center justify-between px-4 md:px-6 z-10 shrink-0">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSidebar(!showSidebar)}
            className="md:hidden rounded-full text-muted-foreground"
          >
            {showSidebar ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
          </Button>
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Nano Info</span>
        </div>
        <div className="flex items-center gap-1">
          <a
            href="https://github.com/liujuntao123/Nano-Info"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-muted-foreground hover:text-foreground"
            >
              <Github className="h-4.5 w-4.5" />
            </Button>
          </a>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowWechat(true)}
            className="rounded-full text-muted-foreground hover:text-foreground"
          >
            <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.007-.27-.018-.407-.032zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/>
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            className={`rounded-full ${isConfigured ? 'text-muted-foreground hover:text-foreground' : 'text-destructive'}`}
          >
            <Settings className="h-4.5 w-4.5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Mobile Overlay */}
        {showSidebar && (
          <div
            className="md:hidden fixed inset-0 top-14 bg-black/20 z-20"
            onClick={() => setShowSidebar(false)}
          />
        )}

        {/* Left Panel - Control Sidebar */}
        <aside className={`
          ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
          fixed md:relative inset-y-0 top-14 md:top-0 left-0 z-30
          w-[85vw] sm:w-96 lg:w-[420px] xl:w-[460px]
          bg-background border-r border-border/60
          flex flex-col shrink-0
          transition-transform duration-200 ease-out md:translate-x-0
        `}>
          {/* Settings Panel */}
          <APISettings open={showSettings} onOpenChange={setShowSettings} />

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-5 space-y-5 md:space-y-6">
            {/* Input Section */}
            <InputSection />
            {/* Fixed Bottom Button */}
          <div className="p-2 md:p-2 bg-background shrink-0">
            <Button
              onClick={handleProcess}
              disabled={isProcessing || !textContent.trim()}
              className="w-full gap-2 py-3 shadow-sm"
            >
              <Sparkles className="h-4 w-4" />
              {isProcessing ? '生成中...' : '生成绘图信息'}
            </Button>
          </div>

            {/* Style Selector */}
            <StyleSelector />

            {/* Generation Parameters */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <ImageCountInput />
                <AspectRatioSelector />
              </div>
              <ResolutionSelector />
            </div>
          </div>

          
        </aside>

        {/* Right Panel - Preview Area */}
        <section className="flex-1 bg-muted/30 overflow-y-auto p-4 md:p-6">
          <ContentBlocksSection />
        </section>
      </main>

      {/* WeChat QR Code Dialog */}
      <Dialog open={showWechat} onOpenChange={setShowWechat}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center gap-4 py-4">
            <img src="/qrcode.png" alt="WeChat QR Code" className="max-w-full" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default App
