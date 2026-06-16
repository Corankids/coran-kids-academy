import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Certificats({ onRetour }) {
  const [eleves, setEleves] = useState([])
  const [hifzData, setHifzData] = useState({})
  const [loading, setLoading] = useState(true)
  const [eleveSelectionne, setEleveSelectionne] = useState(null)
  const [printing, setPrinting] = useState(false)

  useEffect(() => {
    fetchEleves()
  }, [])

  async function fetchEleves() {
    setLoading(true)
    const { data } = await supabase
      .from('eleves')
      .select('*, niveaux(nom)')
      .eq('actif', true)
      .order('nom')
    setEleves(data || [])

    // Récupérer le hifz de chaque élève
    if (data && data.length > 0) {
      const hifzMap = {}
      for (const eleve of data) {
        const { data: hifz } = await supabase
          .from('hifz')
          .select('*, sourates(nom_fr, nom_ar, nombre_versets)')
          .eq('eleve_id', eleve.id)
          .in('statut', ['memorise', 'revise'])
        hifzMap[eleve.id] = hifz || []
      }
      setHifzData(hifzMap)
    }
    setLoading(false)
  }

  function calculerProgress(eleveId) {
    const hifz = hifzData[eleveId] || []
    const versets = hifz.reduce((acc, h) => acc + (h.sourates?.nombre_versets || 0), 0)
    const sourates = hifz.length
    const pct = Math.round((versets / 6236) * 100)
    return { versets, sourates, pct }
  }

  function getJalons(eleveId) {
    const { sourates, versets } = calculerProgress(eleveId)
    const jalons = []

    // Juz Amma (sourates 78-114 = 37 sourates)
    const hifz = hifzData[eleveId] || []
    const souratesIds = hifz.map(h => h.sourate_id)
    const juzAmma = [78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114]
    const juzAmmaMemorises = juzAmma.filter(id => souratesIds.includes(id)).length

    if (juzAmmaMemorises === 37) jalons.push({ label: 'Juz Amma', icon: '🌟', desc: '37 sourates mémorisées' })
    if (versets >= 500) jalons.push({ label: '500 versets', icon: '⭐', desc: '500 versets mémorisés' })
    if (versets >= 1000) jalons.push({ label: '1000 versets', icon: '🏆', desc: '1000 versets mémorisés' })
    if (sourates >= 30) jalons.push({ label: '30 sourates', icon: '📖', desc: '30 sourates mémorisées' })
    if (sourates >= 50) jalons.push({ label: '50 sourates', icon: '🎯', desc: '50 sourates mémorisées' })

    return jalons
  }

  function imprimerCertificat(eleve, jalon) {
    setPrinting(true)
    setEleveSelectionne({ eleve, jalon })
    setTimeout(() => {
      window.print()
      setPrinting(false)
    }, 500)
  }

  return (
    <div style={styles.wrap}>

      {/* HEADER — caché à l'impression */}
      <div style={styles.header} className="no-print">
        <button onClick={onRetour} style={styles.backBtn}>← Retour</button>
        <div>
          <div style={styles.headerTitle}>Certificats de mémorisation</div>
          <div style={styles.headerSub}>Coran Kids Academy</div>
        </div>
      </div>

      {/* CONTENU NORMAL */}
      <div style={styles.content} className="no-print">
        {loading ? (
          <div style={styles.loadingBox}>Chargement...</div>
        ) : eleves.length === 0 ? (
          <div style={styles.emptyBox}>
            <div style={styles.emptyIcon}>📜</div>
            <div style={styles.emptyTitle}>Aucun élève inscrit</div>
            <div style={styles.emptySub}>Inscrivez des élèves pour générer des certificats.</div>
          </div>
        ) : (
          <div style={styles.elevesList}>
            {eleves.map(eleve => {
              const { versets, sourates, pct } = calculerProgress(eleve.id)
              const jalons = getJalons(eleve.id)

              return (
                <div key={eleve.id} style={styles.eleveCard}>
                  <div style={styles.eleveTop}>
                    <div style={styles.eleveAvatar}>
                      {eleve.prenom[0]}{eleve.nom[0]}
                    </div>
                    <div style={styles.eleveInfo}>
                      <div style={styles.eleveName}>{eleve.prenom} {eleve.nom}</div>
                      <div style={styles.eleveNiveau}>{eleve.niveaux?.nom}</div>
                    </div>
                    <div style={styles.eleveStats}>
                      <div style={styles.elevePct}>{pct}%</div>
                      <div style={styles.eleveStatsDetail}>{sourates} sourates · {versets} versets</div>
                    </div>
                  </div>

                  {/* Barre progression */}
                  <div style={styles.barBg}>
                    <div style={{...styles.barFill, width: `${pct}%`}}></div>
                  </div>

                  {/* Jalons */}
                  {jalons.length === 0 ? (
                    <div style={styles.noJalon}>
                      Aucun jalon atteint pour le moment — continuez les efforts !
                    </div>
                  ) : (
                    <div style={styles.jalonsGrid}>
                      {jalons.map((jalon, i) => (
                        <div key={i} style={styles.jalonCard}>
                          <div style={styles.jalonIcon}>{jalon.icon}</div>
                          <div style={styles.jalonLabel}>{jalon.label}</div>
                          <div style={styles.jalonDesc}>{jalon.desc}</div>
                          <button
                            onClick={() => imprimerCertificat(eleve, jalon)}
                            style={styles.printBtn}
                          >
                            🖨️ Imprimer
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* CERTIFICAT À IMPRIMER */}
      {eleveSelectionne && (
        <div style={styles.certificat} className="print-only">
          <div style={styles.certBorder}>

            {/* En-tête certificat */}
            <div style={styles.certHeader}>
              <div style={styles.certArabic}>بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</div>
              <div style={styles.certLogo}>🕌</div>
              <div style={styles.certSchool}>Coran Kids Academy</div>
              <div style={styles.certSchoolSub}>Mémoriser le Coran, Éveiller l'Avenir</div>
              <div style={styles.certSchoolSub}>Ouagadougou, Burkina Faso · 64 65 81 90</div>
            </div>

            {/* Titre */}
            <div style={styles.certTitre}>
              CERTIFICAT DE MÉMORISATION
            </div>
            <div style={styles.certSousTitre}>
              {eleveSelectionne.jalon.label}
            </div>

            {/* Corps */}
            <div style={styles.certCorps}>
              <div style={styles.certTexte}>
                Coran Kids Academy certifie que
              </div>
              <div style={styles.certNom}>
                {eleveSelectionne.eleve.prenom} {eleveSelectionne.eleve.nom}
              </div>
              <div style={styles.certTexte}>
                élève en classe de <strong>{eleveSelectionne.eleve.niveaux?.nom}</strong>
              </div>
              <div style={styles.certTexte}>
                a accompli avec succès la mémorisation de
              </div>
              <div style={styles.certJalon}>
                {eleveSelectionne.jalon.icon} {eleveSelectionne.jalon.desc}
              </div>
              <div style={styles.certTexte}>
                Que Allah bénisse ses efforts et lui facilite la mémorisation du Saint Coran.
              </div>
              <div style={styles.certArabic2}>
                اللَّهُمَّ اجْعَلْهُ مِنْ أَهْلِ الْقُرْآن
              </div>
            </div>

            {/* Pied */}
            <div style={styles.certFooter}>
              <div style={styles.certDate}>
                Ouagadougou, le {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <div style={styles.certSignature}>
                <div style={styles.certSignatureLine}></div>
                <div style={styles.certSignatureLabel}>La Direction</div>
                <div style={styles.certSignatureNom}>Coran Kids Academy</div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* CSS impression */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { margin: 0; }
        }
        @media screen {
          .print-only { display: none; }
        }
      `}</style>

    </div>
  )
}

const styles = {
  wrap: { minHeight: '100vh', background: '#f8f9f8', fontFamily: 'sans-serif' },
  header: {
    background: 'linear-gradient(135deg, #03281e 0%, #085041 100%)',
    padding: '16px 28px', display: 'flex', alignItems: 'center', gap: '16px',
    position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  },
  backBtn: {
    background: 'rgba(255,255,255,0.1)', color: 'white',
    border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px',
    padding: '8px 14px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
  },
  headerTitle: { color: 'white', fontSize: '16px', fontWeight: '600' },
  headerSub: { color: '#7dd4b6', fontSize: '12px', fontStyle: 'italic' },
  content: { maxWidth: '900px', margin: '0 auto', padding: '24px' },
  loadingBox: { textAlign: 'center', padding: '60px', color: '#8a918a' },
  emptyBox: {
    textAlign: 'center', padding: '60px 20px', background: 'white',
    borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  emptyIcon: { fontSize: '48px', marginBottom: '16px' },
  emptyTitle: { fontSize: '16px', fontWeight: '600', color: '#252a25', marginBottom: '8px' },
  emptySub: { fontSize: '13px', color: '#8a918a' },
  elevesList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  eleveCard: {
    background: 'white', borderRadius: '16px', padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #eef0ee',
  },
  eleveTop: { display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' },
  eleveAvatar: {
    width: '44px', height: '44px', borderRadius: '50%',
    background: '#e4f7f2', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '16px', fontWeight: '700',
    color: '#085041', flexShrink: 0,
  },
  eleveInfo: { flex: 1 },
  eleveName: { fontSize: '15px', fontWeight: '600', color: '#252a25' },
  eleveNiveau: { fontSize: '12px', color: '#8a918a', marginTop: '2px' },
  eleveStats: { textAlign: 'right' },
  elevePct: { fontSize: '24px', fontWeight: '700', color: '#085041' },
  eleveStatsDetail: { fontSize: '11px', color: '#8a918a' },
  barBg: { background: '#eef0ee', borderRadius: '99px', height: '6px', marginBottom: '14px' },
  barFill: { background: 'linear-gradient(90deg, #1D9E75, #F5A623)', borderRadius: '99px', height: '6px', transition: 'width 0.6s' },
  noJalon: { fontSize: '13px', color: '#8a918a', fontStyle: 'italic', textAlign: 'center', padding: '12px 0' },
  jalonsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' },
  jalonCard: {
    background: '#e4f7f2', borderRadius: '12px', padding: '14px',
    textAlign: 'center', border: '1px solid #b8eadb',
  },
  jalonIcon: { fontSize: '28px', marginBottom: '6px' },
  jalonLabel: { fontSize: '13px', fontWeight: '600', color: '#085041', marginBottom: '4px' },
  jalonDesc: { fontSize: '11px', color: '#0a6652', marginBottom: '10px' },
  printBtn: {
    background: '#085041', color: 'white', border: 'none',
    borderRadius: '8px', padding: '7px 14px', fontSize: '12px',
    fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
  },
  // Certificat
  certificat: {
    position: 'fixed', inset: 0, background: 'white',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '40px', zIndex: 999,
  },
  certBorder: {
    border: '8px double #F5A623', borderRadius: '16px',
    padding: '40px', maxWidth: '700px', width: '100%',
    textAlign: 'center', background: 'white',
    boxShadow: '0 0 0 4px #085041',
  },
  certHeader: { marginBottom: '24px' },
  certArabic: {
    fontFamily: 'serif', fontSize: '18px', color: '#F5A623',
    marginBottom: '12px', direction: 'rtl',
  },
  certLogo: { fontSize: '48px', marginBottom: '8px' },
  certSchool: { fontSize: '22px', fontWeight: '700', color: '#085041', marginBottom: '4px' },
  certSchoolSub: { fontSize: '12px', color: '#8a918a', marginBottom: '2px' },
  certTitre: {
    fontSize: '20px', fontWeight: '700', color: '#085041',
    letterSpacing: '0.1em', marginBottom: '6px',
    borderTop: '2px solid #F5A623', borderBottom: '2px solid #F5A623',
    padding: '10px 0', marginTop: '20px',
  },
  certSousTitre: { fontSize: '16px', color: '#F5A623', fontWeight: '600', marginBottom: '24px' },
  certCorps: { marginBottom: '32px' },
  certTexte: { fontSize: '14px', color: '#4a524a', marginBottom: '8px', lineHeight: '1.6' },
  certNom: {
    fontSize: '28px', fontWeight: '700', color: '#085041',
    margin: '16px 0', fontFamily: 'serif',
  },
  certJalon: {
    fontSize: '18px', fontWeight: '600', color: '#F5A623',
    margin: '16px 0', padding: '12px',
    background: '#e4f7f2', borderRadius: '10px',
  },
  certArabic2: {
    fontFamily: 'serif', fontSize: '20px', color: '#085041',
    marginTop: '16px', direction: 'rtl',
  },
  certFooter: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'flex-end', borderTop: '1px solid #eef0ee', paddingTop: '20px',
  },
  certDate: { fontSize: '13px', color: '#4a524a' },
  certSignature: { textAlign: 'right' },
  certSignatureLine: { width: '150px', height: '1px', background: '#252a25', marginBottom: '6px', marginLeft: 'auto' },
  certSignatureLabel: { fontSize: '12px', color: '#4a524a' },
  certSignatureNom: { fontSize: '13px', fontWeight: '600', color: '#085041' },
}