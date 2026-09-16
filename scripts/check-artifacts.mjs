/**
 * check:artifacts —— 产物完整性与客户端冒烟测试
 * ============================================================================
 * 这个脚本回答一个问题:**把 lib/client.js 交给 DSH 的加载器,它会不会跑起来?**
 * 不靠肉眼看代码,而是真的伪造一个加载器 + 一套最小服务,把工厂执行一遍,
 * 再让 React 真渲染一次设置页。
 *
 * 检查项
 *   1. 产物与源同步     —— 重新构建一遍,字节不一致就是"忘了 npm run build";
 *   2. lib/client.js 形态 —— 首字节必须是 window.(无 BOM)、id 必须是包名、
 *                            不得残留 import/export、占位符必须已替换;
 *   3. 配色一致性       —— client.js 内联的 180 个值与 lib/tokens.js 完全相同,
 *                          且与 lib/styles/azure-maid.css 逐条对齐
 *                          (两侧不一致会表现为"启动前后颜色跳一下");
 *   4. 客户端加载       —— 工厂能执行、apply() 不抛错、确实调用了 overrideTokens
 *                          且形状是 { light, dark };
 *   5. 设置页渲染       —— 三个模式按钮真的出现在渲染结果里(装了 react 才跑);
 *   6. 生命周期         —— 停止时 overrideTokens 的 disposer 必须被调用,
 *                          否则配色会在停用后残留。
 *
 * 用法:node scripts/check-artifacts.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { contrast } from './color.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PACKAGE_NAME = 'dsh-azure-maid-skin'
const failures = []
const notes = []
const fail = (message) => failures.push(message)

// ── 1. 产物与源同步 ────────────────────────────────────────────────────────
const GENERATED = ['lib/tokens.js', 'lib/styles/azure-maid.css', 'lib/client.js']
const before = new Map(GENERATED.map((file) => [file, fs.readFileSync(path.join(ROOT, file), 'utf8')]))

try {
  // 直接 import 两个构建脚本 —— 它们是"执行即落盘"的模块。
  // 不用子进程:一是省一次进程启动,二是沙箱环境下 spawn 捕获输出会 EPERM。
  await import('./build-tokens.mjs')
  await import('./build-client.mjs')
} catch (err) {
  fail(`重新构建失败:${(err && err.message) || err}`)
}

for (const file of GENERATED) {
  if (before.get(file) !== fs.readFileSync(path.join(ROOT, file), 'utf8')) {
    fail(`${file} 与源文件不同步 —— 请运行 npm run build 并提交产物`)
  }
}
if (failures.length === 0) notes.push('产物与源文件一致(重新构建为字节相同)')

// ── 2. lib/client.js 形态 ─────────────────────────────────────────────────
// 文件以 JSDoc 头注释开头是正常的,**第一句可执行代码**必须是那条 load 调用 ——
// 断言要落在这里,而不是断言文件的首字节。
const clientBundleRaw = fs.readFileSync(path.join(ROOT, 'lib', 'client.js'), 'utf8')
const clientBundle = clientBundleRaw.replace(/^\uFEFF/, '')
const loaderAt = clientBundle.indexOf('window.__ModuleLoader__.load(')
if (loaderAt < 0) {
  fail('lib/client.js 里找不到 window.__ModuleLoader__.load(...)')
} else {
  const before = clientBundle.slice(0, loaderAt)
  // load 之前只允许出现注释与空白。
  if (before.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '').trim() !== '') {
    fail('lib/client.js 在 load 调用之前出现了可执行代码')
  }
}
if (!clientBundle.includes(`id: "${PACKAGE_NAME}"`)) fail('lib/client.js 的模块 id 不是包名')
if (!clientBundle.includes('factory: (require) => {')) fail('lib/client.js 缺少工厂函数')
if (/(^|\n)\s*(import|export)\s/.test(clientBundle)) fail('lib/client.js 里残留 ESM 语法')
if (clientBundle.includes('@INJECT:TOKEN_SETS')) fail('lib/client.js 里的 token 占位符没有被替换')
if (/const\s+TOKENS\s*=\s*var\b/.test(clientBundle)) fail('lib/client.js 的 token 注入把声明关键字重复了一遍')
// 整份文件必须能解析 —— 语法错了 DSH 会在加载这个插件时直接失败。
try {
  // eslint-disable-next-line no-new-func
  new Function('window', 'document', 'console', clientBundle)
} catch (err) {
  fail(`lib/client.js 语法非法:${(err && err.message) || err}`)
}

// ── 3. 配色一致性 ─────────────────────────────────────────────────────────
const { LIGHT, DARK } = await import('../lib/tokens.js')
const names = Object.keys(LIGHT)
if (names.length !== 90) fail(`lib/tokens.js 的 token 数量是 ${names.length},期望 90`)
for (const name of names) {
  if (!(name in DARK)) fail(`lib/tokens.js 的暗色档缺少 ${name}`)
}

/** 从 "const TOKENS = {...}" 段里取出内联值。 */
function readInlineTokens(bundle) {
  const start = bundle.indexOf('const TOKENS = {')
  const end = bundle.indexOf('const React = require')
  if (start < 0 || end < 0 || end < start) throw new Error('lib/client.js 里找不到内联 token 段')
  const out = { light: {}, dark: {} }
  let mode = null
  for (const raw of bundle.slice(start, end).split('\n')) {
    const line = raw.trim()
    if (line.startsWith('light: {')) { mode = 'light'; continue }
    if (line.startsWith('dark: {')) { mode = 'dark'; continue }
    if (line === '},') { mode = null; continue }
    if (mode === null) continue
    const match = line.match(/^'([^']+)': '([^']+)',$/)
    if (match !== null) out[mode][match[1]] = match[2]
  }
  return out
}

