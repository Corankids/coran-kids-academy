import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function ListeEleves({ onRetour }) {
  const [eleves, setEleves] = useState([])
  const [loading, setLoading] = useState(true)
  const [recherche, setRecherche] = useState('')
  const [filtreNiveau, setFiltreNiveau] = useState('')
  const [niveaux, setNiveaux] = useState([])

  useEffect(() => {
    fetchEleves()
    fetchNiveaux()
  }, [])

  async function fetchEleves() {
    setLoading(true)
    const { data } = await supabase
      .from('eleves')
      .select(`
        *,
        niveaux (nom, tranche_age)
      `)
      .eq('actif', true)
      .order('nom')
    setEleves(data || [])
    setLoading(false)
  }

  async function fetchNiveaux() {
    const { data } = await supabase
      .from('niveaux')
      .select('*')
      .order('ordre')
    setNiveaux(data || [])
  }

  function calculerAge(dateNaissance) {
    const today = new Date()
    const birth = new Date(dateNaissance)
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return age
  }

  function getInitiales(prenom, nom) {
    return (prenom?.[0] || '') + (nom?.[0] || '')
  }

  const elevesFiltres = eleves.filter(e => {
    const matchRecherche = recherche === '' ||
      `${e.prenom} ${e.nom}`.toLowerCase().includes(recherche.toLowerCase()) ||
      e.tuteur_nom?.toLowerCase().includes(recherche.toLowerCase())
    const matchNiveau = filtreNiveau === '' || e.niveau_id === filtreNiveau
    return matchRecherche && matchNiveau
  })

  return (
    <div style={styles.wrap}>

      {/* HEADER */}
      <div style={styles.header}>
        <button onClick={onRetour} style={styles.backBtn}>← Retour</button>
        <div>
          <div style={styles.headerTitle}>Liste des élèves</div>
          <div style={styles.headerSub}>Coran Kids Academy</div>
        </div>
        <div style={styles.headerCount}>
          {eleves.length} élève{eleves.length > 1 ? 's' : ''} inscrit{eleves.length > 1 ? 's' : ''}
        </div>
      </div>

      <div style={styles.content}>

        {/* Filtres */}
        <div style={styles.filtresBox}>
          <input
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            placeholder="🔍 Rechercher un élève ou un tuteur..."
            style={styles.searchInput}
          />
          <select
            value={filtreNiveau}
            onChange={e => setFiltreNiveau(e.target.value)}
            style={styles.selectInput}
          >
            <option value="">Tous les niveaux</option>
            {niveaux.map(n => (
              <option key={n.id} value={n.id}>{n.nom}</option>
            ))}
          </select>
        </div>

        {/* Liste */}
        {loading ? (
          <div style={styles.loadingBox}>Chargement des élèves...</div>
        ) : elevesFiltres.length === 0 ? (
          <div style={styles.emptyBox}>
            <div style={styles.emptyIcon}>👧</div>
            <div style={styles.emptyTitle}>
              {eleves.length === 0 ? 'Aucun élève inscrit pour le moment' : 'Aucun résultat trouvé'}
            </div>
            <div style={styles.emptySub}>
              {eleves.length === 0 ? 'Utilisez le bouton "Inscrire un élève" pour commencer.' : 'Modifiez votre recherche.'}
            </div>
          </div>
        ) : (
          <div style={styles.elevesGrid}>
            {elevesFiltres.map(eleve => (
              <div key={eleve.id} style={styles.eleveCard}>
                {/* Avatar */}
                <div style={styles.cardTop}>
                  <div style={{
                    ...styles.avatar,
                    background: eleve.sexe === 'F' ? '#fce7f3' : '#e0f2fe',
                    color: eleve.sexe === 'F' ? '#be185d' : '#0369a1',
                  }}>
                    {getInitiales(eleve.prenom, eleve.nom)}
                  </div>
                  <div style={styles.eleveInfo}>
                    <div style={styles.eleveName}>
                      {eleve.prenom} {eleve.nom}
                    </div>
                    <div style={styles.eleveAge}>
                      {calculerAge(eleve.date_naissance)} ans · {eleve.sexe === 'F' ? 'Fille' : 'Garçon'}
                    </div>
                  </div>
                  <div style={styles.niveauBadge}>
                    {eleve.niveaux?.nom}
                  </div>
                </div>

                {/* Infos tuteur */}
                <div style={styles.cardBody}>
                  <div style={styles.infoLine}>
                    <span style={styles.infoIcon}>👨‍👩‍👧</span>
                    <span style={styles.infoText}>
                      {eleve.tuteur_nom} ({eleve.tuteur_lien})
                    </span>
                  </div>
                  <div style={styles.infoLine}>
                    <span style={styles.infoIcon}>📞</span>
                    <span style={styles.infoText}>{eleve.tuteur_telephone}</span>
                  </div>
                  {eleve.tuteur_whatsapp && eleve.tuteur_whatsapp !== eleve.tuteur_telephone && (
                    <div style={styles.infoLine}>
                      <span style={styles.infoIcon}>💬</span>
                      <span style={styles.infoText}>{eleve.tuteur_whatsapp}</span>
                    </div>
                  )}
                  {eleve.notes && (
                    <div style={styles.notesBox}>{eleve.notes}</div>
                  )}
                </div>

                {/* Date inscription */}
                <div style={styles.cardFooter}>
                  Inscrit le {new Date(eleve.date_inscription).toLocaleDateString('fr-FR')}
                </div>
              </div>
            ))}
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
  headerCount: {
    marginLeft: 'auto',
    background: 'rgba(255,255,255,0.15)',
    color: 'white',
    borderRadius: '99px',
    padding: '6px 14px',
    fontSize: '13px',
    fontWeight: '600',
  },
  content: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '24px',
  },
  filtresBox: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  searchInput: {
    flex: 1,
    minWidth: '200px',
    padding: '11px 14px',
    borderRadius: '10px',
    border: '1.5px solid #d8dbd8',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit',
    background: 'white',
    color: '#252a25',
  },
  selectInput: {
    padding: '11px 14px',
    borderRadius: '10px',
    border: '1.5px solid #d8dbd8',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit',
    background: 'white',
    color: '#252a25',
    minWidth: '180px',
  },
  loadingBox: {
    textAlign: 'center',
    padding: '60px',
    color: '#8a918a',
    fontSize: '14px',
  },
  emptyBox: {
    textAlign: 'center',
    padding: '60px 20px',
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  emptyIcon: { fontSize: '48px', marginBottom: '16px' },
  emptyTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#252a25',
    marginBottom: '8px',
  },
  emptySub: { fontSize: '13px', color: '#8a918a' },
  elevesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px',
  },
  eleveCard: {
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    overflow: 'hidden',
    border: '1px solid #eef0ee',
  },
  cardTop: {
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '1px solid #eef0ee',
  },
  avatar: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: '700',
    flexShrink: 0,
  },
  eleveInfo: { flex: 1 },
  eleveName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#252a25',
  },
  eleveAge: {
    fontSize: '12px',
    color: '#8a918a',
    marginTop: '2px',
  },
  niveauBadge: {
    background: '#e4f7f2',
    color: '#085041',
    borderRadius: '99px',
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  cardBody: {
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  infoLine: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  infoIcon: { fontSize: '14px', flexShrink: 0 },
  infoText: { fontSize: '13px', color: '#4a524a' },
  notesBox: {
    background: '#f8f9f8',
    borderRadius: '8px',
    padding: '8px 10px',
    fontSize: '12px',
    color: '#8a918a',
    fontStyle: 'italic',
    marginTop: '4px',
  },
  cardFooter: {
    padding: '10px 16px',
    borderTop: '1px solid #eef0ee',
    fontSize: '11px',
    color: '#b2b8b2',
  },
}