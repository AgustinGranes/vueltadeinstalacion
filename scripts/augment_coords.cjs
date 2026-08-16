const fs = require('fs');
const path = require('path');
const existing = require('../src/data/circuit_coords.json');

const finalObj = { ...existing };
const keys = Object.keys(existing);

for (const key of keys) {
  const coords = existing[key];
  const aliases = [
    `autodromo ${key}`,
    `autódromo ${key}`,
    `circuito ${key}`,
    `gran premio ${key}`,
    `gp ${key}`,
    `autodromo de ${key}`,
    `autódromo de ${key}`,
    `autodromo ciudad de ${key}`,
    `autódromo ciudad de ${key}`,
    `parque ${key}`,
    `${key} circuit`,
    `${key} raceway`
  ];

  for (const alias of aliases) {
    if (!finalObj[alias]) {
      finalObj[alias] = coords;
    }
  }
}

const dest = path.join(__dirname, '../src/data/circuit_coords.json');
fs.writeFileSync(dest, JSON.stringify(finalObj, null, 2));
console.log('DONE. Augmented dictionary size:', Object.keys(finalObj).length);

// Now also inject into api/widget.ts
let widgetCode = fs.readFileSync(path.join(__dirname, '../api/widget.ts'), 'utf-8');
const objStr = JSON.stringify(finalObj, null, 2);

const regex = /const HARDCODED_COORDS: Record<string, \{lat: number, long: number\}> = \{[\s\S]*?\};/;
widgetCode = widgetCode.replace(regex, `const HARDCODED_COORDS: Record<string, {lat: number, long: number}> = ${objStr};`);

fs.writeFileSync(path.join(__dirname, '../api/widget.ts'), widgetCode);
console.log('Widget API updated with the new massive dictionary.');
