/**
 * 安装后校验 —— 以 DSH profile 的解析上下文验证插件真的能被加载
 * ============================================================================
 * 做四件事,全部真实执行、不猜:
 *   1. 从 profile 目录用模块解析规则找到插件包 —— 这一步能抓到"忘了在
 *      profile 的 node_modules 里建立链接"这类问题;
 *   2. 真的 import 一下 Host 半边,确认导出形状是 DSH 期望的插件对象;
 *   3. 检查 dsh.client 声明的 ./client 导出是否真的存在(客户端加载器会在
 *      启动时报错,如果这里对不上);
 *   4. 解析 cordis.patch.yml,确认它是一组合法的 patch 条目。
 *
 * 用法:node scripts/verify-install.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

const PROFILE_DIR = path.join(process.env.USERPROFILE || process.env.HOME || '', '.dsh', 'profiles', 'web')
const PACKAGE_NAME = 'dsh-azure-maid-skin'

const problems = []
const ok = (m) => console.log(`  ok    ${m}`)
const bad = (m) => { console.log(`  FAIL  ${m}`); problems.push(m) }

console.log(`profile: ${PROFILE_DIR}\n`)
if (!fs.existsSync(PROFILE_DIR)) {
  console.error('找不到 web profile 目录 —— DSH 装好了吗?')
  process.exit(1)
}

// ── 1. profile 里是否登记了这个包 ───────────────────────────────────────────
console.log('[1] profile 登记')
const manifestPath = path.join(PROFILE_DIR, 'package.json')
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
if (manifest.dependencies && manifest.dependencies[PACKAGE_NAME]) {
  ok(`dependencies 里有 ${PACKAGE_NAME} = ${manifest.dependencies[PACKAGE_NAME]}`)
} else {
  bad(`dependencies 里没有 ${PACKAGE_NAME}`)
}
const bundles = (manifest.dsh && manifest.dsh.profile && manifest.dsh.profile.bundles) || []
if (bundles.includes(PACKAGE_NAME)) {
  ok(`bundles 里有 ${PACKAGE_NAME}(共 ${bundles.length} 个 bundle)`)
} else {
  bad(`bundles 里没有 ${PACKAGE_NAME} —— 插件不会被挂载`)
}

// ── 2. 从 profile 目录解析包 ────────────────────────────────────────────────
console.log('\n[2] 模块解析(模拟 DSH 的加载上下文)')
const require = createRequire(path.join(PROFILE_DIR, 'package.json'))
let packageJsonPath = null
try {
  packageJsonPath = require.resolve(`${PACKAGE_NAME}/package.json`)
  ok(`require.resolve 命中: ${packageJsonPath}`)
} catch (err) {
  bad(`解析不到 ${PACKAGE_NAME}: ${(err && err.message) || err}`)
}

let pkg = null
if (packageJsonPath !== null) {
  pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  const root = path.dirname(packageJsonPath)
  const mainFile = path.join(root, pkg.main || 'index.js')
  if (fs.existsSync(mainFile)) ok(`main 存在: ${pkg.main}`)
  else bad(`main 不存在: ${mainFile}`)


  // 3. dsh.client 的 ./client 导出
  console.log('\n[3] dsh.client 声明')
  const decl = pkg.dsh && pkg.dsh.client
  if (decl === undefined) {
    bad('package.json 没有 dsh.client 声明 —— 客户端半边不会被加载')
  } else {
    ok(`dsh.client = ${JSON.stringify(decl)}`)
    const exportsMap = pkg.exports || {}
    const clientRel = exportsMap['./client']
    if (typeof clientRel !== 'string') {
      bad('exports["."] 里没有 ./client —— 客户端加载器会报 "declares dsh.client but exports no ./client bundle"')
    } else {
      const clientFile = path.join(root, clientRel)
      if (fs.existsSync(clientFile)) ok(`client bundle 存在: ${clientRel}(${fs.statSync(clientFile).size} 字节)`)
      else bad(`client bundle 不存在: ${clientFile}`)
      // 客户端入口必须是 __ModuleLoader__ 形态
      if (fs.existsSync(clientFile)) {
        const head = fs.readFileSync(clientFile, 'utf8').replace(/^\uFEFF/, '')
        const loaderAt = head.indexOf('window.__ModuleLoader__.load(')
        if (loaderAt >= 0) {
          const before = head.slice(0, loaderAt).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '').trim()
          if (before === '') ok('client bundle 是 __ModuleLoader__ 格式(load 之前无代码)')
          else bad('client bundle 在 load 之前有可执行代码')
        } else {
          bad('client bundle 不是 __ModuleLoader__.load(...) 格式')
        }
      }
    }
  }
}

// ── 4. 真的 import Host 半边 ────────────────────────────────────────────────
console.log('\n[4] Host 半边真的能被 import')
if (packageJsonPath !== null) {
  const root = path.dirname(packageJsonPath)
  const entry = path.join(root, pkg.main || 'index.js')
  try {
    const mod = await import(pathToFileURL(entry).href)
    const plugin = mod.default
    if (plugin === null || typeof plugin !== 'object') {
      bad('Host 半边没有 default 导出插件对象')
    } else {
      ok(`default 导出存在,name=${JSON.stringify(plugin.name)}`)
      if (typeof plugin.apply !== 'function') bad('插件对象没有 apply()')
      else ok('apply() 存在')
      if (Array.isArray(plugin.inject)) ok(`inject = ${JSON.stringify(plugin.inject)}`)
      else bad('插件对象没有声明 inject —— 它依赖 webServer/connection')
      if (typeof mod.STYLE_ROUTE === 'string') ok(`样式路由 = ${mod.STYLE_ROUTE}`)
      else bad('没有导出 STYLE_ROUTE')
    }
  } catch (err) {
    bad(`import 失败: ${(err && err.stack) || err}`)
  }
}

// ── 5. cordis.patch.yml ────────────────────────────────────────────────────
console.log('\n[5] cordis.patch.yml')
if (packageJsonPath !== null) {
  const root = path.dirname(packageJsonPath)
  const patchRel = pkg.dsh && pkg.dsh.bundle && pkg.dsh.bundle.patch
  if (typeof patchRel !== 'string') {
    bad('package.json 没有 dsh.bundle.patch')
  } else {
    const patchFile = path.join(root, patchRel)
    if (!fs.existsSync(patchFile)) {
      bad(`patch 文件不存在: ${patchFile}`)
    } else {
      const text = fs.readFileSync(patchFile, 'utf8')
      ok(`patch 文件存在(${text.length} 字节)`)
      if (/^- insert:/m.test(text)) ok('含 insert: 条目')
      else bad('patch 文件里没有 insert: 条目 —— 插件不会插入配置树')
      if (text.includes(`id: ${PACKAGE_NAME}`)) ok(`insert 的 id 是 ${PACKAGE_NAME}`)
      else bad(`insert 的 id 不是 ${PACKAGE_NAME}`)
    }
  }
}

// ── 6. 所有 bundle 都能被解析? ─────────────────────────────────────────────
/**
 * 这一步复刻 DSH 启动时的 `resolveBundleDir`:它按 **Node 的 node_modules 向上
 * 查找顺序**,先看 dsh 安装目录、再看 profile 目录,找带 package.json 的包目录;
 * 找不到就直接抛错、**整个 dsh web 起不来**。
 *
 * 为什么要单独查一遍:bundles 里**任何一个**条目(包括与本插件无关的其它插件)
 * 解析失败都会挡住启动。典型事故是某个插件目录被删/被移动后,profile 的
 * node_modules 里留下一条指向空路径的链接 —— 它自己不会报错,但会让
 * `dsh web` 抛出 "cannot resolve profile bundle ..." 而完全无法启动。
 * 在重启之前先跑这一步,能省掉一轮"白屏 + 翻堆栈"。
 */
