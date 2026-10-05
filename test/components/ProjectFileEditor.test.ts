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
