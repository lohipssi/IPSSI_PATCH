require('reflect-metadata');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initializeDatabase } = require('./src/config/data-source');
const userRoutes = require('./src/routes/userRoutes');
const commentRoutes = require('./src/routes/commentRoutes');

const app = express();
const port = process.env.PORT || 8000;

// Middleware de sécurité
app.use(helmet());
app.use(express.json());
app.use(express.text()); // Support text/plain pour compatibilité
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

// Routes
app.use('/', userRoutes);
app.use('/', commentRoutes);

// Route de santé
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: 'TypeORM with SQLite',
    architecture: 'Layered (Repository > Service > Controller)'
  });
});

// Gestion 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Gestion des erreurs globale
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Démarrage du serveur
const startServer = async () => {
  try {
    // Initialiser la base de données avec TypeORM
    await initializeDatabase();
    
    // Démarrer le serveur Express
    app.listen(port, () => {
      console.log('='.repeat(50));
      console.log('🚀 Server started successfully!');
      console.log('='.repeat(50));
      console.log(`📍 Port: ${port}`);
      console.log(`🗄️  Database: SQLite with TypeORM`);
      console.log(`🏗️  Architecture: Layered (Repository > Service > Controller)`);
      console.log(`📊 Health check: http://localhost:${port}/health`);
      console.log('='.repeat(50));
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Fermeture propre
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received, shutting down...');
  process.exit(0);
});

// Lancer le serveur
startServer();
