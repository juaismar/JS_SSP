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

    async query(sql, params) {
        try {
            // Convertir los parámetros de LIMIT y OFFSET para PostgreSQL
            const processedSql = sql.replace('LIMIT ? OFFSET ?', 'LIMIT $' + (params.length - 1) + ' OFFSET $' + params.length);
            const result = await this.pool.query(processedSql, params);
            return result.rows;
        } catch (error) {
            throw new Error(`Error en la consulta PostgreSQL: ${error.message}`);
        }
    }

    async count(table, whereClause = '', params = []) {
        const sql = `SELECT COUNT(*) as total FROM ${this.escapeIdentifier(table)} ${whereClause}`;
        const result = await this.query(sql, params);
        return parseInt(result[0].total);
    }

    escapeIdentifier(identifier) {
        return '"' + identifier.replace(/"/g, '""') + '"';
    }

    buildWhereClause(searchValue, searchableColumns) {
        if (!searchValue || !searchableColumns.length) return '';

        const conditions = searchableColumns.map((column, index) => 
            `${this.escapeIdentifier(column)} ILIKE $${index + 1}`
        );
        
        return 'WHERE ' + conditions.join(' OR ');
    }
}

module.exports = PostgresAdapter; 