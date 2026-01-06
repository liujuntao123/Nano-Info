// 输入模式类型
export type InputMode = 'input' | 'upload'

// 图像比例类型
export type AspectRatio = '1:1' | '4:3' | '3:4' | '16:9' | '9:16'

// 图像分辨率类型
export type Resolution = '1K' | '2K' | '4K'

// 输入类型（用于 AI 工作流）
export type InstructionType = '完整文章' | '简单指令'

// AI 请求输入格式
export interface AIWorkflowInput {
  instruction_type: InstructionType
  instruction: string
  split_number: number
  word_count: number
}

// 视觉风格定义
export interface VisualStyle {
  id: string
  name: string
  tag: string // 标签，用于模板列表显示，格式如 "tag1,tag2"
  preview: string // 预览图片链接
  background: string
  visual_style: string
  word_style: string
  content_principle: string
  negative_space: string
}

// API 配置
export interface APIConfig {
  baseUrl: string
  apiKey: string
  model: string
}

// 图像生成 API Provider 类型
export type ImageAPIProvider = 'openai' | 'gemini'

// 图像生成 API 配置
export interface ImageAPIConfig {
  baseUrl: string
  apiKey: string
  model: string
  provider: ImageAPIProvider
}

// 内容块状态（包含文字和生成的图片）
export interface ContentBlockState {
  title: string  // AI生成的标题
  text: string
  generatedImage: string | null  // base64 图片数据
  isGenerating: boolean
  showImage: boolean  // true显示图片，false显示文字
}

// 应用状态
export interface AppState {
  // 输入相关
  inputMode: InputMode
  textContent: string
  fileName: string | null
  splitCount: number
  aspectRatio: AspectRatio
  resolution: Resolution

  // AI 处理相关
  isProcessing: boolean
  contentBlocks: ContentBlockState[]
  error: string | null

  // 风格选择
  selectedStyleId: string | null
  useStyleReference: boolean  // 是否应用参考图

  // API 配置
  apiConfig: APIConfig

  // 图像生成 API 配置
  imageApiConfig: ImageAPIConfig

  // 生成的提示词
  generatedPrompts: string[]
}

// Store Actions
export interface AppActions {
  // 输入操作
  setInputMode: (mode: InputMode) => void
  setTextContent: (content: string) => void
  setFileName: (name: string | null) => void
  setSplitCount: (count: number) => void
  setAspectRatio: (ratio: AspectRatio) => void
  setResolution: (resolution: Resolution) => void

  // AI 处理操作
  setIsProcessing: (processing: boolean) => void
  setContentBlocks: (blocks: ContentBlockState[]) => void
  setError: (error: string | null) => void
  updateContentBlockText: (index: number, text: string) => void
  updateContentBlockTitle: (index: number, title: string) => void
  setBlockGenerating: (index: number, isGenerating: boolean) => void
  setBlockImage: (index: number, image: string | null) => void
  setBlockShowImage: (index: number, showImage: boolean) => void

  // 风格选择操作
  setSelectedStyleId: (styleId: string | null) => void
  setUseStyleReference: (use: boolean) => void

  // API 配置操作
  setApiConfig: (config: Partial<APIConfig>) => void
  setImageApiConfig: (config: Partial<ImageAPIConfig>) => void

  // 提示词操作
  setGeneratedPrompts: (prompts: string[]) => void

  // 重置
  reset: () => void
}
