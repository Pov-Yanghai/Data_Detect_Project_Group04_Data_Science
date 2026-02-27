import express from 'express';
import axios from 'axios';

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const { filepath, cleaningMethod } = req.body;

    if (!filepath || !cleaningMethod) {
      return res.status(400).json({ error: 'File path and cleaning method are required' });
    }

    // ✅ Send filepath directly — Python reads the file itself (avoids sending 9MB JSON over HTTP)
    const mlResponse = await axios.post(`${req.mlServiceUrl}/clean`, {
      filepath,
      cleaningMethod,
    }, {
      timeout: 60000, // 60s timeout for large files
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    res.json({
      success: true,
      cleanedData: mlResponse.data.cleanedData,
      summary: mlResponse.data.summary,
      originalRows: mlResponse.data.originalRows,
      cleanedRows: mlResponse.data.cleanedRows,
      removedRows: mlResponse.data.removedRows,
      method: mlResponse.data.method,
    });

  } catch (err) {
    if (err.response) {
      console.error('FastAPI error detail:', JSON.stringify(err.response.data, null, 2));
      return res.status(err.response.status).json({
        success: false,
        error: err.response.data
      });
    }
    next(err);
  }
});

// Download endpoint for cleaned file
router.get('/download', async (req, res, next) => {
  try {
    const { filepath } = req.query;
    if (!filepath) return res.status(400).json({ error: 'File path is required' });

    const mlResponse = await axios.get(`${req.mlServiceUrl}/download_cleaned`, {
      responseType: 'stream',
      params: { file_path: filepath }
    });

    mlResponse.data.pipe(res);
  } catch (err) {
    next(err);
  }
});

export default router;