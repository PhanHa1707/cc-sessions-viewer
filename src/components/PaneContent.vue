<script setup lang="ts">
// 一个分屏格子（pane）的完整内容：顶部 TerminalStrip + 主体（view 层 ⊕ TUI 层）。
//
// 这是把原来 App.vue 里「.main 的 strip + main-body」整块搬出来的呈现组件，改成按传入的
// `pane` 渲染，从而可以在 PaneGrid 里被实例化多次（每个叶子一个）。
//   · view 数据（openSession / liveChat / chatMsgs …）全部由**本 pane 的 active view tab**
//     派生 —— 不再读全局 activeViewTab 投影，这样多格子各显示各的。
//   · 行为（删除 / 导出 / resume / 新建 tab …）通过 inject 的 PaneActions 调用 App.vue。
//   · 根节点 pointerdown（capture）先聚焦 pane 并标记当前 TUI tab 已查看，于是那些读「聚焦
//     pane」的无参 action 天然作用在被点的格子上。
//
// 全局全区视图（stats / trash / history / pricing）不在这里 —— 它们在 App.vue 顶层接管整个
// 主区，不进分屏格子。

import { computed, inject, ref, watchEffect, onUnmounted } from 'vue'
import type { Agent, ProjectInfo, SessionMeta, TrashItem, Msg } from '../types'
import type { ChatSession } from '../chatSessions'
import { t } from '../i18n'
import { formatTime } from '../format'
import { viewTabs, type ViewTab } from '../viewTabs'
import { type Pane, focusPane, isFocused, paneCount } from '../panes'
import { markTabViewed } from '../terminals'
import { dragState } from '../tabDrag'
import { registerPaneViews, unregisterPaneViews } from '../paneRegistry'
import { IconExternalLink } from './icons'
import { PaneActionsKey, type PaneActions } from '../paneActions'
import TerminalStrip from './TerminalStrip.vue'
import TerminalPaneSlot from './TerminalPaneSlot.vue'
import ChatView from '../views/ChatView.vue'
import SessionsView from '../views/SessionsView.vue'
import WelcomeView from '../views/WelcomeView.vue'
import GitChangesView from '../views/GitChangesView.vue'

const props = defineProps<{
  pane: Pane
  /** 当前侧栏选中的项目（所有格子共享同一 (agent, project)）。 */
  activeProject: ProjectInfo | undefined
  agent: Agent
  projects: ProjectInfo[]
  sessions: SessionMeta[]
  sessionTotal: number
  loadingList: boolean
  loadingMore: boolean
  /** 聚焦格子若打开的是回收站会话则非空（决定只读/恢复）。 */
  openTrashItem: TrashItem | null
  hasGit: boolean
}>()

const actions = inject(PaneActionsKey) as PaneActions

function focusCurrentPane() {
  focusPane(props.pane.id)
  if (props.pane.activeUiId !== null) markTabViewed(props.pane.activeUiId)
}

// 本 pane 的 ChatView 实例登记进注册表，App.vue 按聚焦 paneId 取用
// （flashMessage / onLiveAppend）。子实例挂载后 ref 变化会重登记。
const chatView = ref<InstanceType<typeof ChatView> | null>(null)
watchEffect(() => {
  registerPaneViews(props.pane.id, { chatView: chatView.value })
})
onUnmounted(() => unregisterPaneViews(props.pane.id))

// —— 本 pane 的 tab ——
const paneViewTab = computed<ViewTab | null>(
  () => viewTabs.value.find((tb) => tb.uiId === props.pane.activeViewTabId) ?? null,
)
const paneViewTabs = computed<ViewTab[]>(() =>
  viewTabs.value.filter(
    (tb) =>
      tb.agent === props.pane.agent &&
      tb.projectKey === props.pane.projectKey &&
      tb.paneId === props.pane.id,
  ),
)
// strip 只在选中了项目时显示 List/新建 等 in-project 元素；全局视图接管时本组件根本不渲染，
// 所以这里等价于 !!activeProject。
const inProjectBrowse = computed(() => !!props.activeProject)

