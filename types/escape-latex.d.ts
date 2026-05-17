declare module 'escape-latex' {
  function escapeLatex(str: string, options?: { preserveFormatting?: boolean }): string
  export = escapeLatex
}
