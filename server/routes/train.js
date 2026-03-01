import express from 'express';
import axios from 'axios';

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const { filepath, modelType, features, target } = req.body;

    if (!filepath || !modelType || !features || !target) {
      return res.status(400).json({
        error: 'File path, model type, features, and target are required'
      });
    }

    const mlResponse = await axios.post(`${req.mlServiceUrl}/train`, {
      filepath,
      modelType,
      features,
      target,
    }, {
      timeout: 120000,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    // Pass FastAPI response directly — no wrapping
    res.json(mlResponse.data);

  } catch (err) {
    if (err.response) {
      console.error('FastAPI error:', JSON.stringify(err.response.data, null, 2));
      return res.status(err.response.status).json({
        success: false,
        error: err.response.data?.detail || 'Training failed'
      });
    }
    next(err);
  }
});

export default router;