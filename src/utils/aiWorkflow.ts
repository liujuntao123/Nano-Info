import type { AIWorkflowInput, APIConfig, InstructionType } from '@/types'

// AI返回的内容块结构
export interface AIContentBlock {
  title: string
  content: string
}

// 根据 design.md 中的 System Prompt 定义
const SYSTEM_PROMPT = `# Role
你是一个集资深作家、编辑与内容架构师于一身的 AI 专家。你擅长创作深度内容并将拆分为多个完整的信息块。

# Input
用户输入：{
instruction_type:完整文章|简单指令,
instruction:用户输入,
split_number:目标数量,
word_count:撰写文章字数
}

# Task

## Step 1: 意图识别与内容创作
- 如果\`instruction_type\`是简单指令，根据\`instruction\`撰写一篇\`word_count\`字的深度长文。得到文章\`ariticle\`。
- 内容要求：逻辑严密，文章的理论和依据都符合事实。
- 如果\`instruction_type\`是完整文章，则直接将原文流转到下一步。得到文章\`ariticle\`。
- 最终得到一篇文章：\`ariticle\`。

## Step 2: 内容预处理
- 识别并过滤掉\`article\`的所有干扰信息（如：无用链接、页码、页眉页脚、广告推广、参考文献列表、乱码字符等），除此之外，不要改动任何文章内容，得到\`clean_article\`。
- 将\`clean_article\`整理为markdown格式的\`markdown_article\`，注意不要损失任何文章内容。

## Step 3: 语义切分
- 将\`markdown_article\`切分为\`split_number\`个独立的部分。
- 切分原则：确保每个部分在语义上是完整的，逻辑上是连贯的。
- 零损耗：除了必要的开头和结尾语句改动外，不要改动\`markdown_article\`原文。
- 为每个部分生成一个简洁的标题（title），标题应概括该部分的核心内容，不超过15个字。

# Output Format
请仅输出一个标准 JSON 字符串数组，数组长度必须等于\`split_number\`。
格式如下：
[
  {"title": "第一部分的标题", "content": "第一部分的内容全文..."},
  {"title": "第二部分的标题", "content": "第二部分的内容全文..."},
  ...
]`

export function buildUserPrompt(input: AIWorkflowInput): string {
  return JSON.stringify({
    instruction_type: input.instruction_type,
    instruction: input.instruction,
    split_number: input.split_number,
    word_count: input.word_count,
  })
}

export function determineInstructionType(
  content: string,
  inputMode: 'input' | 'upload'
): InstructionType {
  if (inputMode === 'input' && content.trim().length < 200) {
    return '简单指令'
  }
  return '完整文章'
}

async function parseSSEResponse(response: Response): Promise<string> {
  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('无法读取响应流')
  }

  const decoder = new TextDecoder()
  let content = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split('\n')

    for (const line of lines) {
      const trimmedLine = line.trim()
      if (!trimmedLine || trimmedLine === 'data: [DONE]') continue

      if (trimmedLine.startsWith('data: ')) {
        try {
          const jsonStr = trimmedLine.slice(6) // 移除 "data: " 前缀
          const data = JSON.parse(jsonStr)
          const delta = data.choices?.[0]?.delta?.content
          if (delta) {
            content += delta
          }
        } catch {
          // 忽略解析失败的行
        }
      }
    }
  }

  return content
}

function isSSEResponse(response: Response): boolean {
  const contentType = response.headers.get('content-type') || ''
  return (
    contentType.includes('text/event-stream') ||
    contentType.includes('text/plain')
  )
}

export async function callAIWorkflow(
  config: APIConfig,
  input: AIWorkflowInput
): Promise<AIContentBlock[]> {
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(input) },
      ],
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      `API 请求失败: ${response.status} ${response.statusText}${
        errorData.error?.message ? ` - ${errorData.error.message}` : ''
      }`
    )
  }

  let content: string

  // 检查是否为 SSE 流式响应
  if (isSSEResponse(response)) {
    content = await parseSSEResponse(response)
  } else {
    const data = await response.json()
    content = data.choices?.[0]?.message?.content
  }

  if (!content) {
    throw new Error('API 返回内容为空')
  }

  // 解析 JSON 数组
  try {
    // 尝试提取 JSON 数组（可能被包裹在 markdown 代码块中）
    let jsonStr = content
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      jsonStr = jsonMatch[0]
    }

    const result = JSON.parse(jsonStr)

    if (!Array.isArray(result)) {
      throw new Error('返回结果不是数组格式')
    }

    if (result.length !== input.split_number) {
      console.warn(
        `警告: 期望 ${input.split_number} 个内容块，但收到 ${result.length} 个`
      )
    }

    // 处理返回结果，确保每个元素都有title和content
    return result.map((item): AIContentBlock => {
      if (typeof item === 'string') {
        // 兼容旧格式：如果返回的是字符串，自动生成标题
        return { title: '', content: item }
      }
      return {
        title: String(item.title || ''),
        content: String(item.content || '')
      }
    })
  } catch (parseError) {
    throw new Error(`解析 AI 返回结果失败: ${parseError}`)
  }
}
