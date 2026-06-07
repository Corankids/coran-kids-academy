import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function InscriptionEleve({ onRetour, onSuccess }) {
  const [niveaux, setNiveaux] = useState([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    prenom: '',
    nom: '',
    date_naissance: '',
    sexe: '',
    niveau_id: '',
    tuteur_nom: '',
    tuteur_telephone: '',
    tuteur_whatsapp: '',
    tuteur_lien: '',
    notes: '',
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

    const { error: insertError } = await supabase
      .from('eleves')
      .insert([{
        prenom: form.prenom,
        nom: form.nom,
        date_naissance: form.date_naissance,
        sexe: form.sexe,
        niveau_id: form.niveau_id,
        tuteur_nom: form.tuteur_nom,
        tuteur_telephone: form.tuteur_telephone,
        tuteur_whatsapp: form.tuteur_whatsapp || form.tuteur_telephone,
        tuteur_lien: form.tuteur_lien,
        notes: form.notes,
        actif: true,
      }])

    if (insertError) {
      setError('Erreur lors de l\'inscription : ' + insertError.message)
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
          <div style={styles.successTitle}>Élève inscrit avec succès !</div>
          <div style={styles.successSub}>
            {form.prenom} {form.nom} a été ajouté(e) à la base de données.
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
        <div style={styles.headerTitle}>Inscription d'un élève</div>
        <div style={styles.headerSub}>Coran Kids Academy</div>
      </div>

      {/* FORMULAIRE */}
      <div style={styles.content}>
        <form onSubmit={handleSubmit} style={styles.form}>

          {/* Informations de l'élève */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>👧 Informations de l'élève</div>

            <div style={styles.row}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Prénom *</label>
                <input
                  name="prenom"
                  value={form.prenom}
                  onChange={handleChange}
                  placeholder="Prénom de l'élève"
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
                <label style={styles.label}>Date de naissance *</label>
                <input
                  name="date_naissance"
                  type="date"
                  value={form.date_naissance}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Sexe *</label>
                <select
                  name="sexe"
                  value={form.sexe}
                  onChange={handleChange}
                  required
                  style={styles.input}
                >
                  <option value="">Choisir...</option>
                  <option value="F">Fille</option>
                  <option value="M">Garçon</option>
                </select>
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Niveau / Classe *</label>
              <select
                name="niveau_id"
                value={form.niveau_id}
                onChange={handleChange}
                required
                style={styles.input}
              >
                <option value="">Choisir un niveau...</option>
                {niveaux.map(n => (
                  <option key={n.id} value={n.id}>
                    {n.nom} — {n.tranche_age}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Notes / Observations</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Informations complémentaires sur l'élève..."
                style={{...styles.input, minHeight: '80px', resize: 'vertical'}}
              />
            </div>
          </div>

          {/* Informations du tuteur */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>👨‍👩‍👧 Informations du tuteur légal</div>

            <div style={styles.row}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Nom complet du tuteur *</label>
                <input
                  name="tuteur_nom"
                  value={form.tuteur_nom}
                  onChange={handleChange}
                  placeholder="Nom et prénom du tuteur"
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Lien avec l'élève *</label>
                <select
                  name="tuteur_lien"
                  value={form.tuteur_lien}
                  onChange={handleChange}
                  required
                  style={styles.input}
                >
                  <option value="">Choisir...</option>
                  <option value="père">Père</option>
                  <option value="mère">Mère</option>
                  <option value="tuteur">Tuteur</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
            </div>

            <div style={styles.row}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Téléphone *</label>
                <input
                  name="tuteur_telephone"
                  value={form.tuteur_telephone}
                  onChange={handleChange}
                  placeholder="Ex: 70 00 00 00"
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>WhatsApp</label>
                <input
                  name="tuteur_whatsapp"
                  value={form.tuteur_whatsapp}
                  onChange={handleChange}
                  placeholder="Si différent du téléphone"
                  style={styles.input}
                />
              </div>
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
              {loading ? 'Inscription en cours...' : '✓ Inscrire l\'élève'}
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
  successIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
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