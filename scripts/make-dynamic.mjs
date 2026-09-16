/**
 * make:dynamic —— 生成一份"把本仓库配色搬进当前进程"的动态 Cordis 插件载荷
 * ============================================================================
 * 产物:tmp-dynamic/preview-client.js —— Cordis **Client** 半边的函数体。
 *
 * 用途
 *   在不改 profile、不重启的情况下,把 lib/tokens.js 里那 180 个**真实值**
 *   通过主题服务的 overrideTokens 立刻应用到正在运行的 GUI 上。
 *   于是"仓库里的配色"与"屏幕上的配色"是同一份数据,不是照着重画一遍。
 *
 * 为什么不用手写一段示意图
 *   手抄一份颜色就等于多了一处会漂移的副本。这里直接从构建产物生成,
 *   生成脚本本身也由 npm run check 覆盖。
 *
 * 生成的插件只做两件事:
 *   1. ctx.effect(() => theme.overrideTokens(<packageId>, layer)) —— 与正式包
 *      完全相同的调用形状(只是 source 换成动态 packageId,便于单独撤回);
 *   2. 在 cordis run 卡片里放一个面板,列出三种偏好与实际生效档位。
 *
 * 用法:node scripts/make-dynamic.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { LIGHT, DARK, TOKEN_NAMES } from '../lib/tokens.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = path.join(ROOT, 'tmp-dynamic')
const OUT_FILE = path.join(OUT_DIR, 'preview-client.js')

/** 只保留实际会用的字段,并做一次形状断言。 */
const tokens = TOKEN_NAMES.map((name) => [name, LIGHT[name], DARK[name]])
for (const [name, light, dark] of tokens) {
  if (typeof light !== 'string' || typeof dark !== 'string') {
    throw new Error(`lib/tokens.js 里 ${name} 不是成对的字符串`)
  }
}

