<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import type { GitCommit, GitDiffFile, DiffHunk, GitWorktree } from '../types'
import { gitLog, gitDiffFiles, gitDiffFile, gitStatus, gitWorktrees } from '../api'
import { t } from '../i18n'
import { gitWorkingChangesRefreshVersion } from '../gitWorkingChanges'
import { buildFileTree, flattenTree, treeDepth, type TreeNode } from '../fileTree'
import DiffBlock from '../components/DiffBlock.vue'
import PersistentScrollArea from '../components/PersistentScrollArea.vue'
import { IconRefresh, IconGitBranch, IconChevronRight, IconFolder, fileIconFor } from '../components/icons'
import { highlightAllCodeBlocks } from '../shikiHighlight'

const props = defineProps<{
  cwd: string
  gitRef: string
  selectedPath?: string | null
}>()

const emit = defineEmits<{
  refChange: [ref: string]
  pathChange: [path: string | null]
}>()

const commits = ref<GitCommit[]>([])
const files = ref<GitDiffFile[]>([])
const selectedFile = ref<string | null>(null)
const diffHunks = ref<DiffHunk[]>([])
const loadingFiles = ref(false)
const loadingDiff = ref(false)
const dropdownOpen = ref(false)
const workingCount = ref(0)
const worktrees = ref<GitWorktree[]>([])
const selectedWorktreePath = ref<string | null>(null)
const worktreeDropdownOpen = ref(false)
const fileTreeWidth = ref(260)
const FILE_TREE_MIN_WIDTH = 220
const FILE_TREE_DEFAULT_WIDTH = 260
const FILE_TREE_MAX_WIDTH = 560
let resizeStartX = 0
let resizeStartWidth = FILE_TREE_DEFAULT_WIDTH

const currentRef = computed(() => props.gitRef || 'working')
const activeWorktree = computed(() => worktrees.value.find((worktree) => worktree.path === selectedWorktreePath.value) ?? null)
const activeCwd = computed(() => activeWorktree.value?.path ?? props.cwd)
const activeWorktreeLabel = computed(() => activeWorktree.value?.isMain
  ? t('git.mainWorktree')
  : activeWorktree.value?.name ?? t('git.mainWorktree'))
const workingChangesRevision = computed(() => gitWorkingChangesRefreshVersion(activeCwd.value))
const currentLabel = computed(() => {
  if (currentRef.value === 'working') return t('git.working')
  const c = commits.value.find((c) => c.hash === currentRef.value)
  if (c) return `${c.hash.slice(0, 7)} ${c.message}`
  return currentRef.value.slice(0, 7)
})

const expandState = reactive<Record<string, boolean>>({})

const fileTree = computed(() => buildFileTree(files.value, { collapseSingleDirectories: false }))
const flatFileNodes = computed(() => flattenTree(fileTree.value, isExpanded))

function isExpanded(path: string): boolean {
  return expandState[path] !== false
}

function toggleDir(node: TreeNode<GitDiffFile>) {
  expandState[node.path] = !isExpanded(node.path)
}

function resizeFileTreeBy(delta: number) {
  fileTreeWidth.value = Math.max(
    FILE_TREE_MIN_WIDTH,
    Math.min(FILE_TREE_MAX_WIDTH, fileTreeWidth.value + delta),
  )
}

function onFileTreeResizeMove(event: PointerEvent) {
  fileTreeWidth.value = Math.max(
    FILE_TREE_MIN_WIDTH,
    Math.min(FILE_TREE_MAX_WIDTH, resizeStartWidth + event.clientX - resizeStartX),
  )
}

function stopFileTreeResize() {
  document.body.classList.remove('git-file-tree-resizing')
  window.removeEventListener('pointermove', onFileTreeResizeMove)
  window.removeEventListener('pointerup', stopFileTreeResize)
  window.removeEventListener('pointercancel', stopFileTreeResize)
}

