export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = {
      model: 'claude-sonnet-4-6',
      max_tokens: req.body.max_tokens || 2500,
      messages: req.body.messages
    };
    if (req.body.system) body.system = req.body.system;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    // Anthropic returned an error (bad model, bad key, rate limit, etc.)
    // Surface it as a real HTTP error instead of silently passing along
    // an object with no "content" field, which the frontend renders as blank.
    if (!response.ok || data.type === 'error') {
      console.error('Anthropic API error:', data);
      return res.status(response.status || 500).json({
        error: 'AI request failed',
        detail: data.error?.message || 'Unknown error from Anthropic API'
      });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error('Handler error:', err);
    res.status(500).json({ error: 'AI request failed', detail: err.message });
  }
}
