/**
 * shoot:preview —— 用本机浏览器给预览页拍两张图(亮色 / 暗色)
 * ============================================================================
 * 产物:preview/light.png、preview/dark.png —— README 里直接引用。
 *
 * 为什么值得做成脚本而不是手工截图
 *   · 改一次配色就能重出一组图,README 不会停留在旧配色上;
 *   · 亮暗两张用**同一个页面 + 强制 prefers-color-scheme** 拍出来,
 *     色差只来自配色本身,不掺杂手工操作的差异。
 *
 * 没有可用浏览器时**不算失败**:打印一行说明并以 0 退出 ——
 * 这个包本身不依赖任何浏览器,截图只是文档便利。
 *
 * 用法:node scripts/shoot-preview.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PAGE = path.join(ROOT, 'preview', 'index.html')
const OUT_DIR = path.join(ROOT, 'preview')
const PROFILE_DIR = path.join(ROOT, '.tmp-chrome-profile')

/** 常见的 Chromium 系浏览器位置(Windows / macOS / Linux)。 */
function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/Application/chrome.exe'),
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean)
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate
  }
  return null
}

/**
 * 拍一张。
 * 注意两处踩坑记录:
 *   1. headless 的截图开关必须写成 `--screenshot=<绝对路径>`;路径里的空格由
 *      参数数组原样传递(不经过 shell),所以不需要额外加引号。
 *   2. 不存在 `--force-prefers-color-scheme` 这个开关(它不是 Chrome 的 flag),
 *      所以暗色不是靠浏览器开关强制,而是用 `?mode=dark` 让页面自己切 ——
 *      结果是确定的,不依赖浏览器版本。
 */
/**
 * 拍一张。
 * 注意三处踩坑记录:
 *   1. headless 的截图开关必须写成 `--screenshot=<绝对路径>`;路径里的空格由
 *      参数数组原样传递(不经过 shell),所以不需要额外加引号。
 *   2. 不存在 `--force-prefers-color-scheme` 这个开关(它不是 Chrome 的 flag),
 *      所以暗色不是靠浏览器开关强制,而是用 `?mode=dark` 让页面自己切 ——
 *      结果是确定的,不依赖浏览器版本。
 *   3. 浏览器默认的用户数据目录可能不可写(受限环境),启动会直接失败并返回
 *      0xC000007B / STATUS_INVALID_IMAGE_FORMAT 这类退出码。指定到包内最稳。
 */
function shoot(browser, mode, outFile) {
  const args = [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--force-color-profile=srgb',
    `--user-data-dir=${PROFILE_DIR}`,
    '--window-size=1500,940',
    '--virtual-time-budget=2500',
    `--screenshot=${outFile}`,
    `${pathToFileURL(PAGE).href}?mode=${mode}`,
  ]
  // stdio: 'ignore' —— 沙箱环境不允许通过管道捕获子进程输出。
  const result = spawnSync(browser, args, { stdio: 'ignore', timeout: 90000 })
  if (process.env.DSH_AZURE_DEBUG === '1') {
    console.log(`[debug] ${mode}: status=${result.status} signal=${result.signal} error=${result.error && result.error.message}`)
  }
  return fs.existsSync(outFile)
}

const browser = findBrowser()
if (browser === null) {
  console.log('· 未找到 Chromium 系浏览器,跳过预览截图(preview/index.html 仍可直接打开)。')
  process.exit(0)
}

if (!fs.existsSync(PAGE)) {
  console.error('preview/index.html 不存在 —— 请先运行 node scripts/preview.mjs')
  process.exit(1)
}

fs.mkdirSync(OUT_DIR, { recursive: true })
let ok = 0
for (const mode of ['light', 'dark']) {
  const outFile = path.join(OUT_DIR, `${mode}.png`)
  if (shoot(browser, mode, outFile)) {
    console.log(`✓ preview/${mode}.png(${Math.round(fs.statSync(outFile).size / 1024)} KB)`)
    ok += 1
  } else {
    console.log(`· ${mode}.png 截图未成功(浏览器退出异常),预览页仍可手动打开。`)
  }
}

if (ok === 0) {
  console.log('· 本机浏览器无法在受限环境下启动无头模式 —— 跳过截图。')
  console.log('  preview/index.html 可以直接双击打开,三种模式都能手动切换。')
  console.log('  需要在别的机器上补图时,重跑本脚本即可。')
} else {
  console.log(ok === 2 ? '✓ shoot:preview 完成' : `· shoot:preview 部分完成(${ok}/2)`)
}
// 截图是文档便利,不是这个包的运行前提 —— 无论如何都以 0 退出。
process.exit(0)