const body = `/**
 * 动态 Cordis 插件载荷(构建产物,请勿手工编辑)
 * ============================================================================
 * 由 scripts/make-dynamic.mjs 生成,配色内联自 lib/tokens.js。
 * 这是一个**临时**插件:只在当前 DSH 进程里活着,重启就没了。
 * 它的作用是把本仓库的配色立刻套到运行中的 GUI 上做肉眼验收,
 * 正式安装请看 README 的「安装」一节。
 *
 * token 表按每行 6 条排版 —— 不是为了好看,是为了让整份载荷能被逐行读进
 * 支持包定义的执行环境(单行过长会被读取方截断)。
 * ========================================================================== */

var TOKENS = [
${(() => {
  const lines = []
  for (let i = 0; i < tokens.length; i += 6) {
    const chunk = tokens
      .slice(i, i + 6)
      .map(([name, light, dark]) => `[${JSON.stringify(name)},${JSON.stringify(light)},${JSON.stringify(dark)}]`)
      .join(', ')
    lines.push(`  ${chunk},`)
  }
  return lines.join('\n')
})()}
]

var MODE_LABELS = { light: '亮色', dark: '暗色', system: '跟随系统' }

/** 把 [name, light, dark] 三元组转成 overrideTokens 要的形状。 */
function buildLayer() {
  var layer = {}
  for (var i = 0; i < TOKENS.length; i += 1) {
    layer[TOKENS[i][0]] = { light: TOKENS[i][1], dark: TOKENS[i][2] }
  }
  return layer
}

function Swatch(props) {
  return React.createElement(
    'div',
    { style: { display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 } },
    React.createElement('i', {
      style: {
        width: 20, height: 20, borderRadius: 6, flex: 'none', display: 'block',
        border: '1px solid var(--dsw-alias-border-l3)',
        background: 'var(' + props.token + ')',
      },
    }),
    React.createElement(
      'span',
      { style: { fontSize: 11, color: 'var(--dsw-alias-label-secondary)', whiteSpace: 'nowrap' } },
      props.label,
    ),
  )
}

function Panel(props) {
  var ctx = props.ctx
  var theme = ctx.get('theme')
  var preference = 'system'
  var resolved = 'light'
  if (theme !== undefined) {
    var snapshot = theme.getTheme()
    preference = snapshot.preference
    resolved = snapshot.active.colorScheme
  }

  var swatches = [
    ['画布', '--dsw-alias-bg-base'],
    ['卡片', '--dsw-alias-bg-layer-1'],
    ['侧栏', '--dsw-specific-sidebar-fill'],
    ['输入框', '--dsw-specific-input-major'],
    ['气泡', '--dsw-specific-bubble'],
    ['代码块', '--dsw-alias-markdown-code-block'],
    ['品牌', '--dsw-alias-brand-primary'],
    ['链接', '--dsw-alias-link'],
    ['强调', '--dsw-alias-state-business-primary'],
    ['正文', '--dsw-alias-label-primary'],
    ['次文字', '--dsw-alias-label-secondary'],
    ['成功', '--dsw-alias-state-success-primary'],
    ['警告', '--dsw-alias-state-warn-primary'],
    ['错误', '--dsw-alias-state-error-primary'],
  ]

  var choose = function (mode) {
    var t = ctx.get('theme')
    if (t !== undefined) t.setTheme(mode)
  }

  return React.createElement(
    'section',
    {
      style: {
        border: '1px solid var(--dsw-alias-border-l1)',
        background: 'var(--dsw-alias-bg-layer-1)',
        borderRadius: 12, padding: '13px 14px',
        display: 'flex', flexDirection: 'column', gap: 11,
      },
    },
    React.createElement(
      'div',
      { style: { display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' } },
      React.createElement(
        'b',
        { style: { fontSize: 13, color: 'var(--dsw-alias-label-primary)' } },
        '蓝瓷女仆 · 实时预览',
      ),
      React.createElement(
        'span',
        { style: { fontSize: 12, color: 'var(--dsw-alias-label-secondary)' } },
        '偏好 ' + (MODE_LABELS[preference] || preference) + ' · 生效档位 ' + MODE_LABELS[resolved] + ' · 90 个语义 token',
      ),
    ),
    React.createElement(
      'div',
      { style: { display: 'flex', gap: 7, flexWrap: 'wrap' } },
      ['light', 'dark', 'system'].map(function (mode) {
        var active = preference === mode
        return React.createElement(
          'button',
          {
            key: mode,
            type: 'button',
            onClick: function () { choose(mode) },
            style: {
              flex: 'none', font: 'inherit', fontSize: 12.5, lineHeight: 1,
              padding: '8px 13px', borderRadius: 9, cursor: 'pointer',
              border: '1px solid ' + (active ? 'var(--dsw-alias-brand-primary)' : 'var(--dsw-alias-border-l2)'),
              background: active ? 'var(--dsw-alias-brand-primary)' : 'var(--dsw-alias-bg-layer-2)',
              color: active ? 'var(--dsw-alias-label-primary-foreground)' : 'var(--dsw-alias-label-primary)',
            },
          },
          MODE_LABELS[mode],
        )
      }),
    ),
    React.createElement(
      'div',
      { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(118px, 1fr))', gap: 7 } },
      swatches.map(function (item) {
        return React.createElement(Swatch, { key: item[1], label: item[0], token: item[1] })
      }),
    ),
    React.createElement(
      'div',
      { style: { fontSize: 11.5, lineHeight: 1.7, color: 'var(--dsw-alias-label-tertiary)' } },
      '这是把仓库里 lib/tokens.js 的 180 个真实值套到当前进程上的效果。停用或移除这个动态插件即可完整还原官方配色。',
    ),
  )
}

return {
  apply: function (ctx) {
    // 与正式包同一个调用形状:一层覆盖,亮暗成对,三种偏好通吃。
    // source 用一个固定的自述字符串而不是动态 packageId —— 这里只需要一个
    // 稳定的层标识,不必依赖客户端是否拿得到 packageId。
    ctx.effect(function () {
      var theme = ctx.get('theme')
      if (theme === undefined) return function () {}
      var dispose = theme.overrideTokens('azure-maid-preview', buildLayer())
      return function () {
        try {
          dispose()
        } catch (err) {
          // 主题服务已卸载时忽略
        }
      }
    })

    var slots = ctx.get('slots')
    if (slots === undefined) return
    var View = function () { return React.createElement(Panel, { ctx: ctx }) }
    slots.inject('tool.view.cordis', function () {
      return slots.register({ name: 'tool.view.cordis', key: 'self' }, View)
    })
  },
}
`

fs.mkdirSync(OUT_DIR, { recursive: true })
fs.writeFileSync(OUT_FILE, body, 'utf8')

// 语法自检 —— 与 build-client 同样的理由:载荷写坏了会在浏览器里才报错。
try {
  // eslint-disable-next-line no-new-func
  new Function('ctx', 'React', 'host', 'styles', 'console', body)
} catch (err) {
  throw new Error(`生成的动态载荷语法非法:${(err && err.message) || err}`)
}

console.log(
  `✓ make:dynamic —— tmp-dynamic/preview-client.js 已生成(${Buffer.byteLength(body)} 字节,内联 ${tokens.length} × 2 个 token)`,
)
