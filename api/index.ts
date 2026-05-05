import type { VercelRequest, VercelResponse } from '@vercel/node';
import { dataFetcher, CATEGORY_RESULTS_URLS } from './lib/data-fetcher';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = req.url || '/api';
  const pathParts = url.split('?')[0].split('/').filter(Boolean);
  
  // pathParts[0] is 'api' (because of the rewrite or direct call)
  // pathParts[1] would be the category (e.g., 'f1')
  // pathParts[2] would be the type (e.g., 'news')

  const category = pathParts[1]?.toLowerCase();
  const type = pathParts[2]?.toLowerCase();

  try {
    // 1. Root /api
    if (!category || category === 'index') {
      return res.status(200).json({
        status: 'online',
        name: 'Motorsport Unified API v1',
        description: 'Perfectly organized motorsport data for all categories.',
        endpoints: {
          discovery: '/api',
          weekly_global_calendar: '/api/weekly',
          categories_list: '/api/categories',
          category_full_data: '/api/{category}',
          category_specific_type: '/api/{category}/{news|calendar|standings}'
        },
        available_categories: Object.keys(CATEGORY_RESULTS_URLS),
        note: 'To access a specific category, use /api/{category}, for example /api/f1'
      });
    }

    // 2. Global Weekly Calendar /api/weekly
    if (category === 'weekly') {
      const data = await dataFetcher.getWeeklyCalendar();
      return res.status(200).json(data);
    }

    // 3. Categories List /api/categories
    if (category === 'categories') {
      return res.status(200).json(Object.keys(CATEGORY_RESULTS_URLS));
    }

    // 4. Specific Category Logic (e.g., /api/f1)
    if (category === 'f1') {
      if (!type) {
        const [news, calendar, standings] = await Promise.all([
          dataFetcher.getF1News(),
          dataFetcher.getF1Calendar(),
          dataFetcher.getF1Standings()
        ]);
        return res.status(200).json({
          category: 'Formula 1',
          resultsUrl: CATEGORY_RESULTS_URLS['F1'],
          news,
          calendar,
          standings
        });
      }
      if (type === 'news') return res.status(200).json(await dataFetcher.getF1News());
      if (type === 'calendar') return res.status(200).json(await dataFetcher.getF1Calendar());
      if (type === 'standings') return res.status(200).json(await dataFetcher.getF1Standings());
    }

    // 5. Generic Category Handling (WRC, MotoGP, NASCAR, etc.)
    const catUpper = category.toUpperCase();
    if (CATEGORY_RESULTS_URLS[catUpper]) {
      const data: any = {
        category: catUpper,
        resultsUrl: CATEGORY_RESULTS_URLS[catUpper]
      };

      if (!type || type === 'news') {
        const newsUrl = catUpper === 'MOTOGP' ? 'https://as.com/noticias/moto-gp/' : `https://lat.motorsport.com/${category}/news/`;
        data.news = await dataFetcher.getNews(category, newsUrl, catUpper === 'MOTOGP' ? 'AS.com' : 'Motorsport.com');
      }

      if (!type || type === 'standings') {
        if (category === 'wrc') data.standings = await dataFetcher.getWRCStandings();
        else data.standings = { note: 'Standings scraping for this category is under development.' };
      }

      if (!type || type === 'calendar') {
        data.calendar = { note: 'Calendar scraping for this category is under development.' };
      }

      return res.status(200).json(type ? data[type] : data);
    }

    return res.status(404).json({ error: 'Endpoint or category not found' });

  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}
