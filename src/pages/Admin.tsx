import { useState, useEffect, useCallback, useRef } from 'react';
import { SITE } from '@/lib/tokens';
import { api, ApiCommunity, ApiEvent } from '@/lib/api';

interface AdminProps {
  onExit: () => void;
}

type Section = 'events' | 'communities' | 'config' | 'portal';

// ─── helpers ────────────────────────────────────────────────────────────────

const S: React.CSSProperties = { fontFamily: '"Space Grotesk", sans-serif' };
const MONO: React.CSSProperties = { fontFamily: '"JetBrains Mono", monospace' };

function Field({
  label, value, onChange, placeholder, multiline, type, readOnly,
}: {
  label: string; value: string; onChange?: (v: string) => void;
  placeholder?: string; multiline?: boolean; type?: string; readOnly?: boolean;
}) {
  const base: React.CSSProperties = {
    width: '100%', padding: '9px 12px', fontSize: 13,
    border: `1px solid ${SITE.rule}`, background: readOnly ? SITE.limestone : '#fff',
    outline: 'none', boxSizing: 'border-box', color: SITE.ink,
    ...S,
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

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      background: color + '18', color, border: `1px solid ${color}40`,
      borderRadius: 2, padding: '2px 7px', fontSize: 11, ...MONO,
      letterSpacing: '0.05em', display: 'inline-block',
    }}>{label}</span>
  );
}

function ApproveBtn({ approved, onToggle }: { approved: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} style={{
      background: approved ? SITE.green + '18' : SITE.red + '18',
      color: approved ? SITE.green : SITE.red,
      border: `1px solid ${approved ? SITE.green : SITE.red}40`,
      padding: '4px 12px', fontSize: 11, cursor: 'pointer', ...MONO,
      letterSpacing: '0.08em', textTransform: 'uppercase',
    }}>
      {approved ? '✓ Aprovado' : '✗ Pendente'}
    </button>
  );
}