function startFileTreeResize(event: PointerEvent) {
  if (event.button !== 0) return
  event.preventDefault()
  resizeStartX = event.clientX
  resizeStartWidth = fileTreeWidth.value
  document.body.classList.add('git-file-tree-resizing')
  window.addEventListener('pointermove', onFileTreeResizeMove)
  window.addEventListener('pointerup', stopFileTreeResize)
  window.addEventListener('pointercancel', stopFileTreeResize)
}

function resetFileTreeWidth() {
  fileTreeWidth.value = FILE_TREE_DEFAULT_WIDTH
}

async function loadWorktrees(): Promise<boolean> {
  const previousPath = selectedWorktreePath.value
  try {
    worktrees.value = await gitWorktrees(props.cwd)
  } catch {
    worktrees.value = []
  }
  const currentIsValid = worktrees.value.some((worktree) => worktree.path === selectedWorktreePath.value)
  if (!currentIsValid) {
    selectedWorktreePath.value = worktrees.value.find((worktree) => worktree.isMain)?.path
      ?? worktrees.value[0]?.path
      ?? null
  }
  return selectedWorktreePath.value !== previousPath
}

async function loadFiles() {
  loadingFiles.value = true
  try {
    files.value = await gitDiffFiles(activeCwd.value, currentRef.value)
    if (selectedFile.value && !files.value.find((f) => f.path === selectedFile.value)) {
      selectedFile.value = null
      diffHunks.value = []
      emit('pathChange', null)
    }
  } catch {
    files.value = []
  }
  loadingFiles.value = false
}

const diffPane = ref<HTMLElement | null>(null)

async function loadDiff(path: string) {
  selectedFile.value = path
  emit('pathChange', path)
  loadingDiff.value = true
  try {
    diffHunks.value = await gitDiffFile(activeCwd.value, currentRef.value, path)
  } catch {
    diffHunks.value = []
  }
  loadingDiff.value = false
  await nextTick()
  const diffBody = diffPane.value?.querySelector<HTMLElement>('.git-diff-body .persistent-scroll-viewport')
  if (diffBody) diffBody.scrollLeft = 0
  if (diffPane.value) highlightAllCodeBlocks(diffPane.value)
}

async function loadCommits() {
  try {
    commits.value = await gitLog(activeCwd.value, 50)
  } catch {
    commits.value = []
  }
}

async function loadWorkingCount() {
  try {
    const st = await gitStatus(activeCwd.value)
    workingCount.value = st.length
  } catch {
    workingCount.value = 0
  }
}

function fileToLoad(): string | null {
  if (selectedFile.value && files.value.some((file) => file.path === selectedFile.value)) {
    return selectedFile.value
  }
  if (props.selectedPath && files.value.some((file) => file.path === props.selectedPath)) {
    return props.selectedPath
  }
  return files.value.length === 1 ? files.value[0].path : null
}

function selectRef(ref: string) {
  dropdownOpen.value = false
  emit('refChange', ref)
}

async function selectWorktree(path: string) {
  worktreeDropdownOpen.value = false
  if (path === selectedWorktreePath.value) return

  selectedWorktreePath.value = path
  selectedFile.value = null
  diffHunks.value = []
  commits.value = []
  workingCount.value = 0
  emit('pathChange', null)
  if (currentRef.value !== 'working') emit('refChange', 'working')

  await nextTick()
  await loadCommits()
  await refresh()
}

async function refresh() {
  await loadFiles()
  const path = fileToLoad()
  if (path) await loadDiff(path)
  if (currentRef.value === 'working') await loadWorkingCount()
}

async function refreshWorktrees() {
  const scopeChanged = await loadWorktrees()
  if (scopeChanged) {
    selectedFile.value = null
    diffHunks.value = []
    emit('pathChange', null)
    if (currentRef.value !== 'working') emit('refChange', 'working')
    await nextTick()
  }
  await loadCommits()
  await refresh()
}

