const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { param, body } = require('express-validator');

// GET /users - Liste tous les utilisateurs
router.get('/users', userController.getAllUsers.bind(userController));

// GET /user/:id - Obtenir un utilisateur par ID
router.get(
  '/user/:id',
  [param('id').isInt().withMessage('Invalid user ID')],
  userController.getUserById.bind(userController)
);

// POST /user - Rechercher un utilisateur (compatible avec App.js)
router.post(
  '/user',
  [body('id').optional().isInt().withMessage('Invalid user ID')],
  userController.getUserByIdPost.bind(userController)
);

// GET /populate - Peupler avec des utilisateurs aléatoires
router.get('/populate', userController.populateUsers.bind(userController));

// GET /users/count - Compter les utilisateurs
router.get('/users/count', userController.getUserCount.bind(userController));

module.exports = router;
