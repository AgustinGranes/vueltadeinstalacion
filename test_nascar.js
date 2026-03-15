
import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';

async function testNascarCalendar() {
  const year = 2026;
  const url = `https://lat.motorsport.com/nascar-cup/schedule/${year}/?all_event_types=1`;
  console.log('Fetching:', url);
  
  try {
    const res = await fetch(url);
    const html = await res.text();
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    
    // Check JSON-LD
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    console.log('JSON-LD scripts found:', scripts.length);

    const items = doc.querySelectorAll('.ms-schedule-table__item, tr[class*="event-row"]');
    console.log('Found table rows:', items.length);
    
    const groups = {};
    items.forEach(item => {
      const nameEl = item.querySelector('.ms-schedule-table-item-main__event .ms-link, .race-name, .event-name');
      if (!nameEl) return;
      const name = nameEl.textContent?.trim() || '';
      if (!groups[name]) groups[name] = { sessions: [] };
      groups[name].sessions.push(item.textContent.trim().substring(0, 50));
    });

    console.log('Unique Groups (Races):', Object.keys(groups).length);
    Object.keys(groups).forEach(k => {
      console.log(`- ${k}: ${groups[k].sessions.length} sessions`);
    });

  } catch (e) {
    console.error('Test failed:', e);
  }
}

testNascarCalendar();
