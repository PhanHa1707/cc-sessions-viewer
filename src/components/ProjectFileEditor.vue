<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch, type ComponentPublicInstance } from 'vue'
import CodeEditor from './CodeEditor.vue'
import ConfirmModal from '../modals/ConfirmModal.vue'
import GitBranchControl from './GitBranchControl.vue'
import GitChangesView from '../views/GitChangesView.vue'
import {
  IconChevronRight,
  IconFile,
  IconFilePlus,
  IconFolder,
  IconFolderPlus,
  IconFold,
  IconGitBranch,
  IconPencil,
  IconEye,
  IconRefresh,
  IconSave,
  IconTrash,
  IconSearch,
  fileIconFor,
} from './icons'
import * as api from '../api'
import { t } from '../i18n'
import { formatSize, renderText } from '../format'
import { langOfPath } from '../shikiHighlight'
import {
  highlightSearchLine,
  isMarkdownFile,
  isProjectFileQuickOpenShortcut,
  rankProjectFiles,
} from '../projectEditor'
import type { FileRev, ProjectEditorEntry, ProjectSearchMatch, ProjectSearchResults } from '../types'

const props = defineProps<{ show: boolean; projectPath: string; projectName: string }>()
const emit = defineEmits<{ (e: 'close'): void }>()

interface ProjectTreeNode {
  name: string
  path: string
  entry?: ProjectEditorEntry
  children: ProjectTreeNode[]
}
interface ProjectTreeRow { node: ProjectTreeNode; depth: number; creating?: boolean }
type SideView = 'explorer' | 'search' | 'git'
const PROJECT_SIDEBAR_MIN_WIDTH = 220
const PROJECT_SIDEBAR_DEFAULT_WIDTH = 300
const PROJECT_SIDEBAR_MAX_WIDTH = 560

const sideView = ref<SideView>('explorer')
const sidebarWidth = ref(PROJECT_SIDEBAR_DEFAULT_WIDTH)
let resizeStartX = 0
let resizeStartWidth = PROJECT_SIDEBAR_DEFAULT_WIDTH
const files = ref<ProjectEditorEntry[]>([])
const listTruncated = ref(false)
const loadError = ref<string | null>(null)
const expanded = ref<Set<string>>(new Set())
const currentDir = ref('')
const creatingKind = ref<'file' | 'directory' | null>(null)
const createName = ref('')
const createError = ref<string | null>(null)
const createInput = ref<HTMLInputElement | null>(null)
const selectedTreePath = ref<string | null>(null)
const treeContextMenu = ref<{ x: number; y: number; path: string } | null>(null)
const deleteTarget = ref<ProjectEditorEntry | null>(null)
const deleting = ref(false)
const deleteError = ref<string | null>(null)
const treeRows = computed<ProjectTreeRow[]>(() => {
  const roots: ProjectTreeNode[] = []
  for (const entry of files.value) {
    const parts = entry.path.split('/')
    let nodes = roots
    let path = ''
    for (const [index, name] of parts.entries()) {
      path = path ? `${path}/${name}` : name
      let node = nodes.find((item) => item.name === name)
      if (!node) {
        node = { name, path, children: [] }
        nodes.push(node)
      }
      if (index === parts.length - 1) node.entry = entry
      nodes = node.children
    }
  }
  const sort = (nodes: ProjectTreeNode[]) => {
    nodes.sort((a, b) => {
      const aDir = !!a.entry?.isDir || a.children.length > 0
      const bDir = !!b.entry?.isDir || b.children.length > 0
      return Number(bDir) - Number(aDir) || a.name.localeCompare(b.name)
    })
    for (const node of nodes) sort(node.children)
  }
  sort(roots)
  const out: ProjectTreeRow[] = []
  const placeholder: ProjectTreeNode = { name: '', path: '__project_editor_create__', children: [] }
  let createRowAdded = false
  if (creatingKind.value && !currentDir.value) {
    out.push({ node: placeholder, depth: 0, creating: true })
    createRowAdded = true
  }
  const visit = (nodes: ProjectTreeNode[], depth: number) => {
    for (const node of nodes) {
      out.push({ node, depth })
      const isDir = !!node.entry?.isDir || node.children.length > 0
      if (creatingKind.value && currentDir.value === node.path && isDir) {
        out.push({ node: placeholder, depth: depth + 1, creating: true })
        createRowAdded = true
      }
      if (isDir && expanded.value.has(node.path)) visit(node.children, depth + 1)
    }
  }
  visit(roots, 0)
  if (creatingKind.value && !createRowAdded) {
    out.push({ node: placeholder, depth: currentDir.value ? currentDir.value.split('/').length : 0, creating: true })
  }
  return out
})
const openRel = ref<string | null>(null)
const text = ref('')
const saved = ref('')
const rev = ref<FileRev | null>(null)
const binary = ref(false)
const clipped = ref(false)
const fileError = ref<string | null>(null)
const busy = ref(false)
const saveError = ref<string | null>(null)
const leaving = ref<string | null>(null)
let leavingLine: number | undefined
const dirty = computed(() => text.value !== saved.value)
const selectedEntry = computed(() => files.value.find((entry) => entry.path === selectedTreePath.value) ?? null)
const deletingDirtyFile = computed(() => {
  const target = deleteTarget.value
  const opened = openRel.value
  return !!target && dirty.value && !!opened && (
    target.path === opened || (target.isDir && opened.startsWith(`${target.path}/`))
  )
})
const editable = computed(() => !binary.value && !clipped.value && openRel.value !== null)
const lang = computed(() => (openRel.value ? langOfPath(openRel.value) : null))
const markdownFile = computed(() => isMarkdownFile(openRel.value))
const editorMode = ref<'edit' | 'preview'>('edit')
const editorRef = ref<InstanceType<typeof CodeEditor> | null>(null)
const searchInput = ref<HTMLInputElement | null>(null)
const searchQuery = ref('')
const includePattern = ref('')
const excludePattern = ref('')
const caseSensitive = ref(false)
const wholeWord = ref(false)
const regexMode = ref(false)
const searchResults = ref<ProjectSearchResults | null>(null)
const searchError = ref<string | null>(null)
const searching = ref(false)
const searchRequest = ref(0)
const pendingSearchTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const gitRef = ref('working')
const quickOpenOpen = ref(false)
const quickOpenQuery = ref('')
const quickOpenActiveIndex = ref(0)
const quickOpenInput = ref<HTMLInputElement | null>(null)
let quickOpenPreviousFocus: HTMLElement | null = null
const quickOpenFiles = computed(() => rankProjectFiles(files.value, quickOpenQuery.value).slice(0, 50))

