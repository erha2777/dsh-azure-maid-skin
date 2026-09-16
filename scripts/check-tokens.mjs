/**
 * check:tokens —— 校验语义映射表与设计基线一致
 * ============================================================================
 * 做四件事:
 *   1. 表本身无重复 token,且数量等于 EXPECTED_TOKEN_COUNT;
 *   2. 每个角色名都能在 palette 里解析(角色拼错会让 buildTokenSets 抛错);
 *   3. 每个值都是合法的 sRGB 十六进制(6 位或 8 位,含 alpha);
 *   4. 若本机装有 DSH,则把表与**设计基线样式表**里的真实 token 清单逐一对齐 ——
 *      多一个(基线没有)或少一个(基线有但没覆盖)都算失败。
 *
 * 第 4 步是"升级哨兵":DSH 版本升级新增语义 token 时,这里会立刻报出来,
 * 而不是等到用户在界面上看到某个角落还是官方配色才发现。
 *
 * 用法:node scripts/check-tokens.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { C } from '../theme/palette.mjs'
import { ROLE_MAP, EXPECTED_TOKEN_COUNT, buildTokenSets } from '../theme/tokens.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const HEX = /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/

const failures = []
const notes = []

// ── 1 / 2:表结构与角色解析 ──────────────────────────────────────────────────
const seen = new Set()
for (const [token, roles] of ROLE_MAP) {
  if (seen.has(token)) failures.push(`重复 token:${token}`)
  seen.add(token)
  if (!Array.isArray(roles) || roles.length !== 2) failures.push(`角色必须是 [light, dark]:${token}`)
}
if (ROLE_MAP.length !== EXPECTED_TOKEN_COUNT) {
  failures.push(`token 数量 ${ROLE_MAP.length} ≠ 期望 ${EXPECTED_TOKEN_COUNT}`)
}

// buildTokenSets 会在角色缺失时抛错 —— 这就是第 2 步的断言。
let sets
try {
  sets = buildTokenSets(C)
} catch (err) {
  failures.push(String((err && err.message) || err))
}

// ── 3:颜色字面量合法性 ─────────────────────────────────────────────────────
if (sets) {
  for (const mode of ['light', 'dark']) {
    const set = sets[mode]
    for (const [token, value] of Object.entries(set)) {
      if (!HEX.test(value)) failures.push(`${mode} ${token}: 非法颜色字面量 "${value}"`)
    }
  }

  // 亮暗两档必须真的不同 —— 这一条拦的是"两个档位填了同一套值"的事故:
  // 生成出来的皮肤能装上、也能覆盖,但用户切到暗色时毫无变化。
  let identical = 0
  for (const token of Object.keys(sets.light)) {
    if (sets.light[token] === sets.dark[token]) identical += 1
  }
  if (identical === Object.keys(sets.light).length) {
    failures.push('亮暗两档完全相同 —— palette 的 dark 档没有被真正使用')
  } else {
    notes.push(`亮暗两档取值不同:${Object.keys(sets.light).length - identical} 个 token 有差异,${identical} 个共用`)
  }
}

// ── 4:与设计基线对齐(需要本机 DSH 安装)────────────────────────────────────
function findBaselineCss() {
  const bases = [
    process.env.DSH_NODE_MODULES,
    path.join(process.env.APPDATA || '', 'npm', 'node_modules'),
    path.join(process.env.LOCALAPPDATA || '', 'npm-cache', '_npx'),
    path.join(process.env.HOME || '', '.npm', '_npx'),
  ].filter(Boolean)
  for (const base of bases) {
    const direct = path.join(base, '@deepseek-ai', 'dsh-client-ui-theme', 'lib', 'client.js')
    if (fs.existsSync(direct)) return direct
    // _npx 下多一层哈希目录
    let entries
    try {
      entries = fs.readdirSync(base)
    } catch {
      continue
    }
    for (const entry of entries) {
      const candidate = path.join(base, entry, 'node_modules', '@deepseek-ai', 'dsh-client-ui-theme', 'lib', 'client.js')
      if (fs.existsSync(candidate)) return candidate
    }
  }
  return null
}

const baselineFile = findBaselineCss()
if (baselineFile === null) {
  notes.push('未找到本机 DSH 安装,跳过设计基线对齐(第 4 步)。')
} else {
  const source = fs.readFileSync(baselineFile, 'utf8')
  const match = source.match(/var design_platform_css_default = "([\s\S]*?)";\n/)
  if (match === null) {
    notes.push('本机 DSH 的基线样式表结构有变,match 失败 —— 请人工确认 token 清单。')
  } else {
    const css = JSON.parse(`"${match[1]}"`)
    const collect = (selector) => {
      const re = new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\{([^}]*)\\}`, 'g')
      const names = new Set()
      let hit
      while ((hit = re.exec(css))) {
        for (const decl of hit[1].split(';')) {
          const colon = decl.indexOf(':')
          if (colon < 0) continue
          const name = decl.slice(0, colon).trim()
          if (name.startsWith('--dsw-alias-') || name.startsWith('--dsw-specific-')) names.add(name)
        }
      }
      return names
    }
    const baseline = collect('body')
    for (const name of collect('body[data-ds-dark-theme]')) baseline.add(name)

    const mine = new Set(ROLE_MAP.map(([token]) => token))
    const missing = [...baseline].filter((name) => !mine.has(name)).sort()
    const extra = [...mine].filter((name) => !baseline.has(name)).sort()
    if (missing.length > 0) failures.push(`基线有但本表未覆盖(${missing.length}):${missing.join(', ')}`)
    if (extra.length > 0) failures.push(`本表有但基线没有(${extra.length}):${extra.join(', ')}`)
    if (missing.length === 0 && extra.length === 0) {
      notes.push(`设计基线对齐通过:${baseline.size} 个语义 token 全覆盖。`)
    }
  }
}

// ── 结论 ───────────────────────────────────────────────────────────────────
for (const note of notes) console.log(`· ${note}`)
if (failures.length > 0) {
  console.error('\ncheck:tokens 失败:')
  for (const failure of failures) console.error(`  ✗ ${failure}`)
  process.exit(1)
}
console.log(`✓ check:tokens 通过:${ROLE_MAP.length} 个语义 token,亮暗各一套,已生成到 ${path.relative(ROOT, path.join(ROOT, 'lib'))}`)
