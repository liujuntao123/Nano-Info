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
import { Settings, Sparkles, PanelLeftClose, PanelLeft } from 'lucide-react'
import type { ContentBlockState } from '@/types'

function App() {
  const [showSettings, setShowSettings] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowSettings(!showSettings)}
          className={`rounded-full ${isConfigured ? 'text-muted-foreground hover:text-foreground' : 'text-destructive'}`}
        >
          <Settings className="h-4.5 w-4.5" />
        </Button>
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

          {/* Fixed Bottom Button */}
          <div className="p-4 md:p-5 border-t border-border/60 bg-background shrink-0">
            <Button
              onClick={handleProcess}
              disabled={isProcessing || !textContent.trim()}
              className="w-full gap-2 py-3 shadow-sm"
            >
              <Sparkles className="h-4 w-4" />
              {isProcessing ? '生成中...' : '生成绘图信息'}
            </Button>
          </div>
        </aside>

        {/* Right Panel - Preview Area */}
        <section className="flex-1 bg-muted/30 overflow-y-auto p-4 md:p-6">
          <ContentBlocksSection />
        </section>
      </main>
    </div>
  )
}

export default App
