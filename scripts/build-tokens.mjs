/**
 * build:tokens —— 由 palette + 语义映射生成两个产物
 * ============================================================================
 * 输入:theme/palette.mjs(颜色真源) + theme/tokens.mjs(语义映射)
 * 输出:
 *   lib/tokens.js               —— Client 半边用,{ LIGHT, DARK } 两个扁平对象
 *   lib/styles/azure-maid.css   —— Host 半边的"首绘样式表"
 *
 * 为什么样式表要写两遍(而不是用 body 属性选一次)
 *   Host 在 <body> 起始处注入这份 CSS,目的是**首次绘制就是皮肤色**(不先闪官方配色)。
 *   此刻 DSH 的引导脚本已经把 body[data-ds-dark-theme] 设好了,但样式表本身无法
 *   预知用户选的是 light/dark/system —— 所以:
 *     · 无媒体查询的那份 = 亮色;当偏好是 light 时,body 上没有 dark 属性,它生效;
 *     · @media (prefers-color-scheme: dark) 里的那份 = 暗色,选择器同时接受
 *       body[data-ds-dark-theme] —— 偏好是 dark(属性在)或 system 且系统为暗
 *       (媒体命中)时生效。
 *   三条分支互不重叠,正好覆盖 light / dark / system 三种偏好。
 *
 *   Client 半边启动后会用 theme.overrideTokens 把同样的值写成 body 行内样式,
 *   行内样式优先级最高,于是无论偏好怎么切都是同一套色 —— 两侧不会各做一半。
 *
 * 用法:node scripts/build-tokens.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { C } from '../theme/palette.mjs'
import { ROLE_MAP, buildTokenSets } from '../theme/tokens.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const LIB = path.join(ROOT, 'lib')
const STYLES = path.join(LIB, 'styles')

const sets = buildTokenSets(C)

// ── 产物 1:lib/tokens.js ────────────────────────────────────────────────────
function renderTokensModule() {
  const render = (object) =>
    Object.entries(object)
      .map(([token, value]) => `  '${token}': '${value}',`)
      .join('\n')

  return `/**
 * 蓝瓷女仆 · Azure Maid —— 语义 token(构建产物,请勿手工编辑)
 * ============================================================================
 * 由 scripts/build-tokens.mjs 生成。改配色请改 theme/palette.mjs 后运行 npm run build。
 *
 * 每个 token 在亮/暗两套里各有一个值,正好对应 theme.overrideTokens 的
 * { light, dark } 契约 —— 因此"亮色 / 暗色 / 跟随系统"三种偏好共用同一层
 * 覆盖:偏好为 system 时由主题服务按系统色决定用哪一套,颜色自动跟随。
 *
 * 不要把这套值写进 CSS 的 :root —— overrideTokens 负责行内样式,本文件是
 * 它的数据源,不是样式表。
 */

/** 亮色档:${ROLE_MAP.length} 个语义 token。 */
export const LIGHT = Object.freeze({
${render(sets.light)}
})

/** 暗色档:${ROLE_MAP.length} 个语义 token。 */
export const DARK = Object.freeze({
${render(sets.dark)}
})

/** 亮暗两档的 token 名完全一致 —— 覆盖层只切值,不切名单。 */
export const TOKEN_NAMES = Object.freeze(Object.keys(LIGHT))
`
}

// ── 产物 2:lib/styles/azure-maid.css ───────────────────────────────────────
function renderDeclarations(mode, indent) {
  const set = mode === 'light' ? sets.light : sets.dark
  return Object.entries(set)
    .map(([token, value]) => `${indent}${token}: ${value};`)
    .join('\n')
}

/** 自停用规则体:与 renderDeclarations 同名同序,值一律 unset。 */
function renderUnsetDeclarations(indent) {
  return Object.keys(sets.light)
    .map((token) => `${indent}${token}: unset;`)
    .join('\n')
}

function renderStylesheet() {
  return `/* ============================================================================
 * 蓝瓷女仆 · Azure Maid —— 首绘样式表(构建产物,请勿手工编辑)
 * ============================================================================
 * 由 scripts/build-tokens.mjs 生成。改配色请改 theme/palette.mjs 后运行 npm run build。
 *
 * 由 Host 半边(lib/index.js)在 <body> 起始处注入,位置早于任何模块脚本,
 * 因此首次绘制就是皮肤色,不会先闪一下官方配色。
 *
 * 本文件**只声明 token 值,不含任何选择器层面的产品 DOM 假设** ——
 * 不碰 --dsw-static-*(那是设计基线的原始色阶,改它等于改调色板本身),
 * 只覆盖语义层 90 个 token。DSH 升级换掉内部类名也不会让本文件失效。
 *
 * 三段生效规则,对应三种外观偏好(详见 scripts/build-tokens.mjs 顶部注释):
 *   1. body{...}                                    → 偏好 light
 *   2. @media (prefers-color-scheme: dark) 里的 body  → 偏好 dark 或 system 且系统为暗
 *   3. 同处媒体查询内的 body[data-ds-dark-theme]      → 系统亮但用户手动选了暗色
 *
 * 自停用 / Self-disable
 *   最后一条规则让本文件在客户端接手后自己失效:客户端半边的模块在加载时(早于
 *   插件 apply)就给 <html> 打上 data-dsh-azure-maid-client,于是这份样式表的
 *   每一条规则都被后面那条同特异性、且写在最后的原值规则压回去 ——
 *   此后配色由 theme.overrideTokens 在 body 行内样式上负责(优先级更高)。
 *
 *   这样做的好处是**不需要任何 DOM 查询**:不用去 document 里找这个 <link>
 *   再把它的 media 改掉,少一处会和宿主 DOM 结构耦合的地方。
 *   在客户端尚未接管的这段时间里,本文件保证首绘就是皮肤色。
 * ========================================================================= */

/* 自停用:客户端已接管时,把上面所有 token 还原成设计基线的原值。
   选择器与 body / body[data-ds-dark-theme] 同特异性,但写在最后,因此在
   "后写的同特异性规则胜出"这条规则下必然生效;又因为用的是 CSS 变量自身的
   初始值(unset),还原结果是"回到官方配色",不需要知道官方任何具体色值。 */
html[data-dsh-azure-maid-client] body,
html[data-dsh-azure-maid-client] body[data-ds-dark-theme] {
${renderUnsetDeclarations('  ')}
}

/* ── 1. 亮色档 ────────────────────────────────────────────────────────────── */
body {
${renderDeclarations('light', '  ')}
}

/* ── 2/3. 暗色档 ──────────────────────────────────────────────────────────── */
@media (prefers-color-scheme: dark) {
  body,
  body[data-ds-dark-theme] {
${renderDeclarations('dark', '    ')}
  }
}
`
}

// ── 落盘 ───────────────────────────────────────────────────────────────────
fs.mkdirSync(STYLES, { recursive: true })
fs.writeFileSync(path.join(LIB, 'tokens.js'), renderTokensModule(), 'utf8')
fs.writeFileSync(path.join(STYLES, 'azure-maid.css'), renderStylesheet(), 'utf8')

const count = ROLE_MAP.length
console.log(`✓ build:tokens —— lib/tokens.js 与 lib/styles/azure-maid.css 已生成(${count} token × 2 档)`)
