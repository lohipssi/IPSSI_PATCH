const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Comment',
  tableName: 'comments',
  columns: {
    id: {
      primary: true,
      type: 'int',
      generated: true
    },
    content: {
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
