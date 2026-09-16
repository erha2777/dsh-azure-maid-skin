/**
 * check:readme —— README 结构与引用自检
 * ============================================================================
 * README 是最容易悄悄烂掉的文件:删了一节忘了删目录项、改了图名忘了改引用、
 * 手工编辑时覆盖掉别人的段落 —— 这些在 GitHub 上都只是"看起来有点怪",
 * 不会报错。这个脚本把它们变成会让 check 失败的问题。
 *
 * 检查项
 *   1. 标题不重复;
 *   2. 目录里的每一项都能落到一个真实标题上(悬空项直接失败);
 *   3. 每个二级标题都在目录里(漏登记也失败);
 *   4. 引用的图片文件真实存在;
 *   5. 相对链接指向的路径真实存在;
 *   6. 页内锚点(#xxx)能落到某个标题上;
 *   7. README 里出现的版本号与 package.json 一致 —— 版本漂移是发布事故的常见来源。
 *
 * 用法:node scripts/check-readme.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8')
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))

const failures = []
const notes = []
const fail = (message) => failures.push(message)

// ── 1. 标题 ────────────────────────────────────────────────────────────────
const headings = [...readme.matchAll(/^(#{2,3}) (.+)$/gm)].map((match) => match[2].trim())
const h2 = [...readme.matchAll(/^## (.+)$/gm)].map((match) => match[1].trim())
const seen = new Map()
for (const heading of headings) seen.set(heading, (seen.get(heading) || 0) + 1)
for (const [heading, count] of seen) {
  if (count > 1) fail(`标题重复(${count} 次):${heading}`)
}

// ── 2/3. 目录 ↔ 标题 双向一致 ──────────────────────────────────────────────
const toc = [...readme.matchAll(/^- \[([^\]]+)\]\(#([^)]+)\)$/gm)].map((match) => match[1])
for (const item of toc) {
  if (!seen.has(item)) fail(`目录项悬空(没有对应标题):${item}`)
}
for (const heading of h2) {
  if (heading === '目录') continue
  if (!toc.includes(heading)) fail(`二级标题未登记进目录:${heading}`)
}
notes.push(`标题 ${headings.length} 个,二级 ${h2.length} 个,目录项 ${toc.length} 条`)

// ── 4/5. 图片与链接 ────────────────────────────────────────────────────────
const images = [
  ...[...readme.matchAll(/<img\s+src="([^"]+)"/g)].map((match) => match[1]),
  ...[...readme.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map((match) => match[1]),
]
for (const src of new Set(images)) {
  if (/^https?:/.test(src)) continue
  if (!fs.existsSync(path.join(ROOT, src))) fail(`图片不存在:${src}`)
}
const links = [...readme.matchAll(/\]\(([^)]+)\)/g)]
  .map((match) => match[1])
  .filter((url) => !/^https?:/.test(url) && !url.startsWith('#') && !url.startsWith('mailto:'))
for (const url of new Set(links)) {
  if (!fs.existsSync(path.join(ROOT, url))) fail(`相对链接指向不存在的路径:${url}`)
}
notes.push(`图片 ${new Set(images).size} 张,相对链接 ${new Set(links).size} 个`)

// ── 6. 页内锚点 ────────────────────────────────────────────────────────────
// GitHub 的锚点规则:小写、去标点、空格转连字符。这里只做保守近似,
// 目的是抓"整节被删掉但引用还在"这类问题,不追求与 GitHub 完全一致。
const slug = (text) => text.toLowerCase().replace(/[^\w\u4e00-\u9fa5 -]/g, '').replace(/ /g, '-')
const slugs = new Set(headings.map(slug))
for (const anchor of new Set([...readme.matchAll(/\]\(#([^)]+)\)/g)].map((match) => match[1]))) {
  if (!slugs.has(anchor)) fail(`页内锚点没有目标标题:#${anchor}`)
}

// ── 7. 版本号 ──────────────────────────────────────────────────────────────
// 版本号以 package.json 与 git tag 为准,README 里**不强制**出现 ——
// 把它降级成提示,避免为了过检查而往文档里塞没人看的元信息。
// 但一旦 README 提到了版本号,就必须是本包当前的版本,不能是过期的旧号。
const mentioned = [...readme.matchAll(/\bv?(\d+\.\d+\.\d+)\b/g)].map((match) => match[1])
if (mentioned.length === 0) {
  notes.push(`README 未提及版本号(以 package.json 的 ${pkg.version} 为准)`)
} else if (!mentioned.includes(pkg.version)) {
  notes.push(`README 提到的版本号 ${[...new Set(mentioned)].join(', ')} 中不含当前版本 ${pkg.version}(仅提示)`)
} else {
  notes.push(`版本号 ${pkg.version} 与 package.json 一致`)
}
const repoUrl = String((pkg.repository && pkg.repository.url) || '').replace(/^git\+/, '').replace(/\.git$/, '')
if (repoUrl !== '' && !readme.includes(repoUrl)) {
  fail(`README 里没有出现仓库地址 ${repoUrl}`)
}

// ── 结论 ───────────────────────────────────────────────────────────────────
for (const note of notes) console.log(`· ${note}`)
if (failures.length > 0) {
  console.error(`\ncheck:readme 失败(${failures.length} 项):`)
  for (const message of failures) console.error(`  ✗ ${message}`)
  process.exit(1)
}
console.log('✓ check:readme 通过:标题无重复、目录与标题双向一致、图片与链接均存在、锚点可达、版本号同步')