function resizeSidebarBy(delta: number) {
  const maxWidth = Math.max(PROJECT_SIDEBAR_MIN_WIDTH, Math.min(PROJECT_SIDEBAR_MAX_WIDTH, window.innerWidth - 320))
  sidebarWidth.value = Math.max(PROJECT_SIDEBAR_MIN_WIDTH, Math.min(maxWidth, sidebarWidth.value + delta))
}

function onSidebarResizeMove(event: PointerEvent) {
  const maxWidth = Math.max(PROJECT_SIDEBAR_MIN_WIDTH, Math.min(PROJECT_SIDEBAR_MAX_WIDTH, window.innerWidth - 320))
  sidebarWidth.value = Math.max(
    PROJECT_SIDEBAR_MIN_WIDTH,
    Math.min(maxWidth, resizeStartWidth + event.clientX - resizeStartX),
  )
}

function stopSidebarResize() {
  document.body.classList.remove('project-sidebar-resizing')
  window.removeEventListener('pointermove', onSidebarResizeMove)
  window.removeEventListener('pointerup', stopSidebarResize)
  window.removeEventListener('pointercancel', stopSidebarResize)
}

function startSidebarResize(event: PointerEvent) {
  if (event.button !== 0) return
  event.preventDefault()
  resizeStartX = event.clientX
  resizeStartWidth = sidebarWidth.value
  document.body.classList.add('project-sidebar-resizing')
  window.addEventListener('pointermove', onSidebarResizeMove)
  window.addEventListener('pointerup', stopSidebarResize)
  window.addEventListener('pointercancel', stopSidebarResize)
}

function resetSidebarWidth() {
  sidebarWidth.value = PROJECT_SIDEBAR_DEFAULT_WIDTH
}

const searchGroups = computed(() => {
  const groups = new Map<string, ProjectSearchMatch[]>()
  for (const match of searchResults.value?.matches ?? []) {
    const group = groups.get(match.path) ?? []
    group.push(match)
    groups.set(match.path, group)
  }
  return [...groups.entries()].map(([path, matches]) => ({ path, matches }))
})

function toggleDir(node: ProjectTreeNode) {
  selectedTreePath.value = node.path
  const next = new Set(expanded.value)
  if (next.has(node.path)) next.delete(node.path)
  else next.add(node.path)
  expanded.value = next
  if (node.entry?.isDir) currentDir.value = node.path
}

function expandParents(path: string) {
  const parts = path.split('/')
  const next = new Set(expanded.value)
  for (let i = 1; i < parts.length; i++) next.add(parts.slice(0, i).join('/'))
  expanded.value = next
}

async function loadList() {
  loadError.value = null
  try {
    const result = await api.projectEditorListFiles(props.projectPath)
    files.value = result.files
    listTruncated.value = result.truncated
  } catch (error) {
    files.value = []
    loadError.value = String(error)
  }
}

async function openFile(rel: string, lineNumber?: number) {
  if (busy.value) return
  selectedTreePath.value = rel
  busy.value = true
  fileError.value = null
  saveError.value = null
  try {
    const file = await api.projectEditorReadFile(props.projectPath, rel)
    openRel.value = rel
    text.value = file.text
    saved.value = file.text
    rev.value = file.rev
    binary.value = file.binary
    clipped.value = file.truncated
    editorMode.value = 'edit'
    currentDir.value = rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/')) : ''
    expandParents(rel)
    if (lineNumber) {
      await nextTick()
      editorRef.value?.revealLine(lineNumber)
    }
  } catch (error) {
    fileError.value = String(error)
  } finally {
    busy.value = false
  }
}

function selectFile(rel: string, lineNumber?: number) {
  if (busy.value) return
  selectedTreePath.value = rel
  currentDir.value = rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/')) : ''
  if (rel === openRel.value) {
    if (lineNumber) {
      editorMode.value = 'edit'
      void nextTick(() => editorRef.value?.revealLine(lineNumber))
    }
    return
  }
  if (dirty.value) {
    leaving.value = rel
    leavingLine = lineNumber
    return
  }
  void openFile(rel, lineNumber)
}

async function save() {
  const rel = openRel.value
  const current = rev.value
  if (!rel || !current || !editable.value || !dirty.value || busy.value) return
  busy.value = true
  saveError.value = null
  try {
    rev.value = await api.projectEditorWriteFile(props.projectPath, rel, text.value, current)
    saved.value = text.value
    const entry = files.value.find((file) => file.path === rel)
    if (entry) entry.bytes = new TextEncoder().encode(text.value).length
  } catch (error) {
    saveError.value = String(error)
  } finally {
    busy.value = false
  }
}

async function refreshFiles() {
  await loadList()
}

async function beginCreate(kind: 'file' | 'directory') {
  creatingKind.value = kind
  createName.value = ''
  createError.value = null
  if (currentDir.value) {
    expandParents(currentDir.value)
    expanded.value = new Set([...expanded.value, currentDir.value])
  }
  await nextTick()
  createInput.value?.focus()
}

