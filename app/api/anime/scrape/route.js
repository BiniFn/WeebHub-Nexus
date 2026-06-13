import * as cheerio from "cheerio";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title");
  const ep = parseInt(searchParams.get("ep") || "1");

  if (!title) return Response.json({ error: "Missing title" }, { status: 400 });

  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      'Referer': 'https://anikototv.to/'
    };

    // 1. Search Anikoto
    const searchRes = await fetch(`https://anikototv.to/filter?keyword=${encodeURIComponent(title)}`, { headers });
    const searchHtml = await searchRes.text();
    const $ = cheerio.load(searchHtml);
    
    // Find first anime link
    const animeLink = $('.item a.name.d-title').first().attr('href') || $('.ani.poster.tip a').first().attr('href');
    if (!animeLink) return Response.json({ error: "Anime not found" }, { status: 404 });

    // 2. Fetch Anime Page
    const animeRes = await fetch(`https://anikototv.to${animeLink}`, { headers });
    const animeHtml = await animeRes.text();
    const $anime = cheerio.load(animeHtml);
    const seriesId = $anime('div[id^="watch"][data-id]').first().attr('data-id') || 
                     $anime('main [data-id]').first().attr('data-id') || 
                     animeHtml.match(/data-id="(\d+)"/)?.[1];
    
    if (!seriesId) return Response.json({ error: "Series ID not found" }, { status: 404 });

    // 3. Fetch Episode List
    const epsRes = await fetch(`https://anikototv.to/ajax/episode/list/${seriesId}`, {
      headers: { ...headers, 'X-Requested-With': 'XMLHttpRequest' }
    });
    const epsData = await epsRes.json();
    const $eps = cheerio.load(epsData.result);

    // Find requested episode
    let targetEp = null;
    $eps('a[data-ids]').each((i, el) => {
      const num = parseInt($eps(el).attr('data-num') || "0");
      if (num === ep || (num === 0 && i + 1 === ep)) {
        targetEp = $eps(el);
      }
    });

    if (!targetEp) return Response.json({ error: "Episode not found" }, { status: 404 });

    const dataIds = targetEp.attr('data-ids');

    // 4. Fetch Server List
    const serversRes = await fetch(`https://anikototv.to/ajax/server/list?servers=${dataIds}`, {
      headers: { ...headers, 'X-Requested-With': 'XMLHttpRequest' }
    });
    const serversData = await serversRes.json();
    const $servers = cheerio.load(serversData.result);

    // Get a sub server, fallback to dub
    const linkId = $servers('.servers .type[data-type="sub"] li[data-link-id]').first().attr('data-link-id') || 
                   $servers('.servers .type[data-type="dub"] li[data-link-id]').first().attr('data-link-id');

    if (!linkId) return Response.json({ error: "No servers available" }, { status: 404 });

    // 5. Get Embed URL
    const embedRes = await fetch(`https://anikototv.to/ajax/server?get=${linkId}`, {
      headers: { ...headers, 'X-Requested-With': 'XMLHttpRequest' }
    });
    const embedData = await embedRes.json();
    let embedUrl = embedData.result?.url;

    if (!embedUrl) return Response.json({ error: "No embed URL" }, { status: 404 });

    // 6. Get Sources from Embed
    const origin = new URL(embedUrl).origin;
    const embedPageRes = await fetch(embedUrl, { headers: { Referer: 'https://anikototv.to/' }});
    const embedHtml = await embedPageRes.text();
    let dataId = cheerio.load(embedHtml)('#megaplay-player').attr('data-id') || embedHtml.match(/data-id="([^"]+)"/)?.[1];

    if (!dataId) {
       const iframeMatch = embedHtml.match(/<iframe[^>]+\bsrc="([^"]*\/stream\/[^"]*)"/i);
       if (iframeMatch) {
         const innerUrl = iframeMatch[1].startsWith('http') ? iframeMatch[1] : `https:${iframeMatch[1]}`;
         const innerRes = await fetch(innerUrl, { headers: { Referer: embedUrl }});
         const innerHtml = await innerRes.text();
         dataId = cheerioload(innerHtml)('#megaplay-player').attr('data-id') || innerHtml.match(/data-id="([^"]+)"/)?.[1];
       }
    }

    if (!dataId) return Response.json({ error: "Stream ID not found" }, { status: 404 });

    const sourceRes = await fetch(`${origin}/stream/getSources?id=${dataId}`, {
      headers: { ...headers, 'X-Requested-With': 'XMLHttpRequest', Referer: embedUrl }
    });
    const sourceData = await sourceRes.json();

    let m3u8 = Array.isArray(sourceData.sources) ? sourceData.sources[0]?.file : sourceData.sources?.file;

    return Response.json({
      url: m3u8,
      subtitles: sourceData.tracks || []
    });

  } catch (error) {
    console.error("Scraper Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
