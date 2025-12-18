const commentRepository = require('../repositories/commentRepository');

class CommentService {
  async getAllComments(limit = 50, offset = 0) {
    try {
      return await commentRepository.findAll(limit, offset);
    } catch (error) {
      console.error('Error fetching comments:', error.message);
      throw new Error('Unable to fetch comments');
    }
  }

  async getCommentById(id) {
    try {
      const comment = await commentRepository.findById(id);
      if (!comment) {
        throw new Error('Comment not found');
      }
      return comment;
    } catch (error) {
      throw error;
    }
  }

  async createComment(content) {
    try {
      // Validation
      if (!content || content.trim().length === 0) {
        throw new Error('Content is required');
      }

      if (content.length > 500) {
        throw new Error('Comment too long (max 500 characters)');
      }

      // Échappement HTML pour prévenir XSS
      const sanitizedContent = content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');

      return await commentRepository.create({
        content: sanitizedContent
      });
    } catch (error) {
      throw error;
    }
  }

  async getCommentCount() {
    try {
      return await commentRepository.count();
    } catch (error) {
      console.error('Error counting comments:', error.message);
      throw new Error('Unable to count comments');
    }
  }
}

module.exports = new CommentService();
