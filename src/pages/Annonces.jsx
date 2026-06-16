import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Annonces({ onRetour, profil }) {
  const [annonces, setAnnonces] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    titre: '',
    contenu: '',
    cible: 'tous',
  })

  useEffect(() => {
    fetchAnnonces()
  }, [])

  async function fetchAnnonces() {
    setLoading(true)
    const { data } = await supabase
      .from('annonces')
      .select('*')
      .order('publie_at', { ascending: false })
    setAnnonces(data || [])
    setLoading(false)
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)

    await supabase
      .from('annonces')
      .insert([{
        titre: form.titre,
        contenu: form.contenu,
        cible: form.cible,
        auteur_id: profil.id,
      }])

    setForm({ titre: '', contenu: '', cible: 'tous' })
    setShowForm(false)
    setSaving(false)
    fetchAnnonces()
  }

  async function handleDelete(id) {
    if (window.confirm('Supprimer cette annonce ?')) {
      await supabase.from('annonces').delete().eq('id', id)
      fetchAnnonces()
    }
  }

  const cibleConfig = {
    tous: { label: '👥 Tous', color: '#085041', bg: '#e4f7f2' },
    parents: { label: '👨‍👩‍👧 Parents', color: '#0369a1', bg: '#eff6ff' },
    monitrices: { label: '👩‍🏫 Monitrices', color: '#b8780d', bg: '#fef8e7' },
  }

  return (
    <div style={styles.wrap}>

      {/* HEADER */}
      <div style={styles.header}>
        <button onClick={onRetour} style={styles.backBtn}>← Retour</button>
        <div>
          <div style={styles.headerTitle}>Annonces</div>
          <div style={styles.headerSub}>Coran Kids Academy</div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={styles.newBtn}
        >
          {showForm ? '✕ Annuler' : '+ Nouvelle annonce'}
        </button>
      </div>

      <div style={styles.content}>

        {/* Formulaire nouvelle annonce */}
        {showForm && (
          <div style={styles.formCard}>
            <div style={styles.formTitle}>📢 Nouvelle annonce</div>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Titre *</label>
                <input
                  name="titre"
                  value={form.titre}
                  onChange={handleChange}
                  placeholder="Titre de l'annonce"
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Message *</label>
                <textarea
                  name="contenu"
                  value={form.contenu}
                  onChange={handleChange}
                  placeholder="Contenu de l'annonce..."
                  required
                  style={{...styles.input, minHeight: '100px', resize: 'vertical'}}
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Destinataires *</label>
                <select
                  name="cible"
                  value={form.cible}
                  onChange={handleChange}
                  style={styles.input}
                >
                  <option value="tous">👥 Tous</option>
                  <option value="parents">👨‍👩‍👧 Parents uniquement</option>
                  <option value="monitrices">👩‍🏫 Monitrices uniquement</option>
                </select>
              </div>
              <div style={styles.btnRow}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={styles.btnSecondary}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={saving ? styles.btnDisabled : styles.btnPrimary}
                >
                  {saving ? 'Publication...' : '📢 Publier l\'annonce'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Liste annonces */}
        {loading ? (
          <div style={styles.loadingBox}>Chargement...</div>
        ) : annonces.length === 0 ? (
          <div style={styles.emptyBox}>
            <div style={styles.emptyIcon}>📢</div>
            <div style={styles.emptyTitle}>Aucune annonce publiée</div>
            <div style={styles.emptySub}>
              Cliquez sur "Nouvelle annonce" pour informer les familles.
            </div>
          </div>
        ) : (
          <div style={styles.annoncesList}>
            {annonces.map(annonce => {
              const cfg = cibleConfig[annonce.cible] || cibleConfig.tous
              const date = new Date(annonce.publie_at)
              return (
                <div key={annonce.id} style={styles.annonceCard}>
                  <div style={styles.annonceTop}>
                    <div style={styles.annonceTitre}>{annonce.titre}</div>
                    <span style={{...styles.cibleBadge, background: cfg.bg, color: cfg.color}}>
                      {cfg.label}
                    </span>
                  </div>
                  <div style={styles.annonceContenu}>{annonce.contenu}</div>
                  <div style={styles.annonceFooter}>
                    <div style={styles.annonceDate}>
                      Publié le {date.toLocaleDateString('fr-FR')} à {date.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}
                    </div>
                    <button
                      onClick={() => handleDelete(annonce.id)}
                      style={styles.deleteBtn}
                    >
                      🗑 Supprimer
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}

const styles = {
  wrap: { minHeight: '100vh', background: '#f8f9f8', fontFamily: 'sans-serif' },
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
    background: 'rgba(255,255,255,0.1)', color: 'white',
    border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px',
    padding: '8px 14px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
  },
  headerTitle: { color: 'white', fontSize: '16px', fontWeight: '600' },
  headerSub: { color: '#7dd4b6', fontSize: '12px', fontStyle: 'italic' },
  newBtn: {
    marginLeft: 'auto',
    background: '#F5A623', color: '#085041',
    border: 'none', borderRadius: '8px',
    padding: '10px 16px', fontSize: '13px',
    fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit',
  },
  content: { maxWidth: '800px', margin: '0 auto', padding: '24px' },
  formCard: {
    background: 'white', borderRadius: '16px',
    padding: '20px 24px', marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    border: '2px solid #F5A623',
  },
  formTitle: { fontSize: '15px', fontWeight: '600', color: '#085041', marginBottom: '16px' },
  form: { display: 'flex', flexDirection: 'column', gap: '14px' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '500', color: '#4a524a' },
  input: {
    padding: '11px 14px', borderRadius: '10px',
    border: '1.5px solid #d8dbd8', fontSize: '14px',
    outline: 'none', fontFamily: 'inherit',
    background: 'white', color: '#252a25',
  },
  btnRow: { display: 'flex', gap: '10px', justifyContent: 'flex-end' },
  btnPrimary: {
    background: '#006847', color: 'white', border: 'none',
    borderRadius: '10px', padding: '11px 20px', fontSize: '14px',
    fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
  },
  btnSecondary: {
    background: 'white', color: '#085041',
    border: '1.5px solid #085041', borderRadius: '10px',
    padding: '11px 20px', fontSize: '14px',
    fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
  },
  btnDisabled: {
    background: '#b2b8b2', color: 'white', border: 'none',
    borderRadius: '10px', padding: '11px 20px', fontSize: '14px',
    fontWeight: '600', cursor: 'not-allowed', fontFamily: 'inherit',
  },
  loadingBox: { textAlign: 'center', padding: '60px', color: '#8a918a' },
  emptyBox: {
    textAlign: 'center', padding: '60px 20px',
    background: 'white', borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  emptyIcon: { fontSize: '48px', marginBottom: '16px' },
  emptyTitle: { fontSize: '16px', fontWeight: '600', color: '#252a25', marginBottom: '8px' },
  emptySub: { fontSize: '13px', color: '#8a918a' },
  annoncesList: { display: 'flex', flexDirection: 'column', gap: '14px' },
  annonceCard: {
    background: 'white', borderRadius: '16px',
    padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    border: '1px solid #eef0ee',
  },
  annonceTop: {
    display: 'flex', alignItems: 'flex-start',
    justifyContent: 'space-between', gap: '12px', marginBottom: '10px',
  },
  annonceTitre: { fontSize: '15px', fontWeight: '600', color: '#252a25', flex: 1 },
  cibleBadge: {
    fontSize: '11px', fontWeight: '600',
    padding: '3px 10px', borderRadius: '99px', flexShrink: 0,
  },
  annonceContenu: {
    fontSize: '14px', color: '#4a524a',
    lineHeight: '1.6', marginBottom: '14px',
  },
  annonceFooter: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', borderTop: '1px solid #eef0ee', paddingTop: '10px',
  },
  annonceDate: { fontSize: '12px', color: '#8a918a' },
  deleteBtn: {
    background: 'none', color: '#e05252', border: 'none',
    fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit',
    padding: '4px 8px', borderRadius: '6px',
  },
}