// —— 从本 pane 的 view tab 派生的展示数据（逻辑同原 App.vue，仅数据源换成 paneViewTab）——
const openSession = computed<SessionMeta | null>(() => {
  const tab = paneViewTab.value
  if (!tab) return null
  if (tab.type === 'session') return tab.session
  if (tab.type === 'chat') return tab.sourceSession
  return null
})
const liveChat = computed<ChatSession | null>(() => {
  const tab = paneViewTab.value
  return tab?.type === 'chat' ? tab.chatSession : null
})
const chatMsgs = computed<Msg[]>(() => {
  const tab = paneViewTab.value
  if (!tab) return []
  if (tab.type === 'session') return tab.msgs
  if (tab.type === 'chat') return tab.chatSession?.msgs ?? []
  return []
})
// 只读会话的 msgs 是按需装载的（启动恢复只建壳，后台闲置会被释放；见 viewTabs.ts）。
// 一个还没装载的 session tab 必然马上就要读盘，所以直接显示 loading —— 否则会先闪
// 一下「空会话」再出内容。
const showMsgsLoading = computed(() => {
  const tab = paneViewTab.value
  if (!tab) return false
  return tab.loadingMsgs || (tab.type === 'session' && !tab.msgsLoaded)
})
const liveTailing = computed(() => paneViewTab.value?.liveTailing ?? false)
const chatAgent = computed<Agent>(
  () =>
    paneViewTab.value?.trashAgent ??
    paneViewTab.value?.importedAgent ??
    paneViewTab.value?.agent ??
    props.agent,
)
const chatCwd = computed<string>(() => {
  if (props.openTrashItem) return ''
  return openSession.value?.cwd || props.activeProject?.displayPath || ''
})
const liveChatSourceSession = computed<SessionMeta | null>(() => {
  const tab = paneViewTab.value
  if (!tab || tab.type !== 'chat') return null
  return tab.sourceSession
})
/** 列表层此刻是否该露出来 —— 等价于原来那条 v-if 链走到 SessionsView 分支的条件。
 *
 * 列表被从链里摘出来单独挂载，靠 v-show 藏：打开会话详情时它只是 display:none，
 * 不再整个卸载。卸载会把滚动位置连同 DOM 一起丢掉，点回 List 只能事后再"恢复"，
 * 而这个列表没有虚拟滚动，几十上百张卡的高度在单次 nextTick 时还没稳定，恢复必然
 * 对不准。不卸载就没有"恢复"这个动作 —— scrollTop 由 WebView 自己保着。
 * （ChatView 是虚拟化的，display:none 会让它收到 0 高测量，所以那几个分支保持原样。） */
const showSessionsList = computed(() => {
  const tab = paneViewTab.value
  if (tab?.type === 'chat' && liveChat.value) return false
  if (tab?.type === 'session' && openSession.value) return false
  if (tab?.type === 'git' && tab.gitCwd) return false
  return !!props.activeProject
})

const liveChatMeta = computed<SessionMeta>(() => {
  const c = liveChat.value
  const source = liveChatSourceSession.value
  return {
    id: c?.sessionId ?? '',
    fileName: source?.fileName ?? '',
    path: source?.path ?? '',
    title: c?.title ?? t('list.action.newSessionGui'),
    cwd: source?.cwd ?? c?.cwd,
    created: c?.createdAt,
    modified: source?.modified ?? 0,
    size: source?.size ?? 0,
    messageCount: source?.messageCount ?? c?.msgs.length ?? 0,
    codexAppListRank: null,
    codexAppListScanned: 0,
    codexAppFirstPageSize: 0,
    codexAppFirstPagePosition: 0,
  } as SessionMeta
})