console.log('\n[6] bundles 解析预检(复刻 dsh 的 resolveBundleDir)')
/**
 * dsh 用它自己所在包的 package.json 当"安装锚点",先在那里解析 bundle,
 * 再退到 profile 目录。这里照做:优先环境变量,否则在 npx 缓存里找
 * `@deepseek-ai/dsh/package.json`。找不到就只查 profile 目录(会漏报
 * 装在 dsh 安装目录里的 bundle,所以只作为降级)。
 */
function findInstallAnchor() {
  if (process.env.DSH_INSTALL_ANCHOR) return process.env.DSH_INSTALL_ANCHOR
  const npxRoot = path.join(process.env.LOCALAPPDATA || '', 'npm-cache', '_npx')
  if (!fs.existsSync(npxRoot)) return undefined
  try {
    for (const entry of fs.readdirSync(npxRoot)) {
      const candidate = path.join(npxRoot, entry, 'node_modules', '@deepseek-ai', 'dsh', 'package.json')
      if (fs.existsSync(candidate)) return candidate
    }
  } catch (err) {
    // 读不到就降级
  }
  return undefined
}
const INSTALL_ANCHOR = findInstallAnchor()
if (INSTALL_ANCHOR === undefined) {
  console.log('  (未找到 dsh 安装锚点,只按 profile 目录解析;可设 DSH_INSTALL_ANCHOR 指定)')
} else {
  console.log(`  dsh 安装锚点: ${INSTALL_ANCHOR}`)
}
/** Node 的 node_modules 向上查找顺序(不要求父包存在)。 */
function nodeModulesPaths(fromDir) {
  const out = []
  let dir = path.resolve(fromDir)
  for (;;) {
    out.push(path.join(dir, 'node_modules'))
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return out
}
function packageDirFromAnchor(anchorPath, name) {
  const searchPaths = []
  try {
    if (fs.existsSync(anchorPath)) searchPaths.push(...(createRequire(anchorPath).resolve.paths(name) ?? []))
  } catch (err) {
    // 锚点不可用时退回纯向上查找
  }
  searchPaths.push(...nodeModulesPaths(path.dirname(anchorPath)))
  const seen = new Set()
  for (const searchPath of searchPaths) {
    if (seen.has(searchPath)) continue
    seen.add(searchPath)
    const candidate = path.join(searchPath, name)
    if (fs.existsSync(path.join(candidate, 'package.json'))) return candidate
  }
  return undefined
}
function resolveBundleDir(name) {
  const anchors = [
    INSTALL_ANCHOR,
    path.join(PROFILE_DIR, 'package.json'),
  ].filter((value) => typeof value === 'string')
  for (const anchor of anchors) {
    const dir = packageDirFromAnchor(anchor, name)
    if (dir !== undefined) return dir
  }
  return undefined
}

for (const name of bundles) {
  const dir = resolveBundleDir(name)
  if (dir === undefined) {
    bad(`bundles 里的 "${name}" 解析不到 —— dsh web 会直接启动失败`)
    continue
  }
  let declared
  try {
    declared = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).dsh?.bundle?.patch
  } catch (err) {
    bad(`bundles 里的 "${name}" 读不到 package.json: ${(err && err.message) || err}`)
    continue
  }
  if (declared === undefined) {
    bad(`bundles 里的 "${name}" 没有 dsh.bundle.patch`)
    continue
  }
  if (!fs.existsSync(path.join(dir, declared))) {
    bad(`bundles 里的 "${name}" 的 patch 文件缺失: ${declared}`)
    continue
  }
  ok(`bundle "${name}" → ${dir}`)
}

console.log('')
if (problems.length > 0) {
  console.error(`verify-install 失败(${problems.length} 项):`)
  for (const p of problems) console.error(`  ✗ ${p}`)
  process.exit(1)
}
console.log('✓ verify-install 通过:插件已登记、可解析、Host 半边可 import、客户端 bundle 格式正确、patch 合法、bundles 全部可解析')
console.log('  还需要重启 dsh web 让新 bundle 进入配置树(见 README/答复说明)。')
console.log('  提示:若只想确认"重启能不能起得来",看第 [6] 节即可。')
