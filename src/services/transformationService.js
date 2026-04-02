const DatasetRepository = require('../repositories/datasetRepository');

class TransformationService {
  /**
   * Chains filters, groupings, and aggregations on a dataset.
   * queryParams shape: { filters: [{field, value, operator}], groupings: [field1, field2], aggregations: [{field, op: 'sum'}] }
   */
  static async query(datasetId, options = {}) {
    const { filters = [], groupings = [], aggregations = [] } = options;
    const recordsData = await DatasetRepository.getRecords(datasetId);

    if (recordsData.length === 0) return [];

    let result = [...recordsData];

    // 1. Filtering
    if (filters.length > 0) {
      result = result.filter(record => {
        return filters.every(f => {
          const val = record[f.field];
          if (val === undefined || val === null) return false;
          
          // Simple string/number equality for now
          // Could be extended for >, <, contains etc.
          if (f.operator === 'eq' || !f.operator) {
             return String(val) === String(f.value);
          }
           if (f.operator === 'ne') return String(val) !== String(f.value);
           if (f.operator === 'gt') return Number(val) > Number(f.value);
           if (f.operator === 'lt') return Number(val) < Number(f.value);
           
           return true;
        });
      });
    }

    // 2. Grouping & Aggregating
    if (groupings.length > 0 || aggregations.length > 0) {
      const groups = {};

      result.forEach(record => {
        const groupKey = groupings.map(g => record[g] ?? 'null').join('|');
        if (!groups[groupKey]) {
          groups[groupKey] = {
            _records: [],
            _meta: {}
          };
          groupings.forEach(g => { groups[groupKey]._meta[g] = record[g] ?? 'null'; });
        }
        groups[groupKey]._records.push(record);
      });

      // Process aggregations
      const finalResult = Object.values(groups).map(group => {
        let entry = { ...group._meta };
        
        if (aggregations.length > 0) {
          aggregations.forEach(agg => {
            const field = agg.field;
            const op = agg.op; // sum, count, avg
            const key = `${op}_${field}`;

            if (op === 'count') {
              entry[key] = group._records.length;
            } else if (op === 'sum') {
              entry[key] = group._records.reduce((acc, r) => acc + (parseFloat(r[field]) || 0), 0);
            } else if (op === 'avg') {
              const sum = group._records.reduce((acc, r) => acc + (parseFloat(r[field]) || 0), 0);
              entry[key] = sum / group._records.length;
            } else if (op === 'min') {
              entry[key] = Math.min(...group._records.map(r => parseFloat(r[field]) || Infinity));
            } else if (op === 'max') {
               entry[key] = Math.max(...group._records.map(r => parseFloat(r[field]) || -Infinity));
            }
          });
        } else {
             // If groupings but no aggregations, just return group meta + count
             entry.count = group._records.length;
        }

        return entry;
      });

      return finalResult;
    }

    return result;
  }
}

module.exports = TransformationService;
