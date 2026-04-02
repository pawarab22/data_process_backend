const { pool } = require('./db');

class DatabaseInitializer {
  static async init() {
    const createDatasetsTable = `
      CREATE TABLE IF NOT EXISTS datasets (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createDatasetRecordsTable = `
      CREATE TABLE IF NOT EXISTS dataset_records (
        id SERIAL PRIMARY KEY,
        dataset_id INTEGER REFERENCES datasets(id) ON DELETE CASCADE,
        data JSONB NOT NULL
      );
    `;

    try {
      await pool.query(createDatasetsTable);
      await pool.query(createDatasetRecordsTable);
      console.log('Database tables initialized.');
    } catch (err) {
      console.error('Error initializing database tables:', err);
    }
  }
}

module.exports = DatabaseInitializer;
