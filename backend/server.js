const express = require('express');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcrypt');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

const app = express();
const port = process.env.PORT || 8000;

// Middleware de sécurité
app.use(helmet()); // Headers de sécurité HTTP
app.use(express.json()); // Remplacer express.text()
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // max 100 requêtes par IP
});
app.use(limiter);

// Connexion DB sécurisée
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
      
      // Requête préparée sécurisée
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

// Routes sécurisées

app.get('/populate', async (req, res) => {
  try {
    await insertRandomUsers();
    res.json({ success: true, message: 'Inserted 3 users' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// SUPPRIMER cette route dangereuse
// app.post('/query', ...) 

app.get('/users', (req, res) => {
  db.all('SELECT id, name, created_at FROM users', [], (err, rows) => {
    if (err) {
      console.error('Query error:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Route sécurisée pour obtenir un utilisateur par ID
app.get('/user/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  
  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
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
      res.json(row);
    }
  );
});

// Route sécurisée pour les commentaires
app.post('/comment', [
  body('content')
    .trim()
    .notEmpty().withMessage('Content is required')
    .isLength({ max: 500 }).withMessage('Content too long')
    .escape() // Protection XSS
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { content } = req.body;
  
  db.run(
    'INSERT INTO comments (content) VALUES (?)',
    [content],
    function(err) {
      if (err) {
        console.error('Insert error:', err.message);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ success: true, id: this.lastID });
    }
  );
});

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
