export function escapeUrl(url: string): string {
  return url.replace(/%/g, '\\%').replace(/#/g, '\\#')
}

/** Strip https://, http://, and www. for display — keeps the link clean */
export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
}

/** Format a raw phone string to (XXX) XXX-XXXX or +1 (XXX) XXX-XXXX */
export function formatPhone(raw: string | null | undefined): string {
  if (!raw) return ''
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 11 && digits[0] === '1') {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return raw
}
