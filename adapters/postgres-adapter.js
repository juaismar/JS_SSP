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
            let sql = `SELECT * FROM ${this.escapeIdentifier(table)}`;
            
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

            // Ejecutar la consulta
            const result = await this.pool.query(sql);
            return result.rows;
        } catch (error) {
            throw new Error(`Error en la consulta PostgreSQL: ${error.message}`);
        }
    }

    async count(table, whereClause = '') {
        try {
            let sql = `SELECT COUNT(*) as total FROM ${this.escapeIdentifier(table)}`;
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
                    return `${columnName} ~* '${value}'`;
                }
                return `${columnName} ILIKE '%${value}%'`;

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
            case 'bool':
                const boolValue = value.toLowerCase() === 'true' ? 'true' : 'false';
                return `${columnName} = ${boolValue}`;

            case 'date':
                return `${columnName} = '${value}'`;

            case 'timestamp':
            case 'timestamptz':
                return "";//`${columnName} = '${value}'`;

            default:
                // Para tipos desconocidos, intentamos búsqueda de texto case insensitive
                return "";//`${columnName} ILIKE '%${value}%'`;
        }
    }

}

module.exports = PostgresAdapter; 