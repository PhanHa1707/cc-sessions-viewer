import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'

const { gitDiffFileMock, gitDiffFilesMock, gitLogMock, gitStatusMock, gitWorktreesMock } = vi.hoisted(() => ({
  gitDiffFileMock: vi.fn(),
  gitDiffFilesMock: vi.fn(),
  gitLogMock: vi.fn(),
  gitStatusMock: vi.fn(),
  gitWorktreesMock: vi.fn(),
}))

vi.mock('../../src/api', () => ({
  gitDiffFile: gitDiffFileMock,
  gitDiffFiles: gitDiffFilesMock,
  gitLog: gitLogMock,
  gitStatus: gitStatusMock,
  gitWorktrees: gitWorktreesMock,
}))

import GitChangesView from '../../src/views/GitChangesView.vue'
import { vTooltip } from '../../src/tooltip'

enableAutoUnmount(afterEach)

const factory = () => mount(GitChangesView, {
  props: { cwd: '/work/project', gitRef: 'working' },
  global: {
    directives: { tooltip: vTooltip },
    stubs: { DiffBlock: true },
  },
})

describe('GitChangesView', () => {
  beforeEach(() => {
    gitDiffFileMock.mockReset()
    gitDiffFilesMock.mockReset()
    gitLogMock.mockReset()
    gitStatusMock.mockReset()
    gitWorktreesMock.mockReset()
    gitWorktreesMock.mockResolvedValue([
      { path: '/work/project', name: 'project', branch: 'main', head: 'a'.repeat(40), isMain: true, detached: false, locked: false, prunable: false, bare: false },
    ])
    gitDiffFileMock.mockResolvedValue([])
    gitLogMock.mockResolvedValue([])
    gitStatusMock.mockResolvedValue([])
  })

  it('automatically selects the only changed file', async () => {
    gitDiffFilesMock.mockResolvedValue([
      { path: 'docs/new.md', additions: 2, deletions: 0, status: 'A' },
    ])

    const wrapper = factory()
    await flushPromises()

    expect(gitDiffFileMock).toHaveBeenCalledWith('/work/project', 'working', 'docs/new.md')
    expect(wrapper.emitted('pathChange')).toEqual([['docs/new.md']])
  })

  it('keeps each directory level visible and resizes the changed-files tree by dragging', async () => {
    gitDiffFilesMock.mockResolvedValue([
      { path: 'apps/main/__tests__/finance/pending-contract.test.ts', additions: 1, deletions: 0, status: 'A' },
    ])

    const wrapper = factory()
    await flushPromises()

    expect(wrapper.findAll('.git-file-name').map((node) => node.text())).toEqual([
      'apps', 'main', '__tests__', 'finance', 'pending-contract.test.ts',
    ])

    const separator = wrapper.get('[role="separator"]')
    separator.element.dispatchEvent(new MouseEvent('pointerdown', {
      bubbles: true,
      button: 0,
      clientX: 260,
    }))
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 340 }))
    await wrapper.vm.$nextTick()
    expect(wrapper.get('.git-file-tree').attributes('style')).toContain('width: 340px')
    window.dispatchEvent(new MouseEvent('pointerup'))
  })

  it('resets horizontal scroll when switching diff files', async () => {
    gitDiffFilesMock.mockResolvedValue([
      { path: 'src/file.ts', additions: 1, deletions: 0, status: 'M' },
      { path: 'src/other.ts', additions: 2, deletions: 0, status: 'M' },
    ])
    gitDiffFileMock.mockResolvedValue([
      { oldStart: 1, newStart: 1, lines: [{ kind: 'ctx', oldNo: 1, newNo: 1, text: 'line' }] },
    ])

    const wrapper = factory()
    await flushPromises()
    const rows = wrapper.findAll('.git-file-row:not(.dir)')
    await rows[0].trigger('click')
    await flushPromises()
    const diffBody = wrapper.get('.git-diff-body .persistent-scroll-viewport').element as HTMLElement
    diffBody.scrollLeft = 120

    await rows[1].trigger('click')
    await flushPromises()

    expect((wrapper.get('.git-diff-body .persistent-scroll-viewport').element as HTMLElement).scrollLeft).toBe(0)
  })

  it('routes status, commit and file diffs to the selected worktree', async () => {
    const linkedPath = '/work/project/.claude/worktrees/feature'
    gitWorktreesMock.mockResolvedValue([
      { path: '/work/project', name: 'project', branch: 'main', head: 'a'.repeat(40), isMain: true, detached: false, locked: false, prunable: false, bare: false },
      { path: linkedPath, name: 'feature', branch: 'feature', head: 'b'.repeat(40), isMain: false, detached: false, locked: false, prunable: false, bare: false },
    ])
    gitDiffFilesMock.mockResolvedValue([
      { path: 'src/worktree.ts', additions: 1, deletions: 0, status: 'A' },
    ])
    gitDiffFileMock.mockResolvedValue([
      { oldStart: 0, newStart: 1, lines: [{ kind: 'add', oldNo: null, newNo: 1, text: 'from worktree' }] },
    ])

    const wrapper = factory()
    await flushPromises()
    expect(gitDiffFilesMock).toHaveBeenLastCalledWith('/work/project', 'working')

    await wrapper.get('.git-worktree-button').trigger('click')
    await wrapper.findAll('.git-worktree-item')[1].trigger('click')
    await flushPromises()

    expect(gitLogMock).toHaveBeenLastCalledWith(linkedPath, 50)
    expect(gitStatusMock).toHaveBeenLastCalledWith(linkedPath)
    expect(gitDiffFilesMock).toHaveBeenLastCalledWith(linkedPath, 'working')
    expect(gitDiffFileMock).toHaveBeenLastCalledWith(linkedPath, 'working', 'src/worktree.ts')
  })

  it('does not choose a file automatically when several files changed', async () => {
    gitDiffFilesMock.mockResolvedValue([
      { path: 'a.ts', additions: 1, deletions: 0, status: 'A' },
      { path: 'b.ts', additions: 1, deletions: 0, status: 'A' },
    ])

    const wrapper = factory()
    await flushPromises()

    expect(gitDiffFileMock).not.toHaveBeenCalled()
    expect(wrapper.emitted('pathChange')).toBeUndefined()
  })
})