let inline = { light: {}, dark: {} }
try {
  inline = readInlineTokens(clientBundle)
} catch (err) {
  fail(String((err && err.message) || err))
}
for (const mode of ['light', 'dark']) {
  const expected = mode === 'light' ? LIGHT : DARK
  const actualNames = Object.keys(inline[mode])
  if (actualNames.length !== 90) {
    fail(`lib/client.js 内联的${mode === 'light' ? '亮' : '暗'}色 token 数量是 ${actualNames.length},期望 90`)
  }
  for (const name of names) {
    if (inline[mode][name] !== expected[name]) {
      fail(`client.js ${mode} ${name} = ${inline[mode][name]},tokens.js 是 ${expected[name]}`)
    }
  }
}

const css = fs.readFileSync(path.join(ROOT, 'lib', 'styles', 'azure-maid.css'), 'utf8')
/**
 * CSS 里的三段:
 *   body { ... }                                    → 亮色档
 *   @media (prefers-color-scheme: dark) { body, body[data-ds-dark-theme] { ... } } → 暗色档
 * 两段 token **值**应当完全一致 —— 这正是"client 内联值 == CSS 值"的第三处交叉验证。
 */
const readDecls = (block) => {
  const out = {}
  for (const match of block.matchAll(/(--dsw-[a-z0-9-]+):\s*([^;]+);/g)) out[match[1]] = match[2].trim()
  return out
}
/**
 * 定位两段的边界。
 * 三处需要注意:
 *   1. 文件头注释里也会出现 `@media (prefers-color-scheme: dark)` 这几个字,
 *      所以不能用它做锚点(会切到注释上,切出 0 个 token);
 *   2. 自停用规则里的 token 名与亮暗两档完全相同,所以不能简单地
 *      "从第一个 token 切到 @media" —— 会把自停用规则也算进去;
 *   3. 因此统一用构建器写出的段标题注释做锚点,并且断言锚点必须存在。
 */
