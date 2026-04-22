import { DOMParser } from 'linkedom';
global.DOMParser = DOMParser;

// Mocking the environment for testing the generator logic
const generateICSDatetime = (timestamp) => {
  const d = new Date(timestamp);
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};
const generateICSDateOnly = (d) => {
  return d.toISOString().split('T')[0].replace(/-/g, '');
};
const escapeICS = (str) => {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n');
};

const mockRaces = [
  { 
    category: 'F1', 
    schedules: [
      { name: 'Race, Monaco', startAt: Date.now() + 86400000, time: '15:00' }
    ] 
  },
  {
    category: 'Nascar',
    schedules: [
      { name: 'All Day Event', startAt: Date.now() + 172800000, time: '--:--' }
    ]
  }
];

function test() {
  const flatSchedules = mockRaces.flatMap(race =>
    race.schedules.map(s => ({ ...s, category: race.category }))
  );

  let icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Vuelta de Instalacion//Calendario Dinamico//ES"
  ];

  const nowStamp = generateICSDatetime(Date.now());
  const allDayAddedCategories = new Set();

  flatSchedules.forEach((sched) => {
    const isAllDay = sched.time === '--:--' || !sched.time;
    let startStr, endStr;
    
    if (isAllDay) {
      if (allDayAddedCategories.has(sched.category)) return;
      allDayAddedCategories.add(sched.category);
      const d = new Date(sched.startAt);
      startStr = generateICSDateOnly(d);
      const end = new Date(d); end.setDate(d.getDate() + 3);
      endStr = generateICSDateOnly(end);
    } else {
      startStr = generateICSDatetime(sched.startAt);
      endStr = generateICSDatetime(sched.startAt + 3600000);
    }

    const summary = isAllDay ? `${sched.category} (Horarios TBD)` : `${sched.category}: ${sched.name}`;
    const cleanUid = `${sched.startAt}-${sched.category}`.replace(/[^a-zA-Z0-9]/g, '');
    
    icsContent.push(
      "BEGIN:VEVENT",
      `UID:${cleanUid}-${Math.floor(Math.random()*1000)}@vueltadeinstalacion`,
      `DTSTAMP:${nowStamp}`
    );
    
    if (isAllDay) {
      icsContent.push(`DTSTART;VALUE=DATE:${startStr}`, `DTEND;VALUE=DATE:${endStr}`);
    } else {
      icsContent.push(`DTSTART:${startStr}`, `DTEND:${endStr}`);
    }
    
    icsContent.push(`SUMMARY:${escapeICS(summary)}`, "END:VEVENT");
  });
  icsContent.push("END:VCALENDAR");

  console.log(icsContent.join('\r\n'));
}

test();
