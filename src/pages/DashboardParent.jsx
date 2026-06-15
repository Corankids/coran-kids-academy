import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function DashboardParent({ user, profil, onLogout }) {
  const [eleve, setEleve] = useState(null)
  const [presences, setPresences] = useState([])
  const [hifz, setHifz] = useState([])
  const [paiements, setPaiements] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState('accueil')

  useEffect(() => {
    fetchEleve()
  }, [])

  async function fetchEleve() {
    setLoading(true)
    const { data } = await supabase
      .from('eleves')
      .select('*, niveaux(nom, tranche_age)')
      .eq('parent_id', user.id)
      .eq('actif', true)
      .single()
    setEleve(data)
    if (data) {
      fetchPresences(data.id)
      fetchHifz(data.id)
      fetchPaiements(data.id)
    }
    setLoading(false)
  }

  async function fetchPresences(eleveId) {
    const { data } = await supabase
      .from('presences')
      .select('*')
      .eq('eleve_id', eleveId)
      .order('date', { ascending: false })
      .limit(30)
    setPresences(data || [])
  }

  async function fetchHifz(eleveId) {
    const { data } = await supabase
      .from('hifz')
      .select('*, sourates(nom_fr, nom_ar, nombre_versets)')
      .eq('eleve_id', eleveId)
      .order('sourate_id')
    setHifz(data || [])
  }

  async function fetchPaiements(eleveId) {
    const { data } = await supabase
      .from('paiements')
      .select('*')
      .eq('eleve_id', eleveId)
      .order('annee', { ascending: false })
      .order('mois', { ascending: false })
    setPaiements(data || [])
  }

  const versetsMemorises = hifz
    .filter(h => h.statut === 'memorise' || h.statut === 'revise')
    .reduce((acc, h) => acc + (h.sourates?.nombre_versets || 0), 0)

  const souratesMemorisees = hifz.filter(h => h.statut === 'memorise' || h.statut === 'revise').length
  const pctHifz = Math.round((versetsMemorises / 6236) * 100)

  const presencesPresent = presences.filter(p => p.statut === 'present').length
  const tauxPresence = presences.length > 0
    ? Math.round((presencesPresent / presences.length) * 100)
    : 0

  const moisNoms = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

  const statutPaiementConfig = {
    paye: { label: '✓ Payé', bg: '#e4f7f2', color: '#085041' },
    en_attente: { label: '⏱ En attente', bg: '#fef8e7', color: '#b8780d' },
    retard: { label: '⚠ Retard', bg: '#fef2f2', color: '#dc2626' },
  }

  const statutPresenceConfig = {
    present: { label: '✓', color: '#085041', bg: '#e4f7f2' },
    absent: { label: '✗', color: '#dc2626', bg: '#fef2f2' },
    retard: { label: '⏱', color: '#b8780d', bg: '#fef8e7' },
    excuse: { label: '📋', color: '#0369a1', bg: '#eff6ff' },
  }

  if (loading) {
    return (
      <div style={styles.loadingWrap}>
        <div style={styles.loadingText}>Chargement...</div>
      </div>
    )
  }

  if (!eleve) {
    return (
      <div style={styles.wrap}>
        <div style={styles.header}>
          <div style={styles.headerLogo}>
            <img src="/LOGO_CKA_vf.png" alt="Logo" style={styles.logo} />
            <div>
              <div style={styles.headerTitle}>Coran Kids Academy</div>
              <div style={styles.headerSub}>Espace Parent</div>
            </div>
          </div>
          <button onClick={onLogout} style={styles.logoutBtn}>Déconnexion</button>
        </div>
        <div style={styles.emptyWrap}>
          <div style={styles.emptyIcon}>👧</div>
          <div style={styles.emptyTitle}>Aucun enfant associé</div>
          <div style={styles.emptySub}>
            Votre compte n'est pas encore lié à un élève. Contactez la direction.
          </div>
          <div style={styles.contactBox}>
            📞 64 65 81 90 / 72 05 73 00
          </div>
        </div>
      </div>
    )
  }

  // PAGE PRESENCES
  if (page === 'presences') {
    return (
      <div style={styles.wrap}>
        <div style={styles.header}>
          <button onClick={() => setPage('accueil')} style={styles.backBtn}>← Retour</button>
          <div>
            <div style={styles.headerTitle}>Présences</div>
            <div style={styles.headerSub}>{eleve.prenom} {eleve.nom}</div>
          </div>
        </div>
        <div style={styles.content}>
          <div style={styles.statsRow}>
            <div style={{...styles.statCard, borderTop: '3px solid #1D9E75'}}>
              <div style={styles.statVal}>{presencesPresent}</div>
              <div style={styles.statLbl}>Jours présent</div>
            </div>
            <div style={{...styles.statCard, borderTop: '3px solid #e05252'}}>
              <div style={styles.statVal}>{presences.filter(p => p.statut === 'absent').length}</div>
              <div style={styles.statLbl}>Absences</div>
            </div>
            <div style={{...styles.statCard, borderTop: '3px solid #1D9E75'}}>
              <div style={styles.statVal}>{tauxPresence}%</div>
              <div style={styles.statLbl}>Taux présence</div>
            </div>
          </div>
          <div style={styles.section}>
            <div style={styles.sectionTitle}>📅 Historique — 30 derniers jours</div>
            <div style={styles.presenceGrid}>
              {presences.map(p => {
                const cfg = statutPresenceConfig[p.statut] || statutPresenceConfig.present
                const date = new Date(p.date)
                return (
                  <div key={p.id} style={{...styles.presenceDay, background: cfg.bg}}>
                    <div style={{...styles.presenceDayLabel, color: cfg.color}}>{cfg.label}</div>
                    <div style={styles.presenceDayDate}>
                      {date.getDate()}/{date.getMonth() + 1}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // PAGE HIFZ
  if (page === 'hifz') {
    return (
      <div style={styles.wrap}>
        <div style={styles.header}>
          <button onClick={() => setPage('accueil')} style={styles.backBtn}>← Retour</button>
          <div>
            <div style={styles.headerTitle}>Progression Coran</div>
            <div style={styles.headerSub}>{eleve.prenom} {eleve.nom}</div>
          </div>
        </div>
        <div style={styles.content}>
          <div style={styles.hifzSummary}>
            <div style={styles.hifzPct}>{pctHifz}%</div>
            <div style={styles.hifzDetail}>
              <div style={styles.hifzVersets}>{versetsMemorises} / 6 236 versets</div>
              <div style={styles.hifzSourates}>{souratesMemorisees} sourates mémorisées</div>
            </div>
            <div style={styles.hifzBarBg}>
              <div style={{...styles.hifzBarFill, width: `${pctHifz}%`}}></div>
            </div>
          </div>
          <div style={styles.section}>
            <div style={styles.sectionTitle}>📖 Détail par sourate</div>
            {hifz.length === 0 ? (
              <div style={styles.emptySub}>Aucune sourate enregistrée pour le moment.</div>
            ) : (
              <div style={styles.souratesList}>
                {hifz.map(h => (
                  <div key={h.id} style={{
                    ...styles.sourateRow,
                    background: h.statut === 'memorise' ? '#e4f7f2' :
                                h.statut === 'revise' ? '#eff6ff' :
                                h.statut === 'en_cours' ? '#fef8e7' : '#f8f9f8',
                    borderLeft: `3px solid ${
                      h.statut === 'memorise' ? '#1D9E75' :
                      h.statut === 'revise' ? '#4a90d9' :
                      h.statut === 'en_cours' ? '#F5A623' : '#d8dbd8'
                    }`,
                  }}>
                    <div style={styles.sourateNum}>{h.sourate_id}</div>
                    <div style={styles.sourateInfo}>
                      <div style={styles.sourateNomFr}>{h.sourates?.nom_fr}</div>
                      <div style={styles.sourateNomAr}>{h.sourates?.nom_ar}</div>
                    </div>
                    <div style={styles.sourateStatut}>
                      {h.statut === 'memorise' ? '✓ Mémorisée' :
                       h.statut === 'revise' ? '↺ Révisée' :
                       h.statut === 'en_cours' ? '⟳ En cours' : '— À venir'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // PAGE PAIEMENTS
  if (page === 'paiements') {
    return (
      <div style={styles.wrap}>
        <div style={styles.header}>
          <button onClick={() => setPage('accueil')} style={styles.backBtn}>← Retour</button>
          <div>
            <div style={styles.headerTitle}>Paiements</div>
            <div style={styles.headerSub}>{eleve.prenom} {eleve.nom}</div>
          </div>
        </div>
        <div style={styles.content}>
          {paiements.length === 0 ? (
            <div style={styles.emptyWrap}>
              <div style={styles.emptyIcon}>💳</div>
              <div style={styles.emptyTitle}>Aucun paiement enregistré</div>
              <div style={styles.emptySub}>Les paiements apparaîtront ici dès qu'ils seront enregistrés par la direction.</div>
            </div>
          ) : (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>💳 Historique des paiements</div>
              {paiements.map(p => {
                const cfg = statutPaiementConfig[p.statut] || statutPaiementConfig.en_attente
                return (
                  <div key={p.id} style={styles.paiementRow}>
                    <div style={styles.paiementInfo}>
                      <div style={styles.paiementMois}>
                        {moisNoms[p.mois - 1]} {p.annee}
                      </div>
                      <div style={styles.paiementDate}>
                        {p.date_paiement ? `Payé le ${new Date(p.date_paiement).toLocaleDateString('fr-FR')}` : 'Non payé'}
                      </div>
                    </div>
                    <div style={styles.paiementRight}>
                      <div style={styles.paiementMontant}>{p.montant?.toLocaleString()} FCFA</div>
                      <div style={{...styles.paiementStatut, background: cfg.bg, color: cfg.color}}>
                        {cfg.label}
                      </div>
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

  // PAGE ACCUEIL PARENT
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
        <button onClick={onLogout} style={styles.logoutBtn}>Déconnexion</button>
      </div>

      <div style={styles.content}>

        {/* Salutation */}
        <div style={styles.salutation}>
          <div style={styles.arabicText}>بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</div>
          <h1 style={styles.welcomeTitle}>
            Assalamu Alaykum, {profil.prenom} 👋
          </h1>
        </div>

        {/* Carte enfant */}
        <div style={styles.eleveCard}>
          <div style={styles.eleveAvatar}>
            {eleve.prenom[0]}{eleve.nom[0]}
          </div>
          <div style={styles.eleveInfo}>
            <div style={styles.eleveName}>{eleve.prenom} {eleve.nom}</div>
            <div style={styles.eleveNiveau}>{eleve.niveaux?.nom} · {eleve.niveaux?.tranche_age}</div>
            <div style={styles.elevePresent}>● Inscrit à Coran Kids Academy</div>
          </div>
        </div>

        {/* Progression hifz */}
        <div style={styles.hifzCard} onClick={() => setPage('hifz')}>
          <div style={styles.hifzCardTop}>
            <div style={styles.hifzCardTitle}>📖 Progression Coran</div>
            <div style={styles.hifzCardPct}>{pctHifz}%</div>
          </div>
          <div style={styles.hifzBarBg}>
            <div style={{...styles.hifzBarFill, width: `${pctHifz}%`}}></div>
          </div>
          <div style={styles.hifzCardDetail}>
            <span>{versetsMemorises} versets mémorisés</span>
            <span>{souratesMemorisees} sourates</span>
          </div>
          {hifz.length > 0 && (
            <div style={styles.derniereSourate}>
              🌟 Dernière sourate : {hifz.filter(h => h.statut === 'memorise').slice(-1)[0]?.sourates?.nom_fr || '—'}
            </div>
          )}
        </div>

        {/* Navigation rapide */}
        <div style={styles.navGrid}>
          <div style={styles.navCard} onClick={() => setPage('presences')}>
            <div style={styles.navIcon}>📅</div>
            <div style={styles.navLabel}>Présences</div>
            <div style={styles.navVal}>{tauxPresence}%</div>
            <div style={styles.navSub}>taux ce mois</div>
          </div>
          <div style={styles.navCard} onClick={() => setPage('hifz')}>
            <div style={styles.navIcon}>📖</div>
            <div style={styles.navLabel}>Coran</div>
            <div style={styles.navVal}>{souratesMemorisees}</div>
            <div style={styles.navSub}>sourates</div>
          </div>
          <div style={styles.navCard} onClick={() => setPage('paiements')}>
            <div style={styles.navIcon}>💳</div>
            <div style={styles.navLabel}>Paiements</div>
            <div style={styles.navVal}>{paiements.filter(p => p.statut === 'paye').length}</div>
            <div style={styles.navSub}>payés</div>
          </div>
        </div>

        {/* Contact école */}
        <div style={styles.contactCard}>
          <div style={styles.contactTitle}>📞 Contacter l'école</div>
          <div style={styles.contactInfo}>64 65 81 90 / 72 05 73 00</div>
          <div style={styles.contactInfo}>Ouagadougou, Burkina Faso</div>
        </div>

      </div>
    </div>
  )
}

const styles = {
  wrap: { minHeight: '100vh', background: '#f8f9f8', fontFamily: 'sans-serif' },
  loadingWrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: '16px', color: '#8a918a' },
  header: {
    background: 'linear-gradient(135deg, #03281e 0%, #085041 100%)',
    padding: '12px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  },
  headerLogo: { display: 'flex', alignItems: 'center', gap: '10px' },
  logo: { width: '40px', height: '40px', borderRadius: '50%', objectFit: 'contain', background: 'white', padding: '2px' },
  headerTitle: { color: 'white', fontSize: '14px', fontWeight: '600' },
  headerSub: { color: '#7dd4b6', fontSize: '11px', fontStyle: 'italic' },
  logoutBtn: {
    background: 'rgba(255,255,255,0.1)', color: 'white',
    border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px',
    padding: '7px 12px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit',
  },
  backBtn: {
    background: 'rgba(255,255,255,0.1)', color: 'white',
    border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px',
    padding: '7px 12px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit',
  },
  content: { maxWidth: '600px', margin: '0 auto', padding: '20px' },
  salutation: { marginBottom: '20px' },
  arabicText: { fontFamily: 'serif', fontSize: '14px', color: '#F5A623', marginBottom: '6px', direction: 'rtl' },
  welcomeTitle: { fontSize: '20px', fontWeight: '600', color: '#085041', margin: '0 0 4px' },
  eleveCard: {
    background: 'linear-gradient(135deg, #085041, #0a6652)',
    borderRadius: '16px',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '16px',
  },
  eleveAvatar: {
    width: '52px', height: '52px', borderRadius: '50%',
    background: '#F5A623', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '20px', fontWeight: '700',
    color: '#085041', flexShrink: 0,
  },
  eleveInfo: { flex: 1 },
  eleveName: { fontSize: '17px', fontWeight: '600', color: 'white' },
  eleveNiveau: { fontSize: '13px', color: '#7dd4b6', marginTop: '3px' },
  elevePresent: { fontSize: '12px', color: '#3dba90', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' },
  hifzCard: {
    background: 'white', borderRadius: '16px', padding: '16px',
    marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    cursor: 'pointer', border: '1px solid #eef0ee',
  },
  hifzCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  hifzCardTitle: { fontSize: '14px', fontWeight: '600', color: '#252a25' },
  hifzCardPct: { fontSize: '24px', fontWeight: '700', color: '#085041', fontFamily: 'serif' },
  hifzBarBg: { background: '#eef0ee', borderRadius: '99px', height: '8px', marginBottom: '8px' },
  hifzBarFill: { background: 'linear-gradient(90deg, #1D9E75, #F5A623)', borderRadius: '99px', height: '8px', transition: 'width 0.6s ease' },
  hifzCardDetail: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#8a918a' },
  derniereSourate: { marginTop: '10px', background: '#e4f7f2', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#085041', fontWeight: '500' },
  navGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' },
  navCard: {
    background: 'white', borderRadius: '14px', padding: '14px 10px',
    textAlign: 'center', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    border: '1px solid #eef0ee',
  },
  navIcon: { fontSize: '22px', marginBottom: '6px' },
  navLabel: { fontSize: '12px', fontWeight: '500', color: '#4a524a', marginBottom: '4px' },
  navVal: { fontSize: '22px', fontWeight: '700', color: '#085041', fontFamily: 'serif' },
  navSub: { fontSize: '11px', color: '#8a918a', marginTop: '2px' },
  contactCard: {
    background: 'white', borderRadius: '14px', padding: '16px',
    textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    border: '1px solid #eef0ee',
  },
  contactTitle: { fontSize: '14px', fontWeight: '600', color: '#085041', marginBottom: '8px' },
  contactInfo: { fontSize: '13px', color: '#4a524a', marginBottom: '4px' },
  emptyWrap: { textAlign: 'center', padding: '60px 20px' },
  emptyIcon: { fontSize: '48px', marginBottom: '16px' },
  emptyTitle: { fontSize: '18px', fontWeight: '600', color: '#252a25', marginBottom: '8px' },
  emptySub: { fontSize: '13px', color: '#8a918a', marginBottom: '16px' },
  contactBox: { background: '#e4f7f2', borderRadius: '10px', padding: '12px', fontSize: '14px', color: '#085041', fontWeight: '500' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' },
  statCard: { background: 'white', borderRadius: '12px', padding: '14px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  statVal: { fontSize: '28px', fontWeight: '700', color: '#252a25', fontFamily: 'serif' },
  statLbl: { fontSize: '11px', color: '#8a918a', marginTop: '4px' },
  section: { background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  sectionTitle: { fontSize: '14px', fontWeight: '600', color: '#252a25', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid #eef0ee' },
  presenceGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' },
  presenceDay: { borderRadius: '8px', padding: '6px 4px', textAlign: 'center' },
  presenceDayLabel: { fontSize: '14px', fontWeight: '700' },
  presenceDayDate: { fontSize: '10px', color: '#8a918a', marginTop: '2px' },
  hifzSummary: { background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  hifzPct: { fontSize: '48px', fontWeight: '700', color: '#085041', fontFamily: 'serif', textAlign: 'center' },
  hifzDetail: { textAlign: 'center', marginBottom: '12px' },
  hifzVersets: { fontSize: '14px', fontWeight: '500', color: '#252a25' },
  hifzSourates: { fontSize: '13px', color: '#8a918a', marginTop: '4px' },
  souratesList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  sourateRow: { borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' },
  sourateNum: { width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: '#085041', flexShrink: 0 },
  sourateInfo: { flex: 1 },
  sourateNomFr: { fontSize: '13px', fontWeight: '500', color: '#252a25' },
  sourateNomAr: { fontFamily: 'serif', fontSize: '13px', color: '#F5A623', direction: 'rtl' },
  sourateStatut: { fontSize: '12px', fontWeight: '500', color: '#085041' },
  paiementRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #eef0ee' },
  paiementInfo: {},
  paiementMois: { fontSize: '14px', fontWeight: '500', color: '#252a25' },
  paiementDate: { fontSize: '12px', color: '#8a918a', marginTop: '2px' },
  paiementRight: { textAlign: 'right' },
  paiementMontant: { fontSize: '14px', fontWeight: '600', color: '#252a25' },
  paiementStatut: { display: 'inline-block', marginTop: '4px', fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '99px' },
}