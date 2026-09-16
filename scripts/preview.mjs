/**
 * preview —— 生成自包含的可视预览页
 * ============================================================================
 * 产物:preview/index.html —— 双击即可打开,不需要 DSH、不需要联网、不需要构建。
 *
 * 它把**真实生效的那 90 个 token** 摆进一个仿 DSH 的界面骨架里(侧栏 / 会话区 /
 * 代码块 / 输入框 / 工具调用 / 设置行),让你在看配色时看到的是"这些颜色放在一起
 * 是什么样",而不是一排孤立的色块。
 *
 * 三个模式按钮的行为与插件一致:
 *   亮色   = body 无 dark 属性
 *   暗色   = body 带 data-ds-dark-theme
 *   跟随系统 = 由 prefers-color-scheme 决定
 * 实现方式和真实样式表同构(亮色裸 body、暗色在媒体查询里、外加
 * body[data-ds-dark-theme] 分支),所以预览里的观感 == 装上后的观感。
 *
 * 用法:node scripts/preview.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { C } from '../theme/palette.mjs'
import { buildTokenSets, ROLE_MAP } from '../theme/tokens.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUTPUT = path.join(ROOT, 'preview', 'index.html')
const PACKAGE_NAME = 'dsh-azure-maid-skin'

const { light: LIGHT, dark: DARK } = buildTokenSets(C)

/** 把一套 token 渲染成 CSS 自定义属性声明。 */
function declarations(set, indent = '      ') {
  return Object.entries(set)
    .map(([token, value]) => `${indent}${token}: ${value};`)
    .join('\n')
}

const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>蓝瓷女仆 · Azure Maid —— 配色预览</title>
<!--
  本文件由 scripts/preview.mjs 生成,请勿手工编辑。
  改配色请改 theme/palette.mjs 后运行:node scripts/preview.mjs
-->
<style>
/* ============================================================================
 * 第一段:本主题的 90 个语义 token —— 与 lib/styles/azure-maid.css 完全同构。
 * 因此预览页里的颜色就是装上插件后的颜色,不是"另画一份示意图"。
 * ========================================================================= */
body {
${declarations(LIGHT, '  ')}
}
@media (prefers-color-scheme: dark) {
  body:not([data-ds-theme="light"]) {
${declarations(DARK, '    ')}
  }
}
body[data-ds-theme="dark"] {
${declarations(DARK, '  ')}
}

/* ============================================================================
 * 第二段:平台层占位 —— 真实 DSH 里这些值由设计基线提供,预览页用一个中性的
 * 合成基线顶上,好让 --dsw-* 的取值能被看清。这一层**不属于本插件**。
 * ========================================================================= */
body {
  --demo-radius: 10px;
  --demo-font: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  margin: 0;
  font-family: var(--demo-font);
  background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary);
  font-size: 14px;
  line-height: 22px;
  transition: background 180ms ease, color 180ms ease;
}
* { box-sizing: border-box; }
.app { display: flex; height: 100vh; overflow: hidden; }

/* 侧栏 */
.sidebar {
  width: 244px; flex: none; display: flex; flex-direction: column;
  background: var(--dsw-specific-sidebar-fill);
  border-right: 0.5px solid var(--dsw-alias-border-l2);
}
.brand { padding: 16px 16px 12px; display: flex; align-items: center; gap: 10px; }
.logo {
  width: 26px; height: 26px; border-radius: 8px; flex: none;
  background: var(--dsw-alias-brand-primary);
  display: grid; place-items: center; color: var(--dsw-alias-label-primary-foreground);
  font-size: 13px; font-weight: 700;
}
.brand b { font-weight: 600; font-size: 14px; }
.nav { padding: 6px 10px; display: flex; flex-direction: column; gap: 2px; }
.nav-item {
  display: flex; align-items: center; gap: 9px; padding: 8px 10px;
  border-radius: 8px; color: var(--dsw-alias-label-secondary); cursor: default;
}
.nav-item:hover { background: var(--dsw-specific-sidebar-nav-item-hover); }
.nav-item.active {
  background: var(--dsw-specific-sidebar-nav-item-active);
  color: var(--dsw-alias-label-primary);
}
.nav-item.active .dot { background: var(--dsw-specific-sidebar-nav-item-active-accent); }
.dot { width: 6px; height: 6px; border-radius: 50%; background: var(--dsw-alias-label-tertiary); flex: none; }
.sidebar-foot { margin-top: auto; padding: 12px; border-top: 0.5px solid var(--dsw-alias-border-l2); }

