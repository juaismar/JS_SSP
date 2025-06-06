const { Pool } = require('pg');
const BaseAdapter = require('./base-adapter');

class PostgresAdapter extends BaseAdapter {
    constructor(config) {
        super(config);
        this.pool = new Pool(config);
    }

    async connect() {
        try {
            const client = await this.pool.connect();
            client.release();
            return true;
        } catch (error) {
            throw new Error(`Error al conectar con PostgreSQL: ${error.message}`);
        }
    }

    async query(table, whereClause = '', start = 0, length = 10, order = []) {
        try {
            // Construir la consulta base
            let sql = `SELECT * FROM ${table}`;
            
            // Añadir cláusula WHERE si existe
            if (whereClause) {
                sql += ` WHERE ${whereClause}`;
            }

            // Añadir ordenamiento si existe
            if (order.length > 0) {
                sql += ` ORDER BY ${order.join(', ')}`;
            }

            // Añadir paginación
            sql += ` LIMIT ${length} OFFSET ${start}`;
            console.log(sql);

            // Ejecutar la consulta
            const result = await this.pool.query(sql);
            return result.rows;
        } catch (error) {
            throw new Error(`Error en la consulta PostgreSQL: ${error.message}`);
        }
    }

    async count(table, whereClause = '') {
        try {
            let sql = `SELECT COUNT(*) as total FROM ${table}`;
            if (whereClause) {
                sql += ` WHERE ${whereClause}`;
            }
            const result = await this.pool.query(sql);
            return parseInt(result.rows[0].total);
        } catch (error) {
            throw new Error(`Error en la consulta PostgreSQL: ${error.message}`);
        }
    }

    escapeIdentifier(identifier) {
        return '"' + identifier.replace(/"/g, '""') + '"';
    }

    buildWhereClause(searchValue, searchableColumns) {
        if (!searchValue || !searchableColumns.length) return '';

        const conditions = searchableColumns.map((column, index) => {
            // Para campos numéricos, intentamos convertir el valor de búsqueda a número
            const isNumeric = /^[0-9]+$/.test(searchValue);
            if (isNumeric) {
                return `${this.escapeIdentifier(column)} = $${index + 1}`;
            }
            // Para campos de texto, usamos ILIKE con el valor procesado
            return `${this.escapeIdentifier(column)}::text ILIKE $${index + 1}`;
        });
        
        return 'WHERE ' + conditions.join(' OR ');
    }

    // Método para procesar los parámetros de búsqueda
    processSearchParams(searchValue, searchableColumns) {
        if (!searchValue || !searchableColumns.length) return [];

        return searchableColumns.map(() => {
            // Si es un número, devolvemos el número
            if (/^[0-9]+$/.test(searchValue)) {
                return parseInt(searchValue);
            }
            // Si es texto, añadimos los comodines para búsqueda parcial
            return `%${searchValue}%`;
        });
    }

    async InitBinding(table) {
        try {
            const sql = `
                SELECT 
                    column_name as "columnName",
                    data_type as "type",
                    udt_name as "udtName"
                FROM 
                    information_schema.columns 
                WHERE 
                    table_name = $1
            `;
            
            const result = await this.pool.query(sql, [table]);
            return result.rows;
        } catch (error) {
            throw new Error(`Error al obtener tipos de columnas: ${error.message}`);
        }
    }

    bindingTypesQuery(value, columnInfo, isRegEx, column) {
        const columnName = this.escapeIdentifier(column.db);

        switch (columnInfo.udtName.toLowerCase()) {
            case 'string':
            case 'text':
            case 'varchar':
            case 'char':
                if (isRegEx == "true") {
                    return `${columnName} ~ '${value}'`;
                }
                return `${columnName} LIKE '%${value}%'`;

            case 'int4':
            case 'int8':
            case 'int':
            case 'integer':
            case 'bigint':
            case 'smallint':
                const numValue = parseInt(value);
                if (isNaN(numValue)) {
                    return '';
                }
                return `${columnName} = ${numValue}`;

            case 'float':
            case 'double':
            case 'decimal':
            case 'numeric':
                const floatValue = parseFloat(value);
                if (isNaN(floatValue)) {
                    return '';
                }
                return `${columnName} = ${floatValue}`;

            case 'boolean':
                const boolValue = value.toLowerCase() === 'true' ? 'true' : 'false';
                return `${columnName} = ${boolValue}`;

            case 'date':
                return `${columnName} = '${value}'`;

            case 'timestamp':
            case 'timestamptz':
                return "";//`${columnName} = '${value}'`;

            default:
                // Para tipos desconocidos, intentamos búsqueda de texto
                return `${columnName}::text ILIKE '%${value}%'`;
        }
    }

}

module.exports = PostgresAdapter; 