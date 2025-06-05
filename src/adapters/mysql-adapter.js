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

    async query(sql, params) {
        try {
            const [rows] = await this.pool.query(sql, params);
            return rows;
        } catch (error) {
            throw new Error(`Error en la consulta MySQL: ${error.message}`);
        }
    }

    async count(table, whereClause = '', params = []) {
        const sql = `SELECT COUNT(*) as total FROM ${this.escapeIdentifier(table)} ${whereClause}`;
        const [result] = await this.query(sql, params);
        return result.total;
    }

    escapeIdentifier(identifier) {
        return '`' + identifier.replace(/`/g, '``') + '`';
    }

    buildWhereClause(searchValue, searchableColumns) {
        if (!searchValue || !searchableColumns.length) return '';

        const conditions = searchableColumns.map(column => 
            `${this.escapeIdentifier(column)} LIKE ?`
        );
        
        return 'WHERE ' + conditions.join(' OR ');
    }
}

module.exports = MySQLAdapter; 