// 只读详情里的紧凑会话查看器。它与完整 SessionsView 分开挂载，切换当前详情时不丢展开状态。
const sessionNavigatorOpen = ref(false)
const sessionNavigatorQuery = ref('')
const pendingSessionPath = ref<string | null>(null)
let sessionNavigatorRequest = 0
const canShowSessionNavigator = computed(() => {
  const tab = paneViewTab.value
  return !!(
    tab?.type === 'session' &&
    openSession.value &&
    !tab.chatSession &&
    !props.openTrashItem &&
    !tab.trashAgent &&
    !tab.importedAgent &&
    tab.agent === props.agent &&
    tab.projectKey === (props.activeProject?.dirName ?? '')
  )
})
const navigatorSessions = computed(() => {
  const query = sessionNavigatorQuery.value.trim().toLocaleLowerCase()
  const current = openSession.value
  const source = current && !props.sessions.some(session => session.path === current.path)
    ? [current, ...props.sessions]
    : props.sessions
  if (!query) return source
  return source.filter((session) =>
    `${session.title} ${session.id} ${session.cwd ?? ''} ${session.path}`
      .toLocaleLowerCase()
      .includes(query),
  )
})

async function openNavigatorSession(session: SessionMeta, openInBackground: boolean) {
  const tab = paneViewTab.value
  if (!tab || tab.type !== 'session' || !canShowSessionNavigator.value) return
  const request = ++sessionNavigatorRequest
  pendingSessionPath.value = session.path
  try {
    if (openInBackground) await actions.openChatInBackground(session)
    else await actions.openChat(session)
  } finally {
    if (request === sessionNavigatorRequest) pendingSessionPath.value = null
  }
}

function chooseNavigatorSession(session: SessionMeta, e: MouseEvent) {
  if (e.type === 'auxclick' && e.button !== 1) return
  const openInBackground = e.metaKey || e.ctrlKey || e.button === 1
  if (openInBackground) e.preventDefault()
  return openNavigatorSession(session, openInBackground)
}
</script>

