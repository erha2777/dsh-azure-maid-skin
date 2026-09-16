/**
 * 蓝瓷女仆 · Azure Maid —— 调色板 / Palette
 * ============================================================================
 * 全仓配色**唯一真源** (single source of truth)。
 * scripts/build-tokens.mjs 由本文件派生 lib/tokens.js 与 lib/styles/azure-maid.css,
 * 两半因此永远同色;改色只需改这里,然后 `npm run build`。
 *
 * 配色依据 / Where the colours come from
 *   取参考图(蓝发白蕾丝女仆挂件)的五个色域,每个色域在亮/暗两套里各占一档:
 *
 *     色域            参考图取样                           亮色档      暗色档
 *     ─────────────  ───────────────────────────────────  ──────────  ──────────
 *     发色(主)       中明度蓝紫 #5568B0 / #6F82C8 / #8A9AD8  #5060A8     #8A9AD8
 *     发影           深蓝 #2A3568 / #39457F                 #2E3C74     #B9C5EC
 *     提亮/蕾丝       近白冷蓝 #F2F6FF                       #F5F8FF     #E8EEFB
 *     发间青宝石      青蓝 #3E8FC4 / #2F7FB8                #2F7FB8     #6FB6E0
 *     腮红/暖点       暖粉 #F0B9BE                          #C25E75     #FF9EB0
 *
 *   暗色不是"把亮色调暗",而是同色域的另一个明度档 —— 与参考图里同一束
 *   头发的高光与阴影关系一致。
 *
 * 硬约束 / Hard constraints
 *   1. 仅使用 sRGB 十六进制或 8 位十六进制(带 alpha),不写颜色函数 —— 这些值
 *      会被写进 body 的行内样式,必须字面可解析。
 *   2. 亮色 --dsw-* 只由 C.* 与已定义的 P.* 派生,不出现"孤立的十六进制魔法值"。
 *   3. 任何前台色/背景色组合都必须满足对比度要求,见 scripts/check-contrast.mjs。
 */

