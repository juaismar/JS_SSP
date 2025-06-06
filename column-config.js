class ColumnConfig {
    constructor(config) {
        this.db = config.db;           // Nombre de la columna en la base de datos
        this.dt = config.dt;           // Nombre de la columna en DataTables
        this.formatter = config.formatter || null;  // Función formateadora opcional
    }

    format(value) {
        if (this.formatter && typeof this.formatter === 'function') {
            return this.formatter(value);
        }
        return value;
    }
}

module.exports = ColumnConfig; 