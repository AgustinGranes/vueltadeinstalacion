const axios = require('axios');
const { JSDOM } = require('jsdom');

async function testWRC() {
  const proxyUrl = 'http://localhost:3000/api/proxy'; // Adjust if needed, or use direct axios if allowed
  
  // Since I can't easily run the local proxy in a scratch script without starting the server,
  // I'll try to use the same logic but with direct axios if the environment allows outgoing requests.
  // Actually, I can use the browser subagent to just check the content or run a script in the browser.
  
  const urls = [
    'https://www.wrc.com/en/calendar',
    'https://www.wrc.com/en/calendar?rb3TabId=past'
  ];

  for (const url of urls) {
    console.log(`\n--- Fetching ${url} ---`);
    try {
      const resp = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36'
        }
      });
      const dom = new JSDOM(resp.data);
      const cards = dom.window.document.querySelectorAll('a.event-feed-card');
      console.log(`Found ${cards.length} cards`);
      cards.forEach((card, i) => {
        if (i < 3) {
          const title = card.querySelector('.event-feed-card__title')?.textContent?.trim();
          console.log(`  Card ${i}: ${title}`);
        }
      });
    } catch (e) {
      console.error(`Error fetching ${url}:`, e.message);
    }
  }
}

testWRC();