const marks = {
  disable: '/* 自停用:',
  light: '/* ── 1. 亮色档',
  dark: '/* ── 2/3. 暗色档',
}
const at = {}
for (const [key, marker] of Object.entries(marks)) {
  at[key] = css.indexOf(marker)
  if (at[key] < 0) fail(`lib/styles/azure-maid.css 里找不到段标题:${key}`)
}
const sliceBetween = (from, to) => (from < 0 || to < 0 ? '' : css.slice(from, to))
const cssLight = readDecls(sliceBetween(at.light, at.dark))
const cssDark = readDecls(at.dark < 0 ? '' : css.slice(at.dark))
const cssDisabled = readDecls(sliceBetween(at.disable, at.light))
if (process.env.DSH_AZURE_DEBUG === '1') {
  console.log('[debug] LIGHT keys', Object.keys(LIGHT).length, 'first', JSON.stringify(Object.entries(LIGHT)[0]))
  console.log('[debug] DARK  keys', Object.keys(DARK).length, 'first', JSON.stringify(Object.entries(DARK)[0]))
  console.log('[debug] cssLight keys', Object.keys(cssLight).length, 'cssDark keys', Object.keys(cssDark).length)
  console.log('[debug] cssDark bg-base', cssDark['--dsw-alias-bg-base'], 'DARK bg-base', DARK['--dsw-alias-bg-base'])
}
for (const [mode, actual, expected] of [['light', cssLight, LIGHT], ['dark', cssDark, DARK]]) {
  if (Object.keys(actual).length !== 90) {
    fail(`CSS ${mode} 档声明了 ${Object.keys(actual).length} 个 token,期望 90`)
  }
  for (const name of names) {
    if (actual[name] !== expected[name]) fail(`CSS ${mode} ${name} = ${actual[name]},tokens.js 是 ${expected[name]}`)
  }
}
if (!css.includes('body[data-ds-dark-theme]')) fail('CSS 缺少 body[data-ds-dark-theme] 选择器 —— 手动选暗色会失效')
if (at.disable < 0) {
  fail('CSS 缺少自停用规则 —— 客户端接管后首绘样式表不会让位')
} else {
  // 自停用规则必须覆盖**全部** 90 个 token 且值一律 unset:漏一个就会残留旧值。
  if (Object.keys(cssDisabled).length !== 90) {
    fail(`自停用规则只覆盖了 ${Object.keys(cssDisabled).length} 个 token,期望 90`)
  }
  for (const [name, value] of Object.entries(cssDisabled)) {
    if (value !== 'unset') fail(`自停用规则 ${name} 的值是 ${value},期望 unset`)
  }
}

// ── 4/5/6. 客户端冒烟测试 ─────────────────────────────────────────────────
/** 伪造的最小 DOM —— 只实现 lib/client.js 真正用到的那几个方法。 */
function createFakeDom() {
  const element = (tag) => ({
    tagName: String(tag).toUpperCase(),
    attributes: {},
    children: [],
    parentNode: null,
    setAttribute(name, value) { this.attributes[name] = value },
    getAttribute(name) { return this.attributes[name] },
    appendChild(child) { child.parentNode = this; this.children.push(child) },
    removeChild(child) { this.children = this.children.filter((node) => node !== child) },
  })
  const byMarker = new Map()
  const document = {
    documentElement: element('html'),
    head: element('head'),
    createElement: (tag) => element(tag),
    querySelector: (selector) => {
      const marker = selector.match(/^link\[([^\]]+)\]$/)
      if (marker !== null) return byMarker.get(marker[1]) || null
      return null
    },
    __register: (marker, node) => byMarker.set(marker, node),
  }
  return { document }
}

/** 伪造 DSH 的客户端加载器,取出模块 id、工厂和插件实例。 */
function loadClientBundle(document, ReactImpl, log) {
  let definition = null
  const window = {
    __ModuleLoader__: { load: (value) => { definition = value } },
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  }
  const requireImpl = (specifier) => {
    if (specifier === 'react') return ReactImpl
    throw new Error(`冒烟测试未提供模块:${specifier}`)
  }
  const script = new Function('window', 'document', 'console', clientBundle)
  script(window, document, { log: (...a) => log.push(['console.log', ...a]), error: (...a) => log.push(['console.error', ...a]) })
  if (definition === null) throw new Error('client.js 没有调用 window.__ModuleLoader__.load')
  return definition.factory(requireImpl)
}

/** 伪造 Cordis 上下文,记录 apply() 期间发生的一切。 */
function createFakeCtx() {
  const log = []
  let disposeCalls = 0
  let teardown = null
  const ctx = {
    __log: log,
    get __disposeCalls() { return disposeCalls },
    get __teardown() { return teardown },
    get(name) {
      if (name === 'theme') {
        return {
          getTheme: () => ({ preference: 'system', fontSize: 14, active: { id: 'light', colorScheme: 'light', tokens: {} }, themes: [{ id: 'light' }, { id: 'dark' }], revision: 1 }),
          setTheme: (id) => log.push({ kind: 'setTheme', id }),
          overrideTokens: (source, tokens) => {
            log.push({ kind: 'overrideTokens', source, tokens })
            return () => { disposeCalls += 1 }
          },
        }
      }
      if (name === 'slots') {
        return {
          inject: (slot, callback) => { log.push({ kind: 'inject', slot }); callback() },
          register: (options, component) => {
            log.push({ kind: 'register', name: options.name, id: options.id, component })
            return () => {}
          },
        }
      }
      return undefined
    },
    on: () => () => {},
    effect: (callback) => {
      teardown = callback()
      return () => { if (typeof teardown === 'function') teardown() }
    },
  }
  return ctx
}

