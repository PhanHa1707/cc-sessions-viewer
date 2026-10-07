// 默认主题与品牌配色。浏览器用量工具由各自 Markdown 页按需导入，
// 不在全站注册，避免无关页面加载计算器与 JSONL 解析逻辑。
import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import './style.css'

export default {
  extends: DefaultTheme,
} satisfies Theme
