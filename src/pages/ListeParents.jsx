import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function ListeParents({ onRetour }) {
  const [parents, setParents] = useState([])
  const [loading, setLoading] = useState(true)
  const [recherche, setRecherche] = useState('')
  const [editParent, setEditParent] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    prenom: '',
    nom: '',
    telephone: '',
    whatsapp: '',
  })

  useEffect(() => {
    fetchParents()
  }, [])

  async function fetchParents() {
    setLoading(true)
    const { data } = await supabase
      .from('utilisateurs')
      .select(`
        *,
        eleves (id, prenom, nom, niveaux(nom))
      `)
      .eq('role', 'parent')
      .order('nom')
    setParents(data || [])
    setLoading(false)
  }

  async function handleDelete(parent) {
    if (!window.confirm(`Supprimer le compte de ${parent.prenom} ${parent.nom} ?`)) return

    // 1. Délier les élèves
    await supabase
      .from('eleves')
      .update({ parent_id: null })
      .eq('parent_id', parent.id)

    // 2. Supprimer le profil
    await supabase
      .from('utilisateurs')
      .delete()
      .eq('id', parent.id)

    fetchParents()
  }

  function ouvrirEdit(parent) {
    setEditParent(parent)
    setForm({
      prenom: parent.prenom || '',
      nom: parent.nom || '',
      telephone: parent.telephone || '',
      whatsapp: parent.whatsapp || '',
    })
  }

  async function handleSave() {
    setSaving(true)
    await supabase
      .from('utilisateurs')
      .update({
        prenom: form.prenom,
        nom: form.nom,
        telephone: form.telephone,
        whatsapp: form.whatsapp || form.telephone,
      })
      .eq('id', editParent.id)
    setEditParent(null)
    setSaving(false)
    fetchParents()
  }

  const parentsFiltres = parents.filter(p =>
    recherche === '' ||
    `${p.prenom} ${p.nom}`.toLowerCase().includes(recherche.toLowerCase()) ||
    p.telephone?.includes(recherche)
  )

  return (
    <div style={styles.wrap}>

      {/* HEADER */}
      <div style={styles.header}>
        <button onClick={onRetour} style={styles.backBtn}>← Retour</button>
        <div>
          <div style={styles.headerTitle}>Liste des parents</div>
          <div style={styles.headerSub}>Coran Kids Academy</div>
        </div>
        <div style={styles.headerCount}>
          {parents.length} parent{parents.length > 1 ? 's' : ''}
        </div>
      </div>

      <div style={styles.content}>

        {/* Recherche */}
        <div style={styles.filtresBox}>
          <input
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            placeholder="🔍 Rechercher un parent..."
            style={styles.searchInput}
          />
        </div>

        {/* Modal édition */}
        {editParent && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalCard}>
              <div style={styles.modalTitle}>✏️ Modifier le parent</div>
              <div style={styles.form}>
                <div style={styles.row}>
                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>Prénom</label>
                    <input
                      value={form.prenom}
                      onChange={e => setForm({...form, prenom: e.target.value})}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>Nom</label>
                    <input
                      value={form.nom}
                      onChange={e => setForm({...form, nom: e.target.value})}
                      style={styles.input}
                    />
                  </div>
                </div>
                <div style={styles.row}>
                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>Téléphone</label>
                    <input
                      value={form.telephone}
                      onChange={e => setForm({...form, telephone: e.target.value})}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>WhatsApp</label>
                    <input
                      value={form.whatsapp}
                      onChange={e => setForm({...form, whatsapp: e.target.value})}
                      style={styles.input}
                    />
                  </div>
                </div>
                <div style={styles.btnRow}>
                  <button onClick={() => setEditParent(null)} style={styles.btnSecondary}>
                    Annuler
                  </button>
                  <button onClick={handleSave} disabled={saving} style={saving ? styles.btnDisabled : styles.btnPrimary}>
                    {saving ? 'Sauvegarde...' : '✓ Sauvegarder'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Liste */}
        {loading ? (
          <div style={styles.loadingBox}>Chargement...</div>
        ) : parentsFiltres.length === 0 ? (
          <div style={styles.emptyBox}>
            <div style={styles.emptyIcon}>👨‍👩‍👧</div>
            <div style={styles.emptyTitle}>
              {parents.length === 0 ? 'Aucun parent enregistré' : 'Aucun résultat'}
            </div>
            <div style={styles.emptySub}>
              {parents.length === 0 ? 'Utilisez "Ajouter un parent" pour commencer.' : 'Modifiez votre recherche.'}
            </div>
          </div>
        ) : (
          <div style={styles.parentsList}>
            {parentsFiltres.map(parent => (
              <div key={parent.id} style={styles.parentCard}>
                <div style={styles.cardTop}>
                  <div style={styles.avatar}>
                    {parent.prenom?.[0]}{parent.nom?.[0]}
                  </div>
                  <div style={styles.parentInfo}>
                    <div style={styles.parentName}>
                      {parent.prenom} {parent.nom}
                    </div>
                    <div style={styles.parentContact}>
                      📞 {parent.telephone}
                      {parent.whatsapp && parent.whatsapp !== parent.telephone &&
                        ` · 💬 ${parent.whatsapp}`}
                    </div>
                  </div>
                  <div style={styles.cardActions}>
                    <button onClick={() => ouvrirEdit(parent)} style={styles.editBtn}>
                      ✏️ Modifier
                    </button>
                    <button onClick={() => handleDelete(parent)} style={styles.deleteBtn}>
                      🗑️ Supprimer
                    </button>
                  </div>
                </div>

                {/* Enfants liés */}
                <div style={styles.cardBody}>
                  <div style={styles.enfantsLabel}>Enfant(s) lié(s) :</div>
                  {parent.eleves && parent.eleves.length > 0 ? (
                    <div style={styles.enfantsList}>
                      {parent.eleves.map(eleve => (
                        <div key={eleve.id} style={styles.enfantPill}>
                          👧 {eleve.prenom} {eleve.nom} — {eleve.niveaux?.nom}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={styles.noEnfant}>Aucun enfant lié</div>
                  )}
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
  headerCount: {
    marginLeft: 'auto', background: 'rgba(255,255,255,0.15)',
    color: 'white', borderRadius: '99px', padding: '6px 14px',
    fontSize: '13px', fontWeight: '600',
  },
  content: { maxWidth: '900px', margin: '0 auto', padding: '24px' },
  filtresBox: { marginBottom: '20px' },
  searchInput: {
    width: '100%', padding: '11px 14px', borderRadius: '10px',
    border: '1.5px solid #d8dbd8', fontSize: '14px', outline: 'none',
    fontFamily: 'inherit', background: 'white', color: '#252a25',
  },
  modalOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 200, padding: '20px',
  },
  modalCard: {
    background: 'white', borderRadius: '20px', padding: '28px',
    width: '100%', maxWidth: '500px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  },
  modalTitle: { fontSize: '16px', fontWeight: '600', color: '#085041', marginBottom: '20px' },
  form: { display: 'flex', flexDirection: 'column', gap: '14px' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '500', color: '#4a524a' },
  input: {
    padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #d8dbd8',
    fontSize: '14px', outline: 'none', fontFamily: 'inherit',
    background: 'white', color: '#252a25',
  },
  btnRow: { display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' },
  btnPrimary: {
    background: '#006847', color: 'white', border: 'none',
    borderRadius: '10px', padding: '11px 20px', fontSize: '14px',
    fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
  },
  btnSecondary: {
    background: 'white', color: '#085041', border: '1.5px solid #085041',
    borderRadius: '10px', padding: '11px 20px', fontSize: '14px',
    fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
  },
  btnDisabled: {
    background: '#b2b8b2', color: 'white', border: 'none',
    borderRadius: '10px', padding: '11px 20px', fontSize: '14px',
    fontWeight: '600', cursor: 'not-allowed', fontFamily: 'inherit',
  },
  loadingBox: { textAlign: 'center', padding: '60px', color: '#8a918a' },
  emptyBox: {
    textAlign: 'center', padding: '60px 20px', background: 'white',
    borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  emptyIcon: { fontSize: '48px', marginBottom: '16px' },
  emptyTitle: { fontSize: '16px', fontWeight: '600', color: '#252a25', marginBottom: '8px' },
  emptySub: { fontSize: '13px', color: '#8a918a' },
  parentsList: { display: 'flex', flexDirection: 'column', gap: '14px' },
  parentCard: {
    background: 'white', borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #eef0ee',
    overflow: 'hidden',
  },
  cardTop: {
    padding: '16px 20px', display: 'flex', alignItems: 'center',
    gap: '14px', borderBottom: '1px solid #eef0ee',
  },
  avatar: {
    width: '44px', height: '44px', borderRadius: '50%',
    background: '#e4f7f2', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '16px', fontWeight: '700',
    color: '#085041', flexShrink: 0,
  },
  parentInfo: { flex: 1 },
  parentName: { fontSize: '15px', fontWeight: '600', color: '#252a25', marginBottom: '4px' },
  parentContact: { fontSize: '13px', color: '#4a524a' },
  cardActions: { display: 'flex', gap: '8px' },
  editBtn: {
    background: '#e4f7f2', color: '#085041', border: 'none',
    borderRadius: '8px', padding: '7px 12px', fontSize: '12px',
    fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
  },
  deleteBtn: {
    background: '#fef2f2', color: '#dc2626', border: 'none',
    borderRadius: '8px', padding: '7px 12px', fontSize: '12px',
    fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
  },
  cardBody: { padding: '12px 20px' },
  enfantsLabel: { fontSize: '12px', fontWeight: '600', color: '#8a918a', marginBottom: '8px' },
  enfantsList: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  enfantPill: {
    background: '#e4f7f2', color: '#085041', borderRadius: '99px',
    padding: '5px 12px', fontSize: '12px', fontWeight: '500',
  },
  noEnfant: { fontSize: '13px', color: '#b2b8b2', fontStyle: 'italic' },
}