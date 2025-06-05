const express = require('express');
const path = require('path');
const { SSP } = require('./datatables-server');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware para parsear JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de DataTables
const ssp = new SSP({
    dialect: process.env.DB_DIALECT || 'mysql', // mysql, postgres, etc.
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'test'
});

// Ruta para la página de demostración
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta para el endpoint de DataTables
app.post('/api/data', async (req, res) => {
    try {
        const columns = [
            { db: 'id', dt: 'id', formatter: null },
            { db: 'nombre', dt: 'nombre', formatter: (value) => value.toUpperCase() },
            { db: 'email', dt: 'email', formatter: null },
            { db: 'fecha_registro', dt: 'fecha_registro', formatter: (value) => new Date(value).toLocaleDateString('es-ES') }
        ];

        const result = await ssp.Simple(req.body, 'usuarios', columns);
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