/* 主区 */
.main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.topbar {
  height: 48px; flex: none; display: flex; align-items: center; gap: 12px;
  padding: 0 16px; border-bottom: 0.5px solid var(--dsw-alias-border-l2);
}
.topbar .title { font-weight: 500; }
.spacer { flex: 1; }
.thread { flex: 1; overflow-y: auto; padding: 20px 24px 8px; display: flex; flex-direction: column; gap: 16px; }
.msg { display: flex; gap: 10px; max-width: 780px; }
.avatar {
  width: 26px; height: 26px; border-radius: 50%; flex: none;
  display: grid; place-items: center; font-size: 11px; font-weight: 600;
  background: var(--dsw-alias-brand-primary); color: var(--dsw-alias-label-primary-foreground);
}
.avatar.user { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
.bubble {
  background: var(--dsw-alias-bg-layer-1); border: 0.5px solid var(--dsw-alias-border-l2);
  border-radius: var(--demo-radius); padding: 10px 13px; min-width: 0;
}
.msg.user .bubble { background: var(--dsw-specific-bubble); border-color: transparent; }
.bubble p { margin: 0 0 8px; }
.bubble p:last-child { margin-bottom: 0; }
code.inline {
  background: var(--dsw-alias-markdown-inline-code); border-radius: 5px;
  padding: 1px 5px; font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 12.5px;
}
pre {
  margin: 8px 0 0; background: var(--dsw-alias-markdown-code-block);
  border: 0.5px solid var(--dsw-alias-border-l2); border-radius: 8px;
  overflow: hidden;
}
pre .bar {
  display: flex; align-items: center; gap: 8px; padding: 6px 10px;
  background: var(--dsw-alias-markdown-code-block-banner);
  color: var(--dsw-alias-label-secondary); font-size: 11.5px;
}
pre code {
  display: block; padding: 10px; font-family: ui-monospace, Menlo, Consolas, monospace;
  font-size: 11.5px; line-height: 19px; color: var(--dsw-alias-label-primary);
  white-space: pre-wrap;
}
.tool {
  border: 0.5px solid var(--dsw-alias-border-l2); border-radius: 8px;
  padding: 8px 11px; background: var(--dsw-alias-bg-layer-2);
  font-size: 12.5px; color: var(--dsw-alias-label-secondary);
  display: flex; align-items: center; gap: 8px;
}
.pill { border-radius: 999px; padding: 2px 9px; font-size: 11.5px; }
.pill.ok { background: var(--dsw-alias-state-success-tertiary); color: var(--dsw-alias-state-success-primary); }
.pill.warn { background: var(--dsw-alias-state-warn-tertiary); color: var(--dsw-alias-state-warn-label); }
.pill.err { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-state-error-primary); }

/* 输入区 */
.composer { padding: 10px 24px 18px; }
.composer-inner {
  border: 0.5px solid var(--dsw-alias-border-l3); border-radius: 14px;
  background: var(--dsw-specific-input-major); padding: 11px 13px;
  display: flex; align-items: center; gap: 10px;
}
.composer-inner .ph { color: var(--dsw-alias-label-caption); flex: 1; }
.send {
  width: 28px; height: 28px; border-radius: 50%; flex: none; border: 0;
  background: var(--dsw-alias-button-primary-fill); color: var(--dsw-alias-label-primary-foreground);
  cursor: pointer; font-size: 13px;
}

