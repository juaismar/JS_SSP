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
        try {
            console.log(params);
            
            const individualFilter = this.filterIndividual(params);
            const globalFilter = this.filterGlobal(params);

            let filtersQuery = individualFilter;
            if (filtersQuery == "") {
                filtersQuery = globalFilter;
            } else {
                filtersQuery += ' AND ' + globalFilter;
            }

            // Obtener los datos con filtros, ordenación y paginación
            const rows = await this.adapter.query(table, filtersQuery, params.start, params.length, this.order(params));
            const formattedRows = this.dataOutput(rows, columns);

            // Calcular el total de registros filtrados
            let filteredCount = await this.adapter.count(table, filtersQuery);
            console.log("filteredCount");
            console.log(filteredCount);

            // Obtener el total de registros
            const recordsTotal = await this.adapter.count(table);
            console.log("recordsTotal");
            console.log(recordsTotal);

            // Devolver la respuesta en el formato esperado por DataTables
            return {
                draw: parseInt(params.draw),
                recordsTotal: recordsTotal,
                recordsFiltered: filteredCount,
                data: formattedRows
            };
        } catch (error) {
            console.error('Error en Simple:', error);
            throw error;
        }
    }

    filterIndividual(params) {
        const conditions = [];
        params.columns.forEach((col, index) => {
            const columnConfig = params.columns.find(c => c.dt === col.data);
            
            if (columnConfig && col.searchable === 'true' && col.search && col.search.value) {
                const isNumeric = /^[0-9]+$/.test(col.search.value);
                let query;

                if (isNumeric) {
                    query = `${this.adapter.escapeIdentifier(columnConfig.db)} = ${parseInt(col.search.value)}`;
                } else {
                    query = `${this.adapter.escapeIdentifier(columnConfig.db)}::text ILIKE '%${col.search.value}%'`;
                }

                if (query) {
                    conditions.push(query);
                }
            } else if (col.searchable === 'true') {
                console.warn(`(001) ¿Olvidaste searchable: false en la columna ${col.data}? o nombre de columna incorrecto en el lado del cliente\n (campo data del cliente: debe ser igual que el campo DT del servidor)`);
            }
        });

        return conditions.join(' AND ');
    }

    filterGlobal(params) {
        if (!params.search || !params.search.value) {
            return '';
        }

        const conditions = [];

        requestColumns.forEach((col, index) => {
            const columnConfig = params.columns.find(c => c.dt === col.data);
            
            if (columnConfig && col.searchable === 'true') {
                const isNumeric = /^[0-9]+$/.test(search.value);
                let query;

                if (isNumeric) {
                    query = `${this.adapter.escapeIdentifier(columnConfig.db)} = ${parseInt(search.value)}`;
                } else {
                    query = `${this.adapter.escapeIdentifier(columnConfig.db)}::text ILIKE '%${search.value}%'`;
                }

                if (query) {
                    conditions.push(query);
                }
            } else if (col.searchable === 'true') {
                console.warn(`(002) ¿Olvidaste searchable: false en la columna ${col.data}? o nombre de columna incorrecto en el lado del cliente\n (campo data del cliente: debe ser igual que el campo DT del servidor)`);
            }
        });

        return conditions.join(' OR ');
    }

    dataOutput(rows, columns) {
        return rows.map(row => {
            const formattedRow = {};
            columns.forEach(col => {
                const value = row[col.db];
                formattedRow[col.dt] = col.formatter ? col.formatter(value, row) : value;
            });
            return formattedRow;
        });
    }

    order(params) {
        const orderClauses = [];
        if (!params.order || !params.order.length) {
            return orderClauses;
        }

        for (let i = 0; i < params.order.length; i++) {
            const orderInfo = params.order[i];
            const columnIndex = orderInfo.column;
            const columnData = params.columns[columnIndex];

            if (columnData && columnData.orderable === 'true') {
                const columnName = columnData.data;
                if(columnName != null){
                    const direction = orderInfo.dir.toUpperCase();
                    orderClauses.push(`${this.adapter.escapeIdentifier(columnName)} ${direction}`);
                }
            } else if (columnData && columnData.orderable === 'true') {
                console.warn(`(003) ¿Olvidaste orderable: false en la columna ${columnIndex}?`);
            }
        }

        return orderClauses;
    }
}

module.exports = { SSP }; 