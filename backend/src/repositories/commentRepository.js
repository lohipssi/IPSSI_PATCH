const { AppDataSource } = require('../config/data-source');

class CommentRepository {
  constructor() {
    this.repository = null;
  }

  getRepository() {
    if (!this.repository) {
      this.repository = AppDataSource.getRepository('Comment');
    }
    return this.repository;
  }

  async findAll(limit = 50, offset = 0) {
    return await this.getRepository().find({
      order: { id: 'DESC' },
      take: limit,
      skip: offset
    });
  }

  async findById(id) {
    return await this.getRepository().findOne({
      where: { id }
    });
  }

  async create(commentData) {
    const comment = this.getRepository().create(commentData);
    return await this.getRepository().save(comment);
  }

  async count() {
    return await this.getRepository().count();
  }

  async delete(id) {
    const result = await this.getRepository().delete(id);
    return result.affected > 0;
  }
}

module.exports = new CommentRepository();
