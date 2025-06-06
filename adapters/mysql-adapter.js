const mysql = require('mysql2/promise');
const BaseAdapter = require('./base-adapter');

class MySQLAdapter extends BaseAdapter {
    constructor(config) {
        super(config);
        this.pool = mysql.createPool(config);
    }

    async connect() {
        try {
            const connection = await this.pool.getConnection();
            connection.release();
            return true;
        } catch (error) {
            throw new Error(`Error al conectar con MySQL: ${error.message}`);
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

            // Ejecutar la consulta
            const [rows] = await this.pool.query(sql);
            return rows;
        } catch (error) {
            throw new Error(`Error en la consulta MySQL: ${error.message}`);
        }
    }

    async count(table, whereClause = '') {
        try {
            let sql = `SELECT COUNT(*) as total FROM ${table}`;
            if (whereClause) {
                sql += ` WHERE ${whereClause}`;
            }
            const [rows] = await this.pool.query(sql);
            return parseInt(rows[0].total);
        } catch (error) {
            throw new Error(`Error en la consulta MySQL: ${error.message}`);
        }
    }

    escapeIdentifier(identifier) {
        return '`' + identifier.replace(/`/g, '``') + '`';
    }

    async InitBinding(table) {
        try {
            const sql = `
                SELECT 
                    COLUMN_NAME as columnName,
                    DATA_TYPE as type,
                    COLUMN_TYPE as udtName
                FROM 
                    INFORMATION_SCHEMA.COLUMNS 
                WHERE 
                    TABLE_NAME = ?
            `;
            
            const [rows] = await this.pool.query(sql, [table]);
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener tipos de columnas: ${error.message}`);
        }
    }

    bindingTypesQuery(value, columnInfo, isRegEx, column) {
        const columnName = this.escapeIdentifier(column.db);

        switch (columnInfo.udtName.toLowerCase()) {
            case 'varchar':
            case 'char':
            case 'text':
            case 'longtext':
            case 'mediumtext':
            case 'tinytext':
                if (isRegEx == "true") {
                    return `${columnName} REGEXP '${value}'`;
                }
                return `${columnName} LIKE '%${value}%'`;

            case 'int':
            case 'bigint':
            case 'tinyint':
            case 'smallint':
            case 'mediumint':
                const numValue = parseInt(value);
                if (isNaN(numValue)) {
                    return '';
                }
                return `${columnName} = ${numValue}`;

            case 'float':
            case 'double':
            case 'decimal':
                const floatValue = parseFloat(value);
                if (isNaN(floatValue)) {
                    return '';
                }
                return `${columnName} = ${floatValue}`;

            case 'boolean':
            case 'tinyint(1)':
                const boolValue = value.toLowerCase() === 'true' ? 1 : 0;
                return `${columnName} = ${boolValue}`;

            case 'date':
                return `${columnName} = '${value}'`;

            case 'datetime':
            case 'timestamp':
                return `${columnName} = '${value}'`;

            default:
                // Para tipos desconocidos, intentamos búsqueda de texto
                return "";//`${columnName} LIKE '%${value}%'`;
        }
    }
}

module.exports = MySQLAdapter; 