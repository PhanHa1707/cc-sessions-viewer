import { describe, expect, it } from 'vitest'
import {
  highlightSearchLine,
  isMarkdownFile,
  getProjectSearchShortcutTarget,
  isProjectEditorShortcut,
  isProjectFileQuickOpenShortcut,
  rankProjectFiles,
} from '../src/projectEditor'

describe('isMarkdownFile', () => {
  it('recognizes Markdown extensions for every filename, case-insensitively', () => {
    expect(isMarkdownFile('README.md')).toBe(true)
    expect(isMarkdownFile('docs/guide.MD')).toBe(true)
    expect(isMarkdownFile('notes.mdx')).toBe(true)
    expect(isMarkdownFile('src/app.ts')).toBe(false)
    expect(isMarkdownFile(null)).toBe(false)
  })
})

describe('isProjectEditorShortcut', () => {
  it('matches Cmd+Shift+E on macOS and Ctrl+Shift+E elsewhere', () => {
    expect(isProjectEditorShortcut({ key: 'E', metaKey: true, ctrlKey: false, shiftKey: true, altKey: false }, true)).toBe(true)
    expect(isProjectEditorShortcut({ key: 'e', metaKey: false, ctrlKey: true, shiftKey: true, altKey: false }, false)).toBe(true)
  })

  it('rejects missing modifiers, extra modifiers, and the other platform mod key', () => {
    expect(isProjectEditorShortcut({ key: 'e', metaKey: true, ctrlKey: false, shiftKey: false, altKey: false }, true)).toBe(false)
    expect(isProjectEditorShortcut({ key: 'e', metaKey: true, ctrlKey: false, shiftKey: true, altKey: true }, true)).toBe(false)
    expect(isProjectEditorShortcut({ key: 'e', metaKey: false, ctrlKey: true, shiftKey: true, altKey: false }, true)).toBe(false)
  })
})

describe('getProjectSearchShortcutTarget', () => {
  const macShortcut = { key: 'F', metaKey: true, ctrlKey: false, shiftKey: true, altKey: false }
  const windowsShortcut = { key: 'f', metaKey: false, ctrlKey: true, shiftKey: true, altKey: false }

  it('routes Cmd/Ctrl+Shift+F to project search only while the editor is open', () => {
    expect(getProjectSearchShortcutTarget(macShortcut, true, true)).toBe('project')
    expect(getProjectSearchShortcutTarget(windowsShortcut, false, true)).toBe('project')
    expect(getProjectSearchShortcutTarget(macShortcut, true, false)).toBe('global')
  })

  it('rejects unrelated modifiers and keys', () => {
    expect(getProjectSearchShortcutTarget({ ...macShortcut, metaKey: false }, true, true)).toBeNull()
    expect(getProjectSearchShortcutTarget({ ...macShortcut, shiftKey: false }, true, true)).toBeNull()
    expect(getProjectSearchShortcutTarget({ ...macShortcut, altKey: true }, true, true)).toBeNull()
    expect(getProjectSearchShortcutTarget({ ...macShortcut, key: 'g' }, true, true)).toBeNull()
  })
})

describe('isProjectFileQuickOpenShortcut', () => {
  it('matches Cmd+P on macOS and Ctrl+P elsewhere', () => {
    expect(isProjectFileQuickOpenShortcut({ key: 'p', metaKey: true, ctrlKey: false, shiftKey: false, altKey: false }, true)).toBe(true)
    expect(isProjectFileQuickOpenShortcut({ key: 'P', metaKey: false, ctrlKey: true, shiftKey: false, altKey: false }, false)).toBe(true)
  })

  it('rejects the shortcut with missing, extra, or wrong-platform modifiers', () => {
    expect(isProjectFileQuickOpenShortcut({ key: 'p', metaKey: false, ctrlKey: false, shiftKey: false, altKey: false }, true)).toBe(false)
    expect(isProjectFileQuickOpenShortcut({ key: 'p', metaKey: true, ctrlKey: false, shiftKey: true, altKey: false }, true)).toBe(false)
    expect(isProjectFileQuickOpenShortcut({ key: 'p', metaKey: true, ctrlKey: false, shiftKey: false, altKey: true }, true)).toBe(false)
    expect(isProjectFileQuickOpenShortcut({ key: 'p', metaKey: false, ctrlKey: true, shiftKey: false, altKey: false }, true)).toBe(false)
  })
})

describe('rankProjectFiles', () => {
  const entries = [
    { path: 'README.md', bytes: 10, isDir: false },
    { path: 'src/components/ProjectFileEditor.vue', bytes: 20, isDir: false },
    { path: 'src', bytes: 0, isDir: true },
  ]

  it('fuzzy-matches file names and omits directories', () => {
    expect(rankProjectFiles(entries, 'pfe').map((entry) => entry.path)).toEqual([
      'src/components/ProjectFileEditor.vue',
    ])
  })

  it('lists files alphabetically when the query is empty', () => {
    expect(rankProjectFiles(entries, '').map((entry) => entry.path)).toEqual([
      'README.md',
      'src/components/ProjectFileEditor.vue',
    ])
  })
})

describe('highlightSearchLine', () => {
  it('highlights literal case-insensitive matches and escapes markup', () => {
    expect(highlightSearchLine('<foo> FOO', 'foo', false, false, false)).toBe(
      '&lt;<mark>foo</mark>&gt; <mark>FOO</mark>',
    )
  })

  it('supports whole-word and regular-expression search modes', () => {
    expect(highlightSearchLine('foo foobar', 'foo', true, true, false)).toBe(
      '<mark>foo</mark> foobar',
    )
    expect(highlightSearchLine('foo1 foo2', 'foo\\d', true, false, true)).toBe(
      '<mark>foo1</mark> <mark>foo2</mark>',
    )
  })

  it('returns escaped text for invalid expressions', () => {
    expect(highlightSearchLine('<foo>', '[', true, false, true)).toBe('&lt;foo&gt;')
  })
})