/** 两套模式的原始色档 / Raw colour steps. */
export const C = Object.freeze({
  light: Object.freeze({
    // —— 画布与层次(冷白 → 浅蓝,取自蕾丝的冷白与发色的淡染)——
    canvas: '#F4F7FE',
    surface: '#FFFFFF',
    surfaceSunken: '#E9EFFB',
    surfaceRaised: '#FFFFFF',
    surfacePlatform: '#EDF2FC',
    surfaceMulti: '#EDF2FC',
    overlay: '#DEE7F8',
    sidebar: '#E7EEFA',
    sidebarHover: '#F4F7FE',
    sidebarActive: '#D2DFF6',
    sidebarAccent: '#BDD1F2',
    bubble: '#EAF0FC',
    bubbleHighlight: '#CEDDF6',
    tip: '#EDF2FC',
    menu: '#FFFFFF',
    selector: '#EDF2FC',
    input: '#FFFFFF',
    loginInput: '#F4F7FE',

    // —— 描边(发影的极淡投影,冷色调而非中性灰)——
    borderL1: '#2A35680F',
    borderL2: '#2A356826',
    borderL2Thin: '#2A35681F',
    borderL3: '#2A356833',
    borderL4: '#2A356840',
    borderInverted: '#00000000',
    borderInverted2: '#00000000',

    // —— 文字(发影做正文,发色做次级)——
    text: '#141C36',
    textBluish: '#1E2A52',
    textDimmed: '#101731',
    textSecondary: '#3F4B78',
    textTertiary: '#5A648F',
    textCaption: '#767FA6',
    textOnBrand: '#FFFFFF',
    textInverted: '#FFFFFF',
    textPrimaryForeground: '#FFFFFF',
    labelDimmed: '#C3CFE8',
    // —— 品牌与交互(发色档)——
    brand: '#3A4A8C',
    brandHover: '#4A5BA6',
    brandInvert: '#141C36',
    accent: '#276C9F',
    accentSoft: '#D6E3F8',
    link: '#2F6FB0',
    focus: '#4A5BA6',
    interactiveHover: '#2432560F',
    interactiveHoverStrong: '#2432561A',
    interactiveActive: '#24325626',
    interactiveAccent: '#276C9F24',
    dangerHover: '#E0416A12',

    // —— 状态(青宝石 / 腮红 / 琥珀)——
    success: '#1A7B61',
    successSoft: '#DEF4EA',
    warn: '#936511',
    warnLabel: '#8A5E0E',
    warnSoft: '#FBF0D8',
    error: '#B83551',
    errorSoft: '#FBDDE3',
    businessSoft: '#D6E3F8',

    // —— Markdown / 代码 ——
    codeBlock: '#EDF2FC',
    codeBlockBanner: '#DCE6F9',
    codeInline: '#E4EBF9',
    codeSegmentSelected: '#FFFFFF',
    codeSegmentUnselected: '#E9EFFB',
    codeTag: '#DFE8F8',
    codePlaceholder: '#E9EFFB',
    citation: '#DCE6F8',

    // —— 滚动条 / 浮层 ——
    scrollbarTrack: '#DFE7F6',
    scrollbarThumb: '#C3CFE8',
    scrollbarThumbHover: '#A6B6DC',
    toast: '#1B2444',
    tooltip: '#1B2444',

    // —— 蒙版(与官方同值:蒙版本就该中性)——
    mask1: '#0000003D',
    mask2: '#0000001F',
    mask3: '#0000007A',
    maskPhoto: '#000000E0',
    maskDrop: '#FFFFFFB3',
    skeleton: '#0000000A',

    // —— 工具条浮钮(压在内容上,需中性半透明)——
    toolbarFill: '#54555780',
    toolbarHover: '#54555799',
    toolbarInvisible: '#1F1F1F5C',
  }),

  dark: Object.freeze({
    // —— 画布与层次(深夜蓝 → 逐层提亮,取自参考图的深蓝底)——
    canvas: '#0A1024',
    surface: '#151E42',
    surfaceSunken: '#1D2750',
    surfaceRaised: '#1D2750',
    surfacePlatform: '#1B2549',
    surfaceMulti: '#1B2549',
    overlay: '#2E3C74',
    sidebar: '#0D1430',
    sidebarHover: '#1B2549',
    sidebarActive: '#2A366B',
    sidebarAccent: '#43549B',
    bubble: '#1B2549',
    bubbleHighlight: '#27336A',
    tip: '#1B2549',
    menu: '#1D2750',
    selector: '#1D2750',
    input: '#1B2549',
    loginInput: '#0A1024',

    // —— 描边(冷白极淡,而非中性灰)——
    borderL1: '#FFFFFF0F',
    borderL2: '#FFFFFF1F',
    borderL2Thin: '#FFFFFF0F',
    borderL3: '#FFFFFF29',
    borderL4: '#FFFFFF33',
    borderInverted: '#FFFFFF0F',
    borderInverted2: '#FFFFFF14',

    // —— 文字(蕾丝冷白做正文,发色提亮做次级)——
    text: '#E8EEFB',
    textBluish: '#E8EEFB',
    textDimmed: '#E8EEFB',
    textSecondary: '#A9B7E0',
    textTertiary: '#8A9AD8',
    textCaption: '#6E7CB4',
    // 品牌底在暗色下是提亮档,所以"压在品牌上的字"必须转到深色一端。
    textOnBrand: '#0A1024',
    textInverted: '#1D2750',
    textPrimaryForeground: '#0A1024',
    labelDimmed: '#2E3C74',

    // —— 品牌与交互 ——
    // 暗色下品牌是**提亮档**:它是按钮的填充色,文字用 --dsw-alias-label-primary-foreground
    // (= canvas)。这与设计基线的做法一致(基线在暗色下把品牌设成浅灰,按钮文字
    // 用深灰)。反过来做(深底浅字)会同时压死"品牌色当文字压在暗底上"这一用法。
    brand: '#8A9AD8',
    brandHover: '#B9C5EC',
    brandInvert: '#E8EEFB',
    accent: '#7FC0E8',
    accentSoft: '#27336A',
    link: '#8FBEF0',
    focus: '#8A9AD8',
    interactiveHover: '#FFFFFF14',
    interactiveHoverStrong: '#FFFFFF1F',
    interactiveActive: '#FFFFFF24',
    interactiveAccent: '#FFFFFF3D',
    dangerHover: '#F25A5A26',

    // —— 状态 ——
    success: '#5FD6B4',
    successSoft: '#173A44',
    warn: '#F0C168',
    warnLabel: '#F2A9BE',
    warnSoft: '#33294A',
    error: '#FF8598',
    errorSoft: '#3A2038',
    businessSoft: '#2E3C74',

    // —— Markdown / 代码 ——
    codeBlock: '#161F42',
    codeBlockBanner: '#27336A',
    codeInline: '#1B2549',
    codeSegmentSelected: '#27336A',
    codeSegmentUnselected: '#161F42',
    codeTag: '#1B2549',
    codePlaceholder: '#1D2750',
    citation: '#2E3C74',

    // —— 滚动条 / 浮层 ——
    scrollbarTrack: '#27336A',
    scrollbarThumb: '#3A4A8C',
    scrollbarThumbHover: '#4A5BA6',
    // 暗色下浮层走高亮面 + 深字(而亮色下是深面 + 浅字)—— 浮层要"浮"起来,
    // 就得与它覆盖的暗色内容拉开明度,顺着页面一起变暗只会糊成一片。
    toast: '#C6D2EE',
    tooltip: '#C6D2EE',

    // —— 蒙版 ——
    mask1: '#00000080',
    mask2: '#00000033',
    mask3: '#0000007A',
    maskPhoto: '#000000E0',
    maskDrop: '#272730B3',
    skeleton: '#FFFFFF14',

    // —— 工具条浮钮 ——
    toolbarFill: '#54555780',
    toolbarHover: '#54555799',
    toolbarInvisible: '#1F1F1F5C',
  }),
})

/**
 * 亮色品牌主色用于按下态/悬停态时的加深档(由 brand 单独给出,避免颜色函数)。
 * Derived hover steps that cannot be expressed by mixing alone stay explicit.
 */
export const BRAND_TEXT_LIGHT = '#FFFFFF'
export const BRAND_TEXT_DARK = '#0A1024'
