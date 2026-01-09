import { parseHTML } from 'linkedom'
import { Readability } from '@mozilla/readability'
import TurndownService from 'turndown'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
}

// 处理 OPTIONS 预检请求
export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

// 预处理微信文章 DOM
function preprocessWechatArticle(document) {
  // 显示隐藏的内容区域
  const jsContent = document.getElementById('js_content')
  if (jsContent) {
    jsContent.style.visibility = 'visible'
    jsContent.style.display = 'block'
  }

  // 移除不需要的元素
  const removeSelectors = [
    '#js_pc_qr_code',
    '#js_profile_qrcode',
    '.qr_code_pc_outer',
    '.rich_media_area_extra',
    '.reward_area',
    '#js_tags',
    '.original_area_primary',
    '.original_area_extra',
    'img', // 移除所有图片
  ]
  removeSelectors.forEach((selector) => {
    const elements = document.querySelectorAll(selector)
    elements.forEach((el) => el.remove())
  })
}

// 提取微信文章内容
function extractWechatContent(document) {
  const titleEl = document.getElementById('activity-name') ||
                  document.querySelector('.rich_media_title') ||
                  document.querySelector('h1')
  const title = titleEl?.textContent?.trim() || '微信公众号文章'

  const contentEl = document.getElementById('js_content') ||
                    document.querySelector('.rich_media_content')

  if (!contentEl) {
    return null
  }

  return { title, content: contentEl.innerHTML }
}

export async function onRequestPost(context) {
  const { request } = context

  try {
    const { url } = await request.json()

    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ error: '请提供有效的URL' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 验证是否为微信文章链接
    if (!url.includes('mp.weixin.qq.com')) {
      return new Response(JSON.stringify({ error: '请提供微信公众号文章链接' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 抓取页面内容
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Referer': 'https://mp.weixin.qq.com/',
      },
      redirect: 'follow',
    })

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `无法获取页面内容: ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const html = await response.text()
    const { document } = parseHTML(html)

    // 预处理微信文章
    preprocessWechatArticle(document)

    // 使用 Readability 解析
    const reader = new Readability(document.cloneNode(true))
    let article = reader.parse()

    // 如果 Readability 失败，尝试直接提取
    if (!article) {
      const wechatContent = extractWechatContent(document)
      if (wechatContent) {
        article = {
          title: wechatContent.title,
          content: wechatContent.content,
        }
      }
    }

    if (!article) {
      return new Response(
        JSON.stringify({ error: '无法解析文章内容' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 转换为 Markdown（不包含图片）
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-',
    })

    // 移除空链接
    turndownService.addRule('removeEmptyLinks', {
      filter: (node) => node.nodeName === 'A' && !node.textContent?.trim(),
      replacement: () => '',
    })

    // 忽略图片
    turndownService.addRule('ignoreImages', {
      filter: 'img',
      replacement: () => '',
    })

    const wrappedHtml = `<!DOCTYPE html><html><body>${article.content || ''}</body></html>`
    const { document: contentDoc } = parseHTML(wrappedHtml)
    const markdown = turndownService.turndown(contentDoc.body)

    const fullMarkdown = `# ${article.title}\n\n> 来源: [微信公众号](${url})\n\n${markdown}`

    return new Response(JSON.stringify({
      success: true,
      data: {
        title: article.title,
        content: fullMarkdown,
        url: url,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Parse wechat article error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : '解析失败' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}
