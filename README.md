# JS-SSP (JavaScript Server-Side Processing)

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://semver.org)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-%3E%3D12.0-blue.svg)](https://www.postgresql.org)
[![MySQL](https://img.shields.io/badge/MySQL-%3E%3D8.0-orange.svg)](https://www.mysql.com)

A JavaScript library for implementing Server-Side Processing in DataTables with support for multiple databases.

## 🚀 Features

- ✨ PostgreSQL and MySQL support
- 🔍 Advanced search with individual and global filters
- 📊 Pagination and sorting
- 🛡️ SQL injection protection
- 🔄 Dynamic column typing
- 🎯 Easy integration with Express.js

## 📋 Requirements

- Node.js >= 14.0.0
- PostgreSQL >= 12.0 or MySQL >= 8.0
- Express.js (optional, for example)

## ⚙️ Required Configuration

For the library to work properly, it is **mandatory** to configure the following Express middlewares:

```javascript
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
```

Without these middlewares, the library will not be able to process DataTables requests correctly.

## 🔧 Installation

```bash
npm install js-ssp
```

## 🎮 Basic Usage

```javascript
const { SSP } = require('js-ssp');
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

// ⚠️ IMPORTANTE: Es obligatorio usar estos middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database configuration
const config = {
    dialect: 'postgres', // or 'mysql'
    host: 'localhost',
    user: 'user',
    password: 'password',
    database: 'my_database',
    port: 5432 // 3306 for MySQL
};

// Column configuration
const columns = [
    { db: 'id', dt: 'id' },
    { db: 'name', dt: 'name' },
    { db: 'email', dt: 'email' }
];

// Create instance
const ssp = new SSP(config);

// Use in your endpoint
app.get('/api/data', async (req, res) => {
    try {
        const result = await ssp.Simple(req.query, 'my_table', columns);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

## 📝 Complete Example

```html
<table id="myTable" class="table">
    <thead>
        <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
        </tr>
    </thead>
</table>

<script>
$(document).ready(function() {
    $('#myTable').DataTable({
        processing: true,
        serverSide: true,
        ajax: {
            url: '/api/data'
        },
        columns: [
            { data: 'id' },
            { data: 'name' },
            { data: 'email' }
        ]
    });
});
</script>
```

## 🤝 Contributing

Contributions are welcome.
We need:
- More adapters for MongoDB, SQLite...
- Proper RegEx implementation
- Tests

## 📄 License

This project is licensed under the MIT License.
