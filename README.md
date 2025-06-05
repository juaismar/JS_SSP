# DataTables Server-Side para Node.js

Esta es una implementación server-side de DataTables para Node.js que permite manejar grandes conjuntos de datos de manera eficiente. Soporta múltiples dialectos de base de datos.

## Requisitos

- Node.js 14.x o superior
- MySQL 5.7 o superior / PostgreSQL 12 o superior

## Instalación

1. Clona este repositorio
2. Instala las dependencias:
```bash
npm install
```

3. Crea un archivo `.env` en la raíz del proyecto con la siguiente configuración:
```
# Configuración general
PORT=3000

# Configuración de la base de datos
DB_DIALECT=mysql # o 'postgres'
DB_HOST=localhost
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_NAME=tu_base_de_datos
```

4. Crea la tabla de ejemplo en tu base de datos:

Para MySQL:
```sql
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

Para PostgreSQL:
```sql
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Uso

1. Inicia el servidor:
```bash
npm start
```

2. Para desarrollo con recarga automática:
```bash
npm run dev
```

3. Abre tu navegador en `http://localhost:3000`

## Características

- Soporte para múltiples dialectos de base de datos (MySQL, PostgreSQL)
- Paginación server-side
- Búsqueda global
- Ordenamiento por columnas
- Interfaz en español
- Diseño responsive con Bootstrap 5

## Personalización

### Configuración de la tabla

Puedes personalizar la tabla modificando el archivo `src/public/index.html` y ajustando las columnas según tus necesidades.

### Configuración de la base de datos

Para usar PostgreSQL, simplemente cambia el dialecto en el archivo `.env`:
```
DB_DIALECT=postgres
```

### Configuración de columnas buscables

Puedes especificar qué columnas son buscables al hacer la petición a la API:

```javascript
$('#usuariosTable').DataTable({
    processing: true,
    serverSide: true,
    ajax: {
        url: '/api/data',
        type: 'POST',
        data: function(d) {
            d.searchableColumns = ['nombre', 'email', 'otra_columna'];
            d.table = 'mi_tabla';
        }
    },
    // ... resto de la configuración
});
```

## Licencia

MIT 