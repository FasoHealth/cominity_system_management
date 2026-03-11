// frontend/src/pages/admin/AdminGuidesPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CAT_TABS = [
    { value: '', label: 'Tous les guides' },
    { value: 'medical', label: 'Urgences Vitales' },
    { value: 'fire', label: 'Incendie' },
    { value: 'security', label: 'Sécurité' },
    { value: 'natural_disaster', label: 'Catastrophes' },
];

const AdminGuidesPage = () => {
    const [guides, setGuides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [catFilter, setCatFilter] = useState('');
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editGuide, setEditGuide] = useState(null);
    const [form, setForm] = useState({ title: '', content: '', category: 'medical', emergencyNumber: '15' });
    const [formLoading, setFormLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(null);
    const [fileUploads, setFileUploads] = useState([]);
    const [uploadLoading, setUploadLoading] = useState(false);
    const fileInputRef = React.useRef();

    const fetchGuides = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('http://localhost:5000/api/guides', { params: { category: catFilter, search } });
            if (data.success) setGuides(data.guides);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchGuides(); }, [catFilter, search]);

    const openCreate = () => { setEditGuide(null); setForm({ title: '', content: '', category: 'medical', emergencyNumber: '15' }); setShowForm(true); };
    const openEdit = (g) => { setEditGuide(g); setForm({ title: g.title, content: g.content, category: g.category, emergencyNumber: g.emergencyNumber || '15' }); setShowForm(true); };

    const handleSave = async (e) => {
        e.preventDefault(); setFormLoading(true);
        try {
            if (editGuide) {
                await axios.put(`http://localhost:5000/api/guides/${editGuide._id}`, form);
            } else {
                await axios.post('http://localhost:5000/api/guides', form);
            }
            setShowForm(false); fetchGuides();
        } catch (err) { alert(err.response?.data?.message || 'Erreur.'); }
        finally { setFormLoading(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer ce guide ?')) return;
        setDeleteLoading(id);
        try {
            await axios.delete(`http://localhost:5000/api/guides/${id}`);
            setGuides(prev => prev.filter(g => g._id !== id));
        } catch (err) { alert('Erreur lors de la suppression.'); }
        finally { setDeleteLoading(null); }
    };

    const handleFilesUpload = async (guideId) => {
        if (!fileUploads.length) return;
        setUploadLoading(true);
        const fd = new FormData();
        fileUploads.forEach(f => fd.append('files', f));
        try {
            await axios.post(`http://localhost:5000/api/guides/${guideId}/files`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setFileUploads([]);
            fetchGuides();
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur upload fichier.');
        } finally {
            setUploadLoading(false);
        }
    };

    const displayed = guides.filter(g => !search || g.title.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="page-container fade-in">
            {/* Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title" style={{ margin: 0 }}>📖 Guides</h1>
                    <p className="page-subtitle" style={{ margin: '4px 0 0' }}>Gestion des protocoles d'intervention</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>🔍</span>
                        <input placeholder="Rechercher un guide..."
                            style={{ paddingLeft: 32, padding: '8px 14px 8px 32px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: '0.85rem', background: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none', minWidth: 200 }}
                            value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <button className="btn btn-primary" onClick={openCreate}>+ Ajouter</button>
                </div>
            </div>

            {/* Category tabs (pill style) */}
            <div className="pill-filter" style={{ marginBottom: 24 }}>
                {CAT_TABS.map(t => (
                    <button key={t.value} className={`pill${catFilter === t.value ? ' active' : ''}`}
                        onClick={() => setCatFilter(t.value)}>
                        {t.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="page-loader"><div className="spinner" /></div>
            ) : (
                <div className="grid-3">
                    {/* Create new guide card */}
                    <div className="guide-create-card" onClick={openCreate}>
                        <div className="guide-create-icon">+</div>
                        <div className="guide-create-title">Créer un nouveau guide</div>
                        <div className="guide-create-desc">Ajoutez un nouveau protocole de premiers secours pour vos utilisateurs</div>
                    </div>

                    {displayed.map(g => (
                        <div key={g._id} className="guide-card">
                            <div className="guide-card-header">
                                <span className="guide-cat-label">{(g.category || 'médical').toUpperCase()}</span>
                                <button className="guide-card-menu" onClick={() => openEdit(g)}>⋮</button>
                            </div>
                            <h3 className="guide-card-title">{g.title}</h3>
                            {g.emergencyNumber && (
                                <div className="guide-emergency">
                                    APPEL: <span>{g.emergencyNumber}</span>
                                </div>
                            )}
                            <div className="guide-steps-count">
                                ☰ {g.steps?.length || (g.content?.split('\n').filter(Boolean).length) || '—'} étapes d'intervention
                            </div>
                            <div className="guide-card-divider" />
                            <div className="guide-card-actions">
                                <button className="btn btn-primary btn-sm" onClick={() => openEdit(g)}>Modifier</button>
                                <button className="btn btn-danger btn-sm"
                                    disabled={deleteLoading === g._id}
                                    onClick={() => handleDelete(g._id)}>
                                    {deleteLoading === g._id ? '...' : 'Supprimer'}
                                </button>
                                <button className="btn btn-secondary btn-sm btn-full" style={{ marginTop: 8, fontSize: '0.78rem' }}>
                                    📄 Aperçu PDF
                                </button>
                            </div>
                            {g.files && g.files.length > 0 && (
                                <div className="guide-files-list" style={{ marginTop: 10 }}>
                                    <strong>Fichiers :</strong>
                                    <ul>
                                        {g.files.map((f, i) => (
                                            <li key={i}>
                                                <a href={`/${f.path}`} target="_blank" rel="noopener noreferrer">{f.originalName || f.filename}</a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Modal form */}
            {showForm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div className="card fade-in" style={{ maxWidth: 600, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                            <h3 className="card-title">{editGuide ? 'Modifier le guide' : 'Nouveau guide'}</h3>
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="form-group">
                                <label className="form-label">Titre</label>
                                <input className="form-control" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Catégorie</label>
                                    <select className="form-control" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                                        <option value="medical">Médical</option>
                                        <option value="fire">Incendie</option>
                                        <option value="security">Sécurité</option>
                                        <option value="natural_disaster">Catastrophe</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Numéro d'urgence</label>
                                    <input className="form-control" value={form.emergencyNumber} onChange={e => setForm(p => ({ ...p, emergencyNumber: e.target.value }))} placeholder="15, 17, 18..." />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Contenu / Étapes</label>
                                <textarea className="form-control" rows={8} value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="Décrivez les étapes d'intervention..." required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Fichiers à joindre</label>
                                <input ref={fileInputRef} type="file" multiple onChange={e => setFileUploads(Array.from(e.target.files))} />
                                {fileUploads.length > 0 && (
                                    <ul style={{ marginTop: 8 }}>
                                        {fileUploads.map((f, i) => (
                                            <li key={i}>{f.name}</li>
                                        ))}
                                    </ul>
                                )}
                                {editGuide && fileUploads.length > 0 && (
                                    <button className="btn btn-primary btn-sm" type="button" disabled={uploadLoading} onClick={() => handleFilesUpload(editGuide._id)}>
                                        {uploadLoading ? 'Upload...' : 'Uploader les fichiers'}
                                    </button>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button className="btn btn-primary btn-full" type="submit" disabled={formLoading}>
                                    {formLoading ? 'Sauvegarde...' : (editGuide ? 'Enregistrer' : 'Créer le guide')}
                                </button>
                                <button className="btn btn-secondary" type="button" onClick={() => setShowForm(false)}>Annuler</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminGuidesPage;