/* 右侧面板:控制 + 色板 + 对比度表 */
.panel {
  width: 372px; flex: none; border-left: 0.5px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-layer-1); overflow-y: auto; padding: 16px;
  display: flex; flex-direction: column; gap: 14px;
}
.panel h2 { margin: 0; font-size: 15px; font-weight: 600; }
.panel .sub { color: var(--dsw-alias-label-secondary); font-size: 12.5px; }
.modes { display: flex; gap: 8px; }
.mode {
  flex: 1; padding: 9px 0; border-radius: 9px; cursor: pointer; font: inherit; font-size: 13px;
  border: 0.5px solid var(--dsw-alias-border-l3); background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-primary);
}
.mode[aria-pressed="true"] {
  background: var(--dsw-alias-brand-primary); color: var(--dsw-alias-label-primary-foreground);
  border-color: var(--dsw-alias-brand-primary);
}
.card {
  border: 0.5px solid var(--dsw-alias-border-l2); border-radius: 12px;
  background: var(--dsw-alias-bg-layer-2); padding: 12px;
}
.card h3 { margin: 0 0 9px; font-size: 12.5px; font-weight: 600; color: var(--dsw-alias-label-secondary); }
.swatches { display: grid; grid-template-columns: repeat(auto-fill, minmax(112px, 1fr)); gap: 7px; }
.sw { display: flex; align-items: center; gap: 8px; min-width: 0; }
.sw i {
  width: 22px; height: 22px; border-radius: 6px; flex: none;
  border: 0.5px solid var(--dsw-alias-border-l3); display: block;
}
.sw span { font-size: 11px; color: var(--dsw-alias-label-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
th, td { text-align: left; padding: 3px 4px; border-bottom: 0.5px solid var(--dsw-alias-border-l1); }
th { color: var(--dsw-alias-label-caption); font-weight: 500; }
td.num { text-align: right; font-variant-numeric: tabular-nums; color: var(--dsw-alias-label-secondary); }
.pass { color: var(--dsw-alias-state-success-primary); }
.fail { color: var(--dsw-alias-state-error-primary); }
.note { font-size: 11.5px; color: var(--dsw-alias-label-tertiary); line-height: 1.6; }
.tokens { max-height: 230px; overflow: auto; font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 10.5px; }
.tokens div { display: flex; gap: 8px; padding: 2px 0; }
.tokens b { flex: none; width: 10px; height: 10px; border-radius: 3px; margin-top: 3px; border: 0.5px solid var(--dsw-alias-border-l3); }
.tokens span { color: var(--dsw-alias-label-tertiary); }
.tokens em { color: var(--dsw-alias-label-secondary); font-style: normal; }
</style>
</head>
<body data-ds-theme="light">
<div class="app">
  <aside class="sidebar">
    <div class="brand"><div class="logo">A</div><b>蓝瓷女仆</b></div>
    <nav class="nav">
      <div class="nav-item active"><i class="dot"></i>新会话</div>
      <div class="nav-item"><i class="dot"></i>工作区文件</div>
      <div class="nav-item"><i class="dot"></i>插件</div>
      <div class="nav-item"><i class="dot"></i>设置</div>
    </nav>
    <div class="sidebar-foot">
      <div class="nav-item"><i class="dot"></i>外观:见右侧</div>
    </div>
  </aside>

  <main class="main">
    <header class="topbar">
      <span class="title">配色预览 · Azure Maid</span>
      <span class="pill ok">已启用</span>
      <span class="spacer"></span>
      <span class="pill warn">警告色样例</span>
      <span class="pill err">错误色样例</span>
    </header>

    <div class="thread">
      <div class="msg user">
        <div class="avatar user">你</div>
        <div class="bubble"><p>把这个项目的主题换成蓝发女仆那套配色,亮暗都要,还要能跟随系统。</p></div>
      </div>

      <div class="msg">
        <div class="avatar">A</div>
        <div class="bubble">
          <p>已按参考图的色域改好:发色做品牌与强调,蕾丝冷白做正文,发影做正文深色,青宝石做交互色。下面是一段行内代码 <code class="inline">theme.overrideTokens()</code> 与代码块样例。</p>
          <div class="tool" style="margin-top:8px">
            <span class="pill ok">完成</span>
            <span>bun run build —— 90 个语义 token × 亮暗两档</span>
          </div>
          <pre><span class="bar">scripts/build-tokens.mjs</span><code>const { light, dark } = buildTokenSets(palette)
// 同一层覆盖同时供亮色 / 暗色 / 跟随系统使用
theme.overrideTokens('dsh-azure-maid-skin', layer)</code></pre>
        </div>
      </div>

      <div class="msg">
        <div class="avatar">A</div>
        <div class="bubble">
          <p>次要文字与说明文字:这一段用 <b>--dsw-alias-label-secondary</b> 与 <b>--dsw-alias-label-tertiary</b>,链接样式见 <a href="#" style="color:var(--dsw-alias-link)">这一条链接</a>。</p>
        </div>
      </div>
    </div>

    <div class="composer">
      <div class="composer-inner">
        <span class="ph">给 DeepSeek Harness 发消息…</span>
        <button class="send" type="button">↑</button>
      </div>
    </div>
  </main>

  <aside class="panel">
    <div>
      <h2>蓝瓷女仆 · Azure Maid</h2>
      <div class="sub">深蓝发色主调 · 蕾丝冷白提亮 · 青宝石点缀</div>
    </div>
    <div class="modes">
      <button class="mode" type="button" data-mode="light">亮色</button>
      <button class="mode" type="button" data-mode="dark">暗色</button>
      <button class="mode" type="button" data-mode="system">跟随系统</button>
    </div>
    <div class="note" id="mode-note"></div>

    <div class="card">
      <h3>色板(实际生效值)</h3>
      <div class="swatches" id="swatches"></div>
    </div>

    <div class="card">
      <h3>对比度自检(WCAG)</h3>
      <table><thead><tr><th>组合</th><th style="text-align:right">对比度</th></tr></thead>
      <tbody id="contrast"></tbody></table>
      <div class="note" id="contrast-note" style="margin-top:8px"></div>
    </div>

    <div class="card">
      <h3>全部 90 个语义 token</h3>
      <div class="tokens" id="alltokens"></div>
    </div>
  </aside>
</div>

<script>
// ── 两种模式各自的 token 表(由构建器注入)────────────────────────────────
var LIGHT = ${JSON.stringify(LIGHT, null, 1)};
var DARK = ${JSON.stringify(DARK, null, 1)};

var SWATCHES = [
  ['画布', '--dsw-alias-bg-base'],
  ['卡片', '--dsw-alias-bg-layer-1'],
  ['次级面', '--dsw-alias-bg-layer-2'],
  ['侧栏', '--dsw-specific-sidebar-fill'],
  ['输入框', '--dsw-specific-input-major'],
  ['气泡', '--dsw-specific-bubble'],
  ['对话框', '--dsw-alias-bg-overlay'],
  ['代码块', '--dsw-alias-markdown-code-block'],
  ['品牌', '--dsw-alias-brand-primary'],
  ['链接', '--dsw-alias-link'],
  ['强调', '--dsw-alias-state-business-primary'],
  ['正文', '--dsw-alias-label-primary'],
  ['次文字', '--dsw-alias-label-secondary'],
  ['三级文字', '--dsw-alias-label-tertiary'],
  ['成功', '--dsw-alias-state-success-primary'],
  ['警告', '--dsw-alias-state-warn-primary'],
  ['错误', '--dsw-alias-state-error-primary']
];

// ── 模式切换:与插件同构 ────────────────────────────────────────────────────
// 初始模式可被 ?mode=light|dark|system 覆盖 —— 截图脚本靠它拿到确定的结果,
// 不依赖浏览器是否支持"强制 prefers-color-scheme"这类开关。
var mode = (function () {
  var found = /[?&]mode=(light|dark|system)/.exec(window.location.search);
  return found ? found[1] : 'light';
})();
var media = window.matchMedia('(prefers-color-scheme: dark)');

function effectiveMode() {
  if (mode === 'system') return media.matches ? 'dark' : 'light';
  return mode;
}

function apply() {
  var dark = effectiveMode() === 'dark';
  document.body.setAttribute('data-ds-theme', dark ? 'dark' : 'light');
  for (var i = 0; i < document.querySelectorAll('.mode').length; i += 1) {
    document.querySelectorAll('.mode')[i].setAttribute('aria-pressed', String(document.querySelectorAll('.mode')[i].dataset.mode === mode));
  }
  document.getElementById('mode-note').textContent = mode === 'system'
    ? '跟随系统,当前系统为' + (dark ? '暗色' : '亮色') + '。系统切换时配色自动跟随。'
    : '固定为' + (mode === 'dark' ? '暗色' : '亮色') + '。';
  renderTables();
}
for (var b = 0; b < document.querySelectorAll('.mode').length; b += 1) {
  document.querySelectorAll('.mode')[b].addEventListener('click', function (event) {
    mode = event.currentTarget.dataset.mode;
    apply();
  });
}
if (media.addEventListener) media.addEventListener('change', function () { if (mode === 'system') apply(); });

// ── 色板 ────────────────────────────────────────────────────────────────────
document.getElementById('swatches').innerHTML = SWATCHES.map(function (item) {
  return '<div class="sw"><i style="background:var(' + item[1] + ')"></i><span>' + item[0] + '</span></div>';
}).join('');

// ── 全套 token ─────────────────────────────────────────────────────────────
function renderTokens() {
  var set = effectiveMode() === 'dark' ? DARK : LIGHT;
  var names = Object.keys(set).sort();
  document.getElementById('alltokens').innerHTML = names.map(function (name) {
    return '<div><b style="background:' + set[name] + '"></b><em>' + name.replace('--dsw-', '') + '</em><span>' + set[name] + '</span></div>';
  }).join('');
}

// ── 对比度(与 scripts/check-contrast.mjs 同一套算法)──────────────────────
function parseHex(hex) {
  var v = hex.replace('#', '');
  return {
    r: parseInt(v.slice(0, 2), 16), g: parseInt(v.slice(2, 4), 16), b: parseInt(v.slice(4, 6), 16),
    a: v.length === 8 ? parseInt(v.slice(6, 8), 16) / 255 : 1
  };
}
function lum(c) {
  function ch(v) { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
  return 0.2126 * ch(c.r) + 0.7152 * ch(c.g) + 0.0722 * ch(c.b);
}
function ratio(fgHex, bgHex) {
  var bg = parseHex(bgHex);
  var fg = parseHex(fgHex);
  if (fg.a < 1) fg = { r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 };
  var l1 = lum(fg), l2 = lum(bg);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}
function cssVar(name) {
  // 优先读浏览器计算样式(真实生效值)。回退到行内样式,是为了让这段逻辑
  // 能在 Node 里被 scripts/check-preview.mjs 用假 DOM 跑一遍做自检。
  if (typeof getComputedStyle === 'function') {
    return getComputedStyle(document.body).getPropertyValue(name).trim();
  }
  return String(document.body.style.getPropertyValue(name) || '').trim();
}
var PAIRS = [
  ['正文 / 卡片', '--dsw-alias-label-primary', '--dsw-alias-bg-layer-1'],
  ['正文 / 画布', '--dsw-alias-label-primary', '--dsw-alias-bg-base'],
  ['正文 / 侧栏', '--dsw-alias-label-primary', '--dsw-specific-sidebar-fill'],
  ['次文字 / 卡片', '--dsw-alias-label-secondary', '--dsw-alias-bg-layer-1'],
  ['链接 / 卡片', '--dsw-alias-link', '--dsw-alias-bg-layer-1'],
  ['按钮字 / 品牌底', '--dsw-alias-label-primary-foreground', '--dsw-alias-button-primary-fill'],
  ['成功 / 卡片', '--dsw-alias-state-success-primary', '--dsw-alias-bg-layer-1'],
  ['警告 / 卡片', '--dsw-alias-state-warn-primary', '--dsw-alias-bg-layer-1'],
  ['错误 / 卡片', '--dsw-alias-state-error-primary', '--dsw-alias-bg-layer-1']
];
var MINIMUM = { '正文 / 卡片': 4.5, '正文 / 画布': 4.5, '正文 / 侧栏': 4.5, '次文字 / 卡片': 4.5, '链接 / 卡片': 4.5, '按钮字 / 品牌底': 4.5, '成功 / 卡片': 4.5, '警告 / 卡片': 4.5, '错误 / 卡片': 4.5 };

function renderTables() {
  var rows = PAIRS.map(function (pair) {
    var value = ratio(cssVar(pair[1]), cssVar(pair[2]));
    var need = MINIMUM[pair[0]] || 4.5;
    var ok = value + 1e-9 >= need;
    return '<tr><td>' + pair[0] + '</td><td class="num ' + (ok ? 'pass' : 'fail') + '">' + value.toFixed(2) + ':1 ' + (ok ? '✓' : '✗') + '</td></tr>';
  });
  document.getElementById('contrast').innerHTML = rows.join('');
  var failed = document.querySelectorAll('#contrast .fail').length;
  document.getElementById('contrast-note').textContent = failed === 0
    ? '当前模式下全部达标(WCAG AA 正文 4.5:1)。这些数值由浏览器的计算样式实时算出。'
    : failed + ' 项未达标 —— 请检查 theme/palette.mjs。';
  renderTokens();
}

apply();
</script>
</body>
</html>
`

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true })
fs.writeFileSync(OUTPUT, html, 'utf8')

console.log(
  `✓ preview —— preview/index.html 已生成(${Buffer.byteLength(html)} 字节,` +
    `${Object.keys(LIGHT).length} × 2 个 token,含 3 种模式切换与实时对比度自检)`,
)
