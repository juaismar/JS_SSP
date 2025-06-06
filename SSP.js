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
        console.log(params);
        console.log(table);
        console.log(columns);
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
        params.columns.forEach((columnReceived, index) => {

            if(columnReceived.search.value == ""){
                return;
            }
            
            if (columnReceived.searchable === 'true') {
                let columnIdx = columns.findIndex(col => col.dt === columnReceived.data);
                let query = this.bindingTypes(columnReceived.search.value, columnsTypes, columns[columnIdx], columnReceived.search.regex);
                if (query) {
                    conditions.push(query);
                }
            } else{
                console.warn(`(001) ¿Olvidaste searchable: false en la columna ${columnReceived.data}? o nombre de columna incorrecto en el lado del cliente\n (campo data del cliente: debe ser igual que el campo DT del servidor)`);
            }
        });

        return conditions.join(' AND ');
    }

    filterGlobal(params, columnsTypes, columns) {
        if (!params.search || !params.search.value) {
            return '';
        }

        const conditions = [];
        for (let i = 0; i < params.columns.length; i++) {
            if(params.columns[i].data == ""){
                break;
            }
            
            if (params.columns[i].searchable == 'true') {
                let columnIdx = columns.findIndex(col => col.dt === params.columns[i].data);
                let requestRegex = params.columns[i].search.regex;

                let query = this.bindingTypes(params.search.value, columnsTypes, columns[columnIdx], requestRegex)
                if (query) {
                    conditions.push(query);
                }
            } else if (col.searchable === 'true') {
                console.warn(`(002) ¿Olvidaste searchable: false en la columna ${col.data}? o nombre de columna incorrecto en el lado del cliente\n (campo data del cliente: debe ser igual que el campo DT del servidor)`);
            }
        };

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

    removeEscapeChar(str) {
        return str.replace(/"/g, '');
    }

    checkReserved(columnName) {
        // Lista de palabras reservadas en PostgreSQL
        const reservedWords = [
            'all', 'analyse', 'analyze', 'and', 'any', 'array', 'as', 'asc', 'asymmetric',
            'authorization', 'binary', 'both', 'case', 'cast', 'check', 'collate', 'column',
            'constraint', 'create', 'cross', 'current_date', 'current_role', 'current_time',
            'current_timestamp', 'current_user', 'default', 'deferrable', 'desc', 'distinct',
            'do', 'else', 'end', 'except', 'false', 'for', 'foreign', 'freeze', 'from', 'full',
            'grant', 'group', 'having', 'in', 'initially', 'inner', 'intersect', 'into', 'is',
            'isnull', 'join', 'leading', 'left', 'like', 'limit', 'localtime', 'localtimestamp',
            'natural', 'not', 'notnull', 'null', 'offset', 'on', 'only', 'or', 'order', 'outer',
            'overlaps', 'placing', 'primary', 'references', 'right', 'select', 'session_user',
            'similar', 'some', 'symmetric', 'table', 'then', 'to', 'trailing', 'true', 'union',
            'unique', 'user', 'using', 'when', 'where', 'with'
        ];

        return reservedWords.includes(columnName.toLowerCase());
    }

    
}

module.exports = { SSP }; 