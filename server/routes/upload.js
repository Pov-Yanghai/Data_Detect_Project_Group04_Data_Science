// import express from 'express';
// import { upload } from '../middleware/upload.js';
// import { readFileSync } from 'fs';

// const router = express.Router();

// router.post('/', upload.single('file'), async (req, res, next) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: 'No file uploaded' });
//     }

//     const fileContent = readFileSync(req.file.path, 'utf-8');
//     const lines = fileContent.split('\n').filter(line => line.trim());
    
//     // Parse CSV header
//     const headers = lines[0].split(',').map(h => h.trim());
//     const rowCount = lines.length - 1;

//     res.json({
//       success: true,
//       filename: req.file.originalname,
//       filepath: req.file.path,
//       size: req.file.size,
//       columns: headers,
//       rowCount,
//       preview: lines.slice(0, 11).map((line, idx) => {
//         const values = line.split(',').map(v => v.trim());
//         const row = {};
//         headers.forEach((header, i) => {
//           row[header] = values[i] || null;
//         });
//         return row;
//       })
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// export default router;
import express from 'express';
import { upload } from '../middleware/upload.js';
import path from 'path';
import XLSX from 'xlsx';
import { readFileSync } from 'fs';

const router = express.Router();

// Parse file and extract columns + row count
function parseFileMeta(filepath) {
  const ext = path.extname(filepath).toLowerCase();

  if (ext === '.xlsx' || ext === '.xls') {
    const workbook = XLSX.readFile(filepath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    const columns = data.length > 0 ? Object.keys(data[0]) : [];
    return { columns, rowCount: data.length };

  } else if (ext === '.csv') {
    const content = readFileSync(filepath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    const columns = lines[0].split(',').map(h => h.trim());
    const rowCount = lines.length - 1; // exclude header
    return { columns, rowCount };

  } else {
    throw new Error('Unsupported file type');
  }
}

router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();

    if (!['.csv', '.xlsx', '.xls'].includes(ext)) {
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    // ✅ Parse file to get columns and rowCount
    const { columns, rowCount } = parseFileMeta(req.file.path);

    res.json({
      success: true,
      filename: req.file.originalname,
      filepath: req.file.path,
      size: req.file.size,
      fileType: ext,
      columns,      
      rowCount,     
    });

  } catch (err) {
    next(err);
  }
});

export default router;