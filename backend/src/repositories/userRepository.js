const { AppDataSource } = require('../config/data-source');

class UserRepository {
  constructor() {
    this.repository = null;
  }

  getRepository() {
    if (!this.repository) {
      this.repository = AppDataSource.getRepository('User');
    }
    return this.repository;
  }

  async findAll() {
    return await this.getRepository().find({
      select: ['id', 'name', 'createdAt'],
      order: { id: 'ASC' }
    });
  }

  async findById(id) {
    return await this.getRepository().findOne({
      where: { id },
      select: ['id', 'name', 'createdAt']
    });
  }

  async create(userData) {
    const user = this.getRepository().create(userData);
    return await this.getRepository().save(user);
  }

  async count() {
    return await this.getRepository().count();
  }

  async delete(id) {
    const result = await this.getRepository().delete(id);
    return result.affected > 0;
  }
}

module.exports = new UserRepository();