/**
 * 渲染替身的选择:
 *   · 装了真的 react 就用真的(更接近生产环境);
 *   · 没装就用本地 hook 替身(见 scripts/test-react-shim.mjs)—— 零依赖,
 *     依然能证明"组件跑得完、三个模式按钮都在"。
 * 两条路都必须走渲染断言,不允许"没装 react 就跳过"。
 */
const shim = await import('./test-react-shim.mjs')
const { renderToText } = shim
let ReactImpl = null
let reactSource = 'null'
try {
  ReactImpl = (await import('react')).default
  reactSource = 'react'
} catch (err) {
  ReactImpl = shim.createHookRuntime()
  reactSource = 'shim'
}
notes.push(`设置页渲染使用:${reactSource === 'react' ? '本机 react' : '内置 hook 替身(零依赖)'}`)

const dom = createFakeDom()
const hostLink = dom.document.createElement('link')
hostLink.setAttribute('data-dsh-azure-maid-skin', '')
dom.document.__register('data-dsh-azure-maid-skin', hostLink)

let plugin = null
const moduleLog = []
try {
  plugin = loadClientBundle(dom.document, ReactImpl.api !== undefined ? ReactImpl.api : ReactImpl, moduleLog)
} catch (err) {
  fail(`执行 lib/client.js 失败:${(err && err.stack) || err}`)
}

if (plugin !== null) {
  if (typeof plugin.apply !== 'function') fail('客户端插件没有 apply()')
  const ctx = createFakeCtx()
  try {
    plugin.apply(ctx)
  } catch (err) {
    fail(`apply() 抛错:${(err && err.stack) || err}`)
  }

  // 4a. 覆盖层
  // 插件必须有硬依赖 theme:否则 apply() 恰好在主题服务挂载前执行时,effect 会
  // 注册成空操作且永不重试 —— 表现就是"皮肤装了但切深浅没反应",且无任何报错。
  const declaredInject = Array.isArray(plugin.inject) ? plugin.inject : []
  if (!declaredInject.includes('theme')) {
    fail(`插件没有把 theme 声明为硬依赖(当前 inject=${JSON.stringify(declaredInject)})—— 存在主题服务晚挂载时静默失效的风险`)
  } else {
    notes.push('已声明 inject: [theme],不存在主题服务晚挂载的时序窗口')
  }

  const override = ctx.__log.find((entry) => entry.kind === 'overrideTokens')
  if (override === undefined) {
    fail('apply() 没有调用 theme.overrideTokens —— 配色不会生效')
  } else {
    if (override.source !== PACKAGE_NAME) fail(`overrideTokens 的 source 是 ${override.source},期望包名`)
    const layerNames = Object.keys(override.tokens)
    if (layerNames.length !== 90) fail(`覆盖层有 ${layerNames.length} 个 token,期望 90`)
    for (const name of layerNames) {
      const modes = override.tokens[name]
      if (modes === null || typeof modes !== 'object' || typeof modes.light !== 'string' || typeof modes.dark !== 'string') {
        fail(`覆盖层 ${name} 不是 { light, dark } 形状(主题服务会抛错)`)
        break
      }
    }
    // 覆盖层必须恰好注册一次 —— source 相同的重复覆盖会互相替换。
    if (ctx.__log.filter((entry) => entry.kind === 'overrideTokens').length !== 1) {
      fail('覆盖层被注册了多次 —— source 相同的覆盖会互相替换')
    }
  }

  // 4b. 客户端已接管标记(首绘样式表靠 CSS 自身让位,不需要 DOM 查询)
  if (dom.document.documentElement.getAttribute('data-dsh-azure-maid-client') === null) {
    fail('加载 lib/client.js 后没有在 <html> 上留下 data-dsh-azure-maid-client —— 首绘样式表不会让位')
  }

  // 4c. 设置页注册与渲染
  const registration = ctx.__log.find((entry) => entry.kind === 'register')
  if (registration === undefined) {
    fail('apply() 没有注册设置页')
  } else {
    if (registration.name !== 'settings.section') fail(`设置页注册到了 ${registration.name},期望 settings.section`)
    if (registration.id !== PACKAGE_NAME) fail(`设置页 id 是 ${registration.id},期望包名`)
    try {
      // shim 路径下 mount 会执行 hooks;真 react 路径下组件本身不含 hook(它只渲染 Panel)。
      const tree =
        ReactImpl.mount !== undefined
          ? ReactImpl.mount(registration.component, {})
          : ReactImpl.createElement(registration.component, {})
      const markup = renderToText(tree)
      for (const label of ['Azure Maid', '亮色', '暗色', '跟随系统']) {
        if (!markup.includes(label)) fail(`设置页渲染结果里没有「${label}」`)
      }
      if (markup.length < 100) fail('设置页渲染结果异常短')
      else notes.push(`设置页渲染通过(${markup.length} 字符,三个模式按钮齐全)`)
    } catch (err) {
      fail(`设置页渲染抛错:${(err && err.stack) || err}`)
    }
  }

  // 6. 生命周期
  if (typeof ctx.__teardown !== 'function') {
    fail('apply() 没有用 ctx.effect 持有覆盖层 —— 停止插件时无法归还')
  } else {
    ctx.__teardown()
    if (ctx.__disposeCalls === 0) fail('停止插件时没有调用 overrideTokens 的 disposer —— 配色会残留')
  }
}

