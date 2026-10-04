/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
    pgm.createTable('item', {
        id: 'id',
        nome: { type: 'varchar(30)', notNull: true},
        descricao: { type: 'text', notNull: true },
        preco: { type: 'numeric(10,2)', notNull: true },
        status: {type: 'varchar(20)', notNull: true, default: 'disponível'}, 
        data_criacao: {type: 'timestamp', notNull: true, default: pgm.func('current_timestamp')},
    });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.dropTable('item');
};
