/**
 * check:contrast —— 对比度守卫
 * ============================================================================
 * 配色好不好看是主观的,但"能不能看清"是客观的。本脚本把两套配色里所有
 * 真实的"前景 / 背景"组合拿出来算 WCAG 对比度,不达标就让 npm run check 失败。
 *
 * 规则 / Rules
 *   · 正文类             ≥ 4.5:1  (WCAG AA 正文)
 *   · 次要文字 / 大字     ≥ 3.0:1  (WCAG AA 大字 / 弱化文字)
 *   · 非文本要素(描边、
 *     选中底色、滚动条)   ≥ 1.15:1 (元素之间"看得出是两块")
 *
 * 带 alpha 的颜色(蒙版、边框)按 sRGB 逐通道混合到背景上再计算 ——
 * 这正是浏览器实际渲染的方式,不能把 alpha 忽略掉再算。
 *
 * 用法:node scripts/check-contrast.mjs [--json]
 */

import { C } from '../theme/palette.mjs'
import { contrast } from './color.mjs'

/**
 * 实际会同时出现在屏幕上的前景 / 背景对。
 * 每一项:[前景角色, 背景角色, 最低要求, 说明]
 * 角色名取自 theme/palette.mjs 的 C.light / C.dark。
 *
 * 判据的选择:
 *   · 前景色若以"文字颜色"的身份被消费,就按文字标准要求;
 *   · 边框、选中底色这类只承担"分区"职责的,按非文本标准要求 ——
 *     把它们的门槛提到 4.5 是在要求一种没人想要的高对比界面。
 */
export const PAIRS = [
  // ── 正文 ────────────────────────────────────────────────────────────────
  ['text', 'canvas', 4.5, '正文 / 画布'],
  ['text', 'surface', 4.5, '正文 / 卡片'],
  ['text', 'surfaceSunken', 4.5, '正文 / 次级面'],
  ['text', 'sidebar', 4.5, '正文 / 侧栏'],
  ['text', 'bubble', 4.5, '正文 / 气泡'],
  ['text', 'codeBlock', 4.5, '正文 / 代码块'],
  ['text', 'overlay', 4.5, '正文 / 浮层面'],
  ['textBluish', 'surface', 4.5, '标题 / 卡片'],
  ['textDimmed', 'surface', 4.5, '弱化标题 / 卡片'],

  // ── 次要文字 ────────────────────────────────────────────────────────────
  ['textSecondary', 'canvas', 4.5, '次要文字 / 画布'],
  ['textSecondary', 'surface', 4.5, '次要文字 / 卡片'],
  ['textSecondary', 'sidebar', 4.5, '次要文字 / 侧栏'],
  ['textTertiary', 'surface', 4.5, '三级文字 / 卡片'],
  ['textTertiary', 'canvas', 4.5, '三级文字 / 画布'],
  ['textCaption', 'surface', 3, '说明文字 / 卡片'],
  ['textCaption', 'canvas', 3, '说明文字 / 画布'],

  // ── 品牌 / 链接 / 强调 ──────────────────────────────────────────────────
  ['link', 'canvas', 4.5, '链接 / 画布'],
  ['link', 'surface', 4.5, '链接 / 卡片'],
  ['accent', 'surface', 4.5, '强调色 / 卡片'],
  ['accent', 'canvas', 4.5, '强调色 / 画布'],
  ['textOnBrand', 'brand', 4.5, '按钮文字 / 品牌底'],
  ['textOnBrand', 'brandHover', 4.5, '按钮文字 / 品牌悬停底'],
  ['textOnBrand', 'accent', 4.5, '按钮文字 / 强调底'],
  ['brand', 'canvas', 4.5, '品牌色 / 画布'],
  ['brand', 'surface', 4.5, '品牌色 / 卡片'],
  ['accent', 'sidebar', 4.5, '强调色 / 侧栏'],
  ['accent', 'codeBlock', 4.5, '强调色 / 代码块'],

  // ── 状态 ────────────────────────────────────────────────────────────────
  ['success', 'surface', 4.5, '成功 / 卡片'],
  ['success', 'successSoft', 4.5, '成功 / 成功底'],
  ['warn', 'surface', 4.5, '警告 / 卡片'],
  ['warn', 'warnSoft', 4.5, '警告 / 警告底'],
  ['warnLabel', 'surface', 4.5, '警告标签 / 卡片'],
  ['error', 'surface', 4.5, '错误 / 卡片'],
  ['error', 'errorSoft', 4.5, '错误 / 错误底'],

  // ── 反色浮层 ────────────────────────────────────────────────────────────
  ['textOnBrand', 'toast', 4.5, '浮层文字 / toast'],
  ['textOnBrand', 'tooltip', 4.5, '浮层文字 / tooltip'],

  // ── 非文本要素:只要能看出"是两块"即可 ──────────────────────────────────
  ['sidebarActive', 'sidebar', 1.15, '侧栏选中项 / 侧栏底'],
  ['sidebarAccent', 'sidebarActive', 1.15, '侧栏选中强调 / 选中底'],
  ['sidebarActive', 'sidebarHover', 1.15, '侧栏选中项 / 悬停底'],
  ['borderL3', 'surface', 1.15, '描边 / 卡片'],
  ['borderL3', 'canvas', 1.15, '描边 / 画布'],
  ['bubbleHighlight', 'bubble', 1.15, '气泡高亮 / 气泡底'],
  ['scrollbarThumb', 'scrollbarTrack', 1.2, '滚动条滑块 / 轨道'],
  ['codeBlockBanner', 'codeBlock', 1.1, '代码块标题栏 / 代码块'],
  ['surfaceSunken', 'surface', 1.05, '次级面 / 卡片'],
  ['surfacePlatform', 'canvas', 1.03, '平台面 / 画布'],
]

// ── 执行 ───────────────────────────────────────────────────────────────────
const results = []
for (const mode of ['light', 'dark']) {
  const palette = C[mode]
  for (const [fgRole, bgRole, minimum, label] of PAIRS) {
    const fg = palette[fgRole]
    const bg = palette[bgRole]
    if (fg === undefined) throw new Error(`palette.${mode} 缺少角色 "${fgRole}"`)
    if (bg === undefined) throw new Error(`palette.${mode} 缺少角色 "${bgRole}"`)
    results.push({ mode, label, fgRole, bgRole, fg, bg, minimum, ratio: contrast(fg, bg) })
  }
}

const failures = results.filter((row) => row.ratio + 1e-9 < row.minimum)

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ results, failures: failures.length }, null, 2))
} else {
  const worst = [...results].sort((a, b) => a.ratio / a.minimum - b.ratio / b.minimum).slice(0, 3)
  for (const row of worst) {
    console.log(`· 最紧的三对之一:${row.label} [${row.mode}] ${row.ratio.toFixed(2)}:1(要求 ${row.minimum})`)
  }
  if (failures.length > 0) {
    console.error(`\ncheck:contrast 失败(${failures.length} 对):`)
    for (const row of failures) {
      console.error(
        `  ✗ [${row.mode}] ${row.label}  ${row.fg} on ${row.bg} = ${row.ratio.toFixed(2)}:1 < ${row.minimum}`,
      )
    }
    process.exit(1)
  }
  console.log(`✓ check:contrast 通过:${results.length} 对前景/背景组合全部达标(WCAG AA)`)
}
