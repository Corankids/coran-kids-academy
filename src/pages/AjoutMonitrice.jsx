import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function AjoutMonitrice({ onRetour, onSuccess }) {
  const [niveaux, setNiveaux] = useState([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    prenom: '',
    nom: '',
    email: '',
    password: '',
    telephone: '',
    whatsapp: '',
    niveau_id: '',
  })

  useEffect(() => {
    fetchNiveaux()
  }, [])

  async function fetchNiveaux() {
    const { data } = await supabase
      .from('niveaux')
      .select('*')
      .order('ordre')
    setNiveaux(data || [])
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // 1. Créer le compte Auth Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
  email: form.email,
  password: form.password,
})
    if (authError) {
      setError('Erreur création compte : ' + authError.message)
      setLoading(false)
      return
    }

    // 2. Créer le profil dans la table utilisateurs
    const { error: profilError } = await supabase
      .from('utilisateurs')
      .insert([{
        id: authData.user.id,
        role: 'monitrice',
        prenom: form.prenom,
        nom: form.nom,
        telephone: form.telephone,
        whatsapp: form.whatsapp || form.telephone,
        niveau_id: form.niveau_id || null,
        actif: true,
      }])

    if (profilError) {
      setError('Erreur création profil : ' + profilError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => {
      onSuccess()
    }, 2000)
  }

  if (success) {
    return (
      <div style={styles.wrap}>
        <div style={styles.successBox}>
          <div style={styles.successIcon}>✅</div>
          <div style={styles.successTitle}>Monitrice ajoutée avec succès !</div>
          <div style={styles.successSub}>
            {form.prenom} {form.nom} peut maintenant se connecter avec son email et mot de passe.
          </div>
          <div style={styles.successSub}>Retour au tableau de bord...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.wrap}>

      {/* HEADER */}
      <div style={styles.header}>
        <button onClick={onRetour} style={styles.backBtn}>
          ← Retour
        </button>
        <div style={styles.headerTitle}>Ajouter une monitrice</div>
        <div style={styles.headerSub}>Coran Kids Academy</div>
      </div>

      {/* FORMULAIRE */}
      <div style={styles.content}>
        <form onSubmit={handleSubmit} style={styles.form}>

          {/* Informations personnelles */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>👩‍🏫 Informations personnelles</div>

            <div style={styles.row}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Prénom *</label>
                <input
                  name="prenom"
                  value={form.prenom}
                  onChange={handleChange}
                  placeholder="Prénom de la monitrice"
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Nom *</label>
                <input
                  name="nom"
                  value={form.nom}
                  onChange={handleChange}
                  placeholder="Nom de famille"
                  required
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.row}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Téléphone *</label>
                <input
                  name="telephone"
                  value={form.telephone}
                  onChange={handleChange}
                  placeholder="Ex: 70 00 00 00"
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>WhatsApp</label>
                <input
                  name="whatsapp"
                  value={form.whatsapp}
                  onChange={handleChange}
                  placeholder="Si différent du téléphone"
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Classe assignée</label>
              <select
                name="niveau_id"
                value={form.niveau_id}
                onChange={handleChange}
                style={styles.input}
              >
                <option value="">Choisir une classe...</option>
                {niveaux.map(n => (
                  <option key={n.id} value={n.id}>
                    {n.nom} — {n.tranche_age}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Accès à l'application */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>🔐 Accès à l'application</div>
            <div style={styles.infoBox}>
              💡 Ces identifiants permettront à la monitrice de se connecter à l'application.
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Email *</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="email@exemple.com"
                required
                style={styles.input}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Mot de passe provisoire *</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Minimum 6 caractères"
                required
                minLength={6}
                style={styles.input}
              />
            </div>
          </div>

          {error && (
            <div style={styles.errorBox}>⚠️ {error}</div>
          )}

          <div style={styles.btnRow}>
            <button
              type="button"
              onClick={onRetour}
              style={styles.btnSecondary}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              style={loading ? styles.btnDisabled : styles.btnPrimary}
            >
              {loading ? 'Création en cours...' : '✓ Ajouter la monitrice'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

const styles = {
  wrap: {
    minHeight: '100vh',
    background: '#f8f9f8',
    fontFamily: 'sans-serif',
  },
  header: {
    background: 'linear-gradient(135deg, #03281e 0%, #085041 100%)',
    padding: '16px 28px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  },
  backBtn: {
    background: 'rgba(255,255,255,0.1)',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '8px',
    padding: '8px 14px',
    fontSize: '13px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  headerTitle: {
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
  },
  headerSub: {
    color: '#7dd4b6',
    fontSize: '12px',
    fontStyle: 'italic',
  },
  content: {
    maxWidth: '700px',
    margin: '0 auto',
    padding: '28px 24px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  section: {
    background: 'white',
    borderRadius: '16px',
    padding: '20px 24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  sectionTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#085041',
    marginBottom: '4px',
    paddingBottom: '10px',
    borderBottom: '1px solid #eef0ee',
  },
  infoBox: {
    background: '#e4f7f2',
    borderRadius: '10px',
    padding: '12px 14px',
    fontSize: '13px',
    color: '#085041',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '14px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#4a524a',
  },
  input: {
    padding: '11px 14px',
    borderRadius: '10px',
    border: '1.5px solid #d8dbd8',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit',
    background: 'white',
    color: '#252a25',
  },
  errorBox: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    padding: '12px 14px',
    fontSize: '13px',
    color: '#dc2626',
  },
  btnRow: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  btnPrimary: {
    background: '#006847',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '13px 24px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  btnSecondary: {
    background: 'white',
    color: '#085041',
    border: '1.5px solid #085041',
    borderRadius: '12px',
    padding: '13px 24px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  btnDisabled: {
    background: '#b2b8b2',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '13px 24px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'not-allowed',
    fontFamily: 'inherit',
  },
  successBox: {
    maxWidth: '400px',
    margin: '100px auto',
    background: 'white',
    borderRadius: '20px',
    padding: '40px',
    textAlign: 'center',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  },
  successIcon: { fontSize: '48px', marginBottom: '16px' },
  successTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#085041',
    marginBottom: '10px',
  },
  successSub: {
    fontSize: '13px',
    color: '#8a918a',
    marginBottom: '6px',
  },
}