<template>
  <div
    class="pane"
    :class="{
      'pane-focused': isFocused(pane.id),
      'pane-drop-target':
        dragState.active && dragState.overPaneId === pane.id && dragState.sourcePaneId !== pane.id,
    }"
    :data-pane-id="pane.id"
    @pointerdown.capture="focusCurrentPane"
  >
    <TerminalStrip
      :pane="pane"
      :agent="pane.agent"
      :project-key="pane.projectKey"
      :in-project-browse="inProjectBrowse"
      :has-git="hasGit"
      :view-tabs="paneViewTabs"
      :active-view-tab-id="pane.activeViewTabId"
      @list-click="actions.onTuiListClick"
      @view-click="actions.onTuiViewTabClick"
      @view-close="actions.onTuiViewClose"
      @view-rename="actions.onViewRename"
      @view-close-others="actions.onViewCloseOthers"
      @view-close-project="actions.onViewCloseProject"
      @close-others-all="actions.onCloseOthersAll"
      @close-all="actions.onCloseAll"
      @tab-closed="actions.onTuiTabClosed"
      @tab-rename="actions.openRenameFromTuiTab"
      @saved-rename="actions.openRenameFromSavedTab"
      @tabs-reordered="actions.saveTabState"
      @new-session="actions.newSession"
      @new-default="actions.newDefaultAction"
      @new-gui-session="actions.newGuiSession"
      @new-shell="actions.newShellSession"
      @git-changes="actions.openGitChanges"
      @refresh="actions.refreshSessions"
      @hydrate-saved="actions.hydrateSavedTab"
    />

    <div class="main-body">
      <!-- view 层：本 pane 无 active TUI tab 时显示 -->
      <div
        class="view-layer"
        :class="{ 'is-covered': pane.activeUiId !== null }"
        :aria-hidden="pane.activeUiId !== null"
      >
        <!-- live GUI chat tab -->
        <ChatView
          v-if="paneViewTab?.type === 'chat' && liveChat"
          :key="paneViewTab.uiId"
          :agent="liveChat.agent"
          :session="liveChatMeta"
          :messages="liveChat.msgs"
          :live-session="liveChat"
          :cwd="liveChat.cwd"
          :has-read-view="!!liveChatSourceSession"
          @back="actions.backFromLiveChat()"
          @rename="actions.openRenameLiveChat"
          @fork="actions.forkLiveChat"
          @edit-cancelled="actions.editCancelledPrompt"
          @archive="actions.archiveLiveChat"
          @switch-to-read="actions.switchLiveChatToRead"
          @open-session-stats="actions.openLiveChatStats"
          @reveal="actions.reveal(liveChatSourceSession?.path || liveChat.cwd || '')"
          @copy-id="actions.copyText(liveChatMeta.id)"
          @export-md="actions.exportLiveChat('md')"
          @export-html="actions.exportLiveChat('html')"
          @export-json="actions.exportLiveChat('json')"
          @delete="actions.deleteFromLiveChat"
        />

        <!-- session tab（只读查看） -->
        <template v-else-if="paneViewTab?.type === 'session' && openSession">
          <div class="session-detail-layout">
            <aside
              v-if="canShowSessionNavigator"
              v-show="sessionNavigatorOpen"
              class="session-navigator"
              :aria-label="t('chat.sessionNavigator.title')"
            >
              <div class="session-navigator-head">
                <strong>{{ t('chat.sessionNavigator.title') }}</strong>
                <span class="session-navigator-count">{{ props.sessions.length }} / {{ props.sessionTotal }}</span>
                <button
                  type="button"
                  class="session-navigator-close"
                  :aria-label="t('chat.sessionNavigator.hide')"
                  @click="sessionNavigatorOpen = false"
                >×</button>
              </div>
              <input
                v-model="sessionNavigatorQuery"
                class="session-navigator-search"
                type="search"
                :placeholder="t('chat.sessionNavigator.search')"
                :aria-label="t('chat.sessionNavigator.search')"
              />
              <div class="session-navigator-list">
                <div
                  v-for="session in navigatorSessions"
                  :key="session.path"
                  class="session-navigator-row"
                  :class="{ pending: session.path === pendingSessionPath }"
                >
                  <button
                    type="button"
                    class="session-navigator-item"
                    :class="{
                      current: session.path === openSession.path,
                      pending: session.path === pendingSessionPath,
                    }"
                    :aria-current="session.path === openSession.path ? 'page' : undefined"
                    :title="session.title"
                    @click="chooseNavigatorSession(session, $event)"
                    @auxclick="chooseNavigatorSession(session, $event)"
                  >
                    <span class="session-navigator-item-title">{{ session.title }}</span>
                    <span class="session-navigator-item-meta">
                      <span>{{ formatTime(session.modified) }}</span>
                      <span v-if="session.path === pendingSessionPath" class="session-navigator-spinner" aria-hidden="true" />
                    </span>
                  </button>
                  <button
                    type="button"
                    class="session-navigator-open-background"
                    :aria-label="t('list.action.openBackground')"
                    v-tooltip="t('list.action.openBackground')"
                    @click.stop="openNavigatorSession(session, true)"
                  >
                    <IconExternalLink />
                  </button>
                </div>
                <div v-if="!navigatorSessions.length" class="session-navigator-empty">
                  {{ t('chat.sessionNavigator.empty') }}
                </div>
              </div>
              <button
                v-if="props.sessions.length < props.sessionTotal"
                type="button"
                class="session-navigator-more"
                :disabled="props.loadingMore"
                @click="actions.loadMore"
              >
                {{ props.loadingMore ? t('list.footer.loading') : t('chat.sessionNavigator.loadMore') }}
              </button>
            </aside>

            <div class="session-detail-content">
              <div v-if="showMsgsLoading" class="loading">{{ t('common.loading') }}</div>
              <ChatView
                v-else
                :key="`${paneViewTab.uiId}:${openSession.path}`"
                ref="chatView"
                :agent="chatAgent"
                :session="openSession"
                :messages="chatMsgs"
                :trashed="!!openTrashItem"
                :live="liveTailing"
                :cwd="chatCwd"
                :pi-tree="paneViewTab.piTree"
                :pi-leaf-id="paneViewTab.piLeafId"
                :pi-has-older="paneViewTab.piHasOlder"
                :pi-loading-older="paneViewTab.piLoadingOlder"
                :pi-stats="paneViewTab.piStats"
                :session-navigator-enabled="canShowSessionNavigator"
                :session-navigator-open="sessionNavigatorOpen"
                @back="actions.closeActiveViewTab"
                @toggle-session-navigator="sessionNavigatorOpen = !sessionNavigatorOpen"
                @refresh="actions.openChat(openSession)"
                @delete="actions.deleteSession(openSession)"
                @resume-here="actions.resumeHere(openSession)"
                @switch-to-chat="actions.resumeChatFromSession(openSession)"
                @rename="actions.openRename(openSession)"
                @reveal="actions.reveal(openSession.path)"
                @copy-id="actions.copyText(openSession.id)"
                @export-md="actions.exportSession('md')"
                @export-html="actions.exportSession('html')"
                @export-json="actions.exportSession('json')"
                @restore="openTrashItem && actions.restore(openTrashItem)"
                @open-session-stats="actions.openSessionStats"
                @pi-leaf-change="actions.switchPiLeaf"
                @load-pi-older="actions.loadOlderPiPage(paneViewTab.uiId)"
                @load-pi-all="actions.loadAllPiHistory(paneViewTab.uiId)"
              />
            </div>
          </div>
        </template>

        <GitChangesView
          v-else-if="paneViewTab?.type === 'git' && paneViewTab.gitCwd"
          :key="paneViewTab.uiId"
          :cwd="paneViewTab.gitCwd"
          :git-ref="paneViewTab.gitRef || 'working'"
          :selected-path="paneViewTab.gitSelectedPath"
          @ref-change="(r: string) => { if (paneViewTab) paneViewTab.gitRef = r }"
          @path-change="(p: string | null) => { if (paneViewTab) paneViewTab.gitSelectedPath = p }"
        />

        <WelcomeView
          v-else-if="!activeProject"
          :agent="agent"
          :projects="projects"
          @select-project="actions.selectProject"
          @switch-agent="actions.switchAgent"
          @open-repo="actions.openRepo"
        />

        <!-- 列表层：选中项目后常驻挂载，只用 v-show 藏（理由见 showSessionsList）。
             外面这层 div 不能省 —— SessionsView 是多根组件（list-head + 滚动区），
             v-show 落不到根元素上会静默失效，变成列表和详情一起占着高度。 -->
        <div v-if="activeProject" v-show="showSessionsList" class="list-layer">
          <SessionsView
            :agent="agent"
            :project="activeProject"
            :sessions="sessions"
            :session-total="sessionTotal"
            :loading="loadingList"
            :loading-more="loadingMore"
            :show-exit-pane="paneCount > 1"
            @open="actions.openChat"
            @rename="actions.openRename"
            @resume="actions.resumeHere"
            @chat="actions.chatFromList"
            @archived-block="actions.notifyArchivedBlock"
            @reveal="actions.reveal"
            @delete="actions.deleteSession"
            @copy="actions.copyText"
            @export="actions.exportFromList"
            @refresh="actions.refreshSessions"
            @create-worktree="actions.createWorktree"
            @new-session="actions.newSession"
            @new-shell="actions.newShellSession"
            @exit-pane="actions.exitPane(pane.id)"
            @load-more="actions.loadMore"
            @batch-delete="actions.batchDeleteSessions"
            @batch-export="actions.batchExportSessions"
            @new-gui-session="actions.newGuiSession"
          />
        </div>
      </div>

      <!-- TUI 层 -->
      <TerminalPaneSlot
        v-show="pane.activeUiId !== null"
        :pane="pane"
        class="tui-layer"
      />
    </div>
  </div>
