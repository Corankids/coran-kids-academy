import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function DashboardMonitrice({ user, profil, onLogout }) {
  const [eleves, setEleves] = useState([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [presences, setPresences] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [page, setPage] = useState('accueil')
  const [eleveSelectionne, setEleveSelectionne] = useState(null)
  const [hifzEleve, setHifzEleve] = useState([])
  const [sourates, setSourates] = useState([])

  useEffect(() => {
    fetchEleves()
    fetchSourates()
  }, [])

  useEffect(() => {
    if (eleves.length > 0) fetchPresences()
  }, [eleves, date])

  async function fetchEleves() {
    setLoading(true)
    const { data } = await supabase
      .from('eleves')
      .select('*, niveaux(nom, tranche_age)')
      .eq('actif', true)
      .eq('niveau_id', profil.niveau_id)
      .order('nom')
    setEleves(data || [])
    setLoading(false)
  }

  async function fetchSourates() {
    const { data } = await supabase
      .from('sourates')
      .select('*')
      .order('id')
    setSourates(data || [])
  }

  async function fetchPresences() {
    const eleveIds = eleves.map(e => e.id)
    if (eleveIds.length === 0) return
    const { data } = await supabase
      .from('presences')
      .select('*')
      .eq('date', date)
      .in('eleve_id', eleveIds)

    const map = {}
    eleves.forEach(e => { map[e.id] = 'present' })
    if (data) data.forEach(p => { map[p.eleve_id] = p.statut })
    setPresences(map)
  }

  async function fetchHifzEleve(eleveId) {
    const { data } = await supabase
      .from('hifz')
      .select('*, sourates(nom_fr, nom_ar, nombre_versets)')
      .eq('eleve_id', eleveId)
    setHifzEleve(data || [])
  }

  function setStatut(eleveId, statut) {
    setPresences(prev => ({ ...prev, [eleveId]: statut }))
    setSaved(false)
  }

  async function handleSavePresences() {
    setSaving(true)
    const upserts = eleves.map(e => ({
      eleve_id: e.id,
      date: date,
      statut: presences[e.id] || 'present',
    }))
    await supabase
      .from('presences')
      .upsert(upserts, { onConflict: 'eleve_id,date' })
    setSaved(true)
    setSaving(false)
    setTimeout(() => setSaved(false), 3000)
  }

  async function ouvrirHifz(eleve) {
    setEleveSelectionne(eleve)
    await fetchHifzEleve(eleve.id)
    setPage('hifz')
  }

  async function updateHifz(sourateId, statut, niveauMaitrise) {
    const existing = hifzEleve.find(h => h.sourate_id === sourateId)
    if (existing) {
      await supabase
        .from('hifz')
        .update({ statut, niveau_maitrise: niveauMaitrise, updated_at: new Date() })
        .eq('id', existing.id)
    } else {
      await supabase
        .from('hifz')
        .insert([{
          eleve_id: eleveSelectionne.id,
          sourate_id: sourateId,
          statut,
          niveau_maitrise: niveauMaitrise,
          date_debut: statut !== 'non_commence' ? new Date().toISOString().split('T')[0] : null,
          date_memorisation: statut === 'memorise' ? new Date().toISOString().split('T')[0] : null,
        }])
    }
    await fetchHifzEleve(eleveSelectionne.id)
  }

  const statutPresenceConfig = {
    present: { label: '✓ Présent', bg: '#e4f7f2', color: '#085041', border: '#1D9E75' },
    absent: { label: '✗ Absent', bg: '#fef2f2', color: '#dc2626', border: '#e05252' },
    retard: { label: '⏱ Retard', bg: '#fef8e7', color: '#b8780d', border: '#F5A623' },
    excuse: { label: '📋 Excusé', bg: '#eff6ff', color: '#0369a1', border: '#4a90d9' },
  }

  const statutHifzConfig = {
    non_commence: { label: '— À venir', color: '#8a918a', bg: '#f8f9f8' },
    en_cours: { label: '⟳ En cours', color: '#b8780d', bg: '#fef8e7' },
    memorise: { label: '✓ Mémorisé', color: '#085041', bg: '#e4f7f2' },
    revise: { label: '↺ Révisé', color: '#0369a1', bg: '#eff6ff' },
  }

  const niveauMaitriseConfig = {
    excellent: { label: '⭐ Excellent', color: '#085041' },
    bien: { label: '✓ Bien', color: '#0369a1' },
    a_revoir: { label: '↺ À revoir', color: '#dc2626' },
  }

  // PAGE HIFZ
  if (page === 'hifz' && eleveSelectionne) {
    const hifzMap = {}
    hifzEleve.forEach(h => { hifzMap[h.sourate_id] = h })

    return (
      <div style={styles.wrap}>
        <div style={styles.header}>
          <button onClick={() => setPage('accueil')} style={styles.backBtn}>← Retour</button>
          <div>
            <div style={styles.headerTitle}>Suivi Hifz</div>
            <div style={styles.headerSub}>{eleveSelectionne.prenom} {eleveSelectionne.nom}</div>
          </div>
        </div>
        <div style={styles.content}>
          <div style={styles.souratesList}>
            {sourates.map(sourate => {
              const hifz = hifzMap[sourate.id]
              const statut = hifz?.statut || 'non_commence'
              const maitrise = hifz?.niveau_maitrise || ''
              const cfg = statutHifzConfig[statut]

              return (
                <div key={sourate.id} style={{
                  ...styles.sourateRow,
                  background: cfg.bg,
                  borderLeft: `3px solid ${cfg.color}`,
                }}>
                  <div style={styles.sourateNum}>{sourate.id}</div>
                  <div style={styles.sourateInfo}>
                    <div style={styles.sourateNomFr}>{sourate.nom_fr}</div>
                    <div style={styles.sourateNomAr}>{sourate.nom_ar}</div>
                    <div style={styles.sourateVersets}>{sourate.nombre_versets} versets</div>
                  </div>
                  <div style={styles.sourateControls}>
                    <select
                      value={statut}
                      onChange={e => updateHifz(sourate.id, e.target.value, maitrise)}
                      style={{...styles.selectSmall, color: cfg.color}}
                    >
                      {Object.entries(statutHifzConfig).map(([key, c]) => (
                        <option key={key} value={key}>{c.label}</option>
                      ))}
                    </select>
                    {statut !== 'non_commence' && (
                      <select
                        value={maitrise}
                        onChange={e => updateHifz(sourate.id, statut, e.target.value)}
                        style={styles.selectSmall}
                      >
                        <option value="">Niveau...</option>
                        {Object.entries(niveauMaitriseConfig).map(([key, c]) => (
                          <option key={key} value={key}>{c.label}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // PAGE ACCUEIL MONITRICE
  return (
    <div style={styles.wrap}>

      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.headerLogo}>
          <img src="/LOGO_CKA_vf.png" alt="Logo" style={styles.logo} />
          <div>
            <div style={styles.headerTitle}>Coran Kids Academy</div>
            <div style={styles.headerSub}>Mémoriser le Coran, Éveiller l'Avenir</div>
          </div>
        </div>
        <div style={styles.headerRight}>
          <div>
            <div style={styles.userName}>{profil.prenom} {profil.nom}</div>
            <div style={styles.userRole}>👩‍🏫 Monitrice</div>
          </div>
          <button onClick={onLogout} style={styles.backBtn}>Déconnexion</button>
        </div>
      </div>

      <div style={styles.content}>

        {/* Salutation */}
        <div style={styles.salutation}>
          <div style={styles.arabicText}>بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</div>
          <h1 style={styles.welcomeTitle}>
            Assalamu Alaykum, {profil.prenom} 👋
          </h1>
          <p style={styles.welcomeSub}>
            {eleves.length} élève{eleves.length > 1 ? 's' : ''} dans votre classe
          </p>
        </div>

        {/* Présences */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionTitle}>📅 Présences du jour</div>
            <div style={styles.dateRow}>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                style={styles.dateInput}
              />
              <button
                onClick={handleSavePresences}
                disabled={saving}
                style={saving ? styles.saveBtnDisabled : styles.saveBtn}
              >
                {saving ? 'Sauvegarde...' : saved ? '✓ Sauvegardé !' : '💾 Sauvegarder'}
              </button>
            </div>
          </div>

          {loading ? (
            <div style={styles.loadingBox}>Chargement...</div>
          ) : eleves.length === 0 ? (
            <div style={styles.emptyBox}>
              Aucun élève assigné à votre classe pour le moment.
            </div>
          ) : (
            <div style={styles.elevesList}>
              {eleves.map((eleve, index) => {
                const statut = presences[eleve.id] || 'present'
                const cfg = statutPresenceConfig[statut]
                return (
                  <div key={eleve.id} style={{
                    ...styles.eleveRow,
                    background: cfg.bg,
                    borderLeft: `4px solid ${cfg.border}`,
                  }}>
                    <div style={styles.eleveNum}>{index + 1}</div>
                    <div style={styles.eleveAvatar}>
                      {eleve.prenom[0]}{eleve.nom[0]}
                    </div>
                    <div style={styles.eleveInfo}>
                      <div style={styles.eleveName}>{eleve.prenom} {eleve.nom}</div>
                      <div style={styles.eleveNiveau}>{eleve.niveaux?.nom}</div>
                    </div>
                    <div style={styles.statutBtns}>
                      {Object.entries(statutPresenceConfig).map(([key, c]) => (
                        <button
                          key={key}
                          onClick={() => setStatut(eleve.id, key)}
                          style={{
                            ...styles.statutBtn,
                            background: statut === key ? c.border : 'white',
                            color: statut === key ? 'white' : c.color,
                            border: `1.5px solid ${c.border}`,
                          }}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => ouvrirHifz(eleve)}
                      style={styles.hifzBtn}
                    >
                      📖 Hifz
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

const styles = {
  wrap: { minHeight: '100vh', background: '#f8f9f8', fontFamily: 'sans-serif' },
  header: {
    background: 'linear-gradient(135deg, #03281e 0%, #085041 100%)',
    padding: '12px 28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  },
  headerLogo: { display: 'flex', alignItems: 'center', gap: '12px' },
  logo: { width: '44px', height: '44px', borderRadius: '50%', objectFit: 'contain', background: 'white', padding: '2px' },
  headerTitle: { color: 'white', fontSize: '15px', fontWeight: '600' },
  headerSub: { color: '#7dd4b6', fontSize: '11px', fontStyle: 'italic' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '16px' },
  userName: { color: 'white', fontSize: '13px', fontWeight: '500', textAlign: 'right' },
  userRole: { color: '#F5A623', fontSize: '11px', fontWeight: '600' },
  backBtn: {
    background: 'rgba(255,255,255,0.1)', color: 'white',
    border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px',
    padding: '8px 14px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
  },
  content: { maxWidth: '900px', margin: '0 auto', padding: '24px' },
  salutation: { marginBottom: '24px' },
  arabicText: { fontFamily: 'serif', fontSize: '15px', color: '#F5A623', marginBottom: '6px', direction: 'rtl' },
  welcomeTitle: { fontSize: '22px', fontWeight: '600', color: '#085041', margin: '0 0 4px' },
  welcomeSub: { fontSize: '13px', color: '#8a918a', margin: 0 },
  section: { background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: '20px' },
  sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' },
  sectionTitle: { fontSize: '15px', fontWeight: '600', color: '#252a25' },
  dateRow: { display: 'flex', gap: '10px', alignItems: 'center' },
  dateInput: {
    padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #d8dbd8',
    fontSize: '13px', outline: 'none', fontFamily: 'inherit', color: '#252a25', background: 'white',
  },
  saveBtn: {
    background: '#F5A623', color: '#085041', border: 'none',
    borderRadius: '8px', padding: '8px 16px', fontSize: '13px',
    fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit',
  },
  saveBtnDisabled: {
    background: '#b2b8b2', color: 'white', border: 'none',
    borderRadius: '8px', padding: '8px 16px', fontSize: '13px',
    fontWeight: '700', cursor: 'not-allowed', fontFamily: 'inherit',
  },
  loadingBox: { textAlign: 'center', padding: '40px', color: '#8a918a' },
  emptyBox: { textAlign: 'center', padding: '40px', color: '#8a918a', fontSize: '14px' },
  elevesList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  eleveRow: {
    borderRadius: '12px', padding: '12px 16px',
    display: 'flex', alignItems: 'center', gap: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  eleveNum: { fontSize: '13px', fontWeight: '600', color: '#8a918a', width: '24px', textAlign: 'center', flexShrink: 0 },
  eleveAvatar: {
    width: '38px', height: '38px', borderRadius: '50%',
    background: 'rgba(255,255,255,0.7)', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontSize: '13px', fontWeight: '700', color: '#085041', flexShrink: 0,
  },
  eleveInfo: { flex: 1 },
  eleveName: { fontSize: '14px', fontWeight: '600', color: '#252a25' },
  eleveNiveau: { fontSize: '12px', color: '#8a918a', marginTop: '2px' },
  statutBtns: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  statutBtn: {
    padding: '5px 10px', borderRadius: '99px', fontSize: '11px',
    fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
  },
  hifzBtn: {
    background: '#085041', color: 'white', border: 'none',
    borderRadius: '8px', padding: '8px 12px', fontSize: '12px',
    fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
  },
  souratesList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  sourateRow: {
    borderRadius: '10px', padding: '12px 16px',
    display: 'flex', alignItems: 'center', gap: '12px',
  },
  sourateNum: {
    width: '32px', height: '32px', borderRadius: '8px',
    background: 'rgba(255,255,255,0.7)', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontSize: '12px', fontWeight: '700', color: '#085041', flexShrink: 0,
  },
  sourateInfo: { flex: 1 },
  sourateNomFr: { fontSize: '13px', fontWeight: '600', color: '#252a25' },
  sourateNomAr: { fontFamily: 'serif', fontSize: '14px', color: '#F5A623', direction: 'rtl' },
  sourateVersets: { fontSize: '11px', color: '#8a918a', marginTop: '2px' },
  sourateControls: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  selectSmall: {
    padding: '6px 10px', borderRadius: '8px', border: '1.5px solid #d8dbd8',
    fontSize: '12px', outline: 'none', fontFamily: 'inherit',
    background: 'white', color: '#252a25', cursor: 'pointer',
  },
}