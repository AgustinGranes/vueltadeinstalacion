export default async function handler(req, res) {
  const query = req.query;
  let targetUrl = query.url;
  
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  // RECONSTRUCT FULL URL: The destination in vercel.json might include ? and & 
  // which Vercel splits into separate query params. We need to put them back.
  const queryParams = { ...query };
  delete queryParams.url;
  
  const queryString = Object.keys(queryParams)
    .map(key => `${key}=${queryParams[key]}`)
    .join('&');
    
  if (queryString) {
    targetUrl += (targetUrl.includes('?') ? '&' : '?') + queryString;
  }

  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    let decodedUrl = decodeURIComponent(targetUrl);
    if (!decodedUrl.startsWith('http')) {
      decodedUrl = `https://${decodedUrl}`;
    }

    const urlObj = new URL(decodedUrl);
    const domain = urlObj.origin;

    const response = await fetch(decodedUrl, {
      method: req.method,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': domain + '/',
        'Origin': domain,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'cross-site',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    const contentType = response.headers.get('content-type');
    const data = await response.text();

    if (contentType) res.setHeader('Content-Type', contentType);
    // DISABLE CACHING TO AVOID STALE DATA
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    if (response.status === 403) {
      console.error(`FORBIDDEN status for URL: ${decodedUrl}`);
    }

    return res.status(response.status).send(data);
  } catch (error) {
    console.error('Proxy Error:', error);
    return res.status(500).json({ error: 'Proxy failed', message: error.message, url: targetUrl });
  }
}
