/**
 * 蓝瓷女仆 · Azure Maid —— 语义映射表 / Token role map
 * ============================================================================
 * 把每个 DSH 语义 token 指向 palette.mjs 里的一个"角色",亮暗两档成对给出。
 * 角色名是本文件自定义的中间层:palette 说"有哪些色",本表说"哪个 token 用哪个色"。
 * 这样换色只动 palette,挪槽位只动本表,两者互不干扰。
 *
 * token 清单来源 / Token list provenance
 *   取自 DSH 设计基线样式表(dsh-client-ui-theme 里平台层 body / body[data-ds-dark-theme]
 *   两条规则)中的 --dsw-alias-* 与 --dsw-specific-* 声明,共 **90** 个,亮暗集合完全一致。
 *   重新核对:`npm run check:tokens`
 *
 * 结构 / Shape
 *   [ token, [亮色角色, 暗色角色] ]  —— 角色名是 palette.C.light / palette.C.dark 的键。
 */

/** 语义映射:[token, [lightRole, darkRole]] */
export const ROLE_MAP = Object.freeze([
  // ── 底层画布与层次 ────────────────────────────────────────────────────────
  ['--dsw-alias-bg-base', ['canvas', 'canvas']],
  ['--dsw-alias-bg-layer-1', ['surface', 'surface']],
  ['--dsw-alias-bg-layer-2', ['surfaceSunken', 'surfaceSunken']],
  ['--dsw-alias-bg-layer-3', ['surfaceRaised', 'surfaceRaised']],
  ['--dsw-alias-bg-module-platform', ['surfacePlatform', 'surfacePlatform']],
  ['--dsw-alias-bg-multi-select', ['surfaceMulti', 'surfaceMulti']],
  ['--dsw-alias-bg-overlay', ['overlay', 'overlay']],
  ['--dsw-alias-bg-skeleton', ['skeleton', 'skeleton']],

  // ── 蒙版 ──────────────────────────────────────────────────────────────────
  ['--dsw-alias-bg-mask-1', ['mask1', 'mask1']],
  ['--dsw-alias-bg-mask-2', ['mask2', 'mask2']],
  ['--dsw-alias-bg-mask-3', ['mask3', 'mask3']],
  ['--dsw-alias-bg-mask-photo', ['maskPhoto', 'maskPhoto']],
  ['--dsw-alias-bg-mask-drop', ['maskDrop', 'maskDrop']],

  // ── 描边 ──────────────────────────────────────────────────────────────────
  ['--dsw-alias-border-l1', ['borderL1', 'borderL1']],
  ['--dsw-alias-border-l2', ['borderL2', 'borderL2']],
  ['--dsw-alias-border-l2-darkmode-thin', ['borderL2Thin', 'borderL2Thin']],
  ['--dsw-alias-border-l3', ['borderL3', 'borderL3']],
  ['--dsw-alias-border-l4', ['borderL4', 'borderL4']],
  ['--dsw-alias-border-inverted', ['borderInverted', 'borderInverted']],
  ['--dsw-alias-border-inverted2', ['borderInverted2', 'borderInverted2']],

  // ── 文字 / 标签 ───────────────────────────────────────────────────────────
  ['--dsw-alias-label-primary', ['text', 'text']],
  ['--dsw-alias-label-primary-bluish', ['textBluish', 'textBluish']],
  ['--dsw-alias-label-primary-dimmed', ['textDimmed', 'textDimmed']],
  ['--dsw-alias-label-primary-foreground', ['textPrimaryForeground', 'textPrimaryForeground']],
  ['--dsw-alias-label-primary-inverted', ['textInverted', 'textInverted']],
  ['--dsw-alias-label-secondary', ['textSecondary', 'textSecondary']],
  ['--dsw-alias-label-tertiary', ['textTertiary', 'textTertiary']],
  ['--dsw-alias-label-caption', ['textCaption', 'textCaption']],
  ['--dsw-alias-label-dimmed', ['labelDimmed', 'labelDimmed']],

  // ── 品牌 / 链接 ───────────────────────────────────────────────────────────
  ['--dsw-alias-brand-primary', ['brand', 'brand']],
  ['--dsw-alias-brand-primary-invert', ['brandInvert', 'brandInvert']],
  ['--dsw-alias-brand-primary-new-colorprimary-new-color', ['accent', 'accent']],
  ['--dsw-alias-brand-text', ['text', 'text']],
  ['--dsw-alias-link', ['link', 'link']],

  // ── 按钮 ──────────────────────────────────────────────────────────────────
  ['--dsw-alias-button-primary-fill', ['brand', 'brand']],
  ['--dsw-alias-button-primary-hover', ['brandHover', 'brandHover']],
  ['--dsw-alias-button-primary-dimmed', ['accentSoft', 'accentSoft']],
  ['--dsw-alias-button-contrast-fill', ['textSecondary', 'text']],
  ['--dsw-alias-button-elevated-fill', ['surface', 'overlay']],
  ['--dsw-alias-button-floating-fill', ['surface', 'input']],
  ['--dsw-alias-button-floating-hover', ['canvas', 'surfaceRaised']],
  ['--dsw-alias-button-ghost-active-fill', ['sidebarActive', 'overlay']],
  ['--dsw-alias-button-ghost-active-border', ['focus', 'overlay']],
  ['--dsw-alias-button-ghost-active-hover', ['sidebarAccent', 'brandHover']],
  ['--dsw-alias-button-info-fill', ['accent', 'accent']],
  ['--dsw-alias-button-info-hover', ['link', 'link']],
  ['--dsw-alias-button-tool-bar-fill', ['toolbarFill', 'toolbarFill']],
  ['--dsw-alias-button-tool-bar-fill-invisible', ['toolbarInvisible', 'toolbarInvisible']],
  ['--dsw-alias-button-tool-bar-hover', ['toolbarHover', 'toolbarHover']],

  // ── 交互态 ────────────────────────────────────────────────────────────────
  ['--dsw-alias-interactive-bg-hover', ['interactiveHover', 'interactiveHover']],
  ['--dsw-alias-interactive-bg-hover-solid', ['canvas', 'surfacePlatform']],
  ['--dsw-alias-interactive-bg-hover-accent', ['interactiveAccent', 'interactiveAccent']],
  ['--dsw-alias-interactive-bg-hover-danger', ['dangerHover', 'dangerHover']],
  ['--dsw-alias-interactive-bg-active', ['interactiveActive', 'interactiveActive']],

  // ── 状态 ──────────────────────────────────────────────────────────────────
  ['--dsw-alias-state-business-primary', ['accent', 'brand']],
  ['--dsw-alias-state-business-tertiary', ['businessSoft', 'businessSoft']],
  ['--dsw-alias-state-success-primary', ['success', 'success']],
  ['--dsw-alias-state-success-secondary', ['success', 'success']],
  ['--dsw-alias-state-success-tertiary', ['successSoft', 'successSoft']],
  ['--dsw-alias-state-warn-primary', ['warn', 'warn']],
  ['--dsw-alias-state-warn-secondary', ['warn', 'warn']],
  ['--dsw-alias-state-warn-tertiary', ['warnSoft', 'warnSoft']],
  ['--dsw-alias-state-warn-label', ['warnLabel', 'warnLabel']],
  ['--dsw-alias-state-error-primary', ['error', 'error']],
  ['--dsw-alias-state-error-secondary', ['error', 'error']],

  // ── Markdown / 代码 ───────────────────────────────────────────────────────
  ['--dsw-alias-markdown-code-block', ['codeBlock', 'codeBlock']],
  ['--dsw-alias-markdown-code-block-banner', ['codeBlockBanner', 'codeBlockBanner']],
  ['--dsw-alias-markdown-code-segment-selected', ['codeSegmentSelected', 'codeSegmentSelected']],
  ['--dsw-alias-markdown-code-segment-unselected', ['codeSegmentUnselected', 'codeSegmentUnselected']],
  ['--dsw-alias-markdown-inline-code', ['codeInline', 'codeInline']],
  ['--dsw-alias-markdown-placeholder', ['codePlaceholder', 'codePlaceholder']],
  ['--dsw-alias-markdown-tag', ['codeTag', 'codeTag']],
  ['--dsw-alias-markdown-citation', ['citation', 'citation']],

  // ── 滚动条 ────────────────────────────────────────────────────────────────
  ['--dsw-alias-scrollbar-bg-l1', ['scrollbarTrack', 'scrollbarTrack']],
  ['--dsw-alias-scrollbar-bg-l2', ['scrollbarTrack', 'scrollbarTrack']],
  ['--dsw-alias-scrollbar-hover-l1', ['scrollbarThumb', 'scrollbarThumb']],
  ['--dsw-alias-scrollbar-hover-l2', ['scrollbarThumbHover', 'scrollbarThumbHover']],

  // ── 浮层 ──────────────────────────────────────────────────────────────────
  ['--dsw-alias-toast-bg', ['toast', 'toast']],
  ['--dsw-alias-tooltip-bg', ['tooltip', 'tooltip']],

  // ── 产品专属面 ────────────────────────────────────────────────────────────
  ['--dsw-specific-bubble', ['bubble', 'bubble']],
  ['--dsw-specific-bubble-highlight', ['bubbleHighlight', 'bubbleHighlight']],
  ['--dsw-specific-input-major', ['input', 'input']],
  ['--dsw-specific-login-input', ['loginInput', 'loginInput']],
  ['--dsw-specific-menu', ['menu', 'menu']],
  ['--dsw-specific-selector', ['selector', 'selector']],
  ['--dsw-specific-sidebar-fill', ['sidebar', 'sidebar']],
  ['--dsw-specific-sidebar-nav-item-hover', ['sidebarHover', 'sidebarHover']],
  ['--dsw-specific-sidebar-nav-item-active', ['sidebarActive', 'sidebarActive']],
  ['--dsw-specific-sidebar-nav-item-active-accent', ['sidebarAccent', 'sidebarAccent']],
  ['--dsw-specific-tip', ['tip', 'tip']],
])

