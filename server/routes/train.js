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
      target
    }, {
      timeout: 120000, // 2 min timeout — training can be slow on large files
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    // ✅ Fixed: field names match what train_model() actually returns
    res.json({
      success: true,
      training_samples: mlResponse.data.training_samples,
      test_samples: mlResponse.data.test_samples,
      metrics: mlResponse.data.metrics,
      predictions: mlResponse.data.predictions,
      feature_importance: mlResponse.data.feature_importance,
      model_type: mlResponse.data.model_type,
    });

  } catch (err) {
    if (err.response) {
      console.error('FastAPI error detail:', JSON.stringify(err.response.data, null, 2));
      return res.status(err.response.status).json({
        success: false,
        error: err.response.data?.detail || 'Training failed'
      });
    }
    next(err);
  }
});

export default router;