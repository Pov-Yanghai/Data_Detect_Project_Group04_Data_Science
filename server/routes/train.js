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

/**
 * POST /api/train/compare
 * Proxies to FastAPI's /compare-models endpoint.
 * Body: { sessions: [{ session_id, model_type, metrics }] }
 */
router.post('/compare', async (req, res, next) => {
  try {
    const { sessions } = req.body;

    if (!sessions || !Array.isArray(sessions) || sessions.length < 2) {
      return res.status(400).json({ error: 'At least two sessions are required for comparison.' });
    }

    const mlResponse = await axios.post(`${req.mlServiceUrl}/compare-models`, {
      sessions,
    }, {
      timeout: 60000,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    res.json(mlResponse.data);

  } catch (err) {
    if (err.response) {
      console.error('FastAPI compare error:', JSON.stringify(err.response.data, null, 2));
      return res.status(err.response.status).json({
        success: false,
        error: err.response.data?.detail || 'Comparison failed'
      });
    }
    next(err);
  }
});

/**
 * POST /api/train/predict
 * Proxies to FastAPI's /predict endpoint.
 * Body: { session_id, input_values: { feature: value } }
 */
router.post('/predict', async (req, res, next) => {
  try {
    const { session_id, input_values } = req.body;

    if (!session_id || !input_values || typeof input_values !== 'object') {
      return res.status(400).json({ error: 'session_id and input_values are required.' });
    }

    const mlResponse = await axios.post(`${req.mlServiceUrl}/predict`, {
      session_id,
      input_values,
    }, { timeout: 30000 });

    res.json(mlResponse.data);

  } catch (err) {
    if (err.response) {
      return res.status(err.response.status).json({
        success: false,
        error: err.response.data?.detail || 'Prediction failed'
      });
    }
    next(err);
  }
});

export default router;