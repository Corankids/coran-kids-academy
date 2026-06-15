import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Presences({ onRetour }) {
  const [eleves, setEleves] = useState([])
  const [niveaux, setNiveaux] = useState([])
  const [filtreNiveau, setFiltreNiveau] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [presences, setPresences] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchNiveaux()
  }, [])

  useEffect(() => {
    fetchEleves()
  }, [filtreNiveau])

  useEffect(() => {
    if (eleves.length > 0) fetchPresences()
  }, [eleves, date])

  async function fetchNiveaux() {
    const { data } = await supabase
      .from('niveaux')
      .select('*')
      .order('ordre')
    setNiveaux(data || [])
  }

  async function fetchEleves() {
    setLoading(true)
    let query = supabase
      .from('eleves')
      .select('*, niveaux(nom)')
      .eq('actif', true)
      .order('nom')
    if (filtreNiveau) query = query.eq('niveau_id', filtreNiveau)
    const { data } = await query
    setEleves(data || [])
    setLoading(false)
  }

  async function fetchPresences() {
    const eleveIds = eleves.map(e => e.id)
    const { data } = await supabase
      .from('presences')
      .select('*')
      .eq('date', date)
      .in('eleve_id', eleveIds)

    const presencesMap = {}
    // Par défaut tout le monde est présent
    eleves.forEach(e => { presencesMap[e.id] = 'present' })
    // Remplacer par les vraies données si elles existent
    if (data) {
      data.forEach(p => { presencesMap[p.eleve_id] = p.statut })
    }
    setPresences(presencesMap)
  }

  function setStatut(eleveId, statut) {
    setPresences(prev => ({ ...prev, [eleveId]: statut }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)

    const upserts = eleves.map(e => ({
      eleve_id: e.id,
      date: date,
      statut: presences[e.id] || 'present',
    }))

    const { error } = await supabase
      .from('presences')
      .upsert(upserts, { onConflict: 'eleve_id,date' })

    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  const stats = {
    present: Object.values(presences).filter(s => s === 'present').length,
    absent: Object.values(presences).filter(s => s === 'absent').length,
    retard: Object.values(presences).filter(s => s === 'retard').length,
    excuse: Object.values(presences).filter(s => s === 'excuse').length,
  }

  const statutConfig = {
    present: { label: '✓ Présent', bg: '#e4f7f2', color: '#085041', border: '#1D9E75' },
    absent: { label: '✗ Absent', bg: '#fef2f2', color: '#dc2626', border: '#e05252' },
    retard: { label: '⏱ Retard', bg: '#fef8e7', color: '#b8780d', border: '#F5A623' },
    excuse: { label: '📋 Excusé', bg: '#eff6ff', color: '#0369a1', border: '#4a90d9' },
  }

  return (
    <div style={styles.wrap}>

      {/* HEADER */}
      <div style={styles.header}>
        <button onClick={onRetour} style={styles.backBtn}>← Retour</button>
        <div>
          <div style={styles.headerTitle}>Feuille de présences</div>
          <div style={styles.headerSub}>Coran Kids Academy</div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={saving ? styles.saveBtnDisabled : styles.saveBtn}
        >
          {saving ? 'Sauvegarde...' : saved ? '✓ Sauvegardé !' : '💾 Sauvegarder'}
        </button>
      </div>

      <div style={styles.content}>

        {/* Filtres date et niveau */}
        <div style={styles.filtresBox}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={styles.input}
            />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Niveau</label>
            <select
              value={filtreNiveau}
              onChange={e => setFiltreNiveau(e.target.value)}
              style={styles.input}
            >
              <option value="">Tous les niveaux</option>
              {niveaux.map(n => (
                <option key={n.id} value={n.id}>{n.nom}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats du jour */}
        <div style={styles.statsRow}>
          <div style={{...styles.statPill, background: '#e4f7f2', color: '#085041'}}>
            ✓ Présents : {stats.present}
          </div>
          <div style={{...styles.statPill, background: '#fef2f2', color: '#dc2626'}}>
            ✗ Absents : {stats.absent}
          </div>
          <div style={{...styles.statPill, background: '#fef8e7', color: '#b8780d'}}>
            ⏱ Retards : {stats.retard}
          </div>
          <div style={{...styles.statPill, background: '#eff6ff', color: '#0369a1'}}>
            📋 Excusés : {stats.excuse}
          </div>
        </div>

        {/* Liste élèves */}
        {loading ? (
          <div style={styles.loadingBox}>Chargement...</div>
        ) : eleves.length === 0 ? (
          <div style={styles.emptyBox}>
            <div style={styles.emptyIcon}>👧</div>
            <div style={styles.emptyTitle}>Aucun élève trouvé</div>
            <div style={styles.emptySub}>Inscrivez des élèves pour gérer les présences.</div>
          </div>
        ) : (
          <div style={styles.elevesList}>
            {eleves.map((eleve, index) => {
              const statut = presences[eleve.id] || 'present'
              const config = statutConfig[statut]
              return (
                <div key={eleve.id} style={{
                  ...styles.eleveRow,
                  background: config.bg,
                  borderLeft: `4px solid ${config.border}`,
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
                    {Object.entries(statutConfig).map(([key, cfg]) => (
                      <button
                        key={key}
                        onClick={() => setStatut(eleve.id, key)}
                        style={{
                          ...styles.statutBtn,
                          background: statut === key ? cfg.border : 'white',
                          color: statut === key ? 'white' : cfg.color,
                          border: `1.5px solid ${cfg.border}`,
                        }}
                      >
                        {cfg.label}
                      </button>
                    ))}
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
  saveBtn: {
    marginLeft: 'auto',
    background: '#F5A623',
    color: '#085041',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 20px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  saveBtnDisabled: {
    marginLeft: 'auto',
    background: '#b2b8b2',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 20px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'not-allowed',
    fontFamily: 'inherit',
  },
  content: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '24px',
  },
  filtresBox: {
    display: 'flex',
    gap: '16px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#4a524a',
  },
  input: {
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1.5px solid #d8dbd8',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit',
    background: 'white',
    color: '#252a25',
  },
  statsRow: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  statPill: {
    padding: '8px 16px',
    borderRadius: '99px',
    fontSize: '13px',
    fontWeight: '600',
  },
  loadingBox: {
    textAlign: 'center',
    padding: '60px',
    color: '#8a918a',
  },
  emptyBox: {
    textAlign: 'center',
    padding: '60px 20px',
    background: 'white',
    borderRadius: '16px',
  },
  emptyIcon: { fontSize: '48px', marginBottom: '16px' },
  emptyTitle: { fontSize: '16px', fontWeight: '600', color: '#252a25', marginBottom: '8px' },
  emptySub: { fontSize: '13px', color: '#8a918a' },
  elevesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  eleveRow: {
    borderRadius: '12px',
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  eleveNum: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#8a918a',
    width: '24px',
    textAlign: 'center',
    flexShrink: 0,
  },
  eleveAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '700',
    color: '#085041',
    flexShrink: 0,
  },
  eleveInfo: { flex: 1 },
  eleveName: { fontSize: '14px', fontWeight: '600', color: '#252a25' },
  eleveNiveau: { fontSize: '12px', color: '#8a918a', marginTop: '2px' },
  statutBtns: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  statutBtn: {
    padding: '6px 12px',
    borderRadius: '99px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.1s',
  },
}