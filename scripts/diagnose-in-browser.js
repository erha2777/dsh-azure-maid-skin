/* ============================================================================
 * 蓝瓷女仆 · 诊断脚本(在浏览器控制台里粘贴运行)
 * ============================================================================
 * 它只**读取**,不改任何东西。回答四个问题:
 *   1. 客户端半边有没有加载?(看 <html> 上的接管标记)
 *   2. 主题覆盖层有没有生效?(看 body 的行内样式里有没有我们的颜色)
 *   3. DSH 现在认为该用哪一档?(看 data-ds-dark-theme 与 color-scheme)
 *   4. 设置页有没有注册?(看设置弹窗里的导航项)
 *
 * 用法:打开 DSH 页面 → F12 → Console → 整段粘贴 → 回车 → 把输出发我
 * ========================================================================== */
(() => {
  const body = document.body
  const html = document.documentElement
  const inline = body.style
  const computed = getComputedStyle(body)
  const read = (name) => (computed.getPropertyValue(name) || '').trim()
  const inlineValue = (name) => (inline.getPropertyValue(name) || '').trim()

  const markers = {
    'html[data-dsh-azure-maid-client] 客户端已接管': html.hasAttribute('data-dsh-azure-maid-client'),
    'body[data-ds-dark-theme] DSH 认为是暗色': body.hasAttribute('data-ds-dark-theme'),
    'html.style.colorScheme': html.style.colorScheme || '(未设置)',
    'link[data-dsh-azure-maid-skin] 首绘样式表存在': !!document.querySelector('link[data-dsh-azure-maid-skin]'),
  }

  const tokens = [
    '--dsw-alias-bg-base',
    '--dsw-alias-label-primary',
    '--dsw-specific-sidebar-fill',
    '--dsw-specific-input-major',
  ]

  console.log('%c=== 蓝瓷女仆诊断 ===', 'font-weight:bold')
  console.log('--- 1/3. 标记 ---')
  for (const [k, v] of Object.entries(markers)) console.log(`  ${v ? '✅' : '❌'} ${k}: ${v}`)

  console.log('--- 2. token 取值(行内 = 覆盖层写入;计算 = 最终生效)---')
  for (const name of tokens) {
    console.log(`  ${name}`)
    console.log(`      行内: ${inlineValue(name) || '(空 —— 覆盖层没写)'}`)
    console.log(`      计算: ${read(name) || '(空)'}`)
  }

  console.log('--- 4. 设置页 ---')
  const navText = [...document.querySelectorAll('button,a,div')]
    .map((el) => (el.textContent || '').trim())
    .filter((t) => t.length > 0 && t.length < 30)
    .some((t) => t.includes('蓝瓷女仆'))
  console.log(`  ${navText ? '✅' : '❌'} 页面上能找到「蓝瓷女仆」字样`)

  // 把关键结论压成一行,方便复制
  const verdict = {
    客户端已接管: markers['html[data-dsh-azure-maid-client] 客户端已接管'],
    覆盖层已写行内样式: inlineValue('--dsw-alias-bg-base') !== '',
    行内画布: inlineValue('--dsw-alias-bg-base'),
    计算画布: read('--dsw-alias-bg-base'),
    DSH暗色标记: markers['body[data-ds-dark-theme] DSH 认为是暗色'],
    colorScheme: markers['html.style.colorScheme'],
    首绘样式表: markers['link[data-dsh-azure-maid-skin] 首绘样式表存在'],
  }
  console.log('%c--- 复制这一行发我 ---', 'font-weight:bold')
  console.log(JSON.stringify(verdict))
  return verdict
})()
