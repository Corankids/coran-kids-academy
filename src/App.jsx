import { useState } from 'react'
import { supabase } from './supabase'
import Dashboard from './pages/Dashboard'
import DashboardMonitrice from './pages/DashboardMonitrice'

export default function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)
  const [profil, setProfil] = useState(null)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError('Email ou mot de passe incorrect.')
      setLoading(false)
      return
    }

    const { data: profilData, error: profilError } = await supabase
      .from('utilisateurs')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profilError) {
      setError('Profil introuvable. Contactez la direction.')
      setLoading(false)
      return
    }

    setUser(data.user)
    setProfil(profilData)
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    setProfil(null)
  }

  // Redirection selon le rôle
if (user && profil) {
  if (profil.role === 'direction') {
    return <Dashboard user={user} profil={profil} onLogout={handleLogout} />
  }
  if (profil.role === 'monitrice') {
    return <DashboardMonitrice user={user} profil={profil} onLogout={handleLogout} />
  }
}

  // Écran de connexion
  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.header}>
          <img src="/LOGO_CKA_vf.png" alt="Coran Kids Academy" style={styles.logo} />
          <div style={styles.arabicText}>بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</div>
          <h1 style={styles.title}>Coran Kids Academy</h1>
          <p style={styles.subtitle}>Mémoriser le Coran, Éveiller l'Avenir</p>
        </div>
        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Adresse email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              style={styles.input}
            />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={styles.input}
            />
          </div>
          {error && <div style={styles.errorBox}>⚠️ {error}</div>}
          <button type="submit" disabled={loading}
            style={loading ? styles.btnDisabled : styles.btn}>
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>
        <div style={styles.footer}>
          Coran Kids Academy · Ouagadougou, Burkina Faso<br />
          📞 64 65 81 90 / 72 05 73 00
        </div>
      </div>
    </div>
  )
}

const styles = {
  wrap: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #03281e 0%, #085041 50%, #0a6652 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '20px', fontFamily: 'sans-serif',
  },
  card: {
    background: 'white', borderRadius: '24px', padding: '40px 36px',
    width: '100%', maxWidth: '420px',
    boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
  },
  header: { textAlign: 'center', marginBottom: '32px' },
  logo: {
    width: '80px', height: '80px', borderRadius: '50%',
    objectFit: 'contain', margin: '0 auto 14px', display: 'block',
  },
  arabicText: {
    fontFamily: 'serif', fontSize: '16px',
    color: '#F5A623', marginBottom: '8px', direction: 'rtl',
  },
  title: { fontSize: '22px', fontWeight: '600', color: '#085041', margin: '0 0 4px' },
  subtitle: { fontSize: '13px', color: '#8a918a', margin: 0, fontStyle: 'italic' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '500', color: '#4a524a' },
  input: {
    padding: '12px 14px', borderRadius: '10px',
    border: '1.5px solid #d8dbd8', fontSize: '14px',
    outline: 'none', fontFamily: 'inherit',
  },
  errorBox: {
    background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: '10px', padding: '12px 14px',
    fontSize: '13px', color: '#dc2626',
  },
  btn: {
    background: '#006847', color: 'white', border: 'none',
    borderRadius: '12px', padding: '14px', fontSize: '15px',
    fontWeight: '600', cursor: 'pointer', marginTop: '4px', fontFamily: 'inherit',
  },
  btnDisabled: {
    background: '#b2b8b2', color: 'white', border: 'none',
    borderRadius: '12px', padding: '14px', fontSize: '15px',
    fontWeight: '600', cursor: 'not-allowed', marginTop: '4px', fontFamily: 'inherit',
  },
  footer: {
    textAlign: 'center', fontSize: '11px',
    color: '#b2b8b2', marginTop: '28px', lineHeight: '1.6',
  },
}