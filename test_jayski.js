const fetch = require('node-fetch');
async function test() {
  const res = await fetch('https://www.jayski.com/oreilly-auto-parts-series/', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://www.google.com/',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'cross-site',
      'Upgrade-Insecure-Requests': '1'
    }
  });
  const text = await res.text();
  console.log('Status: ' + res.status);
  console.log('Contains recent-news-item: ' + text.includes('recent-news-item'));
}
test();
