// Manual post-publication command. No worktree/index writes and no key generation.
import { execFileSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isContentPage, selectChanges, notifyIndexNow, SITE_ORIGIN } from './indexnow-lib.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const usage = `Usage: npm run docs:indexnow -- --from PREVIOUS_PUBLISHED_COMMIT --to NEW_PUBLISHED_COMMIT [--submit --published]
Default: dry-run; committed source changes only, no HTTP requests.
Submit: deploy first, review the dry-run list, host a verification .txt at the production root,
then provide INDEXNOW_KEY (and optional INDEXNOW_KEY_LOCATION). Never part of docs build/CI.
Uncommitted files are intentionally excluded. Source candidates are not a deployment check.`

function parseArgs(args) {
  const options = { submit: false, published: false }
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--help') return { help: true }
    if (arg === '--from' || arg === '--to') {
      const name = arg.slice(2)
      const value = args[++i]
      if (options[name] !== undefined || !value || value.startsWith('-')) throw new Error('Each commit baseline requires exactly one explicit ref')
      options[name] = value
    } else if (arg === '--submit' || arg === '--published') {
      const name = arg.slice(2)
      if (options[name]) throw new Error('Repeated option: ' + arg)
      options[name] = true
    } else throw new Error('Unknown option: ' + arg)
  }
  if (!options.from || !options.to) throw new Error('Specify both --from and --to; no implicit HEAD or all-pages submission')
  if (options.published && !options.submit) throw new Error('--published requires --submit; otherwise use the default dry-run')
  if (options.submit && !options.published) throw new Error('--submit requires --published after the deployment is confirmed')
  return options
}

function git(args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] })
}
function commit(ref) {
  const sha = git(['rev-parse', '--verify', '--end-of-options', ref + '^{commit}']).trim()
  if (!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(sha)) throw new Error('Invalid resolved commit')
  return sha
}
function tree(sha) { return git(['ls-tree', '-r', '--name-only', '-z', sha, '--']).split('\0').filter(isContentPage) }
function reader(sha) {
  const cache = new Map()
  return (path) => {
    if (!cache.has(path)) cache.set(path, git(['show', `${sha}:${path}`]))
    return cache.get(path)
  }
}

try {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    console.log(usage)
  } else {
    if (options.submit && process.env.SITE_URL && process.env.SITE_URL.replace(/\/$/, '') !== SITE_ORIGIN) throw new Error('Refusing submission from a preview/custom SITE_URL environment')
    const from = commit(options.from)
    const to = commit(options.to)
    const changedPaths = git(['diff', '--name-only', '--no-renames', '-z', from, to, '--']).split('\0').filter(Boolean)
    const selection = selectChanges({ changedPaths, beforePages: tree(from), afterPages: tree(to), readBefore: reader(from), readAfter: reader(to) })
    const plan = { from, to, origin: SITE_ORIGIN, ...selection }
    const result = await notifyIndexNow(plan, {
      submit: options.submit, published: options.published,
      key: process.env.INDEXNOW_KEY, keyLocation: process.env.INDEXNOW_KEY_LOCATION,
    })
    console.log(JSON.stringify(result, null, 2))
  }
} catch (error) {
  console.error(`[indexnow] ${error.message}\n${usage}`)
  process.exitCode = 1
}