function cancelCreate() {
  creatingKind.value = null
  createName.value = ''
  createError.value = null
}

function setCreateInput(element: Element | ComponentPublicInstance | null) {
  createInput.value = element instanceof HTMLInputElement ? element : null
}

function onCreateOutsidePointerDown(event: PointerEvent) {
  if (!creatingKind.value) return
  const target = event.target
  if (!(target instanceof Element)) return
  if (target.closest('.project-create-row, .project-side-actions')) return
  cancelCreate()
}

function openTreeContextMenu(event: MouseEvent, path: string) {
  const entry = files.value.find((item) => item.path === path)
  if (!entry) return
  selectedTreePath.value = path
  currentDir.value = entry.isDir ? path : (path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '')
  treeContextMenu.value = {
    x: Math.max(8, Math.min(event.clientX, window.innerWidth - 192)),
    y: Math.max(8, Math.min(event.clientY, window.innerHeight - 52)),
    path,
  }
}

function closeTreeContextMenu() {
  treeContextMenu.value = null
}

function onTreeContextOutsidePointerDown(event: PointerEvent) {
  if (!treeContextMenu.value) return
  const target = event.target
  if (target instanceof Element && target.closest('.project-tree-context-menu')) return
  closeTreeContextMenu()
}

function onTreeContextKeyDown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !treeContextMenu.value) return
  event.preventDefault()
  closeTreeContextMenu()
}

function requestDelete(path = selectedTreePath.value) {
  if (!path) return
  const entry = files.value.find((item) => item.path === path)
  if (!entry) return
  deleteError.value = null
  deleteTarget.value = entry
  closeTreeContextMenu()
}

async function confirmDelete() {
  const target = deleteTarget.value
  if (!target || deleting.value) return
  deleting.value = true
  deleteError.value = null
  const parent = target.path.includes('/') ? target.path.slice(0, target.path.lastIndexOf('/')) : ''
  const isUnderTarget = (path: string | null) => !!path && (
    path === target.path || (target.isDir && path.startsWith(`${target.path}/`))
  )
  try {
    await api.projectEditorDeletePath(props.projectPath, target.path)
    if (isUnderTarget(openRel.value)) {
      openRel.value = null
      text.value = ''
      saved.value = ''
      rev.value = null
      binary.value = false
      clipped.value = false
      fileError.value = null
      saveError.value = null
      editorMode.value = 'edit'
    }
    if (isUnderTarget(selectedTreePath.value)) selectedTreePath.value = parent || null
    if (isUnderTarget(currentDir.value)) currentDir.value = parent
    deleteTarget.value = null
    await loadList()
  } catch (error) {
    deleteTarget.value = null
    deleteError.value = String(error)
  } finally {
    deleting.value = false
  }
}

async function createEntry() {
  const name = createName.value.trim()
  if (!name || name === '.' || name === '..' || name.includes('/') || name.includes('\\')) {
    createError.value = t('projectEditor.invalidName')
    return
  }
  const rel = currentDir.value ? `${currentDir.value}/${name}` : name
  const directory = creatingKind.value === 'directory'
  try {
    await api.projectEditorCreateFile(props.projectPath, rel, directory)
    cancelCreate()
    await loadList()
    if (directory) {
      expanded.value = new Set([...expanded.value, ...(currentDir.value ? [currentDir.value] : [])])
      currentDir.value = rel
      selectedTreePath.value = rel
    } else {
      selectFile(rel)
    }
  } catch (error) {
    createError.value = String(error)
  }
}

function collapseAll() {
  expanded.value = new Set()
}

async function runSearch() {
  if (pendingSearchTimer.value) clearTimeout(pendingSearchTimer.value)
  pendingSearchTimer.value = null
  const query = searchQuery.value.trim()
  if (!query) {
    searchRequest.value += 1
    searching.value = false
    searchResults.value = null
    searchError.value = null
    return
  }
  const request = ++searchRequest.value
  searching.value = true
  searchError.value = null
  try {
    const results = await api.projectEditorSearchFiles({
      cwd: props.projectPath,
      query,
      caseSensitive: caseSensitive.value,
      wholeWord: wholeWord.value,
      regex: regexMode.value,
      include: includePattern.value,
      exclude: excludePattern.value,
    })
    if (request === searchRequest.value) searchResults.value = results
  } catch (error) {
    if (request === searchRequest.value) searchError.value = String(error)
  } finally {
    if (request === searchRequest.value) searching.value = false
  }
}

function scheduleSearch() {
  if (sideView.value !== 'search') return
  if (pendingSearchTimer.value) clearTimeout(pendingSearchTimer.value)
  pendingSearchTimer.value = setTimeout(() => void runSearch(), 250)
}

function openSearchMatch(match: ProjectSearchMatch) {
  sideView.value = 'explorer'
  selectFile(match.path, match.lineNumber)
}

function discardAndGo() {
  const rel = leaving.value
  const line = leavingLine
  leaving.value = null
  leavingLine = undefined
  if (rel) void openFile(rel, line)
}
function discardAndClose() {
  leaving.value = null
  emit('close')
}
function requestReload() {
  if (openRel.value) {
    leavingLine = undefined
    leaving.value = openRel.value
  }
}
function openSourceControl() {
  sideView.value = 'git'
}

function openSearch() {
  sideView.value = 'search'
  void nextTick(() => searchInput.value?.focus())
}

function openQuickOpen() {
  quickOpenPreviousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  closeTreeContextMenu()
  quickOpenQuery.value = ''
  quickOpenActiveIndex.value = 0
  quickOpenOpen.value = true
  void nextTick(() => quickOpenInput.value?.focus())
}

