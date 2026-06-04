import { useState } from 'react';
import { useRouter } from 'next/router';

const PASSWORD = 'Tableronde123';

export default function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = () => {
    if (password === PASSWORD) {
      localStorage.setItem('kairos_auth', 'ok');
      router.push('/');
    } else {
      setError('Mot de passe incorrect');
    }
  };

  return (
    <div style={{ background: '#07090f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' }}>
      <div style={{ background: '#0c0f1a', border: '1px solid #1e2a40', borderRadius: 20, padding: '40px 32px', width: '100%', maxWidth: 340, textAlign: 'center' }}>
        <div style={{ color: '#00FFB2', fontSize: 48, marginBottom: 12 }}>⚡</div>
        <div style={{ color: '#e8f0fe', fontWeight: 700, fontSize: 22, letterSpacing: 3, marginBottom: 4 }}>KAIROS SPORT</div>
        <div style={{ color: '#3a4a5c', fontSize: 10, letterSpacing: 3, marginBottom: 32 }}>ACCÈS PRIVÉ</div>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          placeholder="Mot de passe"
          style={{ background: '#07090f', border: '1px solid #1e2a40', borderRadius: 10, padding: '12px 16px', color: '#e8f0fe', fontFamily: 'monospace', fontSize: 14, width: '100%', outline: 'none', marginBottom: 12, boxSizing: 'border-box' }} />
        {error && <div style={{ color: '#FF4D6D', fontSize: 12, marginBottom: 12 }}>{error}</div>}
        <button onClick={handleLogin}
          style={{ background: '#00FFB2', color: '#07090f', border: 'none', borderRadius: 12, padding: '14px', fontFamily: 'monospace', fontWeight: 700, fontSize: 13, letterSpacing: 2, cursor: 'pointer', width: '100%', textTransform: 'uppercase' }}>
          ENTRER
        </button>
      </div>
    </div>
  );
}
