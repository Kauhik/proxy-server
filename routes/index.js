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
 * Proxies to Lightcast's List All Skills endpoint.
 * Supported query params: q, limit, fields (no offset).
 */
router.get('/api/skills', async (req, res, next) => {
  try {
    const token = await getAccessToken();

    // Sanitize and default query params
    const q      = req.query.q      || '';          // search term
    const limit  = Math.min(1000, parseInt(req.query.limit)  || 50);
    const fields = (req.query.fields || 'id,name')
                     .split(',')
                     .map(f => f.trim())
                     .filter(f => ['id','name','type','infoUrl','description'].includes(f))
                     .join(',');

    // Call the Skills API
    const response = await axios.get(
      'https://emsiservices.com/skills/versions/latest/skills',
      {
        headers: { Authorization: `Bearer ${token}` },
        params:  { q, limit, fields }
      }
    );

    // Return only the array of skills
    res.json(response.data.data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
