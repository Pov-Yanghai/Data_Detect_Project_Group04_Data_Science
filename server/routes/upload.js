import express from 'express';
import { upload } from '../middleware/upload.js';
import path from 'path';
import XLSX from 'xlsx';
import { readFileSync } from 'fs';
import Papa from 'papaparse';

const router = express.Router();

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
    const result = Papa.parse(content, { header: true, skipEmptyLines: true });
    const columns = result.meta.fields || [];
    return { columns, rowCount: result.data.length };

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