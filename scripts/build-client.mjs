/**
 * build:client —— 把 theme/client-source.mjs 打成一个 DSH 客户端模块
 * ============================================================================
 * 产物:lib/client.js
 *
 * 为什么要构建,而不是直接写 lib/client.js
 *   1. 客户端模块的**入口格式**由 DSH 的加载器规定,不是 ESM:
 *        window.__ModuleLoader__.load({ id: '<包名>', factory: (require) => ... })
 *      裸 ESM(`export const ...`)放进 dsh.client 会让 DSH 启动失败。
 *   2. 配色必须与 Host 半边的样式表字节一致 —— 所以 token 不手抄,直接从
 *      lib/tokens.js(build:tokens 的产物)里取出来内联进工厂。
 *      这样"两份颜色"在物理上只有一份来源。
 *
 * 工厂里可用的东西(实测)
 *   · require('react')  —— 客户端模块**没有全局 React**,必须走 require;
 *   · 浏览器全局(document/window)可用,因为这是普通浏览器模块。
 *
 * 用法:node scripts/build-client.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE = path.join(ROOT, 'theme', 'client-source.mjs')
const TOKENS = path.join(ROOT, 'lib', 'tokens.js')
const OUTPUT = path.join(ROOT, 'lib', 'client.js')
const PACKAGE_NAME = 'dsh-azure-maid-skin'
const PLACEHOLDER = '/* @INJECT:TOKEN_SETS */'

/**
 * 从 lib/tokens.js 里取出两个 token 对象。
 * 只接受构建器写出的固定形状 —— 形状对不上就报错,而不是猜。
 */
function readTokenSets() {
  if (!fs.existsSync(TOKENS)) {
    throw new Error('缺少 lib/tokens.js —— 请先运行 npm run build:tokens')
  }
  const text = fs.readFileSync(TOKENS, 'utf8')
  const read = (name, nextName) => {
    const start = text.indexOf(`export const ${name} = Object.freeze({`)
    if (start < 0) throw new Error(`lib/tokens.js 里找不到 ${name}`)
    const open = text.indexOf('{', start)
    const close = text.indexOf('\n})', open)
    if (close < 0) throw new Error(`lib/tokens.js 里 ${name} 的结尾无法定位`)
    const body = text.slice(open + 1, close)
    const out = {}
    for (const line of body.split('\n')) {
      const trimmed = line.trim()
      if (trimmed === '') continue
      const match = trimmed.match(/^'([^']+)':\s*'([^']+)',$/)
      if (match === null) throw new Error(`lib/tokens.js 里出现无法解析的行:${trimmed}`)
      out[match[1]] = match[2]
    }
    if (nextName !== undefined && !text.includes(`export const ${nextName}`)) {
      throw new Error(`lib/tokens.js 缺少 ${nextName}`)
    }
    return out
  }
  const light = read('LIGHT', 'DARK')
  const dark = read('DARK')
  const lightNames = Object.keys(light)
  const darkNames = Object.keys(dark)
  if (lightNames.length !== darkNames.length) {
    throw new Error(`亮暗 token 数量不一致:${lightNames.length} vs ${darkNames.length}`)
  }
  for (const name of lightNames) {
    if (!(name in dark)) throw new Error(`暗色缺少 token:${name}`)
  }
  return { light, dark }
}

/**
 * 生成内联的 token 字面量,交给 `const TOKENS = ...` 使用。
 * 这里**只产出对象字面量**,不带 var/const —— 早先版本多带了一个 `var TOKENS =`,
 * 结果生成出 `const TOKENS = var TOKENS = {...}` 这种语法错误,而构建脚本
 * 当时只检查了 ESM 残留,没检查语法,于是坏文件被写进了仓库。
 * 现在收尾处会用 new Function() 真解析一遍,同类问题不会再溜过去。
 */
function renderInlineTokenSets(sets) {
  const render = (object, indent) =>
    Object.entries(object)
      .map(([token, value]) => `${indent}'${token}': '${value}',`)
      .join('\n')
  return `{
  light: {
${render(sets.light, '    ')}
  },
  dark: {
${render(sets.dark, '    ')}
  },
}`
}

const sets = readTokenSets()
const source = fs.readFileSync(SOURCE, 'utf8')

if (!source.includes(PLACEHOLDER)) {
  throw new Error(`theme/client-source.mjs 里缺少占位符 ${PLACEHOLDER}`)
}

const factoryBody = source
  .replace(PLACEHOLDER, renderInlineTokenSets(sets))
  // 源文件是 ESM(便于工具直接分析),工厂里必须是普通语句。
  .replace(/^export default /m, 'return ')

if (/^\s*(import|export)\s/m.test(factoryBody)) {
  throw new Error('打包后的工厂里仍残留 import/export —— 客户端加载器不接受 ESM')
}

// 语法自检:工厂体必须是能被解析的普通 JS。
// 这一步拦的是"生成的代码本身写坏了"这类问题 —— 它不会被 ESM 检查发现,
// 却会让 DSH 在加载插件时直接报语法错。
try {
  // eslint-disable-next-line no-new-func
  new Function('require', factoryBody)
} catch (err) {
  throw new Error(`生成的工厂体语法非法:${(err && err.message) || err}`)
}

const bundle = `/**
 * 蓝瓷女仆 · Azure Maid —— 客户端模块(构建产物,请勿手工编辑)
 * ============================================================================
 * 由 scripts/build-client.mjs 生成;源文件是 theme/client-source.mjs,
 * 配色内联自 lib/tokens.js(build:tokens 的产物)。
 *
 * 改配色:改 theme/palette.mjs → npm run build
 * 改行为:改 theme/client-source.mjs → npm run build
 *
 * 格式说明 / Format notes
 *   1. DSH 客户端加载器执行的是工厂包装,而非 ESM;id 必须是包名。
 *   2. 工厂直接返回插件对象({ apply }),不经过 module.exports。
 *   3. React 由 require('react') 取得 —— 客户端模块里**没有全局 React**。
 *      漏掉这一步的典型症状:模块能加载、apply() 也执行,但面板一渲染就
 *      ReferenceError,于是设置页不出现。
 *   4. 本文件不含 source map —— 加载器允许缺失,只有存在但格式非法时才抛错。
 * ========================================================================== */

window.__ModuleLoader__.load({
  id: ${JSON.stringify(PACKAGE_NAME)},
  factory: (require) => {
${factoryBody
  .split('\n')
  .map((line) => (line === '' ? '' : `\t\t${line}`))
  .join('\n')}
  },
})
`

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true })
// 不带 BOM:客户端模块是被 <script> 直接执行的,首字节必须是 `window.` ——
// 前置的 U+FEFF 虽然现代浏览器能容忍,但没有理由留这个不确定性。
fs.writeFileSync(OUTPUT, bundle.replace(/^\uFEFF/, ''), 'utf8')

const size = Buffer.byteLength(bundle)
console.log(`✓ build:client —— lib/client.js 已生成(${size} 字节,内联 ${Object.keys(sets.light).length} × 2 个 token)`)
