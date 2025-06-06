# JS-SSP (JavaScript Server-Side Processing)

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://semver.org)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-%3E%3D12.0-blue.svg)](https://www.postgresql.org)
[![MySQL](https://img.shields.io/badge/MySQL-%3E%3D8.0-orange.svg)](https://www.mysql.com)

Una librería JavaScript para implementar Server-Side Processing en DataTables con soporte para múltiples bases de datos.

## 🚀 Características

- ✨ Soporte para PostgreSQL y MySQL
- 🔍 Búsqueda avanzada con filtros individuales y globales
- 📊 Paginación y ordenamiento
- 🛡️ Protección contra inyección SQL
- 🔄 Tipado dinámico de columnas
- 🎯 Fácil de integrar con Express.js

## 📋 Requisitos

- Node.js >= 14.0.0
- PostgreSQL >= 12.0 o MySQL >= 8.0
- Express.js (opcional, para el ejemplo)

## 🔧 Instalación

```bash
npm install js-ssp
```

## 🎮 Uso Básico

```javascript
const { SSP } = require('js-ssp');

// Configuración de la base de datos
const config = {
    dialect: 'postgres', // o 'mysql'
    host: 'localhost',
    user: 'usuario',
    password: 'contraseña',
    database: 'mi_base_de_datos',
    port: 5432 // 3306 para MySQL
};

// Configuración de columnas
const columns = [
    { db: 'id', dt: 'id' },
    { db: 'nombre', dt: 'nombre' },
    { db: 'email', dt: 'email' }
];

// Crear instancia
const ssp = new SSP(config);

// Usar en tu endpoint
app.post('/api/data', async (req, res) => {
    try {
        const result = await ssp.Simple(req.body, 'mi_tabla', columns);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

## 📝 Ejemplo Completo

```html
<table id="miTabla" class="table">
    <thead>
        <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Email</th>
        </tr>
    </thead>
</table>

<script>
$(document).ready(function() {
    $('#miTabla').DataTable({
        processing: true,
        serverSide: true,
        ajax: {
            url: '/api/data',
            type: 'POST'
        },
        columns: [
            { data: 'id' },
            { data: 'nombre' },
            { data: 'email' }
        ]
    });
});
</script>
```

## 🔍 Características Avanzadas

### Filtros Individuales
```javascript
// En el frontend
columns: [
    { 
        data: 'nombre',
        searchable: true,
        search: {
            value: '',
            regex: false
        }
    }
]
```

### Ordenamiento
```javascript
// En el frontend
order: [
    [0, 'asc'],  // Ordenar por ID ascendente
    [1, 'desc']  // Luego por nombre descendente
]
```

## 📚 Documentación

Para más detalles sobre la configuración y uso, consulta la [documentación completa](docs/README.md).

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor, lee [CONTRIBUTING.md](CONTRIBUTING.md) para detalles sobre nuestro código de conducta y el proceso para enviarnos pull requests.

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🙏 Agradecimientos

- [DataTables](https://datatables.net/)
- [Express.js](https://expressjs.com/)
- [node-postgres](https://node-postgres.com/)
- [mysql2](https://github.com/sidorares/node-mysql2)

## 📞 Soporte

Si encuentras algún problema o tienes alguna sugerencia, por favor [abre un issue](https://github.com/tu-usuario/js-ssp/issues). 