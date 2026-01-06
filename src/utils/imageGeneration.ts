import type { ImageAPIConfig } from '@/types'

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
  return `${baseUrl}/models/${config.model}:generateContent`
}

function buildOpenAIUrl(config: ImageAPIConfig): string {
  const baseUrl = config.baseUrl.replace(/\/$/, '')
  return `${baseUrl}/chat/completions`
}

async function callGeminiAPI(
  config: ImageAPIConfig,
  params: GenerateImageParams
): Promise<GenerateImageResult> {
  const url = buildGeminiUrl(config)

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
    generationConfig: {
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

  // 解析 SSE 事件，查找 result 事件
  const lines = buffer.split('\n')
  let currentEvent = ''

  for (const line of lines) {
    if (line.startsWith('event: ')) {
      currentEvent = line.slice(7).trim()
    } else if (line.startsWith('data: ') && currentEvent === 'result') {
      try {
        const data = JSON.parse(line.slice(6))
        const imagePart = data.candidates?.[0]?.content?.parts?.find(
          (p: { inlineData?: { data: string } }) => p.inlineData
        )
        if (imagePart?.inlineData?.data) {
          return { success: true, image: imagePart.inlineData.data }
        }
      } catch {
        // 忽略解析错误
      }
    }
  }

  return { success: false, error: '未找到图像数据，请检查 API 响应' }
}

async function callOpenAIAPI(
  config: ImageAPIConfig,
  params: GenerateImageParams
): Promise<GenerateImageResult> {
  const url = buildOpenAIUrl(config)

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

  // 直接从原始响应中提取 base64 图片数据
  const match = buffer.match(/data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/)
  if (match?.[1]) {
    return { success: true, image: match[1] }
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

