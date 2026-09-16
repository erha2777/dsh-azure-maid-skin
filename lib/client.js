/**
 * 蓝瓷女仆 · Azure Maid —— 客户端模块(构建产物,请勿手工编辑)
 * ============================================================================
 * 由 scripts/build-client.mjs 生成;源文件是 theme/client-source.mjs,
 * 配色内联自 lib/tokens.js(build:tokens 的产物)。
 *
 * 改配色:改 theme/palette.mjs → npm run build
 * 改行为:改 theme/client-source.mjs → npm run build
 *
 * 格式说明 / Format notes
 *   1. DSH 客户端加载器执行的是工厂包装,而非 ESM;id 必须是包名。
 *   2. 工厂直接返回插件对象({ apply }),不经过 module.exports。
 *   3. React 由 require('react') 取得 —— 客户端模块里**没有全局 React**。
 *      漏掉这一步的典型症状:模块能加载、apply() 也执行,但面板一渲染就
 *      ReferenceError,于是设置页不出现。
 *   4. 本文件不含 source map —— 加载器允许缺失,只有存在但格式非法时才抛错。
 * ========================================================================== */

window.__ModuleLoader__.load({
  id: "dsh-azure-maid-skin",
  factory: (require) => {
		/**
		 * 蓝瓷女仆 · Azure Maid —— 客户端半边源码
		 * ============================================================================
		 * 这个文件是 **ESM 源文件,不直接发布**。scripts/build-client.mjs 会:
		 *   1. 把 lib/tokens.js 里的 90 × 2 个 token 内联到占位符处;
		 *   2. 把 `export default` 换成 `return`,整段塞进 DSH 的客户端模块工厂;
		 *   3. 写出 lib/client.js —— 那才是 package.json 里 dsh.client 指向的入口。
		 *
		 * 职责 / What this half owns
		 *   · 外观:一句 theme.overrideTokens 覆盖 90 个语义 token,亮暗两档成对给,
		 *     于是 **亮色 / 暗色 / 跟随系统** 三种偏好共用同一层覆盖 —— 偏好为
		 *     system 时由主题服务按系统色决定取哪一档,颜色自动跟随,不需要本插件
		 *     自己监听 prefers-color-scheme。
		 *   · 交互:一个设置页(设置 → 蓝瓷女仆),用 setTheme('light' | 'dark' |
		 *     'system') 写偏好 —— 这是主题服务允许的唯一写入口,偏好会被 DSH 持久化,
		 *     因此和「设置 → 通用 → 外观」里那三个方块永远同步。
		 *
		 * 为什么是 overrideTokens 而不是 register 两个主题
		 *   主题服务的 system 偏好**只解析到内建的 light / dark**(见其 buildSnapshot),
		 *   第三方 register 出来的 id 不参与 system 解析。所以如果注册成
		 *   azure-light / azure-dark 两个主题,用户一选「跟随系统」就会掉回官方配色 ——
		 *   皮肤在三种偏好里只有两种生效。overrideTokens 是叠加层,不受偏好解析影响,
		 *   三种偏好全覆盖。这也是这个包不注册任何主题 id 的原因。
		 *
		 * 可用的东西 / Available globals(实测)
		 *   require('react') 客户端模块没有全局 React,必须走 require。
		 *   document / window  可用(普通浏览器模块),本文件只用来挂 <style>。
		 * ========================================================================== */

		/** 覆盖层的 source 标识。同一 source 重复覆盖会替换整层 —— 这里只注册一次。 */
		const OVERRIDE_SOURCE = 'dsh-azure-maid-skin'

		/** 皮肤标识:设置项 id、<style> 标记、首绘样式表的互斥标记都复用它。 */
		const SKIN_ID = 'dsh-azure-maid-skin'

		/** 展示名。 */
		const THEME_NAME = '蓝瓷女仆 · Azure Maid'

		/** 一句话说明,出现在设置页副标题。 */
		const TAGLINE = '深蓝发色主调 · 蕾丝冷白提亮 · 青宝石点缀'

		/** 本半边接管后写在 <html> 上的标记,用来停用 Host 的首绘样式表。 */
		const CLIENT_MARKER = 'data-dsh-azure-maid-client'

		/** 允许的三种外观偏好 —— 与主题服务 THEME_PREFERENCES 一致。 */
		const MODES = ['light', 'dark', 'system']

		/** 模式的中文名(仅本面板使用,不参与 DSH 的本地化体系)。 */
		const MODE_LABEL = { light: '亮色', dark: '暗色', system: '跟随系统' }

		/** 覆盖层数据源:构建时由 scripts/build-client.mjs 内联(源自 theme/palette.mjs)。 */
		const TOKENS = {
		  light: {
		    '--dsw-alias-bg-base': '#F4F7FE',
		    '--dsw-alias-bg-layer-1': '#FFFFFF',
		    '--dsw-alias-bg-layer-2': '#E9EFFB',
		    '--dsw-alias-bg-layer-3': '#FFFFFF',
		    '--dsw-alias-bg-module-platform': '#EDF2FC',
		    '--dsw-alias-bg-multi-select': '#EDF2FC',
		    '--dsw-alias-bg-overlay': '#DEE7F8',
		    '--dsw-alias-bg-skeleton': '#0000000A',
		    '--dsw-alias-bg-mask-1': '#0000003D',
		    '--dsw-alias-bg-mask-2': '#0000001F',
		    '--dsw-alias-bg-mask-3': '#0000007A',
		    '--dsw-alias-bg-mask-photo': '#000000E0',
		    '--dsw-alias-bg-mask-drop': '#FFFFFFB3',
		    '--dsw-alias-border-l1': '#2A35680F',
		    '--dsw-alias-border-l2': '#2A356826',
		    '--dsw-alias-border-l2-darkmode-thin': '#2A35681F',
		    '--dsw-alias-border-l3': '#2A356833',
		    '--dsw-alias-border-l4': '#2A356840',
		    '--dsw-alias-border-inverted': '#00000000',
		    '--dsw-alias-border-inverted2': '#00000000',
		    '--dsw-alias-label-primary': '#141C36',
		    '--dsw-alias-label-primary-bluish': '#1E2A52',
		    '--dsw-alias-label-primary-dimmed': '#101731',
		    '--dsw-alias-label-primary-foreground': '#FFFFFF',
		    '--dsw-alias-label-primary-inverted': '#FFFFFF',
		    '--dsw-alias-label-secondary': '#3F4B78',
		    '--dsw-alias-label-tertiary': '#5A648F',
		    '--dsw-alias-label-caption': '#767FA6',
		    '--dsw-alias-label-dimmed': '#C3CFE8',
		    '--dsw-alias-brand-primary': '#3A4A8C',
		    '--dsw-alias-brand-primary-invert': '#141C36',
		    '--dsw-alias-brand-primary-new-colorprimary-new-color': '#276C9F',
		    '--dsw-alias-brand-text': '#141C36',
		    '--dsw-alias-link': '#2F6FB0',
		    '--dsw-alias-button-primary-fill': '#3A4A8C',
		    '--dsw-alias-button-primary-hover': '#4A5BA6',
		    '--dsw-alias-button-primary-dimmed': '#D6E3F8',
		    '--dsw-alias-button-contrast-fill': '#3F4B78',
		    '--dsw-alias-button-elevated-fill': '#FFFFFF',
		    '--dsw-alias-button-floating-fill': '#FFFFFF',
		    '--dsw-alias-button-floating-hover': '#F4F7FE',
		    '--dsw-alias-button-ghost-active-fill': '#D2DFF6',
		    '--dsw-alias-button-ghost-active-border': '#4A5BA6',
		    '--dsw-alias-button-ghost-active-hover': '#BDD1F2',
		    '--dsw-alias-button-info-fill': '#276C9F',
		    '--dsw-alias-button-info-hover': '#2F6FB0',
		    '--dsw-alias-button-tool-bar-fill': '#54555780',
		    '--dsw-alias-button-tool-bar-fill-invisible': '#1F1F1F5C',
		    '--dsw-alias-button-tool-bar-hover': '#54555799',
		    '--dsw-alias-interactive-bg-hover': '#2432560F',
		    '--dsw-alias-interactive-bg-hover-solid': '#F4F7FE',
		    '--dsw-alias-interactive-bg-hover-accent': '#276C9F24',
		    '--dsw-alias-interactive-bg-hover-danger': '#E0416A12',
		    '--dsw-alias-interactive-bg-active': '#24325626',
		    '--dsw-alias-state-business-primary': '#276C9F',
		    '--dsw-alias-state-business-tertiary': '#D6E3F8',
		    '--dsw-alias-state-success-primary': '#1A7B61',
		    '--dsw-alias-state-success-secondary': '#1A7B61',
		    '--dsw-alias-state-success-tertiary': '#DEF4EA',
		    '--dsw-alias-state-warn-primary': '#936511',
		    '--dsw-alias-state-warn-secondary': '#936511',
		    '--dsw-alias-state-warn-tertiary': '#FBF0D8',
		    '--dsw-alias-state-warn-label': '#8A5E0E',
		    '--dsw-alias-state-error-primary': '#B83551',
		    '--dsw-alias-state-error-secondary': '#B83551',
		    '--dsw-alias-markdown-code-block': '#EDF2FC',
		    '--dsw-alias-markdown-code-block-banner': '#DCE6F9',
		    '--dsw-alias-markdown-code-segment-selected': '#FFFFFF',
		    '--dsw-alias-markdown-code-segment-unselected': '#E9EFFB',
		    '--dsw-alias-markdown-inline-code': '#E4EBF9',
		    '--dsw-alias-markdown-placeholder': '#E9EFFB',
		    '--dsw-alias-markdown-tag': '#DFE8F8',
		    '--dsw-alias-markdown-citation': '#DCE6F8',
		    '--dsw-alias-scrollbar-bg-l1': '#DFE7F6',
		    '--dsw-alias-scrollbar-bg-l2': '#DFE7F6',
		    '--dsw-alias-scrollbar-hover-l1': '#C3CFE8',
		    '--dsw-alias-scrollbar-hover-l2': '#A6B6DC',
		    '--dsw-alias-toast-bg': '#1B2444',
		    '--dsw-alias-tooltip-bg': '#1B2444',
		    '--dsw-specific-bubble': '#EAF0FC',
		    '--dsw-specific-bubble-highlight': '#CEDDF6',
		    '--dsw-specific-input-major': '#FFFFFF',
		    '--dsw-specific-login-input': '#F4F7FE',
		    '--dsw-specific-menu': '#FFFFFF',
		    '--dsw-specific-selector': '#EDF2FC',
		    '--dsw-specific-sidebar-fill': '#E7EEFA',
		    '--dsw-specific-sidebar-nav-item-hover': '#F4F7FE',
		    '--dsw-specific-sidebar-nav-item-active': '#D2DFF6',
		    '--dsw-specific-sidebar-nav-item-active-accent': '#BDD1F2',
		    '--dsw-specific-tip': '#EDF2FC',
		  },
		  dark: {
		    '--dsw-alias-bg-base': '#0A1024',
		    '--dsw-alias-bg-layer-1': '#151E42',
		    '--dsw-alias-bg-layer-2': '#1D2750',
		    '--dsw-alias-bg-layer-3': '#1D2750',
		    '--dsw-alias-bg-module-platform': '#1B2549',
		    '--dsw-alias-bg-multi-select': '#1B2549',
		    '--dsw-alias-bg-overlay': '#2E3C74',
		    '--dsw-alias-bg-skeleton': '#FFFFFF14',
		    '--dsw-alias-bg-mask-1': '#00000080',
		    '--dsw-alias-bg-mask-2': '#00000033',
		    '--dsw-alias-bg-mask-3': '#0000007A',
		    '--dsw-alias-bg-mask-photo': '#000000E0',
		    '--dsw-alias-bg-mask-drop': '#272730B3',
		    '--dsw-alias-border-l1': '#FFFFFF0F',
		    '--dsw-alias-border-l2': '#FFFFFF1F',
		    '--dsw-alias-border-l2-darkmode-thin': '#FFFFFF0F',
		    '--dsw-alias-border-l3': '#FFFFFF29',
		    '--dsw-alias-border-l4': '#FFFFFF33',
		    '--dsw-alias-border-inverted': '#FFFFFF0F',
		    '--dsw-alias-border-inverted2': '#FFFFFF14',
		    '--dsw-alias-label-primary': '#E8EEFB',
		    '--dsw-alias-label-primary-bluish': '#E8EEFB',
		    '--dsw-alias-label-primary-dimmed': '#E8EEFB',
		    '--dsw-alias-label-primary-foreground': '#0A1024',
		    '--dsw-alias-label-primary-inverted': '#1D2750',
		    '--dsw-alias-label-secondary': '#A9B7E0',
		    '--dsw-alias-label-tertiary': '#8A9AD8',
		    '--dsw-alias-label-caption': '#6E7CB4',
		    '--dsw-alias-label-dimmed': '#2E3C74',
		    '--dsw-alias-brand-primary': '#8A9AD8',
		    '--dsw-alias-brand-primary-invert': '#E8EEFB',
		    '--dsw-alias-brand-primary-new-colorprimary-new-color': '#7FC0E8',
		    '--dsw-alias-brand-text': '#E8EEFB',
		    '--dsw-alias-link': '#8FBEF0',
		    '--dsw-alias-button-primary-fill': '#8A9AD8',
		    '--dsw-alias-button-primary-hover': '#B9C5EC',
		    '--dsw-alias-button-primary-dimmed': '#27336A',
		    '--dsw-alias-button-contrast-fill': '#E8EEFB',
		    '--dsw-alias-button-elevated-fill': '#2E3C74',
		    '--dsw-alias-button-floating-fill': '#1B2549',
		    '--dsw-alias-button-floating-hover': '#1D2750',
		    '--dsw-alias-button-ghost-active-fill': '#2E3C74',
		    '--dsw-alias-button-ghost-active-border': '#2E3C74',
		    '--dsw-alias-button-ghost-active-hover': '#B9C5EC',
		    '--dsw-alias-button-info-fill': '#7FC0E8',
		    '--dsw-alias-button-info-hover': '#8FBEF0',
		    '--dsw-alias-button-tool-bar-fill': '#54555780',
		    '--dsw-alias-button-tool-bar-fill-invisible': '#1F1F1F5C',
		    '--dsw-alias-button-tool-bar-hover': '#54555799',
		    '--dsw-alias-interactive-bg-hover': '#FFFFFF14',
		    '--dsw-alias-interactive-bg-hover-solid': '#1B2549',
		    '--dsw-alias-interactive-bg-hover-accent': '#FFFFFF3D',
		    '--dsw-alias-interactive-bg-hover-danger': '#F25A5A26',
		    '--dsw-alias-interactive-bg-active': '#FFFFFF24',
		    '--dsw-alias-state-business-primary': '#8A9AD8',
		    '--dsw-alias-state-business-tertiary': '#2E3C74',
		    '--dsw-alias-state-success-primary': '#5FD6B4',
		    '--dsw-alias-state-success-secondary': '#5FD6B4',
		    '--dsw-alias-state-success-tertiary': '#173A44',
		    '--dsw-alias-state-warn-primary': '#F0C168',
		    '--dsw-alias-state-warn-secondary': '#F0C168',
		    '--dsw-alias-state-warn-tertiary': '#33294A',
		    '--dsw-alias-state-warn-label': '#F2A9BE',
		    '--dsw-alias-state-error-primary': '#FF8598',
		    '--dsw-alias-state-error-secondary': '#FF8598',
		    '--dsw-alias-markdown-code-block': '#161F42',
		    '--dsw-alias-markdown-code-block-banner': '#27336A',
		    '--dsw-alias-markdown-code-segment-selected': '#27336A',
		    '--dsw-alias-markdown-code-segment-unselected': '#161F42',
		    '--dsw-alias-markdown-inline-code': '#1B2549',
		    '--dsw-alias-markdown-placeholder': '#1D2750',
		    '--dsw-alias-markdown-tag': '#1B2549',
		    '--dsw-alias-markdown-citation': '#2E3C74',
		    '--dsw-alias-scrollbar-bg-l1': '#27336A',
		    '--dsw-alias-scrollbar-bg-l2': '#27336A',
		    '--dsw-alias-scrollbar-hover-l1': '#3A4A8C',
		    '--dsw-alias-scrollbar-hover-l2': '#4A5BA6',
		    '--dsw-alias-toast-bg': '#C6D2EE',
		    '--dsw-alias-tooltip-bg': '#C6D2EE',
		    '--dsw-specific-bubble': '#1B2549',
		    '--dsw-specific-bubble-highlight': '#27336A',
		    '--dsw-specific-input-major': '#1B2549',
		    '--dsw-specific-login-input': '#0A1024',
		    '--dsw-specific-menu': '#1D2750',
		    '--dsw-specific-selector': '#1D2750',
		    '--dsw-specific-sidebar-fill': '#0D1430',
		    '--dsw-specific-sidebar-nav-item-hover': '#1B2549',
		    '--dsw-specific-sidebar-nav-item-active': '#2A366B',
		    '--dsw-specific-sidebar-nav-item-active-accent': '#43549B',
		    '--dsw-specific-tip': '#1B2549',
		  },
		}

		const React = require('react')

		/**
		 * 把 { light, dark } 两套平表转成 overrideTokens 要的
		 * `{ [token]: { light, dark } }` 形状。
		 * 两个表的 token 名在构建时已被断言完全一致,这里不再做运行时校验。
		 */
		function toOverrideLayer() {
		  const layer = {}
		  for (const name of Object.keys(TOKENS.light)) {
		    layer[name] = { light: TOKENS.light[name], dark: TOKENS.dark[name] }
		  }
		  return layer
		}

		/** 读取当前偏好,拿不到主题服务时返回 null。 */
		function readPreference(ctx) {
		  const theme = ctx.get('theme')
		  if (theme === undefined) return null
		  const snapshot = theme.getTheme()
		  const preference = snapshot && snapshot.preference
		  return typeof preference === 'string' ? preference : null
		}

		/** 系统当前是否为暗色。用于「跟随系统」的说明文字,不参与取色。 */
		function systemPrefersDark() {
		  try {
		    return window.matchMedia('(prefers-color-scheme: dark)').matches === true
		  } catch (err) {
		    return false
		  }
		}

		/**
		 * 标记"客户端已接管"。
		 *
		 * 这一步在**模块加载时**执行,而不是在 apply() 里:模块脚本早于插件树激活,
		 * 所以首绘样式表(见 lib/styles/azure-maid.css 的自停用规则)会尽快让位,
		 * 不会出现"两份同样的 token 同时存在"的窗口。
		 *
		 * 只写一个属性,不做任何 DOM 查询 —— 首绘样式表靠 CSS 自己判断该不该让位,
		 * 因此这里不需要去找它的 <link>。写在 try 里是因为这一步失败也不该
		 * 影响配色本身(行内样式始终优先于样式表)。
		 */
		function markClientActive() {
		  try {
		    document.documentElement.setAttribute(CLIENT_MARKER, '')
		  } catch (err) {
		    // 拿不到 document 时忽略 —— 配色不依赖这个标记。
		  }
		}

		/** 设置页里的一个小按钮。 */
		function ModeButton(props) {
		  const active = props.active
		  return React.createElement(
		    'button',
		    {
		      type: 'button',
		      'aria-pressed': active,
		      onClick: props.onClick,
		      style: {
		        flex: 'none',
		        font: 'inherit',
		        fontSize: 13,
		        lineHeight: 1,
		        padding: '10px 16px',
		        borderRadius: 10,
		        cursor: 'pointer',
		        transition: 'background 120ms ease, border-color 120ms ease',
		        border: '1px solid ' + (active ? 'var(--dsw-alias-brand-primary)' : 'var(--dsw-alias-border-l2)'),
		        background: active ? 'var(--dsw-alias-brand-primary)' : 'var(--dsw-alias-bg-layer-1)',
		        color: active ? 'var(--dsw-alias-label-primary-foreground)' : 'var(--dsw-alias-label-primary)',
		      },
		    },
		    props.label,
		  )
		}

		/** 色板:把本主题实际生效的几个槽位摆出来,切模式时能一眼看出差别。 */
		function Swatches() {
		  const items = [
		    ['画布', '--dsw-alias-bg-base'],
		    ['卡片', '--dsw-alias-bg-layer-1'],
		    ['次级面', '--dsw-alias-bg-layer-2'],
		    ['侧栏', '--dsw-specific-sidebar-fill'],
		    ['输入框', '--dsw-specific-input-major'],
		    ['气泡', '--dsw-specific-bubble'],
		    ['代码块', '--dsw-alias-markdown-code-block'],
		    ['品牌', '--dsw-alias-brand-primary'],
		    ['链接', '--dsw-alias-link'],
		    ['正文', '--dsw-alias-label-primary'],
		    ['次文字', '--dsw-alias-label-secondary'],
		    ['青宝石', '--dsw-alias-state-business-primary'],
		    ['成功', '--dsw-alias-state-success-primary'],
		    ['警告', '--dsw-alias-state-warn-primary'],
		    ['错误', '--dsw-alias-state-error-primary'],
		    ['描边', '--dsw-alias-border-l3'],
		  ]

		  const children = items.map((item) =>
		    React.createElement(
		      'div',
		      {
		        key: item[1],
		        style: {
		          display: 'flex',
		          alignItems: 'center',
		          gap: 8,
		          padding: '6px 8px',
		          borderRadius: 8,
		          border: '1px solid var(--dsw-alias-border-l2)',
		          background: 'var(--dsw-alias-bg-layer-1)',
		          minWidth: 0,
		        },
		      },
		      React.createElement('span', {
		        style: {
		          flex: 'none',
		          width: 24,
		          height: 24,
		          borderRadius: 7,
		          border: '1px solid var(--dsw-alias-border-l3)',
		          background: 'var(' + item[1] + ')',
		        },
		      }),
		      React.createElement(
		        'span',
		        { style: { fontSize: 11.5, color: 'var(--dsw-alias-label-secondary)', whiteSpace: 'nowrap' } },
		        item[0],
		      ),
		    ),
		  )

		  return React.createElement(
		    'div',
		    { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(122px, 1fr))', gap: 8 } },
		    children,
		  )
		}

		/** 设置页主体。 */
		function Panel(props) {
		  const ctx = props.ctx

		  const store = React.useState(() => {
		    const preference = readPreference(ctx)
		    return { preference: preference === null ? 'system' : preference, systemDark: systemPrefersDark() }
		  })
		  const state = store[0]
		  const setState = store[1]

		  React.useEffect(() => {
		    const theme = ctx.get('theme')
		    if (theme === undefined) return undefined
		    const sync = () => {
		      setState({
		        preference: theme.getTheme().preference,
		        systemDark: systemPrefersDark(),
		      })
		    }
		    sync()
		    // 偏好被别处改动(外观方块)、系统色翻转,都会走到这里。
		    return ctx.on('theme/change', sync)
		  }, [])

		  const choose = (mode) => {
		    const theme = ctx.get('theme')
		    if (theme === undefined) return
		    theme.setTheme(mode)
		  }

		  const isOurs = MODES.indexOf(state.preference) !== -1
		  const resolved = state.preference === 'system' ? (state.systemDark ? 'dark' : 'light') : state.preference

		  const caption = !isOurs
		    ? '当前偏好是「' + state.preference + '」——本皮肤的配色依然生效,但它只覆盖语义 token。'
		    : state.preference === 'system'
		      ? '跟随系统,当前系统为' + (state.systemDark ? '暗色' : '亮色') + '。系统切换时配色自动跟随。'
		      : '固定为' + MODE_LABEL[state.preference] + '。'

		  return React.createElement(
		    'section',
		    {
		      style: {
		        border: '1px solid var(--dsw-alias-border-l1)',
		        background: 'var(--dsw-alias-bg-layer-1)',
		        borderRadius: 14,
		        padding: '16px 17px',
		        display: 'flex',
		        flexDirection: 'column',
		        gap: 14,
		      },
		    },
		    React.createElement(
		      'div',
		      { style: { display: 'flex', flexDirection: 'column', gap: 4 } },
		      React.createElement(
		        'h4',
		        { style: { margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--dsw-alias-label-primary)' } },
		        THEME_NAME,
		      ),
		      React.createElement(
		        'div',
		        { style: { fontSize: 12.5, lineHeight: 1.6, color: 'var(--dsw-alias-label-secondary)' } },
		        TAGLINE,
		      ),
		    ),
		    React.createElement(
		      'div',
		      { style: { display: 'flex', flexWrap: 'wrap', gap: 8 } },
		      MODES.map((mode) =>
		        React.createElement(ModeButton, {
		          key: mode,
		          label: MODE_LABEL[mode],
		          active: state.preference === mode,
		          onClick: () => {
		            choose(mode)
		          },
		        }),
		      ),
		    ),
		    React.createElement(
		      'div',
		      { style: { fontSize: 12.5, lineHeight: 1.6, color: 'var(--dsw-alias-label-secondary)' } },
		      caption + '　生效档位:' + MODE_LABEL[resolved] + '。',
		    ),
		    React.createElement(Swatches, null),
		    React.createElement(
		      'div',
		      {
		        style: {
		          background: 'var(--dsw-alias-markdown-code-block)',
		          border: '1px solid var(--dsw-alias-border-l2)',
		          borderRadius: 9,
		          padding: '9px 11px',
		          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
		          fontSize: 11.5,
		          lineHeight: 1.7,
		          color: 'var(--dsw-alias-label-primary)',
		        },
		      },
		      React.createElement('div', null, 'npm run build   // 代码块样例'),
		      React.createElement('div', { style: { color: 'var(--dsw-alias-label-tertiary)' } }, '// 90 个语义 token · 亮暗两档'),
		    ),
		  )
		}

		return {
		  // theme 是**硬依赖**,而不是"取不到就悄悄不干活"。
		  //
		  // 之前写成 ctx.get('theme') + 取不到就早返回,有一个不易察觉的坑:
		  // 如果 apply() 执行的那一刻主题服务还没挂上,这个 effect 会注册成空操作,
		  // **之后再也不会重试** —— 页面看起来"皮肤装了但切深浅没反应",而且没有任何
		  // 报错。声明 inject 之后,Cordis 会把插件挂起等待主题服务出现,补齐后再激活,
		  // 从根本上消除这个时序窗口。
		  //
		  // 代价:主题服务永远不出现时,设置页也不会注册 —— 这是有意的 fail-loud,
		  // 因为一个不控制配色的皮肤页没有意义。
		  inject: ['theme'],

		  apply(ctx) {
		    // ── 1. 配色:一行覆盖层,三种偏好通吃 ──────────────────────────────────
		    ctx.effect(() => {
		      const theme = ctx.get('theme')
		      if (theme === undefined) {
		        // 有了 inject 之后正常不会走到这里;真走到了就是宿主有问题,
		        // 明确报出来,而不是静默失效。
		        console.error('[azure-maid-skin] 主题服务不可用,配色未应用')
		        return () => {}
		      }
		      const dispose = theme.overrideTokens(OVERRIDE_SOURCE, toOverrideLayer())
		      return () => {
		        try {
		          dispose()
		        } catch (err) {
		          // 主题服务已卸载时 disposer 可能已经失效,忽略即可。
		        }
		      }
		    })

		    // ── 2. 交互:设置 → 蓝瓷女仆 ───────────────────────────────────────────
		    const slots = ctx.get('slots')
		    if (slots === undefined) return

		    const Section = () => React.createElement(Panel, { ctx: ctx })
		    slots.inject('settings.section', () =>
		      slots.register(
		        { name: 'settings.section', id: SKIN_ID, order: 40, label: THEME_NAME },
		        Section,
		      ),
		    )
		  },
		}

		/* ── 模块级副作用:标记"客户端已接管" ────────────────────────────────────────
		 * 放在这里而不是 apply() 里,是为了让首绘样式表尽早让位 —— 模块加载早于插件树
		 * 激活。这一步只写一个属性,不注册任何需要在卸载时归还的东西。 */
		markClientActive()

  },
})
