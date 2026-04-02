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
      const { page = 1, limit = 20, search = '' } = req.query;

      const dataset = await DatasetRepository.getDatasetById(id);
      if (!dataset) return res.status(404).json({ error: 'Dataset not found.' });
      
      let records = await DatasetRepository.getRecords(id);

      if (search) {
         const lowerSearch = search.toLowerCase();
         records = records.filter(record => {
            return Object.values(record).some(val => 
               val !== null && val !== undefined && String(val).toLowerCase().includes(lowerSearch)
            );
         });
      }

      const totalRecords = records.length;
      const parsedPage = parseInt(page);
      const parsedLimit = parseInt(limit);
      
      const startIndex = (parsedPage - 1) * parsedLimit;
      const endIndex = startIndex + parsedLimit;
      const paginatedRecords = records.slice(startIndex, endIndex);

      res.json({
        dataset,
        records: paginatedRecords,
        pagination: {
           totalRecords,
           currentPage: parsedPage,
           totalPages: Math.ceil(totalRecords / parsedLimit),
           limit: parsedLimit
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async queryDataset(req, res, next) {
    try {
      const { id } = req.params;
      
      const dataset = await DatasetRepository.getDatasetById(id);
      if (!dataset) {
        return res.status(404).json({ error: 'Dataset not found. Cannot query an empty or non-existent dataset.' });
      }

      const options = req.body; // { filters, groupings, aggregations, page, limit }
      
      if (options.filters && !Array.isArray(options.filters)) {
        return res.status(400).json({ error: 'Invalid query parameters: "filters" must be an array.' });
      }
      if (options.groupings && !Array.isArray(options.groupings)) {
        return res.status(400).json({ error: 'Invalid query parameters: "groupings" must be an array.' });
      }
      if (options.aggregations && !Array.isArray(options.aggregations)) {
        return res.status(400).json({ error: 'Invalid query parameters: "aggregations" must be an array.' });
      }

      const rawData = await TransformationService.query(id, options);
      
      const page = parseInt(options.page || 1);
      const limit = parseInt(options.limit || 20);
      const totalRecords = rawData.length;
      
      const startIndex = (page - 1) * limit;
      const endIndex = Math.min(startIndex + limit, totalRecords);
      const paginatedData = rawData.slice(startIndex, endIndex);

      res.json({
         data: paginatedData,
         pagination: {
            totalRecords,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit),
            limit
         }
      });
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
