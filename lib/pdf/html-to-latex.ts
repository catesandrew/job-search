// @ts-expect-error no types
import escapeLatex from 'escape-latex'

export function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim()
}

export function htmlToLatex(html: string): string {
  if (!html) return ''
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '')
    .replace(/<\/?ul[^>]*>/gi, '')
    // inline markup — extract inner content, escape it, then wrap in LaTeX command
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, (_, inner) =>
      `\\textbf{${escapeLatex(stripTags(inner))}}`)
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, (_, inner) =>
      `\\textbf{${escapeLatex(stripTags(inner))}}`)
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, (_, inner) =>
      `\\textit{${escapeLatex(stripTags(inner))}}`)
    .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, (_, inner) =>
      `\\textit{${escapeLatex(stripTags(inner))}}`)
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, inner) =>
      `\\href{${href}}{${escapeLatex(stripTags(inner))}}`)
    // strip any remaining tags, then escape plain text per line
    .replace(/<[^>]+>/g, '')
    .split('\n')
    .map(line => escapeLatex(line.trim()))
    .filter(line => line.length > 0)
    .join('\n')
}
