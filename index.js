import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'Db.json');

const readData = () => {
    try {
        const data = fs.readFileSync("./Db.json");
        return JSON.parse(data || '{}');
    } catch (error) {
        console.error(error);
        return {};
    }
};

const writeData = (data) => {
    try {
        fs.writeFileSync("./Db.json", JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(error);
    }
};

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'view'));

app.use(express.json());
app.use('/style', express.static(path.join(__dirname, 'style')));

// Ruta principal: muestra la web con datos de Db.json
app.get('/', (req, res) => {
    const db = readData();
    res.render('pagina1', {
        ods12: db.ods12 || {},
        compromisos: db.compromisos || []
    });
});

// API: Obtener todo el contenido de Db.json
app.get('/api/db', (req, res) => {
    const db = readData();
    res.json(db);
});

app.get('/info', (req, res) => {
  res.render('info');
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


// Ruta para el buscador de compromisos por índice
app.get('/buscador', (req, res) => {
    const db = readData();
    let encontrados = [];
    const municipio = req.query.municipio ? req.query.municipio.trim().toLowerCase() : '';
    const anyo = req.query.anyo ? req.query.anyo.trim() : '';
    if (municipio || anyo) {
        encontrados = (Array.isArray(db) ? db : [db]).filter(item => {
            const matchMunicipio = municipio ? (item.municipi && item.municipi.toLowerCase().includes(municipio)) : true;
            const matchAnyo = anyo ? (item.any && item.any.toString() === anyo) : true;
            return matchMunicipio && matchAnyo;
        });
    }
    res.render('buscador', { encontrados });
});

app.get('/mapa', (req, res) => {
    const dbMapaPath = path.join(__dirname, 'Db_mapa.json');
    const db = JSON.parse(fs.readFileSync(dbMapaPath, 'utf8'));
    res.render('mapa', { datos: Array.isArray(db) ? db : [db] });
});

app.get('/api/datos', (req, res) => {
    const dbMapaPath = path.join(__dirname, 'Db_mapa.json');
    const db = JSON.parse(fs.readFileSync(dbMapaPath, 'utf8'));
    res.json(Array.isArray(db) ? db : [db]);
});

app.listen(PORT, () => {
    console.log(`Servidor API escoltant a http://localhost:${PORT}`);
});