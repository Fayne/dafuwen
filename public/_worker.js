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

    // 非导航请求直接透传（静态资源不需要地区判断）
    const isHtmlRequest =
      request.headers.get('accept')?.includes('text/html') ||
      url.pathname === '/' ||
      url.pathname.endsWith('.html')

    if (!isHtmlRequest) {
      return env.ASSETS.fetch(request)
    }

    // 获取原始 HTML（绕过缓存，确保 Worker 每次都执行）
    const cacheBypassRequest = new Request(request, {
      headers: new Headers(request.headers),
    })
    const response = await env.ASSETS.fetch(cacheBypassRequest)
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

    // 用 Headers 对象逐项复制，再覆盖关键头
    // 不能用 spread {...response.headers}，Headers 对象不可枚举
    const newHeaders = new Headers(response.headers)
    newHeaders.set('content-type', 'text/html;charset=UTF-8')
    // 关键：禁止 CDN 缓存 HTML，每次请求都必须过 Worker
    newHeaders.set('cache-control', 'no-store, no-cache, must-revalidate')
    newHeaders.delete('cf-cache-status') // 删掉旧的缓存状态头

    return new Response(injected, {
      status: response.status,
      headers: newHeaders,
    })
  },
}
