import { render } from 'ejs';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Configuración de vistas y middlewares
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'view'));
app.use('/dB', express.static(path.join(__dirname, 'dB')));
app.use(express.json());
app.use('/style', express.static(path.join(__dirname, 'style')));
app.use('/particulas', express.static(path.join(__dirname, 'particulas')));

// FUNCIONES UTILES

const readData = () => {
    try {
        const data = fs.readFileSync("./db/Db.json");
        return JSON.parse(data || '{}');
    } catch (error) {
        console.error(error);
        return {};
    }
};

const writeData = (data) => {
    try {
        fs.writeFileSync("./db/Db.json", JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(error);
    }
};

// RUTAS PRINCIPALES (VISTAS)

// Página principal
app.get('/', (req, res) => {
    const db = readData();
    res.render('pagina1', {
        ods12: db.ods12 || {},
        compromisos: db.compromisos || []
    });
});

// Página de gráficos
app.get('/graficos', (req, res) => {
    const dataPath = path.join(__dirname, 'dB', 'Db.json');
    fs.readFile(dataPath, 'utf-8', (err, jsonData) => {
        if (err) {
            return res.status(500).send('Error llegint les dades.');
        }
        const data = JSON.parse(jsonData);
        res.render('graficos', { data });
    });
});

// Página de información
app.get('/info', (req, res) => {
    res.render('info');
});

// Página del mapa
app.get('/mapa', (req, res) => {
    res.render('mapa');
});

app.get('/conclusiones', (req, res) => {
    const db = readData();
    res.render('conclusiones', {
        ods12: db.ods12 || {},
        compromisos: db.compromisos || []
    });
});

// Página del buscador
app.get('/buscador', (req, res) => {
    const db = readData();
    let encontrados = [];
    const municipio = req.query.municipio ? req.query.municipio.trim().toLowerCase() : '';
    const anyo = req.query.anyo ? req.query.anyo.trim() : '';

    // Obtener años únicos
    const yearsSet = new Set();
    (Array.isArray(db) ? db : [db]).forEach(item => {
        if (item.any) yearsSet.add(item.any);
    });
    const years = Array.from(yearsSet).sort();

    if (municipio || anyo) {
        encontrados = (Array.isArray(db) ? db : [db]).filter(item => {
            const matchMunicipio = municipio ? (item.municipi && item.municipi.toLowerCase().includes(municipio)) : true;
            const matchAnyo = anyo ? (item.any && item.any.toString() === anyo) : true;
            return matchMunicipio && matchAnyo;
        });
    }
    res.render('buscador', { encontrados, years, anyo }); // <-- Añade 'anyo' aquí
});


// RUTAS API (CONSULTAS)

// API: Obtener todo el contenido de Db.json
app.get('/api/db', (req, res) => {
    const db = readData();
    res.json(db);
});

// API: Obtener solo los compromisos
app.get('/api/compromisos', (req, res) => {
    const db = readData();
    res.json(db.compromisos || []);
});

// API: Obtener solo la información de ODS12
app.get('/api/ods12', (req, res) => {
    const db = readData();
    res.json(db.ods12 || {});
});

// API: Obtener un compromiso por índice
app.get('/api/compromisos/:index', (req, res) => {
    const db = readData();
    const idx = parseInt(req.params.index, 10);
    if (Array.isArray(db.compromisos) && db.compromisos[idx]) {
        res.json({ compromiso: db.compromisos[idx] });
    } else {
        res.status(404).json({ error: 'Compromiso no encontrado' });
    }
});

// API: Obtener datos del mapa
app.get('/api/mapa', (req, res) => {
    const dbMapaPath = path.join(__dirname, 'dB', 'Db_mapa.json');
    const db = JSON.parse(fs.readFileSync(dbMapaPath, 'utf8'));
    res.json(db);
});

// API: Obtener datos del mapa (alternativa)
app.get('/datos', (req, res) => {
    const dbMapaPath = path.join(__dirname, 'dB', 'Db_mapa.json');
    try {
        const db = JSON.parse(fs.readFileSync(dbMapaPath, 'utf8'));
        res.json(Array.isArray(db) ? db : [db]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error leyendo los datos del mapa' });
    }
});


// INICIAR SERVIDOR

app.listen(PORT, () => {
    console.log(`Servidor API escoltant a http://localhost:${PORT}`);
});