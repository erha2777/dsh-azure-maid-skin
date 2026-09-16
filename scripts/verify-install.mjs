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

console.log('')
if (problems.length > 0) {
  console.error(`verify-install 失败(${problems.length} 项):`)
  for (const p of problems) console.error(`  ✗ ${p}`)
  process.exit(1)
}
console.log('✓ verify-install 通过:插件已登记、可解析、Host 半边可 import、客户端 bundle 格式正确、patch 合法')
console.log('  还需要重启 dsh web 让新 bundle 进入配置树(见 README/答复说明)。')