/** 设计基线里语义 token 的确切数量 —— 用于 check:tokens 断言清单未漂移。 */
export const EXPECTED_TOKEN_COUNT = 90

/**
 * 合成亮/暗两套 token 表。
 *
 * 签名刻意要求**两套 palette 一起传入**:早先版本是 `buildTokenSets(palette)`,
 * 调用处写成 `buildTokenSets(C.light)` 时不会报错,却会让亮暗两档填进同一批值 ——
 * 生成出一个"暗色等于亮色"的皮肤,而且在浏览器里只表现为"切暗色没反应",
 * 极难定位。把两套并成一次调用,这种误用从签名上就不可能发生。
 *
 * 引用了 palette 中不存在的角色时**立即抛错**,而不是静默产出坏颜色。
 *
 * @param {{ light: Record<string, string>, dark: Record<string, string> }} palettes
 * @returns {{ light: Record<string, string>, dark: Record<string, string> }} token → 颜色值
 */
export function buildTokenSets(palettes) {
  const lightPalette = palettes.light
  const darkPalette = palettes.dark
  if (lightPalette === undefined || darkPalette === undefined) {
    throw new Error('tokens.mjs: buildTokenSets 需要 { light, dark } 两套 palette')
  }
  const light = {}
  const dark = {}
  const seen = new Set()
  for (const [token, roles] of ROLE_MAP) {
    if (seen.has(token)) throw new Error(`tokens.mjs: 重复的 token "${token}"`)
    seen.add(token)
    for (const [index, palette, set] of [[0, lightPalette, light], [1, darkPalette, dark]]) {
      const role = roles[index]
      const value = palette[role === undefined ? '' : role]
      if (typeof value !== 'string') {
        throw new Error(`tokens.mjs: "${token}" 引用了 palette 里不存在的角色 "${role}"`)
      }
      set[token] = value
    }
  }
  return { light, dark }
}
