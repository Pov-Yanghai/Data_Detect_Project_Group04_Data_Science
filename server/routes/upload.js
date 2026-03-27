import express from 'express';
import { upload } from '../middleware/upload.js';
import path from 'path';
import XLSX from 'xlsx';
import { readFileSync } from 'fs';
import { readFile, unlink } from 'fs/promises';
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

    // Forward the uploaded file to the ML service so the returned filepath
    // points to storage accessible by /analyze, /clean, and /train endpoints.
    const fileBuffer = await readFile(req.file.path);
    const form = new FormData();
    form.append(
      'file',
      new Blob([fileBuffer], { type: req.file.mimetype || 'application/octet-stream' }),
      req.file.originalname
    );

    const mlResponse = await fetch(`${req.mlServiceUrl}/upload`, {
      method: 'POST',
      body: form,
    });

    const mlPayload = await mlResponse.json().catch(() => ({ detail: 'ML upload failed' }));

    if (!mlResponse.ok) {
      return res.status(mlResponse.status).json({
        success: false,
        error: mlPayload.detail || mlPayload.error || 'Upload failed',
      });
    }

    // Cleanup temporary backend file after ML service has accepted it.
    await unlink(req.file.path).catch(() => {});

    res.json({
      success: true,
      filename: mlPayload.filename || req.file.originalname,
      filepath: mlPayload.filepath,
      size: mlPayload.size || req.file.size,
      fileType: ext,
      columns: mlPayload.columns || [],
      rowCount: mlPayload.rowCount || 0,
      preview: mlPayload.preview || [],
    });

  } catch (err) {
    next(err);
  }
});

export default router;