// ─── Login ───────────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError('');
    try {
      await api.login(pw);
      onLogin();
    } catch (e: any) {
      setError(e.message ?? 'Erro');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: SITE.paper, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', ...S }}>
      <div style={{ border: `1px solid ${SITE.rule}`, padding: 48, minWidth: 360, background: SITE.paper }}>
        <div style={{ ...MONO, fontSize: 10, color: SITE.green, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>Admin</div>
        <h1 style={{ fontWeight: 700, fontSize: 22, color: SITE.ink, margin: '0 0 28px' }}>Backoffice PTC</h1>
        <Field label="Password" value={pw} onChange={setPw} type="password" />
        {error && <div style={{ color: SITE.red, fontSize: 12, marginBottom: 12 }}>{error}</div>}
        <button onClick={submit} disabled={loading} style={{
          width: '100%', background: SITE.ink, color: SITE.limestone,
          padding: '12px 0', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer', ...S,
        }}>
          {loading ? '…' : 'Entrar'}
        </button>
      </div>
    </div>
  );
}

// ─── Events section ──────────────────────────────────────────────────────────

function EventsSection({ communities }: { communities: ApiCommunity[] }) {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ApiEvent | null>(null);
  const [showPast, setShowPast] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setEvents(await api.getEvents({ all: true, past: showPast }));
    } finally {
      setLoading(false);
    }
  }, [showPast]);

  useEffect(() => { load(); }, [load]);

  async function toggleApprove(ev: ApiEvent) {
    const updated = await api.updateEvent(ev.id, { approved: !ev.approved });
    setEvents(prev => prev.map(e => e.id === updated.id ? updated : e));
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    try {
      const updated = await api.updateEvent(editing.id, editing);
      setEvents(prev => prev.map(e => e.id === updated.id ? updated : e));
      setEditing(null);
      setMsg('Guardado ✓');
      setTimeout(() => setMsg(''), 2000);
    } catch (e: any) {
      setMsg('Erro: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteEvent(id: string) {
    if (!confirm('Apagar este evento?')) return;
    await api.deleteEvent(id);
    setEvents(prev => prev.filter(e => e.id !== id));
  }

  const commMap = Object.fromEntries(communities.map(c => [c.notionId, c.name]));
  const pending = events.filter(e => !e.approved);
  const approved = events.filter(e => e.approved);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ ...MONO, fontSize: 11, color: SITE.mute, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {events.length} eventos
          </span>
          {pending.length > 0 && <Badge label={`${pending.length} pendentes`} color={SITE.ochre} />}
          {msg && <span style={{ fontSize: 12, color: SITE.green }}>{msg}</span>}
        </div>
        <button onClick={() => setShowPast(p => !p)} style={{
          background: 'none', border: `1px solid ${SITE.rule}`, padding: '6px 14px',
          fontSize: 11, cursor: 'pointer', color: SITE.mute, ...MONO,
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          {showPast ? 'Ocultar passados' : 'Ver passados'}
        </button>
      </div>

      {loading ? (
        <div style={{ color: SITE.mute, fontSize: 13, padding: 20 }}>A carregar…</div>
      ) : (
        <>
          {pending.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ ...MONO, fontSize: 10, color: SITE.ochre, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
                Pendentes ({pending.length})
              </div>
              {pending.map(ev => <EventRow key={ev.id} ev={ev} commMap={commMap} onToggle={toggleApprove} onEdit={setEditing} onDelete={deleteEvent} />)}
            </div>
          )}
          <div>
            <div style={{ ...MONO, fontSize: 10, color: SITE.mute, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
              Aprovados ({approved.length})
            </div>
            {approved.map(ev => <EventRow key={ev.id} ev={ev} commMap={commMap} onToggle={toggleApprove} onEdit={setEditing} onDelete={deleteEvent} />)}
          </div>
        </>
      )}

      {editing && (
        <Modal title="Editar evento" onClose={() => setEditing(null)}>
          <Field label="Título" value={editing.name} onChange={v => setEditing(p => p && ({ ...p, name: v }))} />
          <Field label="Descrição" value={editing.description} onChange={v => setEditing(p => p && ({ ...p, description: v }))} multiline />
          <Field label="Local" value={editing.venue} onChange={v => setEditing(p => p && ({ ...p, venue: v }))} />
          <Field label="Data (ISO)" value={editing.date ?? ''} onChange={v => setEditing(p => p && ({ ...p, date: v }))} placeholder="2026-06-11T19:30" />
          <Field label="Região" value={editing.region} onChange={v => setEditing(p => p && ({ ...p, region: v }))} />
          <Field label="URL do evento" value={editing.eventUrl} onChange={v => setEditing(p => p && ({ ...p, eventUrl: v }))} />
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button onClick={saveEdit} disabled={saving} style={{
              flex: 1, background: SITE.ink, color: SITE.limestone, padding: '10px 0',
              fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer', ...S,
            }}>{saving ? '…' : 'Guardar'}</button>
            <button onClick={() => setEditing(null)} style={{
              flex: 1, background: 'none', border: `1px solid ${SITE.rule}`, padding: '10px 0',
              fontSize: 13, cursor: 'pointer', color: SITE.mute, ...S,
            }}>Cancelar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function EventRow({ ev, commMap, onToggle, onEdit, onDelete }: {
  ev: ApiEvent;
  commMap: Record<string, string>;
  onToggle: (ev: ApiEvent) => void;
  onEdit: (ev: ApiEvent) => void;
  onDelete: (id: string) => void;
}) {
  const commName = ev.communityIds.map(id => commMap[id]).filter(Boolean).join(', ') || '—';
  const dateStr = ev.date ? new Date(ev.date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  return (
    <div style={{
      border: `1px solid ${SITE.rule}`, padding: '14px 16px', marginBottom: 8,
      background: ev.approved ? '#fff' : SITE.limestone,
      display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'start',
    }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14, color: SITE.ink, marginBottom: 4 }}>{ev.name}</div>
        <div style={{ ...MONO, fontSize: 11, color: SITE.mute, letterSpacing: '0.05em' }}>
          {dateStr} · {ev.region} · {ev.venue || '—'} · {commName}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <ApproveBtn approved={ev.approved} onToggle={() => onToggle(ev)} />
        <button onClick={() => onEdit(ev)} style={{
          background: 'none', border: `1px solid ${SITE.rule}`, padding: '4px 10px',
          fontSize: 11, cursor: 'pointer', color: SITE.mute, ...MONO, letterSpacing: '0.08em',
        }}>Editar</button>
        <button onClick={() => onDelete(ev.id)} style={{
          background: 'none', border: `1px solid ${SITE.red}40`, padding: '4px 10px',
          fontSize: 11, cursor: 'pointer', color: SITE.red, ...MONO, letterSpacing: '0.08em',
        }}>×</button>
      </div>
    </div>
  );
}

// ─── Communities section ─────────────────────────────────────────────────────

function CommunitiesSection() {
  const [comms, setComms] = useState<ApiCommunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ApiCommunity | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.getCommunities(true).then(setComms).finally(() => setLoading(false));
  }, []);

  async function toggleApprove(c: ApiCommunity) {
    const updated = await api.updateCommunity(c.notionId, { approved: !c.approved });
    setComms(prev => prev.map(x => x.notionId === updated.notionId ? updated : x));
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    try {
      const updated = await api.updateCommunity(editing.notionId, editing);
      setComms(prev => prev.map(x => x.notionId === updated.notionId ? updated : x));
      setEditing(null);
      setMsg('Guardado ✓');
      setTimeout(() => setMsg(''), 2000);
    } catch (e: any) {
      setMsg('Erro: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteComm(notionId: string) {
    if (!confirm('Apagar esta comunidade?')) return;
    await api.deleteCommunity(notionId);
    setComms(prev => prev.filter(c => c.notionId !== notionId));
  }

  const pending = comms.filter(c => !c.approved);
  const approved = comms.filter(c => c.approved);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <span style={{ ...MONO, fontSize: 11, color: SITE.mute, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {comms.length} comunidades
        </span>
        {pending.length > 0 && <Badge label={`${pending.length} novas submissões`} color={SITE.ochre} />}
        {msg && <span style={{ fontSize: 12, color: SITE.green }}>{msg}</span>}
      </div>

      {loading ? (
        <div style={{ color: SITE.mute, fontSize: 13, padding: 20 }}>A carregar…</div>
      ) : (
        <>
          {pending.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ ...MONO, fontSize: 10, color: SITE.ochre, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
                Novas submissões ({pending.length})
              </div>
              {pending.map(c => <CommunityRow key={c.notionId} comm={c} onToggle={toggleApprove} onEdit={setEditing} onDelete={deleteComm} />)}
            </div>
          )}
          <div>
            <div style={{ ...MONO, fontSize: 10, color: SITE.mute, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
              Aprovadas ({approved.length})
            </div>
            {approved.map(c => <CommunityRow key={c.notionId} comm={c} onToggle={toggleApprove} onEdit={setEditing} onDelete={deleteComm} />)}
          </div>
        </>
      )}

      {editing && (
        <Modal title="Editar comunidade" onClose={() => setEditing(null)}>
          <Field label="Nome" value={editing.name} onChange={v => setEditing(p => p && ({ ...p, name: v }))} />
          <Field label="Slug (ID)" value={editing.slug} onChange={v => setEditing(p => p && ({ ...p, slug: v }))} />
          <Field label="Descrição" value={editing.description} onChange={v => setEditing(p => p && ({ ...p, description: v }))} multiline />
          <Field label="Região" value={editing.region} onChange={v => setEditing(p => p && ({ ...p, region: v }))} />
          <Field label="Membros" value={editing.members} onChange={v => setEditing(p => p && ({ ...p, members: v }))} placeholder="1.2k" />
          <Field label="Fundada" value={editing.founded?.toString() ?? ''} onChange={v => setEditing(p => p && ({ ...p, founded: parseInt(v) || null }))} />
          <Field label="URL da comunidade" value={editing.communityPage} onChange={v => setEditing(p => p && ({ ...p, communityPage: v }))} />
          <Field label="URL do logo" value={editing.logoUrl} onChange={v => setEditing(p => p && ({ ...p, logoUrl: v }))} />
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button onClick={saveEdit} disabled={saving} style={{
              flex: 1, background: SITE.ink, color: SITE.limestone, padding: '10px 0',
              fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer', ...S,
            }}>{saving ? '…' : 'Guardar'}</button>
            <button onClick={() => setEditing(null)} style={{
              flex: 1, background: 'none', border: `1px solid ${SITE.rule}`, padding: '10px 0',
              fontSize: 13, cursor: 'pointer', color: SITE.mute, ...S,
            }}>Cancelar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function CommunityRow({ comm, onToggle, onEdit, onDelete }: {
  comm: ApiCommunity;
  onToggle: (c: ApiCommunity) => void;
  onEdit: (c: ApiCommunity) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div style={{
      border: `1px solid ${SITE.rule}`, padding: '14px 16px', marginBottom: 8,
      background: comm.approved ? '#fff' : SITE.limestone,
      display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'start',
    }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14, color: SITE.ink, marginBottom: 4 }}>{comm.name}</div>
        <div style={{ ...MONO, fontSize: 11, color: SITE.mute, letterSpacing: '0.05em' }}>
          {comm.region} · {comm.members || '—'} membros · desde {comm.founded ?? '—'}
        </div>
        {comm.description && (
          <div style={{ fontSize: 12, color: SITE.mute, marginTop: 4 }}>{comm.description}</div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <ApproveBtn approved={comm.approved} onToggle={() => onToggle(comm)} />
        <button onClick={() => onEdit(comm)} style={{
          background: 'none', border: `1px solid ${SITE.rule}`, padding: '4px 10px',
          fontSize: 11, cursor: 'pointer', color: SITE.mute, ...MONO, letterSpacing: '0.08em',
        }}>Editar</button>
        <button onClick={() => onDelete(comm.notionId)} style={{
          background: 'none', border: `1px solid ${SITE.red}40`, padding: '4px 10px',
          fontSize: 11, cursor: 'pointer', color: SITE.red, ...MONO, letterSpacing: '0.08em',
        }}>×</button>
      </div>
    </div>
  );
}

// ─── Config section ───────────────────────────────────────────────────────────

function ConfigSection() {
  const [config, setConfig] = useState<Record<string, any> | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { api.getConfig().then(setConfig); }, []);

  async function save() {
    if (!config) return;
    setSaving(true);
    try {
      await api.updateConfig(config);
      setMsg('Guardado ✓');
      setTimeout(() => setMsg(''), 2000);
    } catch (e: any) {
      setMsg('Erro: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  if (!config) return <div style={{ color: SITE.mute, fontSize: 13 }}>A carregar…</div>;

  function set(key: string, val: any) {
    setConfig(p => p ? ({ ...p, [key]: val }) : p);
  }

  function updateFaq(i: number, field: 'q' | 'a', val: string) {
    const faqs = config!.faqs.map((f: any, idx: number) => idx === i ? { ...f, [field]: val } : f);
    set('faqs', faqs);
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        {msg && <span style={{ fontSize: 12, color: SITE.green, marginRight: 16 }}>{msg}</span>}
        <button onClick={save} disabled={saving} style={{
          background: SITE.ink, color: SITE.limestone, padding: '10px 24px',
          fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer', ...S,
        }}>{saving ? '…' : 'Guardar tudo'}</button>
      </div>

      <SectionBlock title="Formulários">
        <Field label="URL Submit yours" value={config.notionFormUrl ?? ''} onChange={v => set('notionFormUrl', v)} placeholder="https://..." />
        <Field label="URL form de contacto" value={config.contactFormUrl ?? ''} onChange={v => set('contactFormUrl', v)} placeholder="https://..." />
      </SectionBlock>

      <SectionBlock title="Texto About">
        <Field label="Descrição" value={config.aboutText ?? ''} onChange={v => set('aboutText', v)} multiline />
      </SectionBlock>

      <SectionBlock title="Links & Redes Sociais">
        <Field label="Newsletter" value={config.newsletterUrl ?? ''} onChange={v => set('newsletterUrl', v)} placeholder="https://..." />
        <Field label="WhatsApp" value={config.whatsappUrl ?? ''} onChange={v => set('whatsappUrl', v)} placeholder="https://chat.whatsapp.com/..." />
        <Field label="Telegram" value={config.telegramUrl ?? ''} onChange={v => set('telegramUrl', v)} placeholder="https://t.me/..." />
        <Field label="Twitter / X" value={config.twitterUrl ?? ''} onChange={v => set('twitterUrl', v)} placeholder="https://twitter.com/..." />
        <Field label="LinkedIn" value={config.linkedinUrl ?? ''} onChange={v => set('linkedinUrl', v)} placeholder="https://linkedin.com/..." />
        <Field label="Instagram" value={config.instagramUrl ?? ''} onChange={v => set('instagramUrl', v)} placeholder="https://instagram.com/..." />
      </SectionBlock>

      <SectionBlock title="FAQs">
        {(config.faqs ?? []).map((faq: any, i: number) => (
          <div key={i} style={{ border: `1px solid ${SITE.rule}`, padding: 16, marginBottom: 12, background: SITE.limestone }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ ...MONO, fontSize: 10, color: SITE.mute, letterSpacing: '0.12em', textTransform: 'uppercase' }}>FAQ {i + 1}</span>
              <button onClick={() => set('faqs', config.faqs.filter((_: any, idx: number) => idx !== i))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: SITE.red, fontSize: 12, ...MONO }}>
                Remover
              </button>
            </div>
            <Field label="Pergunta" value={faq.q} onChange={v => updateFaq(i, 'q', v)} />
            <Field label="Resposta" value={faq.a} onChange={v => updateFaq(i, 'a', v)} multiline />
          </div>
        ))}
        <button onClick={() => set('faqs', [...(config.faqs ?? []), { q: '', a: '' }])} style={{
          border: `1px dashed ${SITE.rule}`, padding: '10px 20px', background: 'transparent',
          cursor: 'pointer', ...MONO, fontSize: 11, color: SITE.mute, letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>+ Adicionar FAQ</button>
      </SectionBlock>
    </div>
  );
}

function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{
        ...MONO, fontSize: 10, color: SITE.mute, letterSpacing: '0.15em', textTransform: 'uppercase',
        borderBottom: `1px solid ${SITE.rule}`, paddingBottom: 10, marginBottom: 18,
      }}>{title}</div>
      {children}
    </div>
  );
}

// ─── Portal section ──────────────────────────────────────────────────────────

function PortalSection() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function send() {
    if (!email) return;
    setLoading(true);
    setResult(null);
    try {
      const r = await api.sendMagicLink(email);
      setResult({ ok: true, msg: `Link enviado para ${email} — comunidades: ${r.communities.join(', ')}` });
      setEmail('');
    } catch (e: any) {
      setResult({ ok: false, msg: e.message });
    } finally {
      setLoading(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setResult(null), 8000);
    }
  }

  return (
    <div>
      <SectionBlock title="Enviar magic link">
        <p style={{ fontSize: 13, color: SITE.mute, marginBottom: 20, lineHeight: 1.6 }}>
          Envia um link de acesso ao dashboard de comunidade para um community manager registado no CRM.
          O link é válido por 24 horas.
        </p>
        <Field
          label="Email do community manager"
          value={email}
          onChange={setEmail}
          placeholder="manager@comunidade.pt"
          type="email"
        />
        {result && (
          <div style={{
            padding: '10px 14px', fontSize: 12, marginBottom: 16,
            border: `1px solid ${result.ok ? SITE.green : SITE.red}40`,
            background: (result.ok ? SITE.green : SITE.red) + '10',
            color: result.ok ? SITE.green : SITE.red,
          }}>{result.msg}</div>
        )}
        <button onClick={send} disabled={loading || !email} style={{
          background: SITE.ink, color: SITE.limestone, padding: '10px 24px',
          fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer', ...S,
          opacity: !email ? 0.5 : 1,
        }}>{loading ? '…' : 'Enviar link'}</button>
      </SectionBlock>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

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

// ─── Main Admin ───────────────────────────────────────────────────────────────

export function Admin({ onExit }: AdminProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [section, setSection] = useState<Section>('events');
  const [communities, setCommunities] = useState<ApiCommunity[]>([]);

  useEffect(() => {
    api.session().then(({ authenticated }) => {
      setAuthenticated(authenticated);
      setCheckingSession(false);
    }).catch(() => setCheckingSession(false));
  }, []);

  useEffect(() => {
    if (authenticated) {
      api.getCommunities(true).then(setCommunities).catch(() => {});
    }
  }, [authenticated]);

  async function handleLogout() {
    await api.logout().catch(() => {});
    setAuthenticated(false);
  }

  if (checkingSession) return null;
  if (!authenticated) return <LoginScreen onLogin={() => setAuthenticated(true)} />;

  const navItems: { key: Section; label: string }[] = [
    { key: 'events', label: 'Eventos' },
    { key: 'communities', label: 'Comunidades' },
    { key: 'config', label: 'Configuração' },
    { key: 'portal', label: 'Portal' },
  ];

  return (
    <div style={{ background: SITE.paper, minHeight: '100vh', ...S }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 48px', borderBottom: `1px solid ${SITE.rule}`, background: SITE.paper,
        position: 'sticky', top: 0, zIndex: 10, height: 56,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          <button onClick={onExit} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            ...MONO, fontSize: 11, color: SITE.mute, letterSpacing: '0.1em',
            textTransform: 'uppercase', marginRight: 32, padding: 0,
          }}>← Site</button>
          {navItems.map(item => (
            <button key={item.key} onClick={() => setSection(item.key)} style={{
              background: 'none', border: 'none', borderBottom: section === item.key ? `2px solid ${SITE.ink}` : '2px solid transparent',
              padding: '0 20px', height: 56, cursor: 'pointer',
              fontWeight: section === item.key ? 600 : 400,
              fontSize: 14, color: section === item.key ? SITE.ink : SITE.mute, ...S,
            }}>{item.label}</button>
          ))}
        </div>
        <button onClick={handleLogout} style={{
          background: 'none', border: `1px solid ${SITE.rule}`, padding: '6px 16px',
          fontSize: 12, cursor: 'pointer', color: SITE.mute, ...MONO, letterSpacing: '0.08em',
        }}>Sair</button>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 48px 80px' }}>
        {section === 'events' && <EventsSection communities={communities} />}
        {section === 'communities' && <CommunitiesSection />}
        {section === 'config' && <ConfigSection />}
        {section === 'portal' && <PortalSection />}
      </div>
    </div>
  );
}
