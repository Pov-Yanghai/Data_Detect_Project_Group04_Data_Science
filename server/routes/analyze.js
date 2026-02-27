// import express from 'express';
// import axios from 'axios';
// import { readFileSync } from 'fs';

// const router = express.Router();

// router.post('/', async (req, res, next) => {
//   try {
//     const { filepath, analysisType } = req.body;

//     if (!filepath) {
//       return res.status(400).json({ error: 'File path is required' });
//     }

//     // Read the CSV file
//     const fileContent = readFileSync(filepath, 'utf-8');
//     const lines = fileContent.split('\n').filter(line => line.trim());
//     const headers = lines[0].split(',').map(h => h.trim());

//     // Parse CSV data
//     const data = lines.slice(1).map(line => {
//       const values = line.split(',').map(v => v.trim());
//       const row = {};
//       headers.forEach((header, i) => {
//         const value = values[i];
//         row[header] = isNaN(value) ? value : parseFloat(value) || value;
//       });
//       return row;
//     });

//     // Send to ML service for analysis
//     const mlResponse = await axios.post(`${req.mlServiceUrl}/analyze`, {
//       data,
//       columns: headers,
//       analysisType: analysisType || 'full'
//     });

//     res.json({
//       success: true,
//       filename: filepath,
//       analysis: mlResponse.data
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// export default router;
import express from 'express';
import axios from 'axios';
import XLSX from 'xlsx';
import { readFileSync } from 'fs';
import path from 'path';

const router = express.Router();

// Helper to parse Excel or CSV into JSON
function parseFileToJson(filepath) {
  const ext = path.extname(filepath).toLowerCase();

  if (ext === '.xlsx' || ext === '.xls') {
    const workbook = XLSX.readFile(filepath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(sheet);
  } else if (ext === '.csv') {
    const content = readFileSync(filepath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());

    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const row = {};
      headers.forEach((h, i) => {
        row[h] = values[i] || null;
      });
      return row;
    });
  } else {
    throw new Error('Unsupported file type. Only CSV and Excel are allowed.');
  }
}

router.post('/', async (req, res, next) => {
  try {
    const { filepath, analysisType } = req.body;

    if (!filepath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    // Convert file to JSON
    const data = parseFileToJson(filepath);
    if (data.length === 0) {
      return res.status(400).json({ error: 'File is empty or unreadable' });
    }

    // Get columns from first row
    const columns = Object.keys(data[0]);

    // Send JSON to FastAPI
    const mlResponse = await axios.post(`${req.mlServiceUrl}/analyze`, {
      data,
      columns,
      analysisType: analysisType || 'full'
    });

    // Send clean response to frontend
    res.json({
      success: true,
      filename: path.basename(filepath),
      rowCount: data.length,
      columns,
      analysis: mlResponse.data
    });

  } catch (error) {
    if (error.response) {
      // FastAPI returned an error (e.g., 422)
      return res.status(error.response.status).json({
        success: false,
        error: error.response.data
      });
    }
    next(error);
  }
});

export default router;