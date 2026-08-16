const fs = require('fs');
const path = require('path');
const existing = require('../src/data/circuit_coords.json');
const newLocations = [
  'San Fernando del Valle de Catamarca', 'La Rioja Argentina', 'Formosa Argentina', 'San Salvador de Jujuy',
  'Santiago del Estero', 'San Juan Argentina', 'Mendoza Argentina', 'Santa Fe Argentina',
  'Santa Rosa La Pampa', 'Viedma Rio Negro', 'Rawson Chubut', 'Rio Gallegos Santa Cruz',
  'Ushuaia Tierra del Fuego', 'Bariloche', 'Comodoro Rivadavia', 'Trelew', 'Puerto Madryn',
  'Gualeguaychu', 'Concordia Entre Rios', 'San Rafael Mendoza', 'Villa Mercedes San Luis',
  'Oran Salta', 'Tartagal', 'Eldorado Misiones', 'Goya Corrientes', 'Paso de los Libres',
  'General Roca Rio Negro', 'Cipolletti', 'Zapala', 'Esquel', 'Caleta Olivia',
  'Azul Buenos Aires', 'Tandil', 'Necochea', 'Olavarria', 'Tres Arroyos', 'Pehuajo',
  'Chivilcoy', 'Mercedes Buenos Aires', 'Zarate', 'Campana', 'Pergamino', 'San Nicolas de los Arroyos',
  'Venado Tuerto', 'Reconquista Santa Fe', 'Rafaela', 'San Francisco Cordoba', 'Rio Cuarto',
  'Villa Maria', 'Carlos Paz', 'Alta Gracia', 'Bell Ville', 'Marcos Juarez', 'San Martin Mendoza',

  'Macapa Amapa', 'Rio Branco Acre', 'Porto Velho Rondonia', 'Boa Vista Roraima', 'Palmas Tocantins',
  'Cuiaba Mato Grosso', 'Campo Grande MS', 'Goiania Goias', 'Brasilia DF',
  'Belo Horizonte MG', 'Vitoria ES', 'Rio de Janeiro RJ', 'Sao Paulo SP',
  'Curitiba PR', 'Florianopolis SC', 'Porto Alegre RS', 'Salvador BA', 'Aracaju SE',
  'Maceio AL', 'Recife PE', 'Joao Pessoa PB', 'Natal RN', 'Fortaleza CE',
  'Teresina PI', 'Sao Luis MA', 'Belem PA', 'Manaus AM',
  'Campinas', 'Guarulhos', 'Sao Bernardo do Campo', 'Santo Andre', 'Osasco',
  'Ribeirao Preto', 'Sorocaba', 'Uberlandia', 'Juiz de Fora', 'Contagem',
  'Joinville', 'Londrina', 'Caxias do Sul', 'Pelotas', 'Cascavel',
  'Feira de Santana', 'Vitoria da Conquista', 'Campina Grande', 'Caruaru', 'Petrolina',
  'Juazeiro do Norte', 'Mossoro', 'Imperatriz', 'Maraba', 'Santarem',
  'Ilheus', 'Itabuna', 'Jequie', 'Alagoinhas', 'Barreiras', 'Parnaiba',
  'Caxias MA', 'Castanhal', 'Ananindeua', 'Macae', 'Campos dos Goytacazes',
  'Petropolis', 'Nova Friburgo', 'Volta Redonda', 'Resende', 'Angra dos Reis',
  'Santos', 'Sao Vicente', 'Guaruja', 'Praia Grande', 'Bauru', 'Franca',
  'Araraquara', 'Sao Carlos', 'Piracicaba', 'Limeira', 'Rio Claro',
  'Americana', 'Santa Barbara dOeste', 'Indaiatuba', 'Itu', 'Jundiai'
];
async function run() {
  const finalObj = { ...existing };
  for (let i = 0; i < newLocations.length; i += 5) {
    const batch = newLocations.slice(i, i + 5);
    await Promise.all(batch.map(async (loc) => {
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(loc)}&count=1&language=es&format=json`);
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const lat = data.results[0].latitude;
          const long = data.results[0].longitude;
          const key = loc.toLowerCase().trim();
          finalObj[key] = { lat, long };
        }
      } catch(e) {}
    }));
    await new Promise(r => setTimeout(r, 200));
  }
  const dest = path.join(__dirname, '../src/data/circuit_coords.json');
  fs.writeFileSync(dest, JSON.stringify(finalObj, null, 2));
  console.log('DONE. Total coords:', Object.keys(finalObj).length);
}
run();
