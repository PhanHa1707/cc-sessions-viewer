import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'

const { listFilesMock, readFileMock } = vi.hoisted(() => ({
  listFilesMock: vi.fn(),
  readFileMock: vi.fn(),
}))

vi.mock('../../src/api', () => ({
  projectEditorListFiles: listFilesMock,
  projectEditorReadFile: readFileMock,
  projectEditorSearchFiles: vi.fn(),
  projectEditorWriteFile: vi.fn(),
  projectEditorCreateFile: vi.fn(),
  projectEditorDeletePath: vi.fn(),
}))

import ProjectFileEditor from '../../src/components/ProjectFileEditor.vue'
import { t } from '../../src/i18n'
import { vTooltip } from '../../src/tooltip'

enableAutoUnmount(afterEach)

describe('ProjectFileEditor delete action', () => {
  beforeEach(() => {
    listFilesMock.mockReset().mockResolvedValue({
      files: [{ path: 'README.md', bytes: 10, isDir: false }],
      truncated: false,
    })
    readFileMock.mockReset().mockResolvedValue({
      rel: 'README.md',
      text: 'hello',
      bytes: 5,
      binary: false,
      truncated: false,
      rev: { exists: true, bytes: 5, modifiedMs: 1 },
    })
  })

  it('hides delete until an item is selected, then reveals it', async () => {
    const wrapper = mount(ProjectFileEditor, {
      props: {
        show: true,
        projectPath: '/work/project',
        projectName: 'project',
      },
      global: {
        directives: { tooltip: vTooltip },
        stubs: {
          CodeEditor: true,
          ConfirmModal: true,
          GitBranchControl: true,
          GitChangesView: true,
        },
      },
    })
    await flushPromises()

    const deleteButton = () => wrapper.find(`.project-side-actions button[aria-label="${t('projectEditor.delete')}"]`)
    expect(deleteButton().exists()).toBe(false)

    await wrapper.get('.project-tree-row').trigger('click')
    await flushPromises()

    expect(deleteButton().exists()).toBe(true)
  })
})

describe('ProjectFileEditor quick open', () => {
  beforeEach(() => {
    listFilesMock.mockReset().mockResolvedValue({
      files: [
        { path: 'README.md', bytes: 10, isDir: false },
        { path: 'src', bytes: 0, isDir: true },
        { path: 'src/components/ProjectFileEditor.vue', bytes: 20, isDir: false },
      ],
      truncated: false,
    })
    readFileMock.mockReset().mockResolvedValue({
      rel: 'src/components/ProjectFileEditor.vue',
      text: 'component',
      bytes: 9,
      binary: false,
      truncated: false,
      rev: { exists: true, bytes: 9, modifiedMs: 1 },
    })
  })

  const mountEditor = (show: boolean) => mount(ProjectFileEditor, {
    props: { show, projectPath: '/work/project', projectName: 'project' },
    attachTo: document.body,
    global: {
      directives: { tooltip: vTooltip },
      stubs: {
        CodeEditor: true,
        ConfirmModal: true,
        GitBranchControl: true,
        GitChangesView: true,
      },
    },
  })

  const quickOpenKey = () => new KeyboardEvent('keydown', {
    key: 'p',
    metaKey: /Mac/i.test(navigator.platform),
    ctrlKey: !/Mac/i.test(navigator.platform),
    bubbles: true,
    cancelable: true,
  })

  it('focuses the project search input when its sidebar button is clicked', async () => {
    const wrapper = mountEditor(true)
    await flushPromises()

    await wrapper.findAll('.project-activity button')[1].trigger('click')
    await flushPromises()

    const input = wrapper.get('.project-search-query input').element
    expect(document.activeElement).toBe(input)
    wrapper.unmount()
  })

  it('exposes a search action that switches views and focuses its input', async () => {
    const wrapper = mountEditor(true)
    await flushPromises()

    ;(wrapper.vm as unknown as { openSearch: () => void }).openSearch()
    await flushPromises()

    const input = wrapper.get('.project-search-query input').element
    expect(document.activeElement).toBe(input)
    wrapper.unmount()
  })

  it('fuzzy-filters project files and opens the selected result with Enter', async () => {
    const wrapper = mountEditor(true)
    await flushPromises()
    const shortcut = quickOpenKey()
    window.dispatchEvent(shortcut)
    await flushPromises()

    expect(shortcut.defaultPrevented).toBe(true)
    const input = document.body.querySelector<HTMLInputElement>('.project-quick-open-input')
    expect(input).not.toBeNull()
    if (!input) throw new Error('Quick-open input was not rendered')
    input.value = 'pfe'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await flushPromises()
    expect([...document.body.querySelectorAll('.project-quick-open-option')].some((option) => option.textContent?.includes('ProjectFileEditor.vue'))).toBe(true)

    const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    input.dispatchEvent(enter)
    await flushPromises()

    expect(readFileMock).toHaveBeenCalledWith('/work/project', 'src/components/ProjectFileEditor.vue')
    expect(document.body.querySelector('.project-quick-open')).toBeNull()
    wrapper.unmount()
  })

  it('does not capture Cmd/Ctrl+P while the editor is closed', async () => {
    const wrapper = mountEditor(false)
    await flushPromises()
    const shortcut = quickOpenKey()
    window.dispatchEvent(shortcut)
    await flushPromises()

    expect(shortcut.defaultPrevented).toBe(false)
    expect(document.body.querySelector('.project-quick-open')).toBeNull()
    wrapper.unmount()
  })
})
