import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import InscriptionEleve from './InscriptionEleve'
import AjoutMonitrice from './AjoutMonitrice'

export default function Dashboard({ user, profil, onLogout }) {
  const [page, setPage] = useState('dashboard')
  const [stats, setStats] = useState({
    eleves: 0,
    monitrices: 0,
    niveaux: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    setLoading(true)

    // Nombre d'élèves
    const { count: elevesCount } = await supabase
      .from('eleves')
      .select('*', { count: 'exact', head: true })
      .eq('actif', true)

    // Nombre de monitrices
    const { count: montricesCount } = await supabase
      .from('utilisateurs')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'monitrice')

    // Niveaux
    const { data: niveauxData } = await supabase
      .from('niveaux')
      .select('*')
      .order('ordre')

    setStats({
      eleves: elevesCount || 0,
      monitrices: montricesCount || 0,
      niveaux: niveauxData || [],
    })
    setLoading(false)
  }
if (page === 'inscription-eleve') {
  return (
    <InscriptionEleve
      onRetour={() => setPage('dashboard')}
      onSuccess={() => { setPage('dashboard'); fetchStats(); }}
    />
  )
}
if (page === 'ajout-monitrice') {
  return (
    <AjoutMonitrice
      onRetour={() => setPage('dashboard')}
      onSuccess={() => { setPage('dashboard'); fetchStats(); }}
    />
  )
}
  return (
    <div style={styles.wrap}>

      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <img src="/LOGO_CKA_vf.png" alt="Logo" style={styles.logo} />
          <div>
            <div style={styles.schoolName}>Coran Kids Academy</div>
            <div style={styles.schoolSlogan}>Mémoriser le Coran, Éveiller l'Avenir</div>
          </div>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.userInfo}>
            <div style={styles.userName}>{profil.prenom} {profil.nom}</div>
            <div style={styles.userRole}>Direction</div>
          </div>
          <button onClick={onLogout} style={styles.logoutBtn}>
            Déconnexion
          </button>
        </div>
      </div>

      {/* CONTENU */}
      <div style={styles.content}>

        {/* Salutation */}
        <div style={styles.salutation}>
          <div style={styles.arabicText}>بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</div>
          <h1 style={styles.welcomeTitle}>
            Assalamu Alaykum, {profil.prenom} 👋
          </h1>
          <p style={styles.welcomeSub}>
            Tableau de bord — Année scolaire 2025–2026
          </p>
        </div>

        {/* KPI Cards */}
        {loading ? (
          <div style={styles.loadingBox}>Chargement des données...</div>
        ) : (
          <>
            <div style={styles.kpiGrid}>
              <div style={{...styles.kpiCard, borderTop: '3px solid #1D9E75'}}>
                <div style={styles.kpiLabel}>Élèves inscrits</div>
                <div style={styles.kpiValue}>{stats.eleves}</div>
                <div style={styles.kpiSub}>
                  {stats.eleves === 0 ? 'Aucun élève inscrit pour le moment' : 'élèves actifs'}
                </div>
              </div>

              <div style={{...styles.kpiCard, borderTop: '3px solid #F5A623'}}>
                <div style={styles.kpiLabel}>Monitrices</div>
                <div style={styles.kpiValue}>{stats.monitrices}</div>
                <div style={styles.kpiSub}>
                  {stats.monitrices === 0 ? 'Recrutement en cours' : 'monitrices actives'}
                </div>
              </div>

              <div style={{...styles.kpiCard, borderTop: '3px solid #4a90d9'}}>
                <div style={styles.kpiLabel}>Niveaux</div>
                <div style={styles.kpiValue}>{stats.niveaux.length}</div>
                <div style={styles.kpiSub}>classes configurées</div>
              </div>

              <div style={{...styles.kpiCard, borderTop: '3px solid #e05252'}}>
                <div style={styles.kpiLabel}>Paiements en attente</div>
                <div style={styles.kpiValue}>0</div>
                <div style={styles.kpiSub}>aucun paiement en retard</div>
              </div>
            </div>

            {/* Niveaux */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>📚 Les 4 niveaux de l'école</div>
              <div style={styles.niveauxGrid}>
                {stats.niveaux.map((niveau) => (
                  <div key={niveau.id} style={styles.niveauCard}>
                    <div style={styles.niveauNom}>{niveau.nom}</div>
                    <div style={styles.niveauAge}>{niveau.tranche_age}</div>
                    <div style={styles.niveauDesc}>{niveau.description}</div>
                    <div style={styles.niveauEleves}>0 élève</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions rapides */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>⚡ Actions rapides</div>
              <div style={styles.actionsGrid}>
                <div style={styles.actionCard} onClick={() => setPage('inscription-eleve')}>
                  <div style={styles.actionIcon}>👧</div>
                  <div style={styles.actionLabel}>Inscrire un élève</div>
                  <div style={styles.actionSub}>Ajouter un nouvel élève</div>
                </div>
                <div style={styles.actionCard} onClick={() => setPage('ajout-monitrice')}>
                  <div style={styles.actionIcon}>👩‍🏫</div>
                  <div style={styles.actionLabel}>Ajouter une monitrice</div>
                  <div style={styles.actionSub}>Créer un compte monitrice</div>
                </div>
                <div style={styles.actionCard}>
                  <div style={styles.actionIcon}>📢</div>
                  <div style={styles.actionLabel}>Nouvelle annonce</div>
                  <div style={styles.actionSub}>Informer les familles</div>
                </div>
                <div style={styles.actionCard}>
                  <div style={styles.actionIcon}>📊</div>
                  <div style={styles.actionLabel}>Voir les présences</div>
                  <div style={styles.actionSub}>Feuille du jour</div>
                </div>
              </div>
            </div>

          </>
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
    padding: '12px 28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logo: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    objectFit: 'contain',
    background: 'white',
    padding: '2px',
  },
  schoolName: {
    color: 'white',
    fontSize: '15px',
    fontWeight: '600',
  },
  schoolSlogan: {
    color: '#7dd4b6',
    fontSize: '11px',
    fontStyle: 'italic',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userInfo: {
    textAlign: 'right',
  },
  userName: {
    color: 'white',
    fontSize: '13px',
    fontWeight: '500',
  },
  userRole: {
    color: '#F5A623',
    fontSize: '11px',
    fontWeight: '600',
  },
  logoutBtn: {
    background: 'rgba(255,255,255,0.1)',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '8px',
    padding: '8px 14px',
    fontSize: '12px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  content: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '28px 24px',
  },
  salutation: {
    marginBottom: '28px',
  },
  arabicText: {
    fontFamily: 'serif',
    fontSize: '15px',
    color: '#F5A623',
    marginBottom: '6px',
    direction: 'rtl',
  },
  welcomeTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#085041',
    margin: '0 0 4px',
  },
  welcomeSub: {
    fontSize: '13px',
    color: '#8a918a',
    margin: 0,
  },
  loadingBox: {
    textAlign: 'center',
    padding: '40px',
    color: '#8a918a',
    fontSize: '14px',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '28px',
  },
  kpiCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '20px 22px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  kpiLabel: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#8a918a',
    marginBottom: '8px',
  },
  kpiValue: {
    fontSize: '38px',
    fontWeight: '700',
    color: '#252a25',
    lineHeight: 1,
    marginBottom: '6px',
  },
  kpiSub: {
    fontSize: '12px',
    color: '#8a918a',
  },
  section: {
    marginBottom: '28px',
  },
  sectionTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#252a25',
    marginBottom: '14px',
  },
  niveauxGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
  },
  niveauCard: {
    background: 'white',
    borderRadius: '14px',
    padding: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    borderLeft: '4px solid #1D9E75',
  },
  niveauNom: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#085041',
    marginBottom: '4px',
  },
  niveauAge: {
    fontSize: '12px',
    color: '#F5A623',
    fontWeight: '500',
    marginBottom: '6px',
  },
  niveauDesc: {
    fontSize: '12px',
    color: '#8a918a',
    marginBottom: '10px',
    lineHeight: '1.4',
  },
  niveauEleves: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#4a524a',
    background: '#f0fdf9',
    padding: '4px 10px',
    borderRadius: '99px',
    display: 'inline-block',
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
  },
  actionCard: {
    background: 'white',
    borderRadius: '14px',
    padding: '20px 16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'transform 0.1s',
    border: '1.5px solid #eef0ee',
  },
  actionIcon: {
    fontSize: '28px',
    marginBottom: '10px',
  },
  actionLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#252a25',
    marginBottom: '4px',
  },
  actionSub: {
    fontSize: '11px',
    color: '#8a918a',
  },
}