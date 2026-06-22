import { ref, computed } from 'vue'

// ─── 语言初始化 ──────────────────────────────────────────────────────────────
// 优先级：URL ?lang=  >  localStorage 上次选择  >  Cloudflare IP 地理  >  回退 en
//
// Cloudflare geo 是异步的（fetch），所以 lang 初始值先用同步来源，
// geo 结果回来后若用户没有明确选过语言则再更新一次。

const SUPPORTED = ['zh', 'en']

function syncLang() {
  // 1. URL query ?lang=zh / ?lang=en（最高优先级，可覆盖一切）
  const q = new URLSearchParams(window.location.search).get('lang')
  if (SUPPORTED.includes(q)) return { lang: q, source: 'url' }

  // 2. 上次用户手动选择（存 localStorage）
  try {
    const stored = localStorage.getItem('preferred-lang')
    if (SUPPORTED.includes(stored)) return { lang: stored, source: 'stored' }
  } catch {}

  // 3. 没有同步来源，先给 en，等异步 geo 结果
  return { lang: 'en', source: 'pending' }
}

const { lang: initialLang, source: initialSource } = syncLang()
const lang        = ref(initialLang)
const geoResolved = ref(initialSource !== 'pending') // 是否已有确定值

// 异步从 Cloudflare trace 端点获取国家码
// 只在没有 URL / localStorage 来源时才发请求
if (initialSource === 'pending') {
  fetch('https://cloudflare.com/cdn-cgi/trace', { cache: 'no-store' })
    .then(r => r.text())
    .then(text => {
      // 返回格式：每行 key=value，找 loc=XX
      const match = text.match(/^loc=(.+)$/m)
      const country = match?.[1]?.trim()
      if (!geoResolved.value) {
        lang.value = country === 'CN' ? 'zh' : 'en'
        geoResolved.value = true
      }
    })
    .catch(() => {
      // 网络失败（如大陆屏蔽 cloudflare.com）→ 默认 zh
      // 因为能访问 cloudflare.com 说明不在大陆，反之则很可能在大陆
      if (!geoResolved.value) {
        lang.value = 'zh'
        geoResolved.value = true
      }
    })
}

// ─── Composable ──────────────────────────────────────────────────────────────
export function useI18n() {
  const isZh = computed(() => lang.value === 'zh')

  function setLang(l) {
    if (!SUPPORTED.includes(l)) return
    lang.value = l
    geoResolved.value = true // 用户手动选了，不再被 geo 覆盖
    // 持久化到 localStorage
    try { localStorage.setItem('preferred-lang', l) } catch {}
    // 同步到 URL（不刷新页面）
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

  return { lang, isZh, geoResolved, setLang, toggleLang, t }
}
