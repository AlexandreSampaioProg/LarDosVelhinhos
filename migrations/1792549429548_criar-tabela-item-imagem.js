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

    pgm.createTable('item_imagem', {
    id: 'id',
    item_id: {
      type: 'integer',
      notNull: true,
      references: '"item"',
      onDelete: 'CASCADE',
    },
    arquivo: { type: 'varchar(255)', notNull: true },
    ordem: { type: 'smallint', notNull: true, default: 0 },
    principal: { type: 'boolean', notNull: true, default: false },
    data_criacao: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createIndex('item_imagem', 'item_id');

};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.dropTable('item_imagem');
};
