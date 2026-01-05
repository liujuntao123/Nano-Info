import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppStore } from '@/stores/useAppStore'
import { Settings, Eye, EyeOff, Check, Image, MessageSquare } from 'lucide-react'
import type { ImageAPIProvider } from '@/types'

interface APISettingsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function APISettings({ open, onOpenChange }: APISettingsProps) {
  const { apiConfig, setApiConfig, imageApiConfig, setImageApiConfig } = useAppStore()
  const [showApiKey, setShowApiKey] = useState(false)
  const [showImageApiKey, setShowImageApiKey] = useState(false)
  const [localConfig, setLocalConfig] = useState(apiConfig)
  const [localImageConfig, setLocalImageConfig] = useState(imageApiConfig)

  const handleSave = () => {
    setApiConfig(localConfig)
    setImageApiConfig(localImageConfig)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            API 配置
          </DialogTitle>
          <DialogDescription>
            配置文本生成和图像生成的 API 接口
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="text" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="text" className="flex-1 gap-1">
              <MessageSquare className="h-4 w-4" />
              文本 API
            </TabsTrigger>
            <TabsTrigger value="image" className="flex-1 gap-1">
              <Image className="h-4 w-4" />
              生图 API
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="baseUrl">API Base URL</Label>
              <Input
                id="baseUrl"
                placeholder="https://api.openai.com/v1"
                value={localConfig.baseUrl}
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, baseUrl: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                留空使用默认 OpenAI API，或输入自定义 URL
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="sk-..."
                  value={localConfig.apiKey}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, apiKey: e.target.value })
                  }
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">模型名称</Label>
              <Input
                id="model"
                placeholder="gpt-4o-mini"
                value={localConfig.model}
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, model: e.target.value })
                }
              />
            </div>
          </TabsContent>

          <TabsContent value="image" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="imageProvider">Provider 类型</Label>
              <select
                id="imageProvider"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={localImageConfig.provider}
                onChange={(e) =>
                  setLocalImageConfig({ ...localImageConfig, provider: e.target.value as ImageAPIProvider })
                }
              >
                <option value="gemini">Gemini</option>
                <option value="openai">OpenAI</option>
              </select>
              <p className="text-xs text-muted-foreground">
                Provider 类型决定 API URL 的拼接方式
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageBaseUrl">API Base URL</Label>
              <Input
                id="imageBaseUrl"
                placeholder="https://generativelanguage.googleapis.com/v1beta"
                value={localImageConfig.baseUrl}
                onChange={(e) =>
                  setLocalImageConfig({ ...localImageConfig, baseUrl: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageApiKey">API Key</Label>
              <div className="relative">
                <Input
                  id="imageApiKey"
                  type={showImageApiKey ? 'text' : 'password'}
                  placeholder="API Key..."
                  value={localImageConfig.apiKey}
                  onChange={(e) =>
                    setLocalImageConfig({ ...localImageConfig, apiKey: e.target.value })
                  }
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowImageApiKey(!showImageApiKey)}
                >
                  {showImageApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageModel">模型名称</Label>
              <Input
                id="imageModel"
                placeholder="gemini-2.0-flash-preview-image-generation"
                value={localImageConfig.model}
                onChange={(e) =>
                  setLocalImageConfig({ ...localImageConfig, model: e.target.value })
                }
              />
            </div>

          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Check className="h-4 w-4" />
            保存配置
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
