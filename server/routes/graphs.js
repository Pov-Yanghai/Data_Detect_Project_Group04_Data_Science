/**
 * Proxy route for graph images stored in the Python ML service.
 *
 * GET /api/graphs/:filename
 *   → fetches the PNG from FastAPI's static /graphs/<filename> endpoint
 *     and streams it back to the browser.
 *
 * Filenames are validated with a strict allow-list pattern to prevent
 * path-traversal attacks (OWASP A01 / A03).
 */
import express from 'express';
import axios   from 'axios';

const router = express.Router();

/** Only allow filenames matching: hex_chars + underscore/dash + letters + .png */
const VALID_FILENAME = /^[a-f0-9]{32}_[\w\-]+\.png$/i;

router.get('/:filename', async (req, res, next) => {
  try {
    const { filename } = req.params;

    if (!VALID_FILENAME.test(filename)) {
      return res.status(400).json({ error: 'Invalid graph filename.' });
    }

    const mlResponse = await axios.get(
      `${req.mlServiceUrl}/graphs/${encodeURIComponent(filename)}`,
      { responseType: 'arraybuffer', timeout: 30_000 }
    );

    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(mlResponse.data);

  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).json({ error: 'Graph not found.' });
    }
    next(err);
  }
});

export default router;
