export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ message: 'Method Not Allowed' });
    return;
  }

  const username = typeof req.query.username === 'string' && req.query.username
    ? req.query.username
    : 'KokyuJene';

  const payload = { username };
  if (process.env.MISSKEY_API) {
    payload.i = process.env.MISSKEY_API;
  }

  try {
    const apiRes = await fetch('https://misskey.io/api/users/show', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!apiRes.ok) {
      res.status(apiRes.status).json({ message: 'Misskey API error' });
      return;
    }

    const data = await apiRes.json();
    res.status(200).json({ followersCount: data.followersCount ?? null });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch Misskey data' });
  }
}
