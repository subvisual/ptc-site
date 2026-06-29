import { useState, useEffect, useCallback } from 'react';
import { SITE } from '@/lib/tokens';
import { api, ApiCommunity, ApiEvent } from '@/lib/api';

const S: React.CSSProperties = { fontFamily: '"Space Grotesk", sans-serif' };
const MONO: React.CSSProperties = { fontFamily: '"JetBrains Mono", monospace' };

const REGIONS = ['Lisboa', 'Porto', 'Braga', 'Coimbra', 'Aveiro', 'Faro', 'Funchal', 'Açores', 'Online'];
const FORMATS = ['Meetup', 'Conference', 'Workshop', 'Hackathon', 'Online'];
const PRICES = ['Free', 'Paid'];
const TOPICS = ['AI / ML', 'JavaScript', 'Python', 'Rust', 'Elixir', 'DevOps', 'Web3', 'Mobile', 'Hardware', 'Design', 'Security', 'Fintech', 'Blockchain'];

function Field({
  label, value, onChange, placeholder, multiline, type, readOnly,
}: {
  label: string; value: string; onChange?: (v: string) => void;
  placeholder?: string; multiline?: boolean; type?: string; readOnly?: boolean;
}) {
  const base: React.CSSProperties = {
    width: '100%', padding: '9px 12px', fontSize: 13,
    border: `1px solid ${SITE.rule}`, background: readOnly ? SITE.limestone : '#fff',
    outline: 'none', boxSizing: 'border-box', color: SITE.ink, ...S,
  };
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11, color: SITE.mute, marginBottom: 5, ...MONO, letterSpacing: '0.05em' }}>
        {label}
      </label>
      {multiline ? (
        <textarea value={value} onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder} rows={3} readOnly={readOnly}
          style={{ ...base, resize: 'vertical' }} />
      ) : (
        <input type={type ?? 'text'} value={value} onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder} readOnly={readOnly} style={base} />
      )}
    </div>
  );
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11, color: SITE.mute, marginBottom: 5, ...MONO, letterSpacing: '0.05em' }}>
        {label}
      </label>
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        width: '100%', padding: '9px 12px', fontSize: 13,
        border: `1px solid ${SITE.rule}`, background: '#fff',
        outline: 'none', color: SITE.ink, ...S,
      }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: SITE.paper, border: `1px solid ${SITE.rule}`, width: 560, maxHeight: '85vh',
        overflowY: 'auto', padding: 32, ...S,
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontWeight: 700, fontSize: 18, color: SITE.ink, margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: SITE.mute }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

type EventDraft = Omit<ApiEvent, 'id' | 'notionId' | 'approved' | 'communityIds'>;

function emptyDraft(): EventDraft {
  return { name: '', description: '', venue: '', date: '', region: 'Lisboa', format: 'Meetup', topics: [], eventUrl: '', price: 'Free' };
}