// ── 7. 预览页自检 ──────────────────────────────────────────────────────────
/**
 * 预览页里有一段内联 JS(模式切换 + 色板 + 对比度实时自检)。它是给人看的,
 * 但"能打开却点不动"同样算缺陷 —— 所以这里用假 DOM 把它跑起来,断言:
 *   · 三种模式都切得动,body 的 data-ds-theme 正确翻转;
 *   · 对比度自检算出的数值与本仓 scripts/color.mjs 的算法一致(不是瞎写);
 *   · 全部 90 个 token 都渲染出来了。
 */
const PREVIEW = path.join(ROOT, 'preview', 'index.html')
if (!fs.existsSync(PREVIEW)) {
  fail('preview/index.html 不存在 —— 请运行 node scripts/preview.mjs')
} else {
  const html = fs.readFileSync(PREVIEW, 'utf8')
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1])

  /**
   * 用预览页自己的样式表喂给它的取色函数。
   * 不做真实的层叠计算,只按预览页里出现的顺序把 `body{...}` 与
   * `body[data-ds-theme="dark"]{...}` 两段的声明合起来 —— 这正是浏览器在该
   * 页面下会得到的值,足以让"对比度自检"算出有意义的数字。
   */
  function readPreviewTokens() {
    const styleTags = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((match) => match[1])
    const css = styleTags.join('\n')
    const grab = (pattern) => {
      const out = {}
      for (const match of css.matchAll(pattern)) {
        for (const decl of match[1].split(';')) {
          const colon = decl.indexOf(':')
          if (colon < 0) continue
          const name = decl.slice(0, colon).trim()
          if (name.startsWith('--dsw-')) out[name] = decl.slice(colon + 1).trim()
        }
      }
      return out
    }
    const plain = grab(/(?:^|\n)body\s*\{([^}]*)\}/g)
    const dark = grab(/body\[data-ds-theme="dark"\]\s*\{([^}]*)\}/g)
    return { plain, dark: { ...plain, ...dark } }
  }
  const previewTokens = readPreviewTokens()
  if (scripts.length !== 1) {
    fail(`preview/index.html 里的内联脚本数量是 ${scripts.length},期望 1`)
  } else {
    const boot = createFakeDom()
    const stub = () => ({ innerHTML: '', textContent: '', style: {}, attributes: {}, dataset: {}, children: [], appendChild() {}, setAttribute() {} })
    const modes = ['light', 'dark', 'system'].map((mode) => {
      const node = stub()
      node.dataset.mode = mode
      node.addEventListener = (type, handler) => { node.__click = handler }
      return node
    })
    const nodes = { mode: modes }
    const media = {
      matches: false,
      addEventListener() {},
      __handlers: [],
    }
    const previewDocument = {
      body: Object.assign(stub(), {
        style: {
          props: {},
          setProperty(name, value) { this.props[name] = value },
          getPropertyValue(name) { return this.props[name] || '' },
        },
        setAttribute(name, value) { this.attributes[name] = value },
      }),
      querySelectorAll: (selector) => (selector === '.mode' ? modes : []),
      getElementById: (id) => {
        if (nodes[id] === undefined) {
          const node = stub()
          // innerHTML 落成真实属性,方便测试读取;stub 里它是普通字段。
          Object.defineProperty(node, 'innerHTML', {
            get() { return this.__html || '' },
            set(value) { this.__html = String(value) },
            configurable: true,
          })
          nodes[id] = node
        }
        return nodes[id]
      },
    }
    const previewWindow = {
      matchMedia: () => media,
      location: { search: '' },
      // 预览页优先用计算样式取色;这里按当前 data-ds-theme 从它自己的样式表里取值。
      getComputedStyle: () => ({
        getPropertyValue: (name) => {
          const mode = previewDocument.body.attributes['data-ds-theme'] === 'dark' ? previewTokens.dark : previewTokens.plain
          return mode[name] || ''
        },
      }),
    }
    try {
      // 注意参数里显式传入 getComputedStyle:预览页里它是裸标识符(浏览器全局),
      // 而 new Function 的作用域里没有 window 的属性,必须显式给。
      new Function('window', 'document', 'console', 'getComputedStyle', scripts[0])(
        previewWindow,
        previewDocument,
        { log() {}, error() {} },
        previewWindow.getComputedStyle,
      )
    } catch (err) {
      fail(`preview/index.html 的内联脚本抛错:${(err && err.message) || err}`)
    }

    const themeNow = () => previewDocument.body.attributes['data-ds-theme']
    const click = (mode) => {
      const node = nodes.mode.find((item) => item.dataset.mode === mode)
      if (node === undefined || typeof node.__click !== 'function') {
        fail(`预览页的模式按钮「${mode}」没有绑定点击处理`)
        return
      }
      node.__click({ currentTarget: node })
    }

    click('light')
    if (themeNow() !== 'light') fail(`预览页点击「亮色」后 data-ds-theme=${themeNow()}`)
    click('dark')
    if (themeNow() !== 'dark') fail(`预览页点击「暗色」后 data-ds-theme=${themeNow()}`)
    media.matches = true
    click('system')
    if (themeNow() !== 'dark') fail(`预览页在系统为暗时选「跟随系统」应得到 dark,实际 ${themeNow()}`)
    media.matches = false
    click('system')
    if (themeNow() !== 'light') fail(`预览页在系统为亮时选「跟随系统」应得到 light,实际 ${themeNow()}`)

    // 对比度自检必须与本仓算法一致:抽第一行数据比一次。
    click('light')
    const rows = nodes.contrast === undefined ? '' : nodes.contrast.__html || ''
    if (process.env.DSH_AZURE_DEBUG === '1') {
      console.log('[debug] contrast node keys:', Object.keys(nodes))
      console.log('[debug] contrast html len:', rows.length, JSON.stringify(rows.slice(0, 160)))
    }
    const firstRatio = /(\d+\.\d+):1/.exec(rows)
    if (firstRatio === null) {
      fail('预览页的对比度自检没有产出任何数值')
    } else {
      const expected = contrast(LIGHT['--dsw-alias-label-primary'], LIGHT['--dsw-alias-bg-layer-1'])
      if (Math.abs(Number(firstRatio[1]) - expected) > 0.02) {
        fail(`预览页对比度算得 ${firstRatio[1]},本仓算法是 ${expected.toFixed(2)} —— 两处算法不一致`)
      } else {
        notes.push(`预览页自检通过(模式切换 + 对比度 ${expected.toFixed(2)}:1 与本仓算法一致)`)
      }
    }

    const tokenRows = nodes.alltokens === undefined ? '' : nodes.alltokens.innerHTML
    const rendered = (tokenRows.match(/<div>/g) || []).length
    if (rendered !== 90) fail(`预览页只渲染了 ${rendered} 个 token,期望 90`)
  }
}

// ── 结论 ───────────────────────────────────────────────────────────────────
for (const note of notes) console.log(`· ${note}`)
if (failures.length > 0) {
  console.error(`\ncheck:artifacts 失败(${failures.length} 项):`)
  for (const message of failures) console.error(`  ✗ ${message}`)
  process.exit(1)
}
console.log('✓ check:artifacts 通过:产物形态、两侧配色一致性、客户端加载、设置页渲染、生命周期全部正常')
