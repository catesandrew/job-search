export function escapeUrl(url: string): string {
  return url.replace(/%/g, '\\%').replace(/#/g, '\\#')
}
