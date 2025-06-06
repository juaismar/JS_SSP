const express = require('express');
const path = require('path');
const { SSP } = require('../SSP');

const app = express();
const port = 3000;

// Servir archivos estÃ¡ticos
app.use(express.static(path.join(__dirname, 'public')));

// ConfiguraciÃ³n de DataTables
const ssp = new SSP({
    dialect: 'postgres', // mysql, postgres, etc.
    host: 'localhost',
    user: 'postgres',
    password: 'postgres',
    database:  'datatables_demo'
});

// Ruta para la pÃ¡gina de demostraciÃ³n
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta para el endpoint de DataTables
app.get('/api/data', async (req, res) => {
    try {
        console.log(req.query) ;
        const columns = [
            { db: 'id', dt: 'id', formatter: null },
            { db: 'nombre', dt: 'nombre', formatter: (value) => value.toUpperCase() },
            { db: 'email', dt: 'email', formatter: null },
            { db: 'fecha_registro', dt: 'fecha_registro', formatter: (value) => new Date(value).toLocaleDateString('es-ES') }
        ];

        const result = await ssp.Simple(req.query, 'usuarios', columns);
        res.json(result);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
    console.log(`Usando dialecto de base de datos: ${process.env.DB_DIALECT || 'mysql'}`);
}); 