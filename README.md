# Data Processing Backend

A modular, production-grade Node.js/Express backend that allows users to upload, store, and dynamically query varying generic datasets (CSV/JSON formats) in a PostgreSQL database.

## 🛠 Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/en/) (v16.x or newer recommended)
- [PostgreSQL](https://www.postgresql.org/) database server installed and running.

### 1. Clone & Install
Clone the repository, then install project dependencies:
```bash
npm install
```

### 2. Configure Environment
A `.env` file must be present at the root of the project. A typical `.env` might look like:
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=dataprocessdb
```

### 3. Database Initialization
Ensure that your PostgreSQL server is active and the database listed in the `.env` file (e.g., `dataprocessdb`) explicitly exists.

To create the DB manually if it doesn't exist, log in to `psql` or pgAdmin:
```sql
CREATE DATABASE dataprocessdb;
```
> **Note:** The tables (`datasets` and `dataset_records`) will be **auto-created** upon starting the server through the application's startup script.

### 4. Run the Server
For development environment with auto-reload:
```bash
npm run dev
```

For production environment:
```bash
npm start
```
The server will default to listening on port `5000`. You can verify it's working via `http://localhost:5000/health`.

---

## 🧠 Approach and Design Decisions

1. **Architecture & Modularity**
   - The application utilizes a layered architecture separating concerns into **Routes**, **Controllers**, **Services**, and **Repositories**.
   - This prevents tightly coupling database interactions inside HTTP controllers and allows business logic (like query transformations) to be easily tested or modified.

2. **Schema-less Data Storage Strategy**
   - **Problem:** Different CSV and JSON files naturally possess unpredictable metadata limits and column schemas. 
   - **Solution:** While dataset metadata is stored securely in a structured relational table (`datasets`), the actual row entry records are safely stored inside a native `JSONB` column named `data` in the `dataset_records` table.
   - This bypasses the need for heavy dynamic DDL operations upon file uploads and natively handles fast, unstructured datasets dynamically without schema rigidness.

3. **Data Ingestion Buffer**
   - Uploaded files are pushed directly into Memory Storage using **Multer**. This ensures we do not have temporary files continuously lingering arbitrarily on the disk space.
   - The buffer is parsed efficiently through `csv-parse` manually for robust row isolation and pushed linearly to the Database Repository.

4. **In-Memory Transformation & Querying Strategy**
   - To accommodate querying fields dynamically without risking SQL Injection via arbitrary queries constructed purely from user inputs, complex data transformations (such as `filtering`, `grouping`, and metric `aggregations`) are processed in-memory within the `TransformationService`.

5. **Pagination & Global Searching**
   - Global searching (finding arbitrary keywords across unspecified headers/JSON keys) and limiting slice counts via `limit` / `page` parameters are securely executed synchronously. 
   - Datasets are chunked post-processing ensuring the client/UI receives exact mathematically computed boundaries without crashing under mega-payload renders.

---

## ⚠️ Assumptions Made

1. **File Footprint & System Resources**
   - **Scale Focus:** It is reasonably assumed that testing files and uploaded datasets are small-to-medium files (under 15-20MB). Both the Multer memory buffer and the current in-memory `Array` mapping transformation iterations (including fetching the entire `JSONB` stack for full pagination index computations) naturally consume server/instance RAM proportional to the size of the dataset.

2. **Filtering Condition Parameters**
   - Filtering operations primarily account for string and numeric scalar comparisons (`eq`, `ne`, `gt`, `lt`). Heavily sorting and parsing deeply nested multi-dimensional `JSON` sub-arrays require correctly specified query payloads on the client end manually targeting dot-notation equivalents in specific use-cases.

3. **Data Integrity & Ingest Completeness**
   - It is assumed data coming from the CSV or JSON file is well-formed natively. Missing keys/headers across dynamically sparse rows will reliably be filtered out through standard `undefined` or null equality boundaries.

4. **Public Access Usage**
   - Standard Authentication/Authorization (such as Tenant-based JWT endpoints) is skipped from restriction boundaries since this endpoint assumes the user interacting has explicit and permitted access functionally needed internally.