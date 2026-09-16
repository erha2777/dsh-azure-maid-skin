/**
 * 一次性调色求解器(开发工具,不参与 npm run check)
 * ============================================================================
 * 用它算出"刚好达标"的颜色,再把结果写回 theme/palette.mjs。
 * 手调这些值很容易调出"看着像达标、一算差 0.1"的结果,所以让机器算。
 *
 * 用法:node scripts/solve.mjs
 */

import { contrast, solveColor } from './color.mjs'

function line(label, start, target, backgrounds, minimum) {
  const solved = solveColor(start, target, backgrounds, minimum)
  const list = Array.isArray(backgrounds) ? backgrounds : [backgrounds]
  if (solved === null) {
    console.log(`  !! ${label}:从 ${start} 向 ${target} 插值仍达不到 ${minimum}`)
    return null
  }
  const ratios = list.map((bg) => `${contrast(solved, bg).toFixed(2)}@${bg}`).join('  ')
  console.log(`  ${label.padEnd(28)} ${start} → ${solved.padEnd(9)} ${ratios}`)
  return solved
}

console.log('\n== 亮色:文字/状态色(要求 4.5)==')
line('accent', '#2F7FB8', '#123A5C', ['#FFFFFF', '#F4F7FE'], 4.5)
line('success', '#1F8A6D', '#0B4A38', ['#FFFFFF', '#DEF4EA'], 4.5)
line('warn', '#B07A16', '#5C3F08', ['#FFFFFF', '#FBF0D8'], 4.5)
line('error', '#CE3F5C', '#8A1F38', ['#FFFFFF', '#FBDDE3'], 4.5)
line('link', '#2F6FB0', '#123A5C', ['#FFFFFF', '#F4F7FE'], 4.5)
line('warnLabel', '#8A5E0E', '#5C3F08', '#FFFFFF', 4.5)

console.log('\n== 亮色:品牌底 / 深色按钮(白字,要求 4.5)==')
line('brandButton (white text)', '#3A4A8C', '#101736', '#FFFFFF', 4.5)
line('brandInvert', '#141C36', '#101736', '#FFFFFF', 4.5)
line('toast/tooltip (white text)', '#1B2444', '#101736', '#FFFFFF', 4.5)

console.log('\n== 亮色:品牌色作为文字压在浅底(要求 4.5)==')
line('brand on canvas', '#3A4A8C', '#101736', ['#F4F7FE', '#FFFFFF'], 4.5)

console.log('\n== 侧栏层次(非文本,要求 1.15)==')
const sidebar = '#E7EEFA'
line('sidebarActive', '#DEE8F9', '#C2D4F2', sidebar, 1.15)
const active = solveColor('#DEE8F9', '#C2D4F2', sidebar, 1.15)
if (active !== null) {
  console.log(`  sidebarAccent              从 #D3E1F7 向 #A9C2EE 插值,需在 ${active} 与 ${sidebar} 上都 ≥1.15`)
  line('  sidebarAccent', '#D3E1F7', '#A9C2EE', [active, sidebar], 1.15)
}

console.log('\n== 暗色:文字(要求 4.5)==')
line('textSecondary', '#A9B7E0', '#5A6890', ['#151E42', '#0A1024'], 4.5)
line('textTertiary', '#8A9AD8', '#4A5680', ['#151E42', '#0A1024'], 4.5)
line('textCaption', '#6E7CB4', '#3E4870', '#151E42', 3)
line('link', '#8FBEF0', '#2A5C8A', ['#0A1024', '#151E42'], 4.5)

console.log('\n== 暗色:品牌按钮(白字压在深底上,要求 4.5)==')
line('brandButton fill', '#45539B', '#1E2856', '#F2F6FF', 4.5)
line('brandHover fill', '#4A5BA6', '#1E2856', '#F2F6FF', 4.5)

console.log('\n== 暗色:品牌/accent 作为文字压在暗底(要求 4.5)==')
line('brand', '#8A9AD8', '#2A3568', ['#0A1024', '#151E42'], 4.5)
line('accent', '#6FB6E0', '#1E5A80', ['#151E42', '#0A1024'], 4.5)

console.log('\n== 暗色:状态(要求 4.5)==')
line('success', '#5FD6B4', '#0F6B54', ['#151E42', '#173A44'], 4.5)
line('warn', '#F0C168', '#8A6A14', ['#151E42', '#33294A'], 4.5)
line('warnLabel', '#FF9EB0', '#C25E75', ['#151E42', '#FFFFFF'], 4.5)
line('error', '#FF8598', '#A83A50', ['#151E42', '#3A2038'], 4.5)
