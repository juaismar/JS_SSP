const MySQLAdapter = require('./adapters/mysql-adapter');
const PostgresAdapter = require('./adapters/postgres-adapter');

class DataTablesServer {
    constructor(config) {
        this.config = config;
        this.adapter = this.createAdapter(config);
    }

    createAdapter(config) {
        switch (config.dialect?.toLowerCase()) {
            case 'postgres':
            case 'postgresql':
                return new PostgresAdapter(config);
            case 'mysql':
            default:
                return new MySQLAdapter(config);
        }
    }

    async processRequest(params) {
        const {
            draw,
            start,
            length,
            search,
            order,
            columns,
            table = 'usuarios',
            searchableColumns = ['nombre', 'email']
        } = params;

        try {
            // Obtener el total de registros
            const totalRecords = await this.adapter.count(table);

            // Construir la consulta base
            let query = `SELECT * FROM ${this.adapter.escapeIdentifier(table)}`;
            const queryParams = [];

            // Aplicar búsqueda global
            if (search && search.value) {
                const whereClause = this.adapter.buildWhereClause(search.value, searchableColumns);
                query += ' ' + whereClause;
                if (whereClause) {
                    searchableColumns.forEach(() => {
                        queryParams.push(`%${search.value}%`);
                    });
                }
            }

            // Aplicar ordenamiento
            if (order && order.length > 0) {
                const orderColumn = columns[order[0].column].data;
                const orderDir = order[0].dir;
                query += ` ORDER BY ${this.adapter.escapeIdentifier(orderColumn)} ${orderDir}`;
            }

            // Aplicar paginación
            query += ' LIMIT ? OFFSET ?';
            queryParams.push(parseInt(length), parseInt(start));

            // Ejecutar la consulta
            const rows = await this.adapter.query(query, queryParams);

            // Obtener el total de registros filtrados
            let filteredRecords = totalRecords;
            if (search && search.value) {
                const whereClause = this.adapter.buildWhereClause(search.value, searchableColumns);
                filteredRecords = await this.adapter.count(table, whereClause, 
                    searchableColumns.map(() => `%${search.value}%`));
            }

            return {
                draw: parseInt(draw),
                recordsTotal: totalRecords,
                recordsFiltered: filteredRecords,
                data: rows
            };
        } catch (error) {
            console.error('Error en processRequest:', error);
            throw error;
        }
    }
}

module.exports = { DataTablesServer }; 