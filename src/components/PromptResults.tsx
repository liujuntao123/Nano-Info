import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/stores/useAppStore'
import { getStyleById, generatePrompt } from '@/data/visualStyles'
import { Copy, Check } from 'lucide-react'

export function PromptResults() {
  const { contentBlocks, selectedStyleId } = useAppStore()
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const selectedStyle = selectedStyleId ? getStyleById(selectedStyleId) : null

  if (contentBlocks.length === 0 || !selectedStyle) {
    return null
  }

  const prompts = contentBlocks.map((block) => generatePrompt(block.text, selectedStyle, block.title))

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  const handleCopyAll = async () => {
    try {
      const allPrompts = prompts.join('\n\n---\n\n')
      await navigator.clipboard.writeText(allPrompts)
      setCopiedIndex(-1)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          生成的提示词 ({prompts.length} 个)
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyAll}
          className="gap-2"
        >
          {copiedIndex === -1 ? (
            <>
              <Check className="h-4 w-4" />
              已复制全部
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              复制全部
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-4">
        {prompts.map((prompt, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">
                    {index + 1}
                  </span>
                  提示词 {index + 1}
                </div>
                <Badge variant="secondary" className="text-xs">
                  {selectedStyle.name}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-4 text-sm font-mono whitespace-pre-wrap break-words">
                {prompt}
              </div>
              <div className="flex justify-end mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(prompt, index)}
                  className="gap-2"
                >
                  {copiedIndex === index ? (
                    <>
                      <Check className="h-4 w-4" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      复制
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
