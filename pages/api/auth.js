const COOKIE_NAME = 'kairos_auth';
const PASSWORD = 'Tableronde123';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { password } = req.body;

  if (password === PASSWORD) {
    res.setHeader(
      'Set-Cookie',
      `${COOKIE_NAME}=${PASSWORD}; Path=/; HttpOnly=false; SameSite=Lax; Max-Age=604800`
    );
    return res.status(200).json({ success: true });
  }

  return res.status(401).json({ success: false });
}
