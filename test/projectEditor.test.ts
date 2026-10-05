import { describe, expect, it } from 'vitest'
import { highlightSearchLine, isMarkdownFile, isProjectEditorShortcut } from '../src/projectEditor'

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
