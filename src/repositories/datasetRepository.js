const { query } = require('../config/db');

class DatasetRepository {
  static async createDataset(name, type) {
    const result = await query(
      'INSERT INTO datasets (name, type) VALUES ($1, $2) RETURNING id, name, type, created_at',
      [name, type]
    );
    return result.rows[0];
  }

  static async addRecords(datasetId, records) {
    // records is an array of objects.
    // Insert into dataset_records (dataset_id, data)
    // We can use a query with unnest for bulk insert or insert JSONB directly.
    const values = records.map((record) => `(${datasetId}, '${JSON.stringify(record).replace(/'/g, "''")}')`);
    const q = `INSERT INTO dataset_records (dataset_id, data) VALUES ${values.join(', ')}`;
    return await query(q);
  }

  static async getAllDatasets() {
    const result = await query('SELECT * FROM datasets ORDER BY created_at DESC');
    return result.rows;
  }

  static async getDatasetById(id) {
    const result = await query('SELECT * FROM datasets WHERE id = $1', [id]);
    return result.rows[0];
  }
  
  static async getRecords(datasetId) {
    const result = await query('SELECT data FROM dataset_records WHERE dataset_id = $1', [datasetId]);
    return result.rows.map(r => r.data);
  }

  static async deleteDataset(id) {
    await query('DELETE FROM dataset_records WHERE dataset_id = $1', [id]);
    await query('DELETE FROM datasets WHERE id = $1', [id]);
  }
}

module.exports = DatasetRepository;
