import type { ImageAPIConfig } from '@/types'

const isDev = import.meta.env.DEV
function proxyUrl(url: string): string {
  const prefix = 'https://nano-info.aizhi.site' 
  return isDev ? `${prefix}/proxy?url=${encodeURIComponent(url)}` : `/proxy?url=${encodeURIComponent(url)}`
}

interface GenerateImageParams {
  prompt: string
  aspectRatio: string
  resolution: string
  referenceImage?: string  // base64 图片数据
}

interface GenerateImageResult {
  success: boolean
  image?: string  // base64 图片数据
  error?: string
}

function buildGeminiUrl(config: ImageAPIConfig): string {
  const baseUrl = config.baseUrl.replace(/\/$/, '')
  return `${baseUrl}/models/${config.model}:streamGenerateContent?alt=sse`
}

function buildOpenAIUrl(config: ImageAPIConfig): string {
  const baseUrl = config.baseUrl.replace(/\/$/, '')
  return `${baseUrl}/chat/completions`
}

async function callGeminiAPI(
  config: ImageAPIConfig,
  params: GenerateImageParams
): Promise<GenerateImageResult> {
  const url = proxyUrl(buildGeminiUrl(config))

  const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [
    { text: params.prompt }
  ]

  // 如果有参考图，添加到请求中
  if (params.referenceImage) {
    parts.push({
      inlineData: {
        data: params.referenceImage,
        mimeType: 'image/jpeg'
      }
    })
  }

  const payload = {
    contents: [
      {
        role: 'user',
        parts
      }
    ],
    streamGenerateContent: {
      imageConfig:{
        aspectRatio: params.aspectRatio,
        imageSize: params.resolution,
      }
    }
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const errorText = await response.text()
    return { success: false, error: `API 请求失败: ${response.status} - ${errorText}` }
  }

  // 解析 SSE 流式响应
  const reader = response.body?.getReader()
  if (!reader) {
    return { success: false, error: '无法读取响应流' }
  }

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (value) {
      buffer += decoder.decode(value, { stream: true })
    }
    if (done) {
      // 刷新 decoder 中剩余的数据
      buffer += decoder.decode()
      break
    }
  }

  // 尝试解析 SSE 事件，查找图像数据
  const lines = buffer.split('\n')
  let currentEvent = ''

  for (const line of lines) {
    if (line.startsWith('event: ')) {
      currentEvent = line.slice(7).trim()
    } else if (line.startsWith('data: ')) {
      // 优先处理 event: result 事件，也处理无 event 前缀的 data 行
      if (currentEvent === 'result' || currentEvent === '' || currentEvent === 'message') {
        try {
          const dataStr = line.slice(6)
          // 跳过 [DONE] 标记
          if (dataStr.trim() === '[DONE]') continue

          const data = JSON.parse(dataStr)
          const imagePart = data.candidates?.[0]?.content?.parts?.find(
            (p: { inlineData?: { data: string } }) => p.inlineData
          )
          if (imagePart?.inlineData?.data) {
            return { success: true, image: imagePart.inlineData.data }
          }
        } catch {
          // 忽略解析错误，可能是不完整的 JSON 或其他格式
        }
      }
    }
  }

  // 兜底1：尝试直接解析为非流式 JSON 响应
  try {
    const data = JSON.parse(buffer)
    const imagePart = data.candidates?.[0]?.content?.parts?.find(
      (p: { inlineData?: { data: string } }) => p.inlineData
    )
    if (imagePart?.inlineData?.data) {
      return { success: true, image: imagePart.inlineData.data }
    }
  } catch {
    // 忽略解析错误
  }

  // 兜底2：尝试从整个 buffer 中提取 inlineData
  const inlineDataMatch = buffer.match(/"inlineData"\s*:\s*\{\s*"data"\s*:\s*"([A-Za-z0-9+/=]+)"/)
  if (inlineDataMatch?.[1]) {
    return { success: true, image: inlineDataMatch[1] }
  }

  return { success: false, error: '未找到图像数据，请检查 API 响应' }
}

async function callOpenAIAPI(
  config: ImageAPIConfig,
  params: GenerateImageParams
): Promise<GenerateImageResult> {
  const url = proxyUrl(buildOpenAIUrl(config))

  // 构建消息内容，支持参考图
  const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
    { type: 'text', text: params.prompt }
  ]

  // 如果有参考图，添加到消息中
  if (params.referenceImage) {
    content.push({
      type: 'image_url',
      image_url: {
        url: `data:image/jpeg;base64,${params.referenceImage}`
      }
    })
  }

  const payload = {
    model: config.model,
    messages: [
      {
        role: 'user',
        content: content
      }
    ],
    generationConfig: {
      imageConfig:{
        aspectRatio: params.aspectRatio,
        imageSize: params.resolution,
      }
    },
    stream: true,
    stream_options: {
      include_usage: true
    }
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const errorText = await response.text()
    return { success: false, error: `API 请求失败: ${response.status} - ${errorText}` }
  }

  // 解析 SSE 流式响应
  const reader = response.body?.getReader()
  if (!reader) {
    return { success: false, error: '无法读取响应流' }
  }

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (value) {
      buffer += decoder.decode(value, { stream: true })
    }
    if (done) {
      // 刷新 decoder 中剩余的数据
      buffer += decoder.decode()
      break
    }
  }

  // 尝试从 SSE 流式响应中提取 base64 图片数据
  const match = buffer.match(/data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/)
  if (match?.[1]) {
    return { success: true, image: match[1] }
  }

  // 尝试解析 SSE 流式响应（OpenAI 格式）
  const lines = buffer.split('\n')
  for (const line of lines) {
    const trimmedLine = line.trim()
    if (!trimmedLine || trimmedLine === 'data: [DONE]') continue

    if (trimmedLine.startsWith('data: ')) {
      try {
        const data = JSON.parse(trimmedLine.slice(6))
        // 检查是否有图片 URL
        const content = data.choices?.[0]?.delta?.content || data.choices?.[0]?.message?.content
        if (content) {
          const imgMatch = content.match(/data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/)
          if (imgMatch?.[1]) {
            return { success: true, image: imgMatch[1] }
          }
        }
      } catch {
        // 忽略解析错误
      }
    }
  }

  // 兜底：尝试直接解析为非流式 JSON 响应
  try {
    const data = JSON.parse(buffer)
    const content = data.choices?.[0]?.message?.content
    if (content) {
      const imgMatch = content.match(/data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/)
      if (imgMatch?.[1]) {
        return { success: true, image: imgMatch[1] }
      }
    }
  } catch {
    // 忽略解析错误
  }

  return { success: false, error: '未找到图像数据' }
}

export async function generateImage(
  config: ImageAPIConfig,
  params: GenerateImageParams
): Promise<GenerateImageResult> {
  if (!config.baseUrl || !config.apiKey) {
    return { success: false, error: '请先配置图像生成 API' }
  }

  try {
    if (config.provider === 'gemini') {
      return await callGeminiAPI(config, params)
    } else {
      return await callOpenAIAPI(config, params)
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '图像生成失败'
    }
  }
}

