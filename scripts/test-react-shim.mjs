/**
 * 测试用最小 React 替身
 * ============================================================================
 * check:artifacts 需要"真渲染一次设置页"来证明组件不会抛错、三个模式按钮都在。
 * 引入真的 react 会让这个包为了跑自检而拖一个依赖(而且本地装依赖要联网),
 * 所以这里提供一个只覆盖**本包实际用到的那几个 API** 的替身:
 *
 *   createElement(type, props, ...children)   —— 元素就是一个普通对象
 *   useState(initial)                         —— 按调用顺序分配槽位
 *   useEffect(effect, deps)                   —— 按调用顺序分配槽位,依赖变化才重跑
 *
 * 它**不是 React**,不实现调度、并发、Fragment、memo、context。
 * 它的唯一职责是让 `Panel` 组件在 Node 里跑完一次并交出元素树,
 * 从而验证:读偏好不抛错、按钮齐全、渲染期间没有异常。
 *
 * 局限(写在明处,避免误解):
 *   · 不验证真实的协调与更新时序;
 *   · 不验证样式在浏览器里的最终计算值 —— 那是预览页和真机验证的事。
 */

/** 极简元素工厂。children 摊平,和 React 的语义一致。 */
function createElement(type, props, ...children) {
  const flat = []
  const push = (child) => {
    if (child === null || child === undefined || child === false || child === true) return
    if (Array.isArray(child)) {
      for (const item of child) push(item)
      return
    }
    flat.push(child)
  }
  for (const child of children) push(child)
  return { type, props: { ...(props || {}), children: flat.length <= 1 ? flat[0] : flat } }
}

/** 创建一个独立的 hook 运行时 —— 每个测试用例一份,互不干扰。 */
export function createHookRuntime() {
  let slots = []
  let cursor = 0
  const pending = []
  let rendering = false

  function useState(initial) {
    const index = cursor
    cursor += 1
    if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial
    const setState = (next) => {
      slots[index] = typeof next === 'function' ? next(slots[index]) : next
    }
    return [slots[index], setState]
  }

  function useEffect(effect, deps) {
    const index = cursor
    cursor += 1
    const previous = slots[index]
    const depsArray = deps === undefined ? null : deps
    const changed =
      previous === undefined ||
      depsArray === null ||
      previous.deps === null ||
      depsArray.length !== previous.deps.length ||
      depsArray.some((value, i) => !Object.is(value, previous.deps[i]))
    if (changed) {
      slots[index] = { deps: depsArray }
      if (rendering) pending.push(effect)
      else effect()
    }
  }

  /** 渲染一个函数组件,返回它的元素树(会重放 effect,和真实行为接近)。 */
  function mount(Component, props) {
    cursor = 0
    rendering = true
    let tree
    try {
      tree = Component(props)
    } finally {
      rendering = false
    }
    while (pending.length > 0) {
      const effect = pending.shift()
      const cleanup = effect()
      if (typeof cleanup === 'function') cleanup()
    }
    return tree
  }

  return { api: { createElement, useState, useEffect }, mount }
}

/**
 * 把元素树摊成纯文本,用于断言关键文案存在。
 *
 * 函数组件**必须就地展开**:本包的设置页是 Panel + 若干子组件(Button、Swatches),
 * 只遍历宿主元素是拿不到任何文字的 —— 早先版本漏了这一步,渲染断言因此
 * 永远拿到空字符串,看起来像"渲染失败",实际是遍历器不完整。
 *
 * 展开函数组件时,当前 hook 光标保持在 mount() 建立的那份槽位上,
 * 因此子组件里的 useState/useEffect 能正常取到自己的槽位。
 */
export function renderToText(node, depth = 0) {
  if (node === null || node === undefined || node === false || node === true || depth > 200) return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map((child) => renderToText(child, depth + 1)).join('')
  if (typeof node === 'object' && node.props !== undefined) {
    if (typeof node.type === 'function') return renderToText(node.type(node.props), depth + 1)
    return renderToText(node.props.children, depth + 1)
  }
  return ''
}
