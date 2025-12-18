const express = require('express');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcrypt');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, param, validationResult } = require('express-validator');

const app = express();
const port = process.env.PORT || 8000;

// Middleware de sécurité
app.use(helmet());
app.use(express.json()); // Pour les requêtes JSON
app.use(express.text()); // Pour compatibilité avec l'ancien code
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Connexion DB
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('DB connection error:', err.message);
    process.exit(1);
  }
  console.log('Connected to SQLite database.');
});

// Créer les tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Fonction sécurisée pour insérer des utilisateurs
async function insertRandomUsers() {
  try {
    const urls = [1, 2, 3].map(() => axios.get('https://randomuser.me/api/'));
    const results = await Promise.all(urls);
    const users = results.map(r => r.data.results[0]);

    for (const u of users) {
      const fullName = `${u.name.first} ${u.name.last}`;
      const hashedPassword = await bcrypt.hash(u.login.password, 10);
      
      db.run(
        'INSERT INTO users (name, password) VALUES (?, ?)',
        [fullName, hashedPassword],
        (err) => {
          if (err) console.error('Insert error:', err.message);
        }
      );
    }
    console.log('Inserted 3 users into database.');
  } catch (err) {
    console.error('Error inserting users:', err.message);
    throw err;
  }
}

// ============= ROUTES =============

// Peupler la base
app.get('/populate', async (req, res) => {
  try {
    await insertRandomUsers();
    res.json({ success: true, message: 'Inserted 3 users' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Lister tous les utilisateurs (seulement id et name)
app.get('/users', (req, res) => {
  db.all('SELECT id, name, created_at FROM users', [], (err, rows) => {
    if (err) {
      console.error('Query error:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Obtenir un utilisateur par ID (route sécurisée via GET)
app.get('/user/:id', [
  param('id').isInt().withMessage('Invalid user ID')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const userId = parseInt(req.params.id);
  
  db.get(
    'SELECT id, name, created_at FROM users WHERE id = ?',
    [userId],
    (err, row) => {
      if (err) {
        console.error('Query error:', err.message);
        return res.status(500).json({ error: 'Database error' });
      }
      if (!row) {
        return res.status(404).json({ error: 'User not found' });
      }
      // Retourner dans un tableau pour compatibilité avec App.js
      res.json([row]);
    }
  );
});

// Route POST compatible avec l'ancien App.js (mais sécurisée)
app.post('/user', express.json(), [
  body('id').optional().isInt().withMessage('Invalid user ID')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Extraire l'ID du body JSON
  const userId = req.body.id;

  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  db.get(
    'SELECT id, name, created_at FROM users WHERE id = ?',
    [userId],
    (err, row) => {
      if (err) {
        console.error('Query error:', err.message);
        return res.status(500).json({ error: 'Database error' });
      }
      if (!row) {
        return res.status(404).json({ error: 'User not found' });
      }
      // Retourner dans un tableau pour compatibilité
      res.json([row]);
    }
  );
});

// Ajouter un commentaire (compatible avec text/plain et JSON)
app.post('/comment', (req, res) => {
  let content;
  
  // Supporter à la fois text/plain et application/json
  if (typeof req.body === 'string') {
    content = req.body.trim();
  } else if (req.body && req.body.content) {
    content = req.body.content.trim();
  } else {
    return res.status(400).json({ error: 'Content is required' });
  }

  // Validation
  if (!content || content.length === 0) {
    return res.status(400).json({ error: 'Content is required' });
  }

  if (content.length > 500) {
    return res.status(400).json({ error: 'Content too long (max 500 characters)' });
  }

  // Échapper les caractères HTML pour prévenir XSS
  const sanitizedContent = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  db.run(
    'INSERT INTO comments (content) VALUES (?)',
    [sanitizedContent],
    function(err) {
      if (err) {
        console.error('Insert error:', err.message);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ success: true, id: this.lastID });
    }
  );
});

// Lister les commentaires
app.get('/comments', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;

  db.all(
    'SELECT id, content, created_at FROM comments ORDER BY id DESC LIMIT ? OFFSET ?',
    [limit, offset],
    (err, rows) => {
      if (err) {
        console.error('Query error:', err.message);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
});

// Route de santé
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Gestion des erreurs globale
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Fermeture propre de la DB
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) console.error(err.message);
    console.log('Database connection closed.');
    process.exit(0);
  });
});

app.listen(port, () => {
  console.log(`App listening securely on port ${port}`);
});
