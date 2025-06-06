class BaseAdapter {
    constructor(config) {
        this.config = config;
    }

    async connect() {
        throw new Error('El método connect debe ser implementado por el adaptador específico');
    }

    async query(table, whereClause = '', start = 0, length = 10, order = []) {
        throw new Error('El método query debe ser implementado por el adaptador específico');
    }

    async count(table, whereClause = '') {
        throw new Error('El método count debe ser implementado por el adaptador específico');
    }

    escapeIdentifier(identifier) {
        throw new Error('El método escapeIdentifier debe ser implementado por el adaptador específico');
    }

    async InitBinding(table) {
        throw new Error('El método InitBinding debe ser implementado por el adaptador específico');
    }

    bindingTypesQuery(value, columnInfo, isRegEx, column) {
        throw new Error('El método bindingTypesQuery debe ser implementado por el adaptador específico');
    }
}

module.exports = BaseAdapter; 