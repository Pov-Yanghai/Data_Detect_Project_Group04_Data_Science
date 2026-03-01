import express from 'express';
import axios from 'axios';
import path from 'path';

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const { filepath, cleaningMethod, columns } = req.body; // ✅ added columns

    if (!filepath || !cleaningMethod) {
      return res.status(400).json({ error: 'File path and cleaning method are required' });
    }

    const mlResponse = await axios.post(`${req.mlServiceUrl}/clean`, {
      filepath,
      cleaningMethod,
      ...(columns ? { columns } : {}), // 
    }, {
      timeout: 60000,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    res.json(mlResponse.data);

  } catch (err) {
    if (err.response) {
      console.error('FastAPI error:', JSON.stringify(err.response.data, null, 2));
      return res.status(err.response.status).json({
        success: false,
        error: err.response.data?.detail || 'Cleaning failed'
      });
    }
    next(err);
  }
});

// Download endpoint — streams cleaned file back to browser
router.get('/download', async (req, res, next) => {
  try {
    const { filepath } = req.query;

    if (!filepath) {
      return res.status(400).json({ error: 'filepath query param is required' });
    }

    const mlResponse = await axios.get(`${req.mlServiceUrl}/download`, {
      params: { filepath },
      responseType: 'stream',
      timeout: 30000,
    });

    const originalName = path.basename(filepath);
    const downloadName = `cleaned_${originalName}`;
    const ext = path.extname(filepath).toLowerCase();

    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    res.setHeader(
      'Content-Type',
      ext === '.csv'
        ? 'text/csv'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    mlResponse.data.pipe(res);

  } catch (err) {
    if (err.response) {
      return res.status(err.response.status).json({
        success: false,
        error: err.response.data?.detail || 'Download failed'
      });
    }
    next(err);
  }
});

export default router;