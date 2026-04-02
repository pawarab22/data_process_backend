const IngestionService = require('../services/ingestionService');
const TransformationService = require('../services/transformationService');
const DatasetRepository = require('../repositories/datasetRepository');

class DatasetController {
  static async uploadDataset(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
      }
      
      const { name } = req.body;
      const result = await IngestionService.processFile(req.file, name);
      
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getDatasets(req, res, next) {
    try {
      const datasets = await DatasetRepository.getAllDatasets();
      res.json(datasets);
    } catch (err) {
      next(err);
    }
  }

  static async getDatasetById(req, res, next) {
    try {
      const { id } = req.params;
      const dataset = await DatasetRepository.getDatasetById(id);
      if (!dataset) return res.status(404).json({ error: 'Dataset not found.' });
      
      // Also return first few records for schema/preview
      const records = await DatasetRepository.getRecords(id);
      res.json({ dataset, records: records.slice(0, 100), totalRecords: records.length });
    } catch (err) {
      next(err);
    }
  }

  static async queryDataset(req, res, next) {
    try {
      const { id } = req.params;
      const options = req.body; // { filters, groupings, aggregations }
      const data = await TransformationService.query(id, options);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  static async deleteDataset(req, res, next) {
    try {
      const { id } = req.params;
      await DatasetRepository.deleteDataset(id);
      res.json({ message: 'Dataset deleted.' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = DatasetController;
