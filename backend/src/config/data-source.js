require('reflect-metadata');
const { DataSource } = require('typeorm');
const path = require('path');

const User = require('../entities/User');
const Comment = require('../entities/Comment');

const AppDataSource = new DataSource({
  type: 'sqlite',
  database: path.join(__dirname, '../../database.db'),
  synchronize: true, // Auto-création des tables (dev uniquement)
  logging: process.env.NODE_ENV === 'development',
  entities: [User, Comment]
});

const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully with TypeORM');
    return AppDataSource;
  } catch (error) {
    console.error('❌ Error during database initialization:', error);
    throw error;
  }
};

module.exports = { AppDataSource, initializeDatabase };
