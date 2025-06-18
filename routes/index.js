// routes/index.js
const express = require('express');
const router  = express.Router();
const axios   = require('axios');
const qs      = require('qs');

// In-memory OAuth token cache
let _token    = null;
let _tokenExp = 0;

// Fetch and cache OAuth2 token
async function getAccessToken() {
  const now = Date.now();
  if (_token && now < _tokenExp) return _token;

  const payload = qs.stringify({
    client_id:     'u7qzfofb4tsyl3mj',
    client_secret: 'IFu3tc58',
    grant_type:    'client_credentials',
    scope:         'emsi_open'
  });

  const { data } = await axios.post(
    'https://auth.emsicloud.com/connect/token',
    payload,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  _token    = data.access_token;
  _tokenExp = now + (data.expires_in - 60) * 1000;
  return _token;
}

/**
 * GET /api/skills
 * (unchanged from before)
 */

/* … existing GET /api/skills proxy … */

/**
 * POST /api/extract
 * Body: { text: string, confidenceThreshold?: number }
 * Proxies to Lightcast’s POST /skills/versions/latest/extract
 */
router.post('/api/extract', async (req, res, next) => {
  try {
    const token = await getAccessToken();
    const { text, confidenceThreshold = 0.5 } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Request body must include a "text" string.' });
    }

    const response = await axios.post(
      'https://emsiservices.com/skills/versions/latest/extract',
      { text, confidenceThreshold },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // response.data.data is an array of { confidence, skill }
    res.json(response.data.data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