function closeQuickOpen(restoreFocus = true) {
  quickOpenOpen.value = false
  quickOpenQuery.value = ''
  if (restoreFocus) {
    void nextTick(() => {
      if (quickOpenPreviousFocus?.isConnected) quickOpenPreviousFocus.focus()
      quickOpenPreviousFocus = null
    })
  } else {
    quickOpenPreviousFocus = null
  }
}

function openQuickOpenFile(entry: ProjectEditorEntry) {
  closeQuickOpen(false)
  sideView.value = 'explorer'
  selectFile(entry.path)
}

function onQuickOpenKeydown(event: KeyboardEvent) {
  if (!props.show || event.isComposing) return

  if (quickOpenOpen.value) {
    const noModifier = !event.metaKey && !event.ctrlKey && !event.altKey
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      closeQuickOpen()
    } else if (noModifier && event.key === 'ArrowDown') {
      event.preventDefault()
      event.stopPropagation()
      quickOpenActiveIndex.value = Math.min(quickOpenActiveIndex.value + 1, Math.max(0, quickOpenFiles.value.length - 1))
    } else if (noModifier && event.key === 'ArrowUp') {
      event.preventDefault()
      event.stopPropagation()
      quickOpenActiveIndex.value = Math.max(quickOpenActiveIndex.value - 1, 0)
    } else if (noModifier && event.key === 'Enter') {
      event.preventDefault()
      event.stopPropagation()
      const entry = quickOpenFiles.value[quickOpenActiveIndex.value]
      if (entry) openQuickOpenFile(entry)
    }
    return
  }

  if (!isProjectFileQuickOpenShortcut(event, /Mac/i.test(navigator.platform))) return
  if (leaving.value !== null || deleteTarget.value !== null) return
  if (document.querySelector('.app-overlay, .gs-backdrop')) return
  event.preventDefault()
  event.stopPropagation()
  openQuickOpen()
}

function requestClose() {
  if (dirty.value) {
    leavingLine = undefined
    leaving.value = ''
    return
  }
  emit('close')
}

function reset() {
  sideView.value = 'explorer'
  files.value = []
  listTruncated.value = false
  loadError.value = null
  openRel.value = null
  text.value = ''
  saved.value = ''
  rev.value = null
  binary.value = false
  clipped.value = false
  fileError.value = null
  saveError.value = null
  leaving.value = null
  leavingLine = undefined
  expanded.value = new Set()
  currentDir.value = ''
  selectedTreePath.value = null
  treeContextMenu.value = null
  deleteTarget.value = null
  deleting.value = false
  deleteError.value = null
  creatingKind.value = null
  createName.value = ''
  createError.value = null
  searchQuery.value = ''
  includePattern.value = ''
  excludePattern.value = ''
  searchResults.value = null
  searchError.value = null
  gitRef.value = 'working'
  quickOpenOpen.value = false
  quickOpenQuery.value = ''
  quickOpenActiveIndex.value = 0
  quickOpenPreviousFocus = null
  if (pendingSearchTimer.value) clearTimeout(pendingSearchTimer.value)
}

watch(
  () => [props.show, props.projectPath] as const,
  ([show]) => {
    if (show) {
      reset()
      void nextTick(loadList)
    }
  },
  { immediate: true },
)
watch([searchQuery, includePattern, excludePattern, caseSensitive, wholeWord, regexMode], scheduleSearch)
watch(quickOpenQuery, () => { quickOpenActiveIndex.value = 0 })
watch(quickOpenFiles, (matches) => {
  if (quickOpenActiveIndex.value >= matches.length) quickOpenActiveIndex.value = Math.max(0, matches.length - 1)
})
watch(quickOpenActiveIndex, (index) => {
  if (!quickOpenOpen.value) return
  void nextTick(() => document.getElementById(`project-quick-open-option-${index}`)?.scrollIntoView?.({ block: 'nearest' }))
})
watch(sideView, (view) => {
  if (view === 'search' && searchQuery.value.trim()) void runSearch()
})
onMounted(() => {
  window.addEventListener('keydown', onQuickOpenKeydown, true)
  document.addEventListener('pointerdown', onCreateOutsidePointerDown, true)
  document.addEventListener('pointerdown', onTreeContextOutsidePointerDown, true)
  document.addEventListener('keydown', onTreeContextKeyDown, true)
})
onUnmounted(() => {
  stopSidebarResize()
  window.removeEventListener('keydown', onQuickOpenKeydown, true)
  document.removeEventListener('pointerdown', onCreateOutsidePointerDown, true)
  document.removeEventListener('pointerdown', onTreeContextOutsidePointerDown, true)
  document.removeEventListener('keydown', onTreeContextKeyDown, true)

  if (pendingSearchTimer.value) clearTimeout(pendingSearchTimer.value)
})

defineExpose({ requestClose, openSourceControl, openSearch })
</script>

