const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'User',
  tableName: 'users',
  columns: {
    id: {
      primary: true,
      type: 'int',
      generated: true
    },
    name: {
      type: 'text',
      nullable: false
    },
    password: {
      type: 'text',
      nullable: false
    },
    createdAt: {
      name: 'created_at',
      type: 'datetime',
      createDate: true,
      default: () => 'CURRENT_TIMESTAMP'
    }
  }
});
