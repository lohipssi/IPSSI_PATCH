const commentService = require('../services/commentService');
const { validationResult } = require('express-validator');

class CommentController {
  async getAllComments(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;

      const comments = await commentService.getAllComments(limit, offset);
      res.json(comments);
    } catch (error) {
      console.error('Error in getAllComments:', error);
      res.status(500).json({ error: 'Database error' });
    }
  }

  async getCommentById(req, res) {
    try {
      const commentId = parseInt(req.params.id);
      
      if (isNaN(commentId)) {
        return res.status(400).json({ error: 'Invalid comment ID' });
      }

      const comment = await commentService.getCommentById(commentId);
      res.json(comment);
    } catch (error) {
      if (error.message === 'Comment not found') {
        return res.status(404).json({ error: 'Comment not found' });
      }
      console.error('Error in getCommentById:', error);
      res.status(500).json({ error: 'Database error' });
    }
  }

  async createComment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      let content;
      
      // Support text/plain et JSON
      if (typeof req.body === 'string') {
        content = req.body.trim();
      } else if (req.body && req.body.content) {
        content = req.body.content.trim();
      } else {
        return res.status(400).json({ error: 'Content is required' });
      }

      const comment = await commentService.createComment(content);
      res.status(201).json({ 
        success: true, 
        comment: {
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt
        }
      });
    } catch (error) {
      if (error.message.includes('required') || error.message.includes('too long')) {
        return res.status(400).json({ error: error.message });
      }
      console.error('Error in createComment:', error);
      res.status(500).json({ error: 'Database error' });
    }
  }

  async getCommentCount(req, res) {
    try {
      const count = await commentService.getCommentCount();
      res.json({ count });
    } catch (error) {
      console.error('Error in getCommentCount:', error);
      res.status(500).json({ error: 'Database error' });
    }
  }
}

module.exports = new CommentController();
