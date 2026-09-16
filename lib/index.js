/**
 * 蓝瓷女仆 · Azure Maid —— Host 半边
 * ============================================================================
 * 只做一件事:让**首次绘制**就是皮肤色。
 *
 *   1. 把 lib/styles/azure-maid.css 挂到 /dsh-azure-maid/azure-maid.css;
 *   2. 用 ctx.webServer.tapIndex 在 index.html 的 <body> 起始处插入
 *      <link rel="stylesheet" data-dsh-azure-maid-skin> —— 位置早于任何模块脚本,
 *      所以不会先闪一下官方配色(无 FOUC)。
 *
 * 为什么这一半必须存在
 *   配色本身由客户端半边用 theme.overrideTokens 落地(那才是能跟随系统切换的
 *   机制)。但客户端模块要等模块脚本执行完才生效,此前那一帧还是官方配色 ——
 *   深色偏好下会白闪一下。Host 这半边的样式表在 <body> 打开时就位,把这个空档
 *   补上。样式表里亮暗两档用 prefers-color-scheme / body[data-ds-dark-theme]
 *   分段,所以它自己也覆盖 light / dark / system 三种偏好,不需要看用户选了什么。
 *
 * 为什么不注册正式主题 / 不做客户端构建
 *   · 主题服务的 system 偏好只解析到内建 light / dark,第三方 register 的 id 拿不到
 *     「跟随系统」,所以本包走 overrideTokens 叠加层(详见 theme/client-source.mjs);
 *   · dsh.bundle 这层 patch **不对客户端半边做构建**,lib/client.js 是构建产物,
 *     由 scripts/build-client.mjs 产出。
 *
 * 路由安全 / Route safety
 *   沿用官方自定义路由的信任栅栏:Host/Origin 被伪造(DNS 重绑定)或未认证的请求
 *   一律拒绝 —— 不因为"只是静态 CSS"就放行。
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** 包根目录:lib/index.js → 包根。 */
const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** 样式表在包内的候选位置(发布版 / 开发态两种布局都认)。 */
const STYLE_CANDIDATES = [
  path.join(PACKAGE_ROOT, 'lib', 'styles', 'azure-maid.css'),
  path.join(PACKAGE_ROOT, 'styles', 'azure-maid.css'),
]

/** 对外路由。改名要同步 scripts/build-tokens.mjs 的 STYLE_ROUTE 与 README 的排障命令。 */
export const STYLE_ROUTE = '/dsh-azure-maid/azure-maid.css'

/** 注入标记:客户端半边靠它找到这份样式表并让它让位。 */
const INJECT_MARKER = 'data-dsh-azure-maid-skin'

/** 插件名。 */
export const PLUGIN_NAME = 'azure-maid-skin'

/** mtime 缓存:改完 CSS 不用重启 DSH,硬刷新即生效。 */
let styleCache = null

/**
 * 读取皮肤样式表,按 mtime 失效。
 * @returns {{ text: string, href: string } | null} 内容与带版本号的 href;找不到文件时 null。
 */
function loadStyle() {
  for (const file of STYLE_CANDIDATES) {
    try {
      const stat = fs.statSync(file)
      if (styleCache !== null && styleCache.mtimeMs === stat.mtimeMs) {
        return { text: styleCache.text, href: styleCache.href }
      }
      const text = fs.readFileSync(file, 'utf8')
      styleCache = {
        text,
        mtimeMs: stat.mtimeMs,
        href: `${STYLE_ROUTE}?v=${Math.floor(stat.mtimeMs)}`,
      }
      return { text: styleCache.text, href: styleCache.href }
    } catch (err) {
      // 换下一个候选路径
    }
  }
  return null
}

export default {
  name: PLUGIN_NAME,

  inject: ['webServer', 'connection'],

  apply(ctx) {
    // ── 浏览器信任栅栏:与官方插件一致,fail-closed ─────────────────────────
    // 栅栏不可用时宁可不发样式,也不给任意网页一个可探测的响应。
    // 代价只是皮肤晚一帧生效,不影响 DSH 本身可用。
    function rejected(req, res) {
      try {
        const conn = ctx.get('connection') || ctx.connection
        if (!conn || typeof conn.requestRejection !== 'function') return true
        const code = conn.requestRejection(req)
        if (code === undefined || code === null || code === false) return false
        res.statusCode = typeof code === 'number' ? code : 403
        res.end()
        return true
      } catch (err) {
        return true
      }
    }

    const disposeRoute = ctx.webServer.register({
      kind: 'exact',
      path: STYLE_ROUTE,
      handler: (req, res) => {
        if (rejected(req, res)) return
        const style = loadStyle()
        if (style === null) {
          res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
          res.end('azure-maid-skin: stylesheet is missing from the package (run `npm run build`)')
          return
        }
        res.writeHead(200, {
          'Content-Type': 'text/css; charset=utf-8',
          // no-store:皮肤是开发态可热改的资源,不让浏览器留过期副本。
          'Cache-Control': 'no-store',
          'Content-Length': String(Buffer.byteLength(style.text)),
        })
        res.end(style.text)
      },
    })

    const disposeTap = ctx.webServer.tapIndex((html) => {
      try {
        if (html.includes(INJECT_MARKER)) return html
        const style = loadStyle()
        if (style === null) return html
        const tag = `<link rel="stylesheet" ${INJECT_MARKER} href="${style.href}">`
        // 首选 <body> 起始处:先于所有模块脚本完成样式挂载。
        if (/<body(\s[^>]*)?>/i.test(html)) {
          return html.replace(/<body(\s[^>]*)?>/i, (match) => match + tag)
        }
        // 兜底:宿主换了 index 模板时退到 </head> 之前。
        if (html.includes('</head>')) return html.replace('</head>', `${tag}</head>`)
        return tag + html
      } catch (err) {
        // index 变换必须是纯函数且绝不抛 —— 抛了会让整个页面 500。
        try {
          console.warn('[azure-maid-skin] index 注入失败:', (err && err.message) || err)
        } catch (inner) {
          // 连日志都失败时保持沉默
        }
        return html
      }
    })

    ctx.effect(() => () => {
      try {
        disposeTap()
      } catch (err) {
        // 已卸载
      }
      try {
        disposeRoute()
      } catch (err) {
        // 已卸载
      }
    })
  },
}
