import express from 'express';
import axios from 'axios';

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const { filepath, analysisType } = req.body;

    if (!filepath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    const mlResponse = await axios.post(`${req.mlServiceUrl}/analyze`, {
      filepath,
      analysisType: analysisType || 'full',
    }, {
      timeout: 60000,
    });

    // Pass FastAPI response directly — no wrapping
    res.json(mlResponse.data);

  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        error: error.response.data?.detail || 'Analysis failed'
      });
    }
    next(error);
  }
});

export default router;