<template>
  <div class="project-workspace" role="region" :aria-label="projectName">
    <aside class="project-workspace-sidebar" :style="{ width: `${sidebarWidth}px`, flexBasis: `${sidebarWidth}px` }">
      <div class="project-activity" :aria-label="t('projectEditor.views')">
        <button :class="{ active: sideView === 'explorer' }" :aria-label="t('projectEditor.explorer')" v-tooltip="t('projectEditor.explorer')" @click="sideView = 'explorer'"><IconFile /></button>
        <button :class="{ active: sideView === 'search' }" :aria-label="t('projectEditor.search')" v-tooltip="t('projectEditor.search')" @click="openSearch"><IconSearch /></button>
        <button :class="{ active: sideView === 'git' }" :aria-label="t('projectEditor.sourceControl')" v-tooltip="t('projectEditor.sourceControl')" @click="sideView = 'git'"><IconGitBranch /></button>
      </div>

      <section v-if="sideView === 'explorer'" class="project-side-panel">
        <header class="project-side-head">
          <span>{{ t('projectEditor.explorer') }}</span>
          <div class="project-side-actions">
            <button :aria-label="t('projectEditor.newFile')" v-tooltip="t('projectEditor.newFile')" @click="beginCreate('file')"><IconFilePlus /></button>
            <button :aria-label="t('projectEditor.newFolder')" v-tooltip="t('projectEditor.newFolder')" @click="beginCreate('directory')"><IconFolderPlus /></button>
            <button :aria-label="t('projectEditor.refresh')" v-tooltip="t('projectEditor.refresh')" @click="refreshFiles"><IconRefresh /></button>
            <button :aria-label="t('projectEditor.collapseAll')" v-tooltip="t('projectEditor.collapseAll')" @click="collapseAll"><IconFold /></button>
            <button v-if="selectedEntry" :aria-label="t('projectEditor.delete')" v-tooltip="t('projectEditor.delete')" @click="requestDelete()"><IconTrash /></button>
          </div>
        </header>
        <div class="project-tree-scroll" @click.self="cancelCreate">
          <p v-if="loadError" class="project-side-message error">{{ loadError }}</p>
          <p v-if="deleteError" class="project-side-message error">{{ deleteError }}</p>
          <template v-for="row in treeRows" :key="row.creating ? 'project-editor-create-row' : row.node.path">
            <div
              v-if="row.creating"
              class="project-tree-row project-tree-create"
              :style="{ paddingLeft: `${8 + row.depth * 14}px` }"
            >
              <span class="project-tree-chevron-spacer" />
              <IconFolder v-if="creatingKind === 'directory'" class="project-tree-entry-icon" />
              <component v-else :is="fileIconFor(createName || 'new-file')" class="project-tree-entry-icon" />
              <form class="project-create-row" @submit.prevent="createEntry">
                <input :ref="setCreateInput" v-model="createName" :placeholder="creatingKind === 'directory' ? t('projectEditor.folderName') : t('projectEditor.fileName')" @keydown.esc.prevent="cancelCreate">
              </form>
            </div>
            <p v-if="row.creating && createError" class="project-side-message error">{{ createError }}</p>
            <div
              v-else-if="!row.creating"
              class="project-tree-row"
              :class="{
                selected: selectedTreePath === row.node.path,
                directory: row.node.entry?.isDir || row.node.children.length > 0,
              }"
              :style="{ paddingLeft: `${8 + row.depth * 14}px` }"
              @click="(row.node.entry?.isDir || row.node.children.length > 0) ? toggleDir(row.node) : selectFile(row.node.path)"
              @contextmenu.prevent.stop="openTreeContextMenu($event, row.node.path)"
            >
              <IconChevronRight v-if="row.node.entry?.isDir || row.node.children.length > 0" class="project-tree-chevron" :class="{ expanded: expanded.has(row.node.path) }" />
              <span v-else class="project-tree-chevron-spacer" />
              <IconFolder v-if="row.node.entry?.isDir || row.node.children.length > 0" class="project-tree-entry-icon" />
              <component v-else :is="fileIconFor(row.node.name)" class="project-tree-entry-icon" />
              <span class="project-tree-entry-name">{{ row.node.name }}</span>
              <span v-if="row.node.entry && !row.node.entry.isDir" class="project-tree-entry-size">{{ formatSize(row.node.entry.bytes) }}</span>
            </div>
          </template>
          <p v-if="listTruncated" class="project-side-message">{{ t('projectEditor.listTruncated') }}</p>
          <p v-if="!files.length && !loadError" class="project-side-message">{{ t('projectEditor.emptyProject') }}</p>
        </div>
      </section>

      <section v-else-if="sideView === 'search'" class="project-side-panel project-search-panel">
        <header class="project-side-head"><span>{{ t('projectEditor.search') }}</span></header>
        <div class="project-search-form">
          <form class="project-search-query" @submit.prevent="runSearch">
            <input ref="searchInput" v-model="searchQuery" :placeholder="t('projectEditor.searchPlaceholder')">
            <button type="submit" :aria-label="t('projectEditor.search')"><IconSearch /></button>
          </form>
          <div class="project-search-toggles">
            <button :class="{ active: caseSensitive }" :aria-label="t('projectEditor.caseSensitive')" v-tooltip="t('projectEditor.caseSensitive')" @click="caseSensitive = !caseSensitive">Aa</button>
            <button :class="{ active: wholeWord }" :aria-label="t('projectEditor.wholeWord')" v-tooltip="t('projectEditor.wholeWord')" @click="wholeWord = !wholeWord">ab</button>
            <button :class="{ active: regexMode }" :aria-label="t('projectEditor.regex')" v-tooltip="t('projectEditor.regex')" @click="regexMode = !regexMode">.*</button>
          </div>
          <input v-model="includePattern" class="project-search-filter" :placeholder="t('projectEditor.includeFiles')">
          <input v-model="excludePattern" class="project-search-filter" :placeholder="t('projectEditor.excludeFiles')">
        </div>
        <div class="project-search-result-head">
          <span v-if="searching">{{ t('common.loading') }}</span>
          <span v-else-if="searchResults">{{ t('projectEditor.resultSummary', { files: searchResults.filesSearched, matches: searchResults.matches.length }) }}</span>
        </div>
        <p v-if="searchError" class="project-side-message error">{{ searchError }}</p>
        <div class="project-search-results">
          <section v-for="group in searchGroups" :key="group.path" class="project-search-group">
            <header><IconFile /><strong>{{ group.path }}</strong><span>{{ group.matches.length }}</span></header>
            <button v-for="match in group.matches" :key="`${match.path}:${match.lineNumber}`" class="project-search-match" @click="openSearchMatch(match)">
              <span>{{ match.lineNumber }}</span><code v-html="highlightSearchLine(match.line, searchQuery, caseSensitive, wholeWord, regexMode)" />
            </button>
          </section>
          <p v-if="searchResults?.truncated" class="project-side-message">{{ t('projectEditor.searchTruncated') }}</p>
          <p v-if="searchResults && !searchResults.matches.length" class="project-side-message">{{ t('projectEditor.noResults') }}</p>
        </div>
      </section>

      <section v-else class="project-side-panel project-source-panel">
        <header class="project-side-head"><span>{{ t('projectEditor.sourceControl') }}</span></header>
        <p>{{ t('projectEditor.gitHint') }}</p>
      </section>
    </aside>
    <div
      class="project-sidebar-resizer"
      role="separator"
      tabindex="0"
      aria-orientation="vertical"
      :aria-label="t('projectEditor.resizeSidebar')"
      :aria-valuemin="PROJECT_SIDEBAR_MIN_WIDTH"
      :aria-valuemax="PROJECT_SIDEBAR_MAX_WIDTH"
      :aria-valuenow="sidebarWidth"
      @pointerdown="startSidebarResize"
      @keydown.left.prevent="resizeSidebarBy(-16)"
      @keydown.right.prevent="resizeSidebarBy(16)"
      @dblclick="resetSidebarWidth"
    />

    <main class="project-workspace-main">
      <header class="project-workspace-toolbar">
        <span class="project-workspace-title">{{ sideView === 'git' ? t('projectEditor.sourceControl') : (openRel ?? projectName) }}</span>
        <span v-if="dirty && sideView !== 'git'" class="project-workspace-unsaved">{{ t('projectEditor.unsaved') }}</span>
        <div class="project-workspace-toolbar-actions">
          <div class="project-branch-control"><GitBranchControl :cwd="projectPath" open-changes-in-workspace @open-changes="sideView = 'git'" /></div>
          <template v-if="sideView !== 'git' && openRel && markdownFile">
            <button :class="{ active: editorMode === 'edit' }" :aria-label="t('projectEditor.edit')" v-tooltip="t('projectEditor.edit')" @click="editorMode = 'edit'"><IconPencil /></button>
            <button :class="{ active: editorMode === 'preview' }" :aria-label="t('projectEditor.preview')" v-tooltip="t('projectEditor.preview')" @click="editorMode = 'preview'"><IconEye /></button>
          </template>
          <button v-if="sideView !== 'git'" class="project-save" :disabled="!editable || !dirty || busy" @click="save">
            <span v-if="busy" class="chip-spinner" aria-hidden="true" />
            <IconSave v-else />
            {{ busy ? t('projectEditor.saving') : t('projectEditor.save') }}
          </button>
        </div>
      </header>

      <section v-if="sideView === 'git'" class="project-git-view">
        <GitChangesView :cwd="projectPath" :git-ref="gitRef" @ref-change="gitRef = $event" />
      </section>
      <template v-else>
        <p v-if="fileError" class="project-editor-message error">{{ fileError }}</p>
        <div v-else-if="saveError" class="project-editor-save-error">
          <span class="project-editor-message error">{{ saveError }}</span>
          <button v-if="saveError.includes('changed outside')" @click="requestReload">{{ t('projectEditor.reload') }}</button>
        </div>
        <p v-if="binary" class="project-editor-message">{{ t('projectEditor.binary') }}</p>
        <p v-else-if="clipped" class="project-editor-message">{{ t('projectEditor.tooBig') }}</p>
        <CodeEditor
          v-if="openRel && !binary && editorMode === 'edit'"
          ref="editorRef"
          :key="openRel"
          v-model="text"
          :lang="lang"
          :readonly="clipped"
          @save="save"
        />
        <article v-else-if="openRel && editorMode === 'preview' && markdownFile" class="project-markdown-preview md" v-html="renderText(text)" />
        <div v-else-if="!openRel" class="project-editor-empty">{{ t('projectEditor.pickFile') }}</div>
      </template>
    </main>

    <Teleport to="body">
      <div
        v-if="treeContextMenu"
        class="ctx-menu project-tree-context-menu"
        :style="{ left: `${treeContextMenu.x}px`, top: `${treeContextMenu.y}px` }"
        role="menu"
      >
        <button class="ctx-item danger" role="menuitem" @click="requestDelete(treeContextMenu.path)">
          <IconTrash />
          {{ t('projectEditor.delete') }}
        </button>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="quickOpenOpen"
        class="project-quick-open-backdrop"
        @click.self="closeQuickOpen()"
      >
        <section
          class="project-quick-open"
          role="dialog"
          aria-modal="true"
          :aria-label="t('projectEditor.quickOpenTitle')"
        >
          <h2>{{ t('projectEditor.quickOpenTitle') }}</h2>
          <input
            ref="quickOpenInput"
            v-model="quickOpenQuery"
            class="project-quick-open-input"
            type="search"
            role="combobox"
            aria-autocomplete="list"
            aria-haspopup="listbox"
            aria-controls="project-quick-open-list"
            :aria-expanded="true"
            :aria-activedescendant="quickOpenFiles.length ? `project-quick-open-option-${quickOpenActiveIndex}` : undefined"
            :aria-label="t('projectEditor.quickOpenPlaceholder')"
            :placeholder="t('projectEditor.quickOpenPlaceholder')"
          >
          <div id="project-quick-open-list" class="project-quick-open-list" role="listbox">
            <button
              v-for="(entry, index) in quickOpenFiles"
              :id="`project-quick-open-option-${index}`"
              :key="entry.path"
              type="button"
              class="project-quick-open-option"
              role="option"
              :aria-selected="quickOpenActiveIndex === index"
              @mouseenter="quickOpenActiveIndex = index"
              @mousedown.prevent
              @click="openQuickOpenFile(entry)"
            >
              <component :is="fileIconFor(entry.path)" class="project-quick-open-icon" />
              <span class="project-quick-open-name">{{ entry.path.slice(entry.path.lastIndexOf('/') + 1) }}</span>
              <span class="project-quick-open-path">{{ entry.path.includes('/') ? entry.path.slice(0, entry.path.lastIndexOf('/')) : projectName }}</span>
            </button>
            <p v-if="!quickOpenFiles.length" class="project-quick-open-empty">
              {{ t('projectEditor.quickOpenNoResults') }}
            </p>
          </div>
        </section>
      </div>
    </Teleport>

    <ConfirmModal
      :show="deleteTarget !== null"
      :title="t('projectEditor.deleteTitle', { path: deleteTarget?.path ?? '' })"
      :message="`${t('projectEditor.deleteMessage')} ${deletingDirtyFile ? t('projectEditor.deleteUnsavedWarning') : ''}`"
      :ok-text="t('projectEditor.delete')"
      :danger="true"
      :dismissable="!deleting"
      @confirm="confirmDelete"
      @cancel="deleteTarget = null"
    />
    <ConfirmModal
      :show="leaving !== null"
      :title="t('projectEditor.discardTitle')"
      :message="t('projectEditor.discardMessage', { file: openRel ?? '' })"
      :ok-text="t('projectEditor.discard')"
      danger
      @confirm="leaving === '' ? discardAndClose() : discardAndGo()"
      @cancel="leaving = null"
    />
  </div>
