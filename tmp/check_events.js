const https = require('https');

https.get('https://raw.githubusercontent.com/AgustinGranes/DataExtractor/main/data/horarios.json', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    const now = Date.now();
    const end = now + 7 * 24 * 60 * 60 * 1000;

    const events = [];
    for (const series of json.series) {
      const seriesName = series.details?.shortName || series.details?.name;
      const eventsArr = series.events || [];
      for (const event of eventsArr) {
        const sessions = event.sessions || [];
        const weeklySessions = sessions.filter(s => {
          const ts = s.startAt;
          return ts >= now && ts <= end;
        });
        if (weeklySessions.length > 0) {
          events.push({
            series: seriesName,
            event: event.name || event.title || '',
            location: event.location || event.circuit || '',
            sessions: weeklySessions.map(s => ({
              name: s.name || s.title,
              startAt: s.startAt,
              time: new Date(s.startAt).toISOString()
            }))
          });
        }
      }
    }

    console.log('Events in next 7 days:', events.length);
    console.log(JSON.stringify(events, null, 2).substring(0, 5000));

    // Also print the structure of first event
    if (json.series[0]?.events?.[0]) {
      console.log('\n--- FIRST EVENT STRUCTURE ---');
      console.log(JSON.stringify(json.series[0].events[0], null, 2).substring(0, 2000));
    }
  });
});
