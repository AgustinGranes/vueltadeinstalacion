import fs from 'fs';
import { fetchTheRacingLineSessions } from './api/theRacingLine.ts';

async function createSnapshot() {
  console.log('Fetching fresh sessions for snapshot...');
  const sessions = await fetchTheRacingLineSessions();
  console.log('Sessions fetched:', sessions.length);
  if (sessions.length > 0) {
    fs.writeFileSync('api/trl_snapshot.json', JSON.stringify(sessions, null, 2));
    console.log('Successfully written api/trl_snapshot.json with', sessions.length, 'sessions!');
  } else {
    console.error('Failed to fetch sessions!');
  }
}

createSnapshot().catch(console.error);
