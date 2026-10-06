import type { ProjectEditorEntry } from './types'

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

/** Cmd/Ctrl+Shift+F targets project search when the editor is open, global search otherwise. */
export function getProjectSearchShortcutTarget(
  event: ProjectEditorShortcutEvent,
  isMac: boolean,
  projectEditorOpen: boolean,
): 'project' | 'global' | null {
  const mod = isMac ? event.metaKey : event.ctrlKey
  const otherMod = isMac ? event.ctrlKey : event.metaKey
  if (!mod || otherMod || !event.shiftKey || event.altKey || event.key.toLowerCase() !== 'f') return null
  return projectEditorOpen ? 'project' : 'global'
}

/** Cmd/Ctrl+P opens the project file picker while the built-in editor is active. */
export function isProjectFileQuickOpenShortcut(event: ProjectEditorShortcutEvent, isMac: boolean): boolean {
  const mod = isMac ? event.metaKey : event.ctrlKey
  const otherMod = isMac ? event.ctrlKey : event.metaKey
  return mod && !otherMod && !event.shiftKey && !event.altKey && event.key.toLowerCase() === 'p'
}

/** Fuzzy-rank project files by path; directories are never selectable results. */
export function rankProjectFiles(entries: ProjectEditorEntry[], query: string): ProjectEditorEntry[] {
  const normalizedQuery = query.trim().toLowerCase()
  const candidates = entries.filter((entry) => !entry.isDir)
  if (!normalizedQuery) return [...candidates].sort((a, b) => a.path.localeCompare(b.path))

  const scored = candidates.flatMap((entry) => {
    const path = entry.path.replace(/\\/g, '/')
    const lowerPath = path.toLowerCase()
    const basename = lowerPath.slice(lowerPath.lastIndexOf('/') + 1)
    let cursor = 0
    let previous = -2
    let score = 0

    for (const char of normalizedQuery) {
      const index = lowerPath.indexOf(char, cursor)
      if (index < 0) return []
      if (index === 0 || '/_-. '.includes(path[index - 1] ?? '')) score += 12
      if (index === previous + 1) score += 8
      else score -= (index - previous - 1) * 0.1
      score -= index * 0.02
      previous = index
      cursor = index + 1
    }

    if (basename.includes(normalizedQuery)) score += 24
    if (basename.startsWith(normalizedQuery)) score += 16
    if (lowerPath.includes(normalizedQuery)) score += 10
    return [{ entry, score }]
  })

  return scored
    .sort((a, b) => b.score - a.score || a.entry.path.localeCompare(b.entry.path))
    .map(({ entry }) => entry)
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
