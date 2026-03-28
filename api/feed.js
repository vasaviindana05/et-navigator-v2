export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'No URL provided' });
  try {
    const response = await fetch(decodeURIComponent(url));
    const text = await response.text();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(text);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
}