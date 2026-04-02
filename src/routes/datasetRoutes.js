const express = require('express');
const multer = require('multer');
const DatasetController = require('../controllers/datasetController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // Stores in memory for ingestion parse

router.get('/', DatasetController.getDatasets);
router.post('/upload', upload.single('file'), DatasetController.uploadDataset);
router.get('/:id', DatasetController.getDatasetById);
router.post('/:id/query', DatasetController.queryDataset);
router.delete('/:id', DatasetController.deleteDataset);

module.exports = router;
