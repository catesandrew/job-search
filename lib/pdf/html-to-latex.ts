// @ts-expect-error no types
import escapeLatex from 'escape-latex'

export function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim()
}

export function htmlToLatex(html: string): string {
  if (!html) return ''

  const parts: string[] = []
  const placeholder = (i: number) => `\x00${i}\x00`

  const result = html
    // Block elements → newlines
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '')
    .replace(/<\/?ul[^>]*>/gi, '')
    // Inline markup → LaTeX commands (inner text escaped, command stored as placeholder)
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, (_, inner) => {
      parts.push(`\\textbf{${escapeLatex(stripTags(inner))}}`)
      return placeholder(parts.length - 1)
    })
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, (_, inner) => {
      parts.push(`\\textbf{${escapeLatex(stripTags(inner))}}`)
      return placeholder(parts.length - 1)
    })
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, (_, inner) => {
      parts.push(`\\textit{${escapeLatex(stripTags(inner))}}`)
      return placeholder(parts.length - 1)
    })
    .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, (_, inner) => {
      parts.push(`\\textit{${escapeLatex(stripTags(inner))}}`)
      return placeholder(parts.length - 1)
    })
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, inner) => {
      parts.push(`\\href{${href}}{${escapeLatex(stripTags(inner))}}`)
      return placeholder(parts.length - 1)
    })
    // Strip remaining tags
    .replace(/<[^>]+>/g, '')

  // Split into lines, escape plain text segments, restore LaTeX placeholders
  return result
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line =>
      line
        .split(/\x00(\d+)\x00/)
        .map((seg, i) => (i % 2 === 1 ? parts[parseInt(seg)] : escapeLatex(seg)))
        .join('')
    )
    .filter(line => line.length > 0)
    .join('\n')
}
