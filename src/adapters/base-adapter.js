class BaseAdapter {
    constructor(config) {
        this.config = config;
    }

    async connect() {
        throw new Error('Método connect() debe ser implementado por el adaptador');
    }

    async query(sql, params) {
        throw new Error('Método query() debe ser implementado por el adaptador');
    }

    async count(table, whereClause = '', params = []) {
        throw new Error('Método count() debe ser implementado por el adaptador');
    }

    escapeIdentifier(identifier) {
        throw new Error('Método escapeIdentifier() debe ser implementado por el adaptador');
    }

    buildWhereClause(searchValue, searchableColumns) {
        throw new Error('Método buildWhereClause() debe ser implementado por el adaptador');
    }
}

module.exports = BaseAdapter; 