const userService = require('../services/userService');
const { validationResult } = require('express-validator');

class UserController {
  async getAllUsers(req, res) {
    try {
      const users = await userService.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      res.status(500).json({ error: 'Database error' });
    }
  }

  async getUserById(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = parseInt(req.params.id);
      const user = await userService.getUserById(userId);
      
      // Retourner dans un tableau pour compatibilité avec App.js
      res.json([user]);
    } catch (error) {
      if (error.message === 'User not found') {
        return res.status(404).json({ error: 'User not found' });
      }
      console.error('Error in getUserById:', error);
      res.status(500).json({ error: 'Database error' });
    }
  }

  async getUserByIdPost(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.body.id;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
      }

      const user = await userService.getUserById(parseInt(userId));
      res.json([user]);
    } catch (error) {
      if (error.message === 'User not found') {
        return res.status(404).json({ error: 'User not found' });
      }
      console.error('Error in getUserByIdPost:', error);
      res.status(500).json({ error: 'Database error' });
    }
  }

  async populateUsers(req, res) {
    try {
      const users = await userService.populateRandomUsers(3);
      res.json({ 
        success: true, 
        message: `Inserted ${users.length} users`,
        users: users.map(u => ({ id: u.id, name: u.name }))
      });
    } catch (error) {
      console.error('Error in populateUsers:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getUserCount(req, res) {
    try {
      const count = await userService.getUserCount();
      res.json({ count });
    } catch (error) {
      console.error('Error in getUserCount:', error);
      res.status(500).json({ error: 'Database error' });
    }
  }
}

module.exports = new UserController();
