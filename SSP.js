const MySQLAdapter = require('./adapters/mysql-adapter');
const PostgresAdapter = require('./adapters/postgres-adapter');

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
            const columnsTypes = await this.adapter.InitBinding(table);
            
            const individualFilter = this.filterIndividual(params, columnsTypes, columns);
            const globalFilter = this.filterGlobal(params, columnsTypes, columns);

            let filtersQuery = this.mergeFilters([individualFilter, globalFilter]);

            // Obtener los datos con filtros, ordenación y paginación
            const rows = await this.adapter.query(table, filtersQuery, params.start, params.length, this.order(params));
            const formattedRows = this.dataOutput(rows, columns);

            // Calcular el total de registros filtrados
            let filteredCount = await this.adapter.count(table, filtersQuery);

            // Obtener el total de registros
            const recordsTotal = await this.adapter.count(table);

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

    async Complex(params, table, columns, whereResult , whereAll) {
        try {
            const columnsTypes = await this.adapter.InitBinding(table);
            
            const individualFilter = this.filterIndividual(params, columnsTypes, columns);
            const globalFilter = this.filterGlobal(params, columnsTypes, columns);

            const WhereResultFilter = whereResult.join(' AND ');
            const WhereAllFilter = whereAll.join(' AND ');
            
            let filtersQuery = this.mergeFilters([individualFilter, globalFilter,WhereResultFilter,WhereAllFilter]);

            // Obtener los datos con filtros, ordenación y paginación
            const rows = await this.adapter.query(table, filtersQuery, params.start, params.length, this.order(params));
            const formattedRows = this.dataOutput(rows, columns);

            // Calcular el total de registros filtrados
            let filteredCount = await this.adapter.count(table, filtersQuery);

            // Obtener el total de registros
            const recordsTotal = await this.adapter.count(table, WhereAllFilter);

            // Devolver la respuesta en el formato esperado por DataTables
            return {
                draw: parseInt(params.draw),
                recordsTotal: recordsTotal,
                recordsFiltered: filteredCount,
                data: formattedRows
            };
        } catch (error) {
            console.error('Error en Complex:', error);
            throw error;
        }
    }

    mergeFilters(filters) {
        // Filtrar strings vacíos y unir los que quedan con AND
        const validFilters = filters.filter(filter => filter && filter.trim() !== '');
        return validFilters.length > 0 ? `(${validFilters.join(') AND (')})` : '';
    }

    filterIndividual(params, columnsTypes, columns) {
        const conditions = [];
        let i = 0;
        
        while (params[`columns[${i}][data]`]) {
            const data = params[`columns[${i}][data]`];
            const searchable = params[`columns[${i}][searchable]`];
            const searchValue = params[`columns[${i}][search][value]`];
            const searchRegex = params[`columns[${i}][search][regex]`];

            if(searchValue === ""){
                i++;
                continue;
            }
            
            if (searchable === 'true') {
                let columnIdx = columns.findIndex(col => col.dt === data);
                let query = this.bindingTypes(searchValue, columnsTypes, columns[columnIdx], searchRegex);
                if (query) {
                    conditions.push(query);
                }
            } else {
                console.warn(`(001) ¿Olvidaste searchable: false en la columna ${data}? o nombre de columna incorrecto en el lado del cliente\n (campo data del cliente: debe ser igual que el campo DT del servidor)`);
            }
            i++;
        }

        return conditions.join(' AND ');
    }

    filterGlobal(params, columnsTypes, columns) {
        const searchValue = params['search[value]'];
        if (!searchValue) {
            return '';
        }

        const conditions = [];
        let i = 0;
        
        while (params[`columns[${i}][data]`]) {
            const data = params[`columns[${i}][data]`];
            const searchable = params[`columns[${i}][searchable]`];
            
            if(data === ""){
                break;
            }
            
            if (searchable === 'true') {
                let columnIdx = columns.findIndex(col => col.dt === data);
                let searchRegex = params[`columns[${i}][search][regex]`];

                let query = this.bindingTypes(searchValue, columnsTypes, columns[columnIdx], searchRegex)
                if (query) {
                    conditions.push(query);
                }
            } else {
                console.warn(`(002) ¿Olvidaste searchable: false en la columna ${data}? o nombre de columna incorrecto en el lado del cliente\n (campo data del cliente: debe ser igual que el campo DT del servidor)`);
            }
            i++;
        }

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
        let i = 0;

        while (params[`order[${i}][column]`]) {
            const columnIndex = parseInt(params[`order[${i}][column]`]);
            const direction = params[`order[${i}][dir]`];
            const data = params[`columns[${columnIndex}][data]`];
            const orderable = params[`columns[${columnIndex}][orderable]`];

            if (orderable === 'true' && data) {
                orderClauses.push(`${this.adapter.escapeIdentifier(data)} ${direction.toUpperCase()}`);
            } else if (orderable === 'true') {
                console.warn(`(003) ¿Olvidaste orderable: false en la columna ${columnIndex}?`);
            }
            i++;
        }

        return orderClauses;
    }

    bindingTypes(value, columnsType, column, isRegEx) {
        
        const columnInfo = columnsType.find(col => 
            column.db === col.columnName
        );

        if (columnInfo) {
            return this.adapter.bindingTypesQuery(
                value,
                columnInfo,
                isRegEx,
                column
            );
        }

        return '';
    }
    
}

module.exports = { SSP }; 