</template>

<style scoped>
.session-detail-layout {
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.session-navigator {
  display: flex;
  flex: 0 0 248px;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  border-right: 1px solid var(--border);
  background: var(--surface);
}

.session-navigator-head {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 10px 0 14px;
  border-bottom: 1px solid var(--border);
  color: var(--text);
  font-size: 12px;
}

.session-navigator-head strong {
  overflow: hidden;
  flex: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-navigator-count {
  color: var(--text-mute);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}

.session-navigator-close {
  width: 26px;
  height: 26px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--text-mute);
  cursor: pointer;
  font: inherit;
  font-size: 18px;
  line-height: 1;
}

.session-navigator-close:hover {
  background: var(--surface-hover);
  color: var(--text);
}

.session-navigator-search {
  height: 32px;
  margin: 10px 10px 6px;
  padding: 0 9px;
  border: 1px solid var(--border);
  border-radius: 6px;
  outline: none;
  background: var(--surface-2);
  color: var(--text);
  font: inherit;
  font-size: 11px;
}

.session-navigator-search:focus {
  border-color: var(--border-strong);
}

.session-navigator-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 4px 6px 8px;
}

.session-navigator-row {
  position: relative;
  margin: 2px 0;
}

.session-navigator-item {
  display: flex;
  width: 100%;
  min-height: 48px;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  margin: 0;
  padding: 6px 9px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--text-dim);
  cursor: pointer;
  text-align: left;
}

