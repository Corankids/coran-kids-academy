import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Paiements({ onRetour }) {
  const [eleves, setEleves] = useState([])
  const [paiements, setPaiements] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filtreStatut, setFiltreStatut] = useState('')
  const [form, setForm] = useState({
    eleve_id: '',
    mois: new Date().getMonth() + 1,
    annee: new Date().getFullYear(),
    montant: 15000,
    statut: 'paye',
    date_paiement: new Date().toISOString().split('T')[0],
    mode_paiement: 'especes',
    notes: '',
  })

  const moisNoms = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

  useEffect(() => {
    fetchEleves()
    fetchPaiements()
  }, [])

  async function fetchEleves() {
    const { data } = await supabase
      .from('eleves')
      .select('id, prenom, nom, niveaux(nom)')
      .eq('actif', true)
      .order('nom')
    setEleves(data || [])
  }

  async function fetchPaiements() {
    setLoading(true)
    const { data } = await supabase
      .from('paiements')
      .select('*, eleves(prenom, nom, niveaux(nom))')
      .order('annee', { ascending: false })
      .order('mois', { ascending: false })
    setPaiements(data || [])
    setLoading(false)
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)

    await supabase
      .from('paiements')
      .upsert([{
        eleve_id: form.eleve_id,
        mois: parseInt(form.mois),
        annee: parseInt(form.annee),
        montant: parseInt(form.montant),
        statut: form.statut,
        date_paiement: form.statut === 'paye' ? form.date_paiement : null,
        mode_paiement: form.mode_paiement,
        notes: form.notes,
      }], { onConflict: 'eleve_id,mois,annee' })

    setShowForm(false)
    setSaving(false)
    fetchPaiements()
  }

  async function handleDelete(id) {
    if (window.confirm('Supprimer ce paiement ?')) {
      await supabase.from('paiements').delete().eq('id', id)
      fetchPaiements()
    }
  }

  const statutConfig = {
    paye: { label: '✓ Payé', bg: '#e4f7f2', color: '#085041' },
    en_attente: { label: '⏱ En attente', bg: '#fef8e7', color: '#b8780d' },
    retard: { label: '⚠ Retard', bg: '#fef2f2', color: '#dc2626' },
  }

  const paiementsFiltres = paiements.filter(p =>
    filtreStatut === '' || p.statut === filtreStatut
  )

  const totalPaye = paiements
    .filter(p => p.statut === 'paye')
    .reduce((acc, p) => acc + (p.montant || 0), 0)

  const totalAttente = paiements
    .filter(p => p.statut !== 'paye')
    .reduce((acc, p) => acc + (p.montant || 0), 0)

  return (
    <div style={styles.wrap}>

      {/* HEADER */}
      <div style={styles.header}>
        <button onClick={onRetour} style={styles.backBtn}>← Retour</button>
        <div>
          <div style={styles.headerTitle}>Gestion des paiements</div>
          <div style={styles.headerSub}>Coran Kids Academy</div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={styles.newBtn}
        >
          {showForm ? '✕ Annuler' : '+ Enregistrer un paiement'}
        </button>
      </div>

      <div style={styles.content}>

        {/* Stats */}
        <div style={styles.statsGrid}>
          <div style={{...styles.statCard, borderTop: '3px solid #1D9E75'}}>
            <div style={styles.statLabel}>Total encaissé</div>
            <div style={styles.statValue}>{totalPaye.toLocaleString()}</div>
            <div style={styles.statSub}>FCFA</div>
          </div>
          <div style={{...styles.statCard, borderTop: '3px solid #F5A623'}}>
            <div style={styles.statLabel}>En attente</div>
            <div style={styles.statValue}>{totalAttente.toLocaleString()}</div>
            <div style={styles.statSub}>FCFA</div>
          </div>
          <div style={{...styles.statCard, borderTop: '3px solid #4a90d9'}}>
            <div style={styles.statLabel}>Paiements enregistrés</div>
            <div style={styles.statValue}>{paiements.length}</div>
            <div style={styles.statSub}>au total</div>
          </div>
          <div style={{...styles.statCard, borderTop: '3px solid #e05252'}}>
            <div style={styles.statLabel}>En retard</div>
            <div style={styles.statValue}>{paiements.filter(p => p.statut === 'retard').length}</div>
            <div style={styles.statSub}>paiements</div>
          </div>
        </div>

        {/* Formulaire */}
        {showForm && (
          <div style={styles.formCard}>
            <div style={styles.formTitle}>💰 Enregistrer un paiement</div>
            <form onSubmit={handleSubmit} style={styles.form}>

              <div style={styles.row}>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Élève *</label>
                  <select
                    name="eleve_id"
                    value={form.eleve_id}
                    onChange={handleChange}
                    required
                    style={styles.input}
                  >
                    <option value="">Choisir un élève...</option>
                    {eleves.map(e => (
                      <option key={e.id} value={e.id}>
                        {e.prenom} {e.nom} — {e.niveaux?.nom}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Statut *</label>
                  <select
                    name="statut"
                    value={form.statut}
                    onChange={handleChange}
                    style={styles.input}
                  >
                    <option value="paye">✓ Payé</option>
                    <option value="en_attente">⏱ En attente</option>
                    <option value="retard">⚠ Retard</option>
                  </select>
                </div>
              </div>

              <div style={styles.row}>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Mois *</label>
                  <select
                    name="mois"
                    value={form.mois}
                    onChange={handleChange}
                    style={styles.input}
                  >
                    {moisNoms.map((m, i) => (
                      <option key={i+1} value={i+1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Année *</label>
                  <input
                    name="annee"
                    type="number"
                    value={form.annee}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.row}>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Montant (FCFA) *</label>
                  <input
                    name="montant"
                    type="number"
                    value={form.montant}
                    onChange={handleChange}
                    required
                    style={styles.input}
                  />
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Mode de paiement</label>
                  <select
                    name="mode_paiement"
                    value={form.mode_paiement}
                    onChange={handleChange}
                    style={styles.input}
                  >
                    <option value="especes">💵 Espèces</option>
                    <option value="mobile_money">📱 Mobile Money</option>
                    <option value="virement">🏦 Virement</option>
                  </select>
                </div>
              </div>

              {form.statut === 'paye' && (
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Date de paiement</label>
                  <input
                    name="date_paiement"
                    type="date"
                    value={form.date_paiement}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>
              )}

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Notes</label>
                <input
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Observations..."
                  style={styles.input}
                />
              </div>

              <div style={styles.btnRow}>
                <button type="button" onClick={() => setShowForm(false)} style={styles.btnSecondary}>
                  Annuler
                </button>
                <button type="submit" disabled={saving} style={saving ? styles.btnDisabled : styles.btnPrimary}>
                  {saving ? 'Enregistrement...' : '💰 Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filtres */}
        <div style={styles.filtresBox}>
          <span style={styles.filtreLabel}>Filtrer :</span>
          {['', 'paye', 'en_attente', 'retard'].map(s => (
            <button
              key={s}
              onClick={() => setFiltreStatut(s)}
              style={{
                ...styles.filtreBtn,
                background: filtreStatut === s ? '#085041' : 'white',
                color: filtreStatut === s ? 'white' : '#4a524a',
              }}
            >
              {s === '' ? 'Tous' : statutConfig[s]?.label}
            </button>
          ))}
        </div>

        {/* Liste paiements */}
        {loading ? (
          <div style={styles.loadingBox}>Chargement...</div>
        ) : paiementsFiltres.length === 0 ? (
          <div style={styles.emptyBox}>
            <div style={styles.emptyIcon}>💰</div>
            <div style={styles.emptyTitle}>Aucun paiement enregistré</div>
            <div style={styles.emptySub}>
              Cliquez sur "Enregistrer un paiement" pour commencer.
            </div>
          </div>
        ) : (
          <div style={styles.paiementsList}>
            {paiementsFiltres.map(p => {
              const cfg = statutConfig[p.statut] || statutConfig.en_attente
              return (
                <div key={p.id} style={styles.paiementCard}>
                  <div style={styles.paiementLeft}>
                    <div style={styles.paiementEleve}>
                      {p.eleves?.prenom} {p.eleves?.nom}
                    </div>
                    <div style={styles.paiementNiveau}>
                      {p.eleves?.niveaux?.nom}
                    </div>
                    <div style={styles.paiementPeriode}>
                      {moisNoms[p.mois - 1]} {p.annee}
                    </div>
                    {p.date_paiement && (
                      <div style={styles.paiementDate}>
                        Payé le {new Date(p.date_paiement).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                    {p.mode_paiement && (
                      <div style={styles.paiementMode}>
                        {p.mode_paiement === 'especes' ? '💵 Espèces' :
                         p.mode_paiement === 'mobile_money' ? '📱 Mobile Money' : '🏦 Virement'}
                      </div>
                    )}
                  </div>
                  <div style={styles.paiementRight}>
                    <div style={styles.paiementMontant}>
                      {p.montant?.toLocaleString()} FCFA
                    </div>
                    <div style={{...styles.statutBadge, background: cfg.bg, color: cfg.color}}>
                      {cfg.label}
                    </div>
                    <button
                      onClick={() => handleDelete(p.id)}
                      style={styles.deleteBtn}
                    >
                      🗑
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
  newBtn: {
    marginLeft: 'auto', background: '#F5A623', color: '#085041',
    border: 'none', borderRadius: '8px', padding: '10px 16px',
    fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit',
  },
  content: { maxWidth: '900px', margin: '0 auto', padding: '24px' },
  statsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '14px', marginBottom: '24px',
  },
  statCard: {
    background: 'white', borderRadius: '14px', padding: '16px 18px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  statLabel: { fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8a918a', marginBottom: '8px' },
  statValue: { fontSize: '32px', fontWeight: '700', color: '#252a25', lineHeight: 1 },
  statSub: { fontSize: '12px', color: '#8a918a', marginTop: '4px' },
  formCard: {
    background: 'white', borderRadius: '16px', padding: '20px 24px',
    marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    border: '2px solid #F5A623',
  },
  formTitle: { fontSize: '15px', fontWeight: '600', color: '#085041', marginBottom: '16px' },
  form: { display: 'flex', flexDirection: 'column', gap: '14px' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '500', color: '#4a524a' },
  input: {
    padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #d8dbd8',
    fontSize: '14px', outline: 'none', fontFamily: 'inherit', background: 'white', color: '#252a25',
  },
  btnRow: { display: 'flex', gap: '10px', justifyContent: 'flex-end' },
  btnPrimary: {
    background: '#006847', color: 'white', border: 'none', borderRadius: '10px',
    padding: '11px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
  },
  btnSecondary: {
    background: 'white', color: '#085041', border: '1.5px solid #085041',
    borderRadius: '10px', padding: '11px 20px', fontSize: '14px',
    fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
  },
  btnDisabled: {
    background: '#b2b8b2', color: 'white', border: 'none', borderRadius: '10px',
    padding: '11px 20px', fontSize: '14px', fontWeight: '600', cursor: 'not-allowed', fontFamily: 'inherit',
  },
  filtresBox: {
    display: 'flex', alignItems: 'center', gap: '8px',
    marginBottom: '16px', flexWrap: 'wrap',
  },
  filtreLabel: { fontSize: '13px', fontWeight: '500', color: '#4a524a' },
  filtreBtn: {
    padding: '6px 14px', borderRadius: '99px', border: '1.5px solid #d8dbd8',
    fontSize: '12px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit',
  },
  loadingBox: { textAlign: 'center', padding: '60px', color: '#8a918a' },
  emptyBox: {
    textAlign: 'center', padding: '60px 20px', background: 'white',
    borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  emptyIcon: { fontSize: '48px', marginBottom: '16px' },
  emptyTitle: { fontSize: '16px', fontWeight: '600', color: '#252a25', marginBottom: '8px' },
  emptySub: { fontSize: '13px', color: '#8a918a' },
  paiementsList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  paiementCard: {
    background: 'white', borderRadius: '14px', padding: '16px 20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #eef0ee',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px',
  },
  paiementLeft: { flex: 1 },
  paiementEleve: { fontSize: '14px', fontWeight: '600', color: '#252a25', marginBottom: '3px' },
  paiementNiveau: { fontSize: '12px', color: '#8a918a', marginBottom: '4px' },
  paiementPeriode: { fontSize: '13px', fontWeight: '500', color: '#085041', marginBottom: '3px' },
  paiementDate: { fontSize: '12px', color: '#8a918a', marginBottom: '2px' },
  paiementMode: { fontSize: '12px', color: '#4a524a' },
  paiementRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' },
  paiementMontant: { fontSize: '16px', fontWeight: '700', color: '#252a25' },
  statutBadge: { fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '99px' },
  deleteBtn: {
    background: 'none', color: '#e05252', border: 'none',
    fontSize: '16px', cursor: 'pointer', padding: '4px',
  },
}