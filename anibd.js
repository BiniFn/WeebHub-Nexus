const cheerio = require('cheerio');
const https = require('https');

https.get('https://anibd.thankpet.com/?s=naruto', {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const $ = cheerio.load(data);
    const links = [];
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (href && href.includes('naruto')) links.push(href);
    });
    console.log('Found Links:', links.slice(0, 10));
  });
});
