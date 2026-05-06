const https = require('https');

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: 'API key not configured' });

  try {
    const body = JSON.stringify(req.body);
    console.log('body:', body); // 전달되는 내용 확인
    console.log('key prefix:', ANTHROPIC_API_KEY.substring(0, 15)); // 키 앞부분 확인

    const data = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Length': Buffer.byteLength(body)
        }
      };

      const request = https.request(options, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
          console.log('anthropic response:', data);
          resolve({ status: response.statusCode, body: data });
        });
      });

      request.on('error', reject);
      request.write(body);
      request.end();
    });

    res.status(data.status).json(JSON.parse(data.body));
  } catch (err) {
    console.log('error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
