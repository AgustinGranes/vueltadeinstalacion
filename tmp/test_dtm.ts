import { dataService } from '../src/data/dataService';

async function testDTM() {
  console.log('Testing DTM News...');
  const news = await dataService.getDTMNews();
  console.log(`Found ${news.length} news items. First item:`, news[0]);

  console.log('\nTesting DTM Calendar...');
  const calendar = await dataService.getDTMCalendar();
  console.log(`Found ${calendar.length} events. First event:`, calendar[0]);

  console.log('\nTesting DTM Standings (Driver)...');
  const dStandings = await dataService.getDTMStandings('Driver');
  console.log(`Found ${dStandings.length} drivers. First driver:`, dStandings[0]);

  console.log('\nTesting DTM Standings (Team)...');
  const tStandings = await dataService.getDTMStandings('Team');
  console.log(`Found ${tStandings.length} teams. First team:`, tStandings[0]);

  console.log('\nTesting DTM Standings (Constructor)...');
  const cStandings = await dataService.getDTMStandings('Constructor');
  console.log(`Found ${cStandings.length} constructors. First constructor:`, cStandings[0]);
}

testDTM().catch(console.error);