function EventForm({
  initial, onSave, onCancel, saving,
}: {
  initial: EventDraft;
  onSave: (d: EventDraft) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [draft, setDraft] = useState<EventDraft>(initial);
  const set = (k: keyof EventDraft) => (v: any) => setDraft(p => ({ ...p, [k]: v }));

  function toggleTopic(t: string) {
    setDraft(p => ({
      ...p,
      topics: p.topics.includes(t) ? p.topics.filter(x => x !== t) : [...p.topics, t],
    }));
  }

  return (
    <>
      <Field label="Título *" value={draft.name} onChange={set('name')} />
      <Field label="Descrição" value={draft.description} onChange={set('description')} multiline />
      <Field label="Local" value={draft.venue} onChange={set('venue')} placeholder="Auditório XYZ" />
      <Field label="Data (YYYY-MM-DDTHH:MM)" value={draft.date ?? ''} onChange={set('date')} placeholder="2026-09-15T19:30" />
      <SelectField label="Região" value={draft.region} onChange={set('region')} options={REGIONS} />
      <SelectField label="Formato" value={draft.format} onChange={set('format')} options={FORMATS} />
      <SelectField label="Preço" value={draft.price} onChange={set('price')} options={PRICES} />
      <Field label="URL do evento" value={draft.eventUrl} onChange={set('eventUrl')} placeholder="https://meetup.com/..." />
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: SITE.mute, marginBottom: 8, ...MONO, letterSpacing: '0.05em' }}>TEMAS</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {TOPICS.map(t => (
            <button key={t} onClick={() => toggleTopic(t)} style={{
              padding: '4px 10px', fontSize: 11, cursor: 'pointer', ...MONO,
              border: `1px solid ${draft.topics.includes(t) ? SITE.ink : SITE.rule}`,
              background: draft.topics.includes(t) ? SITE.ink : 'transparent',
              color: draft.topics.includes(t) ? SITE.limestone : SITE.mute,
            }}>{t}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button onClick={() => onSave(draft)} disabled={saving || !draft.name} style={{
          flex: 1, background: SITE.ink, color: SITE.limestone, padding: '10px 0',
          fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer', ...S,
          opacity: !draft.name ? 0.5 : 1,
        }}>{saving ? '…' : 'Submeter'}</button>
        <button onClick={onCancel} style={{
          flex: 1, background: 'none', border: `1px solid ${SITE.rule}`, padding: '10px 0',
          fontSize: 13, cursor: 'pointer', color: SITE.mute, ...S,
        }}>Cancelar</button>
      </div>
    </>
  );
}

interface PortalSession {
  communityIds: string[];
  email: string;
}

interface PortalDashboardProps {
  session: PortalSession;
  onLogout: () => void;
}

function PortalDashboard({ session, onLogout }: PortalDashboardProps) {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [communities, setCommunities] = useState<ApiCommunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ApiEvent | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const commMap = Object.fromEntries(communities.map(c => [c.notionId, c]));
  const myCommunityIds = session.communityIds;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [allEvents, allComms] = await Promise.all([
        api.getEvents({ all: true, past: true }),
        api.getCommunities(false),
      ]);
      const myEvents = allEvents.filter(e =>
        e.communityIds.some(id => myCommunityIds.includes(id))
      );
      const myComms = allComms.filter(c => myCommunityIds.includes(c.notionId));
      setEvents(myEvents);
      setCommunities(myComms);
    } finally {
      setLoading(false);
    }
  }, [myCommunityIds]);

  useEffect(() => { load(); }, [load]);

  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(''), 3000); }

  async function handleCreate(draft: EventDraft) {
    setSaving(true);
    try {
      const created = await api.createEvent({ ...draft, communityIds: myCommunityIds, approved: false });
      setEvents(prev => [created, ...prev]);
      setShowForm(false);
      flash('Evento submetido — aguarda aprovação ✓');
    } catch (e: any) {
      flash('Erro: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(draft: EventDraft) {
    if (!editing) return;
    setSaving(true);
    try {
      const updated = await api.updateEvent(editing.id, draft);
      setEvents(prev => prev.map(e => e.id === updated.id ? updated : e));
      setEditing(null);
      flash('Guardado ✓');
    } catch (e: any) {
      flash('Erro: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Apagar este evento?')) return;
    try {
      await api.deleteEvent(id);
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch (e: any) {
      flash('Erro: ' + e.message);
    }
  }

  const commNames = communities.map(c => c.name).join(', ') || '…';
  const pending = events.filter(e => !e.approved);
  const approved = events.filter(e => e.approved);

  return (
    <div style={{ background: SITE.paper, minHeight: '100vh', ...S }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 48px', borderBottom: `1px solid ${SITE.rule}`, background: SITE.paper,
        position: 'sticky', top: 0, zIndex: 10, height: 56,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ ...MONO, fontSize: 10, color: SITE.green, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Portal
          </span>
          <span style={{ fontSize: 14, fontWeight: 600, color: SITE.ink }}>{commNames}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ ...MONO, fontSize: 11, color: SITE.mute }}>{session.email}</span>
          <button onClick={onLogout} style={{
            background: 'none', border: `1px solid ${SITE.rule}`, padding: '6px 16px',
            fontSize: 12, cursor: 'pointer', color: SITE.mute, ...MONO, letterSpacing: '0.08em',
          }}>Sair</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 48px 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontWeight: 700, fontSize: 22, color: SITE.ink, margin: '0 0 6px' }}>Os teus eventos</h1>
            <p style={{ ...MONO, fontSize: 11, color: SITE.mute, margin: 0, letterSpacing: '0.05em' }}>
              Eventos submetidos ficam pendentes até aprovação do admin.
            </p>
          </div>
          <button onClick={() => setShowForm(true)} style={{
            background: SITE.ink, color: SITE.limestone, padding: '10px 20px',
            fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer', ...S,
          }}>+ Novo evento</button>
        </div>

        {msg && (
          <div style={{
            border: `1px solid ${SITE.green}40`, background: SITE.green + '10',
            color: SITE.green, padding: '10px 16px', fontSize: 13, marginBottom: 20,
          }}>{msg}</div>
        )}

        {loading ? (
          <div style={{ color: SITE.mute, fontSize: 13 }}>A carregar…</div>
        ) : events.length === 0 ? (
          <div style={{
            border: `1px dashed ${SITE.rule}`, padding: 48, textAlign: 'center',
            color: SITE.mute, fontSize: 13,
          }}>
            Ainda não há eventos. Submete o primeiro!
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <div style={{ ...MONO, fontSize: 10, color: SITE.ochre, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
                  Aguarda aprovação ({pending.length})
                </div>
                {pending.map(ev => (
                  <EventCard key={ev.id} ev={ev} commMap={commMap}
                    onEdit={() => setEditing(ev)} onDelete={() => handleDelete(ev.id)} />
                ))}
              </div>
            )}
            {approved.length > 0 && (
              <div>
                <div style={{ ...MONO, fontSize: 10, color: SITE.green, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
                  Publicados ({approved.length})
                </div>
                {approved.map(ev => (
                  <EventCard key={ev.id} ev={ev} commMap={commMap}
                    onEdit={() => setEditing(ev)} onDelete={() => handleDelete(ev.id)} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showForm && (
        <Modal title="Novo evento" onClose={() => setShowForm(false)}>
          <EventForm initial={emptyDraft()} onSave={handleCreate} onCancel={() => setShowForm(false)} saving={saving} />
        </Modal>
      )}

      {editing && (
        <Modal title="Editar evento" onClose={() => setEditing(null)}>
          <EventForm
            initial={{ name: editing.name, description: editing.description, venue: editing.venue, date: editing.date ?? '', region: editing.region, format: editing.format, topics: editing.topics, eventUrl: editing.eventUrl, price: editing.price }}
            onSave={handleEdit}
            onCancel={() => setEditing(null)}
            saving={saving}
          />
        </Modal>
      )}
    </div>
  );
}

function EventCard({ ev, commMap, onEdit, onDelete }: {
  ev: ApiEvent;
  commMap: Record<string, ApiCommunity>;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const dateStr = ev.date
    ? new Date(ev.date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Data a definir';

  return (
    <div style={{
      border: `1px solid ${SITE.rule}`, padding: '14px 16px', marginBottom: 8,
      background: ev.approved ? '#fff' : SITE.limestone,
      display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'start',
    }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14, color: SITE.ink, marginBottom: 4 }}>{ev.name}</div>
        <div style={{ ...MONO, fontSize: 11, color: SITE.mute, letterSpacing: '0.05em' }}>
          {dateStr} · {ev.region} · {ev.venue || '—'}
        </div>
        {ev.description && (
          <div style={{ fontSize: 12, color: SITE.mute, marginTop: 4, lineHeight: 1.5 }}>
            {ev.description.slice(0, 120)}{ev.description.length > 120 ? '…' : ''}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={onEdit} style={{
          background: 'none', border: `1px solid ${SITE.rule}`, padding: '4px 10px',
          fontSize: 11, cursor: 'pointer', color: SITE.mute, ...MONO, letterSpacing: '0.08em',
        }}>Editar</button>
        <button onClick={onDelete} style={{
          background: 'none', border: `1px solid ${SITE.red}40`, padding: '4px 10px',
          fontSize: 11, cursor: 'pointer', color: SITE.red, ...MONO, letterSpacing: '0.08em',
        }}>×</button>
      </div>
    </div>
  );
}

function ExpiredMessage() {
  return (
    <div style={{ background: SITE.paper, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', ...S }}>
      <div style={{ textAlign: 'center', maxWidth: 360 }}>
        <div style={{ ...MONO, fontSize: 10, color: SITE.red, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>Link expirado</div>
        <h1 style={{ fontWeight: 700, fontSize: 22, color: SITE.ink, margin: '0 0 16px' }}>Este link já não é válido</h1>
        <p style={{ fontSize: 14, color: SITE.mute, lineHeight: 1.6 }}>
          O magic link que usaste expirou ou já foi utilizado.<br />Pede ao admin para enviar um novo link.
        </p>
      </div>
    </div>
  );
}

export function Portal() {
  const [session, setSession] = useState<PortalSession | null>(null);
  const [checking, setChecking] = useState(true);
  const expired = window.location.hash === '#portal-expired';

  useEffect(() => {
    if (expired) { setChecking(false); return; }
    api.portalSession()
      .then(s => { if (s.authenticated && s.communityIds) setSession({ communityIds: s.communityIds, email: s.email ?? '' }); })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [expired]);

  async function handleLogout() {
    await api.portalLogout().catch(() => {});
    window.location.hash = '';
    window.location.reload();
  }

  if (expired) return <ExpiredMessage />;
  if (checking) return null;
  if (!session) {
    return (
      <div style={{ background: SITE.paper, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', ...S }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ ...MONO, fontSize: 10, color: SITE.mute, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>Portal</div>
          <p style={{ fontSize: 14, color: SITE.mute }}>Sessão inválida. Pede um novo link ao admin.</p>
        </div>
      </div>
    );
  }

  return <PortalDashboard session={session} onLogout={handleLogout} />;
}
