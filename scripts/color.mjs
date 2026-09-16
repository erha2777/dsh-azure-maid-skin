/**
 * 颜色数学(纯函数,无副作用)
 * ============================================================================
 * check:contrast、preview、以及一次性调色求解器共用这几个函数,保证三处算的
 * 是同一件事。这里不 import 任何会执行副作用的模块。
 */

/** 解析 #RRGGBB / #RRGGBBAA → { r, g, b, a }。 */
export function parseHex(hex) {
  const value = hex.replace('#', '')
  if (value.length !== 6 && value.length !== 8) throw new Error(`非法颜色:${hex}`)
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
    a: value.length === 8 ? parseInt(value.slice(6, 8), 16) / 255 : 1,
  }
}

/** { r, g, b } → #RRGGBB。 */
export function toHex(color) {
  const channel = (value) =>
    Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0')
  return `#${channel(color.r)}${channel(color.g)}${channel(color.b)}`.toUpperCase()
}

/** 把前景(可能带 alpha)合成到不透明背景上。 */
export function composite(fg, bg) {
  if (fg.a >= 1) return { r: fg.r, g: fg.g, b: fg.b, a: 1 }
  return {
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  }
}

/** WCAG 相对亮度。 */
export function luminance(color) {
  const channel = (value) => {
    const v = value / 255
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b)
}

/** WCAG 对比度(1..21)。 */
export function contrast(foregroundHex, backgroundHex) {
  const bg = parseHex(backgroundHex)
  const fg = composite(parseHex(foregroundHex), bg)
  const l1 = luminance(fg)
  const l2 = luminance(bg)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * 从 start 向 target 插值,直到在所有 given background 上都达到 minimum。
 * 用于挑"刚好达标"的颜色 —— 比手调更快,而且结果可复现。
 * @returns {string | null} 达标的十六进制色;插值到 target 仍不达标时 null。
 */
export function solveColor(start, target, backgrounds, minimum) {
  const from = parseHex(start)
  const to = parseHex(target)
  const list = Array.isArray(backgrounds) ? backgrounds : [backgrounds]
  for (let t = 0; t <= 1.0001; t += 0.002) {
    const candidate = toHex({
      r: from.r + (to.r - from.r) * t,
      g: from.g + (to.g - from.g) * t,
      b: from.b + (to.b - from.b) * t,
    })
    if (list.every((bg) => contrast(candidate, bg) + 1e-9 >= minimum)) return candidate
  }
  return null
}
