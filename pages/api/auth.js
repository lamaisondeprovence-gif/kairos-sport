import { NextResponse } from 'next/server';

const PASSWORD = 'Tablerond123';
const COOKIE_NAME = 'kairos_auth';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { password } = req.body;

  if (password === PASSWORD) {
    res.setHeader('Set-Cookie', `${COOKIE_NAME}=${PASSWORD}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800`);
    return res.status(200).json({ success: true });
  }

  return res.status(401).json({ success: false });
}
