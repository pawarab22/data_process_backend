const { parse } = require('csv-parse/sync');
const DatasetRepository = require('../repositories/datasetRepository');

class IngestionService {
  static async processFile(file, name) {
    const { buffer, originalname, mimetype } = file;
    let records = [];
    let type = '';

    if (mimetype === 'text/csv' || originalname.endsWith('.csv')) {
      records = parse(buffer.toString(), {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
      type = 'csv';
    } else if (mimetype === 'application/json' || originalname.endsWith('.json')) {
      const data = JSON.parse(buffer.toString());
      records = Array.isArray(data) ? data : [data];
      type = 'json';
    } else {
      throw new Error('Invalid file format. Only CSV and JSON are supported.');
    }

    if (records.length === 0) {
      throw new Error('Empty file or no valid records found.');
    }

    const dataset = await DatasetRepository.createDataset(name || originalname, type);
    await DatasetRepository.addRecords(dataset.id, records);

    return {
      dataset,
      rowCount: records.length,
    };
  }
}

module.exports = IngestionService;
