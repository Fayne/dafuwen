import { ref, computed } from 'vue'

// ─── 语言初始化（只运行一次）────────────────────────────────────────────────
// 优先级：URL query ?lang=  >  Cloudflare 注入的地理默认值  >  回退 'en'
function detectLang() {
  // 1. URL query 参数（?lang=zh 或 ?lang=en）
  const params = new URLSearchParams(window.location.search)
  const query  = params.get('lang')
  if (query === 'zh' || query === 'en') return query

  // 2. Cloudflare Worker 注入的 <meta name="cf-default-lang">
  const meta = document.querySelector('meta[name="cf-default-lang"]')
  if (meta) {
    const content = meta.getAttribute('content')
    if (content === 'zh' || content === 'en') return content
  }

  // 3. 回退：英文
  return 'en'
}

// 全局单例状态
const lang = ref(detectLang())

// ─── Composable ──────────────────────────────────────────────────────────────
export function useI18n() {
  const isZh = computed(() => lang.value === 'zh')

  /**
   * 切换语言。
   * 同步更新 URL query（不刷新页面），方便用户分享/书签带语言偏好。
   */
  function setLang(l) {
    if (l !== 'zh' && l !== 'en') return
    lang.value = l
    const url = new URL(window.location.href)
    url.searchParams.set('lang', l)
    window.history.replaceState(null, '', url.toString())
  }

  function toggleLang() {
    setLang(lang.value === 'zh' ? 'en' : 'zh')
  }

  function t(zhText, enText) {
    return lang.value === 'zh' ? zhText : enText
  }

  return { lang, isZh, setLang, toggleLang, t }
}
