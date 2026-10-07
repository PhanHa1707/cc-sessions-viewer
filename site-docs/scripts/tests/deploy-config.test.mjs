import assert from 'node:assert/strict'
import test from 'node:test'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const src = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const root = resolve(src, '..')

test('deployment typecheck config is self-contained and test typings have their own gate', () => {
  const config = JSON.parse(readFileSync(join(src, 'tsconfig.json'), 'utf8'))
  const ignore = readFileSync(join(root, '.vercelignore'), 'utf8')
  assert.match(ignore, /^\/tsconfig\.json$/m)
  assert.match(ignore, /^\/test$/m)
  assert.equal(config.extends, undefined, 'docs build cannot inherit excluded desktop config')
  assert.equal(config.compilerOptions.strict, true)
  assert.equal(config.compilerOptions.noEmit, true)
  assert.equal(config.compilerOptions.skipLibCheck, true, 'same declaration policy as the desktop, not lost via missing inheritance')
  assert.equal(config.compilerOptions.moduleResolution, 'bundler')
  assert.ok(config.include.every(path => path.startsWith('.vitepress/theme/')), 'build inputs must not include excluded desktop/tests')
  const scripts = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).scripts
  assert.ok(scripts['docs:test:ui'].includes('docs:typecheck:tests'), 'do not silently drop UI test typing')
})

test('actual vue-tsc passes without uploaded root config/tests, retains strictness and catches broken inheritance', () => {
  const scratch = mkdtempSync(join(tmpdir(), 'sv-docs-types-'))
  const target = join(scratch, 'site-docs')
  try {
    mkdirSync(target)
    cpSync(join(src, '.vitepress/theme'), join(target, '.vitepress/theme'), { recursive: true })
    cpSync(join(src, 'tsconfig.json'), join(target, 'tsconfig.json'))
    symlinkSync(join(root, 'node_modules'), join(scratch, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir')
    assert.equal(existsSync(join(scratch, 'tsconfig.json')), false)
    assert.equal(existsSync(join(scratch, 'test')), false)
    assert.equal(existsSync(join(scratch, 'src')), false)
    const run = () => {
      const result = spawnSync(process.execPath, [join(root, 'node_modules/vue-tsc/bin/vue-tsc.js'), '--noEmit', '-p', join(target, 'tsconfig.json')], { cwd: scratch, encoding: 'utf8' })
      if (result.error !== undefined) throw result.error
      return { status: result.status, output: result.stdout + result.stderr }
    }
    const good = run()
    assert.equal(good.status, 0, good.output)

    // skipLibCheck does not suppress errors in our actual Vue source.
    const invalid = join(target, '.vitepress/theme/StrictRegression.vue')
    writeFileSync(invalid, '<script setup lang="ts">const value: number = undefined</script><template>{{ value }}</template>')
    const strict = run()
    assert.notEqual(strict.status, 0)
    assert.match(strict.output, /StrictRegression\.vue.*TS2322/)
    rmSync(invalid)

    const brokenConfig = JSON.parse(readFileSync(join(target, 'tsconfig.json'), 'utf8'))
    brokenConfig.extends = '../tsconfig.json'
    writeFileSync(join(target, 'tsconfig.json'), JSON.stringify(brokenConfig))
    const broken = run()
    assert.notEqual(broken.status, 0)
    assert.match(broken.output, /TS5083/, 'regression must prove absent-root inheritance is caught')
  } finally {
    rmSync(scratch, { recursive: true, force: true })
  }
})