</template>

<style scoped>
.project-workspace {
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: var(--bg);
  color: var(--text);
}
.project-workspace-sidebar { display: flex; flex: 0 0 auto; min-width: 220px; border-right: 0; }
.project-sidebar-resizer {
  position: relative;
  z-index: 2;
  flex: 0 0 5px;
  cursor: col-resize;
  touch-action: none;
  outline: none;
}
.project-sidebar-resizer::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 2px;
  width: 1px;
  background: var(--border);
  transition: background 0.12s ease;
}
.project-sidebar-resizer:hover::after,
.project-sidebar-resizer:focus-visible::after { background: var(--accent); }
:global(body.project-sidebar-resizing) { cursor: col-resize !important; user-select: none !important; -webkit-user-select: none !important; }
.project-activity {
  display: flex;
  flex: 0 0 44px;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding-top: 10px;
  border-right: 1px solid var(--border);
  background: var(--surface);
}
.project-activity button {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border: 0;
  border-left: 2px solid transparent;
  background: transparent;
  color: var(--text-mute);
  cursor: pointer;
}
.project-activity button.active { border-left-color: var(--accent); color: var(--text); }
.project-activity svg { width: 18px; height: 18px; }
.project-side-panel { display: flex; flex: 1; flex-direction: column; min-width: 0; min-height: 0; }
.project-side-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 36px;
  padding: 0 8px 0 12px;
  color: var(--text-secondary);
  font-size: 10px;
  font-weight: 650;
  letter-spacing: .04em;
  text-transform: uppercase;
}
.project-side-actions { display: flex; align-items: center; gap: 1px; }
.project-side-actions button {
  display: grid;
  width: 23px;
  height: 23px;
  place-items: center;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--text-mute);
  cursor: pointer;
}
.project-side-actions button:hover { background: var(--surface-hover); color: var(--text); }
.project-side-actions svg { width: 14px; height: 14px; }
.project-tree-scroll, .project-search-results { flex: 1; min-height: 0; overflow: auto; padding: 2px 4px 8px; }
.project-tree-row { display: flex; align-items: center; height: 25px; gap: 5px; padding-right: 8px; border-radius: 3px; color: var(--text-secondary); cursor: pointer; font-size: 11px; }
.project-tree-row:hover { background: var(--surface-hover); }
.project-tree-row.selected { background: color-mix(in srgb, var(--accent) 15%, var(--surface)); color: var(--text); }
.project-tree-chevron { flex: 0 0 12px; width: 12px; height: 12px; transition: transform .12s; }
.project-tree-chevron.expanded { transform: rotate(90deg); }
.project-tree-chevron-spacer { flex: 0 0 12px; }
.project-tree-entry-icon { flex: 0 0 15px; width: 15px; height: 15px; color: var(--text-mute); }
.project-tree-entry-name { overflow: hidden; flex: 1; text-overflow: ellipsis; white-space: nowrap; }
.project-tree-entry-size { color: var(--text-mute); font-size: 9px; }
.project-side-message { padding: 8px 12px; color: var(--text-mute); font-size: 11px; }
.project-side-message.error, .project-editor-message.error { color: var(--danger); }
.project-tree-create { cursor: default; }
.project-create-row { display: flex; flex: 1; align-items: center; min-width: 0; gap: 6px; margin: 1px 2px; padding: 1px 5px; border: 1px solid var(--accent); border-radius: 4px; }
.project-create-row svg { flex: 0 0 14px; width: 14px; height: 14px; }
.project-create-row input, .project-search-query input, .project-search-filter {
  width: 100%; min-width: 0; border: 1px solid var(--border); border-radius: 4px; background: var(--surface-2); color: var(--text); font-size: 11px;
}
.project-create-row input { border: 0; outline: 0; background: transparent; }
.project-workspace-main { display: flex; flex: 1; flex-direction: column; min-width: 0; min-height: 0; padding: 10px; gap: 8px; }
.project-workspace-toolbar { display: flex; align-items: center; min-height: 34px; gap: 9px; padding: 0 4px; border-bottom: 1px solid var(--border); }
.project-workspace-title { overflow: hidden; flex: 1; color: var(--text-secondary); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.project-workspace-unsaved { color: var(--accent); font-size: 10px; }
.project-workspace-toolbar-actions { display: flex; align-items: center; gap: 6px; }
.project-branch-control :deep(.git-branch-menu) { left: auto; right: -6px; }
.project-workspace-toolbar-actions > button, .project-editor-save-error button {
  display: inline-flex; align-items: center; gap: 5px; padding: 5px 8px; border: 1px solid transparent; border-radius: 5px; background: transparent; color: var(--text-mute); cursor: pointer; font-size: 10px;
}
.project-workspace-toolbar-actions > button.active { border-color: var(--border); background: var(--surface-2); color: var(--text); }
.project-workspace-toolbar-actions > button.project-save { border-color: var(--border); background: var(--surface-2); color: var(--text); }
.project-workspace-toolbar-actions > button:disabled { cursor: default; opacity: .45; }
.project-workspace-toolbar-actions svg { width: 14px; height: 14px; }
.project-workspace-toolbar-actions > button:not(.project-save) { width: 28px; height: 28px; justify-content: center; padding: 0; }
.project-branch-control { display: flex; align-items: center; }
.project-git-view { display: flex; flex: 1; min-height: 0; }
.project-git-view :deep(.git-panel) { flex: 1; min-height: 0; }
.project-workspace-main > .ce { flex: 1; min-height: 0; }
.project-markdown-preview { flex: 1; min-height: 0; overflow: auto; padding: 24px clamp(24px, 8vw, 120px); border: 1px solid var(--border); border-radius: 8px; background: var(--surface-2); }
.project-editor-empty { display: grid; flex: 1; place-items: center; color: var(--text-mute); font-size: 12px; }
.project-editor-message { margin: 4px 8px; color: var(--text-mute); font-size: 11px; }
.project-editor-save-error { display: flex; align-items: center; gap: 8px; }
.project-editor-save-error button { color: var(--accent); }
.project-search-form { display: grid; gap: 7px; padding: 8px; }
.project-search-query { display: flex; gap: 4px; }
.project-search-query input { padding: 6px 7px; }
.project-search-query button { display: grid; width: 28px; place-items: center; border: 1px solid var(--border); border-radius: 4px; background: var(--surface-2); color: var(--text-mute); cursor: pointer; }
.project-search-query button svg { width: 14px; height: 14px; }
.project-search-toggles { display: flex; justify-content: flex-end; gap: 4px; }
.project-search-toggles button { min-width: 25px; padding: 3px 5px; border: 1px solid transparent; border-radius: 4px; background: transparent; color: var(--text-mute); cursor: pointer; font-size: 10px; }
.project-search-toggles button.active { border-color: var(--accent); color: var(--text); }
.project-search-filter { padding: 6px 7px; }
.project-search-result-head { min-height: 22px; padding: 3px 10px; color: var(--text-mute); font-size: 10px; }
.project-search-group { margin-bottom: 8px; }
.project-search-group > header { display: flex; align-items: center; gap: 5px; padding: 5px 6px; color: var(--text-secondary); font-size: 10px; }
.project-search-group > header svg { width: 13px; height: 13px; }
.project-search-group > header strong { overflow: hidden; flex: 1; text-overflow: ellipsis; white-space: nowrap; }
.project-search-group > header span { color: var(--text-mute); }
.project-search-match { display: flex; width: 100%; gap: 8px; padding: 4px 8px 4px 14px; border: 0; background: transparent; color: var(--text-mute); cursor: pointer; text-align: left; font-size: 10px; }
.project-search-match:hover { background: var(--surface-hover); color: var(--text); }
.project-search-match > span { flex: 0 0 28px; text-align: right; }
.project-search-match code { overflow: hidden; flex: 1; text-overflow: ellipsis; white-space: nowrap; }
.project-search-match code :deep(mark) { border-radius: 2px; background: color-mix(in srgb, var(--accent) 36%, transparent); color: var(--text); }
.project-source-panel > p { padding: 0 12px; color: var(--text-mute); font-size: 11px; }
.project-quick-open-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: max(48px, 9vh) 16px 20px;
  background: rgb(0 0 0 / 28%);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}
