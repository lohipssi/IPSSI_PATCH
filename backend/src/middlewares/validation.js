const { body } = require('express-validator');

const commentValidation = [
  body('content')
    .optional()
    .trim()
    .notEmpty().withMessage('Content is required')
    .isLength({ max: 500 }).withMessage('Content too long')
];

module.exports = {
  commentValidation
};
