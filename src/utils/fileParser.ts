import * as pdfjsLib from 'pdfjs-dist'
import mammoth from 'mammoth'

// 配置 PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

export async function parsePDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const textParts: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const pageText = textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
    textParts.push(pageText)
  }

  return textParts.join('\n\n')
}

export async function parseWord(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value
}

export async function parseTextFile(file: File): Promise<string> {
  return await file.text()
}

export async function parseFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase()

  if (fileName.endsWith('.pdf')) {
    return parsePDF(file)
  }

  if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
    return parseWord(file)
  }

  if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
    return parseTextFile(file)
  }

  throw new Error(`不支持的文件格式: ${file.name}`)
}
