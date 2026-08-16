const fs = require('fs');
const path = require('path');
const existing = require('../src/data/circuit_coords.json');

const newLocations = [
  // Argentine cities & tracks
  'Nueve de Julio', 'Junin', 'San Martin Mendoza', 'Puerto Madryn', 'Esquel', 'Bariloche', 'Villa Carlos Paz',
  'Jesus Maria', 'Rio Tercero', 'San Francisco', 'Villa Maria', 'Cruz del Eje', 'Gualeguaychu', 'Gualeguay',
  'Villaguay', 'Victoria', 'Chajari', 'Paso de los Libres', 'Goya', 'Mercedes Corrientes', 'Curuzu Cuatia',
  'Eldorado', 'Iguazu', 'Apóstoles', 'Roque Saenz Peña', 'Villa Angela', 'Charata', 'Clorinda', 'Pirane',
  'Tartagal', 'Oran', 'Rosario de la Frontera', 'Metan', 'San Pedro Jujuy', 'Ledesma', 'Perico', 'Palpala',
  'Banda del Rio Sali', 'Concepcion Tucuman', 'Tafi Viejo', 'Monteros', 'Añatuya', 'Frias', 'Termas',
  'Chilecito', 'Aimogasta', 'Chamical', 'Andalgala', 'Tinogasta', 'Belen', 'Caucete', 'Chimbas', 'Rawson',
  'Villa Mercedes', 'Merlo San Luis', 'General Pico', 'Macachin', 'Victorica', 'Choele Choel', 'Villa Regina',
  'Allen', 'Cipolletti', 'Cinco Saltos', 'Catriel', 'Zapala', 'Cutral Co', 'Plaza Huincul', 'San Martin de los Andes',
  'Puerto Deseado', 'Caleta Olivia', 'Pico Truncado', 'Las Heras Santa Cruz', 'Rio Turbio', 'Ushuaia', 'Rio Grande',
  'Tolhuin', 'Azul', 'Tandil', 'Necochea', 'Tres Arroyos', 'Coronel Suarez', 'Coronel Pringles', 'Pehuajo',
  'Trenque Lauquen', 'Chivilcoy', 'Chacabuco', 'Bragado', 'Lincoln', 'Saladillo', 'Las Flores', 'Dolores',
  'Chascomus', 'Lobos', 'Mercedes BA', 'Lujan', 'Zarate', 'Campana', 'San Pedro BA', 'Baradero', 'Ramallo',
  'Pergamino', 'Arrecifes', 'Salto', 'Rojas', 'Colon BA', 'San Antonio de Areco', 'Capilla del Señor',
  'Avellaneda', 'Lanus', 'Quilmes', 'Berazategui', 'Florencio Varela', 'Almirante Brown', 'Esteban Echeverria',
  'Ezeiza', 'La Matanza', 'Moron', 'Ituzaingo', 'Merlo BA', 'Moreno', 'General Rodriguez', 'Lomas de Zamora',
  'San Vicente', 'Cañuelas', 'Tigre', 'San Fernando', 'San Isidro', 'Vicente Lopez', 'San Martin BA',
  'Tres de Febrero', 'Hurlingham', 'San Miguel', 'Jose C Paz', 'Malvinas Argentinas', 'Pilar', 'Escobar',
  'Zavalla', 'Venado Tuerto', 'Casilda', 'Cañada de Gomez', 'Las Rosas', 'Armstrong', 'Las Parejas', 'El Trebol',
  'San Jorge Santa Fe', 'Sunchales', 'Esperanza', 'Reconquista', 'Avellaneda Santa Fe', 'Vera', 'San Javier',
  'Gobernador Virasoro', 'Ituzaingo Corrientes',

  // Brazilian cities & tracks
  'Guarulhos', 'Campinas', 'Sao Bernardo do Campo', 'Santo Andre', 'Osasco', 'Sao Jose dos Campos', 'Ribeirao Preto',
  'Uberlandia', 'Sorocaba', 'Contagem', 'Aracaju', 'Feira de Santana', 'Cuiaba', 'Joinville', 'Juiz de Fora',
  'Londrina', 'Aparecida de Goiania', 'Ananindeua', 'Porto Velho', 'Cascavel', 'Viamão', 'Bauru', 'Duque de Caxias',
  'Nova Iguacu', 'Sao Goncalo', 'Maceio', 'Natal', 'Teresina', 'Campo Grande', 'Joao Pessoa', 'Jaboatao dos Guararapes',
  'Sao Jose do Rio Preto', 'Mogi das Cruzes', 'Betim', 'Diadema', 'Campina Grande', 'Jundiai', 'Maringa', 'Montes Claros',
  'Piracicaba', 'Carapicuiba', 'Olinda', 'Cariacica', 'Rio Branco', 'Anapolis', 'Belford Roxo', 'Vila Velha',
  'Caucaia', 'Manaus', 'Belo Horizonte', 'Fortaleza', 'Salvador', 'Recife', 'Belem', 'Porto Alegre', 'Goiania',
  'Curitiba', 'Sao Luis', 'Florianopolis', 'Vitoria', 'Macapa', 'Palmas', 'Boa Vista', 'Rio de Janeiro', 'Sao Paulo',
  'Franca', 'Ponta Grossa', 'Canoas', 'Pelotas', 'Vitoria da Conquista', 'Blumenau', 'Franca', 'Uberaba',
  'Boa Vista', 'Paulista', 'Petropolis', 'Santarem', 'Ribeirao das Neves', 'Uberlandia', 'Guaruja', 'Taubate',
  'Limeira', 'Suzano', 'Camaçari', 'Santa Maria', 'Foz do Iguaçu', 'Imperatriz', 'Vazea Grande', 'Maraba',
  'Itaborai', 'Macae', 'Americana', 'Indaiatuba', 'Cotia', 'Araraquara', 'Jacarei', 'Marilia', 'Presidente Prudente',
  'Hortolandia', 'Sete Lagoas', 'Divinopolis', 'Ipatinga', 'Santa Luzia', 'Arapiraca', 'Criciuma', 'Chapeco',
  'Itajai', 'Dourados', 'Tres Lagoas', 'Sinop', 'Rondonopolis', 'Castanhal', 'Parauapebas', 'Caxias', 'Parnaiba',
  'Sobral', 'Juazeiro do Norte', 'Ilheus', 'Itabuna', 'Jequie', 'Teixeira de Freitas', 'Alagoinhas', 'Barreiras',
  'Pouso Alegre', 'Varginha', 'Passos', 'Lavras', 'Itajuba', 'Poços de Caldas', 'Extrema',

  // Common Motorsport specific locations
  'Mogi Guaçu', 'Autodromo de Interlagos', 'Autodromo Oscar y Juan Galvez', 'Autodromo Roberto Mouras',
  'Autodromo Ciudad de Viedma', 'Autodromo Parque Provincia del Neuquen', 'Autodromo Provincia de La Pampa',
  'Autodromo Termas de Rio Hondo', 'Autodromo Rosendo Hernandez', 'Autodromo San Nicolas Ciudad',
  'Autodromo Ciudad de Parana', 'Autodromo Ciudad de Concordia', 'Autodromo Ciudad de Rosario',
  'Autodromo Oscar Cabalen', 'Autodromo Jorge Angel Pena', 'Autodromo Ciudad de Obera',
  'Autodromo Juan Manuel Fangio', 'Autodromo Eusebio Marcilla', 'Autodromo Parque Ciudad de Rio Cuarto',
  'Autodromo de Concepcion del Uruguay', 'Autodromo de Centenario', 'Autodromo de Toay',
  'Autodromo de Termas de Rio Hondo', 'Autodromo de Buenos Aires', 'Autodromo de La Plata',
  'Autodromo de San Jorge', 'Autodromo de Marcos Juarez', 'Autodromo de Salta', 'Autodromo de Chaco',
  'Autodromo de General Roca', 'Autodromo de Pigue', 'Autodromo de Trelew', 'Autodromo de Comodoro Rivadavia',
  'Autodromo de Rio Gallegos', 'Autodromo de El Calafate', 'Autodromo de Olavarria', 'Autodromo de Balcarce',
  'Autodromo de Bahia Blanca', 'Autodromo de Mar de Ajo', 'Autodromo de San Luis', 'Autodromo de San Juan'
];

async function run() {
  const finalObj = { ...existing };
  const chunk = 5;
  for (let i = 0; i < newLocations.length; i += chunk) {
    const batch = newLocations.slice(i, i + chunk);
    await Promise.all(batch.map(async (loc) => {
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(loc)}&count=1&language=es&format=json`);
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const lat = data.results[0].latitude;
          const long = data.results[0].longitude;
          const key = loc.toLowerCase().trim();
          finalObj[key] = { lat, long };
          // Add common variants
          if (key.includes('autodromo de ')) finalObj[key.replace('autodromo de ', '')] = { lat, long };
          if (key.includes('autodromo ')) finalObj[key.replace('autodromo ', '')] = { lat, long };
        }
      } catch(e) {}
    }));
    // wait 200ms to avoid rate limiting
    await new Promise(r => setTimeout(r, 200));
  }
  
  const dest = path.join(__dirname, '../src/data/circuit_coords.json');
  fs.writeFileSync(dest, JSON.stringify(finalObj, null, 2));
  console.log('DONE. Total coords:', Object.keys(finalObj).length);
}
run();
