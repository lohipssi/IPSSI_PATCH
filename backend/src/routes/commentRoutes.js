const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');

// GET /comments - Liste tous les commentaires
router.get('/comments', commentController.getAllComments.bind(commentController));

// GET /comment/:id - Obtenir un commentaire par ID
router.get('/comment/:id', commentController.getCommentById.bind(commentController));

// POST /comment - Créer un commentaire
router.post('/comment', commentController.createComment.bind(commentController));

// GET /comments/count - Compter les commentaires
router.get('/comments/count', commentController.getCommentCount.bind(commentController));

module.exports = router;