.project-quick-open {
  display: flex;
  width: min(640px, 100%);
  max-height: min(520px, 72vh);
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  box-shadow: var(--shadow-lg);
}
.project-quick-open h2 {
  margin: 0;
  padding: 13px 15px 8px;
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 600;
}
.project-quick-open-input {
  flex: 0 0 auto;
  margin: 0 12px 9px;
  padding: 9px 10px;
  border: 1px solid var(--accent);
  border-radius: 6px;
  outline: 0;
  background: var(--surface-2);
  color: var(--text);
  font-size: 13px;
}
.project-quick-open-list { min-height: 0; overflow: auto; padding: 0 6px 7px; }
.project-quick-open-option {
  display: flex;
  width: 100%;
  min-height: 32px;
  align-items: center;
  gap: 9px;
  padding: 5px 9px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  text-align: left;
  font-size: 11px;
}
.project-quick-open-option[aria-selected="true"],
.project-quick-open-option:hover { background: var(--surface-hover); color: var(--text); }
.project-quick-open-icon { flex: 0 0 15px; width: 15px; height: 15px; color: var(--text-mute); }
.project-quick-open-name { overflow: hidden; flex: 0 1 auto; text-overflow: ellipsis; white-space: nowrap; }
.project-quick-open-path { overflow: hidden; flex: 1; color: var(--text-mute); text-align: right; text-overflow: ellipsis; white-space: nowrap; }
.project-quick-open-empty { padding: 14px 10px; color: var(--text-mute); text-align: center; font-size: 11px; }
@media (max-width: 720px) {
  .project-workspace-sidebar { flex-basis: 235px; min-width: 190px; }
  .project-activity { flex-basis: 38px; }
  .project-workspace-main { padding: 6px; }
}
</style>
