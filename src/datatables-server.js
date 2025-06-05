const MySQLAdapter = require('./adapters/mysql-adapter');
const PostgresAdapter = require('./adapters/postgres-adapter');
const ColumnConfig = require('./column-config');

class SSP {
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

    async Simple(params, table, columns) {
        const {
            draw,
            start,
            length,
            search,
            order,
        } = params;

        try {
            // Configurar las columnas
            const columnConfigs = columns.map(col => new ColumnConfig(col));

            // Obtener el total de registros
            const totalRecords = await this.adapter.count(table);

            // Construir la consulta base
            const selectColumns = columnConfigs.map(col => 
                this.adapter.escapeIdentifier(col.db)
            ).join(', ');

            let query = `SELECT ${selectColumns} FROM ${this.adapter.escapeIdentifier(table)}`;
            const queryParams = [];

            // Aplicar búsqueda global
            if (search && search.value) {
                const searchableColumns = params.columns
                    .filter(col => col.searchable === 'true')
                    .map(col => columnConfigs.find(c => c.dt === col.data)?.db)
                    .filter(Boolean);
                
                const whereClause = this.adapter.buildWhereClause(search.value, searchableColumns);
                query += ' ' + whereClause;
                if (whereClause) {
                    searchableColumns.forEach(() => {
                        queryParams.push(`%${search.value}%`);
                    });
                }
            }

            // Aplicar ordenamiento
            if (order && order.length > 0 && columnConfigs.length > 0) {
                const orderColumn = params.columns[order[0].column];
                if (orderColumn && orderColumn.orderable === 'true') {
                    const orderDir = order[0].dir;
                    const dbColumn = columnConfigs.find(c => c.dt === orderColumn.data)?.db;
                    if (dbColumn) {
                        query += ` ORDER BY ${this.adapter.escapeIdentifier(dbColumn)} ${orderDir}`;
                    }
                }
            }

            // Aplicar paginación
            query += ' LIMIT ? OFFSET ?';
            queryParams.push(parseInt(length), parseInt(start));

            // Ejecutar la consulta
            const rows = await this.adapter.query(query, queryParams);

            // Formatear los resultados
            const formattedRows = rows.map(row => {
                const formattedRow = {};
                columnConfigs.forEach(col => {
                    formattedRow[col.dt] = col.format(row[col.db]);
                });
                return formattedRow;
            });

            // Obtener el total de registros filtrados
            let filteredRecords = totalRecords;
            if (search && search.value) {
                const searchableColumns = params.columns
                    .filter(col => col.searchable === 'true')
                    .map(col => columnConfigs.find(c => c.dt === col.data)?.db)
                    .filter(Boolean);
                
                const whereClause = this.adapter.buildWhereClause(search.value, searchableColumns);
                filteredRecords = await this.adapter.count(table, whereClause, 
                    searchableColumns.map(() => `%${search.value}%`));
            }

            return {
                draw: parseInt(draw),
                recordsTotal: totalRecords,
                recordsFiltered: filteredRecords,
                data: formattedRows
            };
        } catch (error) {
            console.error('Error en Simple:', error);
            throw error;
        }
    }
}

module.exports = { SSP }; 