.session-navigator-open-background {
  display: grid;
  position: absolute;
  top: 50%;
  right: 6px;
  width: 28px;
  height: 28px;
  transform: translateY(-50%);
  place-items: center;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--text-mute);
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
}

.session-navigator-row:hover .session-navigator-open-background,
.session-navigator-row:focus-within .session-navigator-open-background {
  opacity: 1;
  pointer-events: auto;
}

.session-navigator-row.pending .session-navigator-open-background {
  opacity: 0;
  pointer-events: none;
}

.session-navigator-open-background:hover {
  background: var(--surface-hover);
  color: var(--text);
}

.session-navigator-open-background svg {
  width: 15px;
  height: 15px;
}

.session-navigator-item:hover {
  background: var(--surface-hover);
  color: var(--text);
}

.session-navigator-row:hover .session-navigator-item,
.session-navigator-row:focus-within .session-navigator-item {
  padding-right: 42px;
}

.session-navigator-item.current {
  background: var(--surface-active);
  color: var(--text);
}

.session-navigator-item:focus-visible,
.session-navigator-open-background:focus-visible,
.session-navigator-close:focus-visible,
.session-navigator-more:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 1px;
}

.session-navigator-item-title {
  overflow: hidden;
  width: 100%;
  font-size: 11px;
  font-weight: 550;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-navigator-item-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--text-mute);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}

.session-navigator-spinner {
  width: 10px;
  height: 10px;
  border: 1px solid var(--border-strong);
  border-top-color: var(--brand);
  border-radius: 50%;
  animation: session-navigator-spin 0.7s linear infinite;
}

.session-navigator-empty {
  padding: 18px 8px;
  color: var(--text-mute);
  font-size: 11px;
  text-align: center;
}

.session-navigator-more {
  min-height: 34px;
  margin: 4px 10px 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: transparent;
  color: var(--text-dim);
  cursor: pointer;
  font: inherit;
  font-size: 11px;
}

.session-navigator-more:hover:not(:disabled) {
  background: var(--surface-hover);
  color: var(--text);
}

.session-navigator-more:disabled {
  cursor: default;
  opacity: 0.55;
}

.session-detail-content {
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
}

.session-detail-content > .loading {
  flex: 1;
}

@keyframes session-navigator-spin {
  to { transform: rotate(360deg); }
}
</style>
