/**
 * Cloudflare Pages Worker — 语言地理默认值注入
 *
 * 逻辑：
 *  1. 非 HTML 请求（JS/CSS/图片等）直接透传，不做任何处理
 *  2. HTML 请求：读取 CF-IPCountry header
 *     - CN → 默认 zh
 *     - 其他 → 默认 en
 *  3. 将默认语言以 <meta name="cf-default-lang"> 注入 <head>
 *     前端 JS 读取该标签，若 URL 有 ?lang= 则以 URL 为准
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    // 非导航请求直接透传（静态资源）
    const isHtmlRequest =
      request.headers.get('accept')?.includes('text/html') ||
      url.pathname === '/' ||
      url.pathname.endsWith('.html')

    if (!isHtmlRequest) {
      return env.ASSETS.fetch(request)
    }

    // 获取原始 HTML
    const response = await env.ASSETS.fetch(request)
    if (!response.ok) return response

    // 读取 Cloudflare 注入的国家码（本地开发时为 undefined）
    const country = request.cf?.country ?? 'XX'
    const defaultLang = country === 'CN' ? 'zh' : 'en'

    // 注入 meta 标签到 <head>
    const originalHtml = await response.text()
    const injected = originalHtml.replace(
      '<head>',
      `<head>\n  <meta name="cf-default-lang" content="${defaultLang}">`
    )

    return new Response(injected, {
      status: response.status,
      headers: {
        ...Object.fromEntries(response.headers),
        'content-type': 'text/html;charset=UTF-8',
        // 避免 CDN 缓存含有地区信息的 HTML
        'cache-control': 'no-store',
        'vary': 'CF-IPCountry',
      },
    })
  },
}
