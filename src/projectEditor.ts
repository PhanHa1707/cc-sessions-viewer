function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function isMarkdownFile(path: string | null): boolean {
  return /\.mdx?$/i.test(path ?? '')
}

export type ProjectEditorShortcutEvent = Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey' | 'altKey' | 'shiftKey'>

/** Cmd/Ctrl+Shift+E opens the selected project's editor on the current platform. */
export function isProjectEditorShortcut(event: ProjectEditorShortcutEvent, isMac: boolean): boolean {
  const mod = isMac ? event.metaKey : event.ctrlKey
  const otherMod = isMac ? event.ctrlKey : event.metaKey
  return mod && !otherMod && event.shiftKey && !event.altKey && event.key.toLowerCase() === 'e'
}

/** Safely highlights the active search term within one project-search result line. */
export function highlightSearchLine(
  line: string,
  query: string,
  caseSensitive: boolean,
  wholeWord: boolean,
  regexMode: boolean,
): string {
  if (!query) return escapeHtml(line)
  const escaped = regexMode ? query : query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const source = wholeWord ? `\\b(?:${escaped})\\b` : escaped
  let matcher: RegExp
  try {
    matcher = new RegExp(source, caseSensitive ? 'g' : 'gi')
  } catch {
    return escapeHtml(line)
  }

  let output = ''
  let cursor = 0
  let match: RegExpExecArray | null
  while ((match = matcher.exec(line)) !== null) {
    const start = match.index
    const end = start + match[0].length
    output += `${escapeHtml(line.slice(cursor, start))}<mark>${escapeHtml(match[0])}</mark>`
    cursor = end
    if (match[0].length === 0) matcher.lastIndex += 1
  }
  return output + escapeHtml(line.slice(cursor))
}