function onDocClick(e: MouseEvent) {
  const target = e.target as HTMLElement | null
  if (dropdownOpen.value && !target?.closest('.git-ref-dropdown, .git-ref-selector')) {
    dropdownOpen.value = false
  }
  if (worktreeDropdownOpen.value && !target?.closest('.git-worktree-dropdown, .git-worktree-button')) {
    worktreeDropdownOpen.value = false
  }
}

watch(() => props.cwd, async () => {
  selectedWorktreePath.value = null
  selectedFile.value = null
  diffHunks.value = []
  await loadWorktrees()
  await loadCommits()
  await refresh()
})

watch(() => props.gitRef, () => {
  void refresh()
})

watch(workingChangesRevision, () => {
  if (currentRef.value === 'working') void refresh()
})

onMounted(async () => {
  document.addEventListener('click', onDocClick, true)
  await loadWorktrees()
  loadCommits()
  await refresh()
})

onUnmounted(() => {
  stopFileTreeResize()
  document.removeEventListener('click', onDocClick, true)
})

const selectedDiffFile = computed(() => files.value.find((f) => f.path === selectedFile.value))
</script>

<template>
  <div class="git-panel">
    <div class="git-toolbar">
      <div v-if="worktrees.length > 1" class="git-worktree-menu">
        <button
          class="git-worktree-button"
          type="button"
          :aria-label="t('git.worktrees')"
          :aria-expanded="worktreeDropdownOpen"
          :title="activeWorktree?.path"
          @click.stop="worktreeDropdownOpen = !worktreeDropdownOpen"
        >
          <IconFolder class="git-worktree-icon" />
          <span class="git-worktree-label">{{ activeWorktreeLabel }}</span>
          <span v-if="activeWorktree?.branch" class="git-worktree-branch">{{ activeWorktree.branch }}</span>
          <span v-else-if="activeWorktree?.detached" class="git-worktree-branch">{{ t('git.detached') }}</span>
          <span class="git-ref-arrow">▾</span>
        </button>
        <div v-if="worktreeDropdownOpen" class="git-ref-dropdown git-worktree-dropdown" @click.stop>
          <button
            v-for="worktree in worktrees"
            :key="worktree.path"
            class="git-worktree-item"
            :class="{ active: worktree.path === selectedWorktreePath }"
            :title="worktree.path"
            @click="selectWorktree(worktree.path)"
          >
            <span class="git-worktree-item-top">
              <span class="git-worktree-item-name">{{ worktree.isMain ? t('git.mainWorktree') : worktree.name }}</span>
              <span class="git-worktree-item-branch">{{ worktree.branch ?? t('git.detached') }}</span>
            </span>
            <span class="git-worktree-item-path">{{ worktree.path }}</span>
          </button>
        </div>
      </div>
      <div class="git-ref-selector" @click.stop="dropdownOpen = !dropdownOpen">
        <IconGitBranch class="git-ref-icon" />
        <span class="git-ref-label">{{ currentLabel }}</span>
        <span v-if="currentRef === 'working' && workingCount > 0" class="git-ref-badge">{{ workingCount }}</span>
        <span class="git-ref-arrow">▾</span>
      </div>
      <button class="icon-btn" v-tooltip="t('proj.refresh')" @click="refreshWorktrees">
        <IconRefresh />
      </button>
      <span class="git-hint">{{ t('git.recentCommits', { n: 50 }) }}</span>

      <div v-if="dropdownOpen" class="git-ref-dropdown" @click.stop>
        <button
          class="git-ref-item"
          :class="{ active: currentRef === 'working' }"
          @click="selectRef('working')"
        >
          <span class="git-ref-item-label">{{ t('git.working') }}</span>
          <span v-if="workingCount > 0" class="git-ref-badge">{{ workingCount }}</span>
        </button>
        <div v-if="commits.length" class="git-ref-sep" />
        <button
          v-for="c in commits"
          :key="c.hash"
          class="git-ref-item"
          :class="{ active: currentRef === c.hash }"
          @click="selectRef(c.hash)"
        >
          <span class="git-ref-item-hash">{{ c.hash.slice(0, 7) }}</span>
          <span class="git-ref-item-label">{{ c.message }}</span>
          <span class="git-ref-item-author">{{ c.author }}</span>
          <span class="git-ref-item-date">{{ c.date.slice(0, 10) }}</span>
        </button>
      </div>
    </div>

    <div v-if="!loadingFiles && files.length === 0" class="git-empty">
      <p>{{ t('git.noChanges') }}</p>
      <p class="git-empty-hint">{{ t('git.browseCommits') }}</p>
    </div>

    <div v-else class="git-body">
      <div class="git-file-tree" :style="{ width: `${fileTreeWidth}px`, flexBasis: `${fileTreeWidth}px` }">
        <div class="git-file-tree-head">
          {{ t('git.files') }}
          <span class="git-file-count">{{ files.length }}</span>
        </div>
        <div class="git-file-list">
          <div
            v-for="node in flatFileNodes"
            :key="node.path"
            class="git-file-row"
            :class="{
              dir: node.children.length > 0,
              selected: node.item && node.path === selectedFile,
            }"
            :style="{ paddingLeft: treeDepth(node.path) * 12 + 8 + 'px' }"
            @click="node.item ? loadDiff(node.path) : toggleDir(node)"
          >
            <IconChevronRight v-if="node.children.length" class="git-dir-arrow" :class="{ open: isExpanded(node.path) }" />
            <span v-else class="git-dir-arrow-spacer" />
            <IconFolder v-if="node.children.length" class="git-tree-icon folder" />
            <template v-else>
              <span
                v-if="node.item"
                class="git-status"
                :class="'st-' + node.item.status"
              >{{ node.item.status }}</span>
              <component :is="fileIconFor(node.name)" class="git-tree-icon" />
            </template>
            <span class="git-file-name" :title="node.item?.path ?? node.path">{{ node.name }}</span>
            <span v-if="node.item" class="git-file-stat">
              <span v-if="node.item.additions" class="git-add">+{{ node.item.additions }}</span>
              <span v-if="node.item.deletions" class="git-del">-{{ node.item.deletions }}</span>
            </span>
          </div>
        </div>
      </div>
      <div
        class="git-file-tree-resizer"
        role="separator"
        tabindex="0"
        aria-orientation="vertical"
        :aria-label="t('git.resizeFileTree')"
        :aria-valuemin="FILE_TREE_MIN_WIDTH"
        :aria-valuemax="FILE_TREE_MAX_WIDTH"
        :aria-valuenow="fileTreeWidth"
        @pointerdown="startFileTreeResize"
        @keydown.left.prevent="resizeFileTreeBy(-16)"
        @keydown.right.prevent="resizeFileTreeBy(16)"
        @dblclick="resetFileTreeWidth"
      />
      <div ref="diffPane" class="git-diff-pane">
        <template v-if="selectedFile && selectedDiffFile">
          <div class="git-diff-head">
            <span class="git-status" :class="'st-' + selectedDiffFile.status">{{ selectedDiffFile.status }}</span>
            <span class="git-diff-path">{{ selectedFile }}</span>
            <span class="git-file-stat">
              <span v-if="selectedDiffFile.additions" class="git-add">+{{ selectedDiffFile.additions }}</span>
              <span v-if="selectedDiffFile.deletions" class="git-del">-{{ selectedDiffFile.deletions }}</span>
            </span>
          </div>
          <div v-if="loadingDiff" class="git-empty">{{ t('common.loading') }}</div>
          <PersistentScrollArea v-else-if="diffHunks.length" class="git-diff-body">
            <DiffBlock :hunks="diffHunks" :file-path="selectedFile" />
          </PersistentScrollArea>
          <div v-else class="git-empty">{{ t('git.noDiff') }}</div>
        </template>
        <div v-else class="git-empty git-empty-center">
          {{ t('git.selectFile') }}
        </div>
      </div>
    </div>
  </div>
</template>
