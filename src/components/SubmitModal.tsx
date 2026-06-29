import { useState, useRef, KeyboardEvent } from 'react';
import { SITE, T } from '@/lib/tokens';
import { api } from '@/lib/api';

const REGIONS = ['Lisboa', 'Porto', 'Coimbra', 'Braga', 'Aveiro', 'Faro', 'Évora', 'Setúbal', 'Leiria', 'Viseu', 'Guimarães', 'Viana do Castelo'];
const DEFAULT_TOPICS = ['Web', 'Mobile', 'AI/ML', 'DevOps', 'Cloud', 'Security', 'Data', 'Design', 'Startup', 'Gaming', 'Blockchain', 'IoT', 'Open Source'];
const ROLES = ['Organizer', 'Co-organizer', 'Speaker coordinator', 'Other'];

interface SubmitModalProps {
  onClose: () => void;
}

type Step = 'community' | 'organizer' | 'success';
type LoadingState = 'idle' | 'loading' | 'error';

const inputStyle = {
  width: '100%', boxSizing: 'border-box' as const,
  padding: '9px 12px', background: T.paper,
  border: `1px solid ${T.rule}`, color: T.ink,
  fontFamily: '"Space Grotesk", sans-serif', fontSize: 14,
  outline: 'none',
};

const labelStyle = {
  display: 'block', fontFamily: '"JetBrains Mono", monospace',
  fontSize: 10, color: T.mute, letterSpacing: '0.15em',
  textTransform: 'uppercase' as const, marginBottom: 6,
};

const chipStyle = (active: boolean) => ({
  padding: '5px 12px',
  background: active ? SITE.green : 'transparent',
  color: active ? '#fff' : T.inkSoft,
  border: `1px solid ${active ? SITE.green : T.rule}`,
  cursor: 'pointer',
  fontFamily: '"JetBrains Mono", monospace',
  fontSize: 11, letterSpacing: '0.1em',
});

export function SubmitModal({ onClose }: SubmitModalProps) {
  const [step, setStep] = useState<Step>('community');

  // Step 1 — community
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [communityPage, setCommunityPage] = useState('');
  const [region, setRegion] = useState('');
  const [customCity, setCustomCity] = useState('');
  const [founded, setFounded] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [customTopicInput, setCustomTopicInput] = useState('');
  const [extraTopics, setExtraTopics] = useState<string[]>([]);

  // Step 2 — organizer
  const [orgName, setOrgName] = useState('');
  const [orgEmail, setOrgEmail] = useState('');
  const [orgRole, setOrgRole] = useState('Organizer');

  const [communityId, setCommunityId] = useState('');
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const allTopics = [...DEFAULT_TOPICS, ...extraTopics];

  function toggleTopic(t: string) {
    setTopics(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }

  function addCustomTopic(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter' && e.key !== ',') return;
    e.preventDefault();
    const val = customTopicInput.trim();
    if (!val || allTopics.includes(val)) { setCustomTopicInput(''); return; }
    setExtraTopics(prev => [...prev, val]);
    setTopics(prev => [...prev, val]);
    setCustomTopicInput('');
  }

  function addCustomCity(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const val = customCity.trim();
    if (val) setRegion(val);
    setCustomCity('');
  }

  async function handleSubmitCommunity(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !region) return;
    setLoadingState('loading');
    setErrorMsg('');
    try {
      const res = await api.submitCommunity({
        name, description, communityPage, region, topics,
        ...(founded ? { founded: parseInt(founded) } : {}),
      });
      setCommunityId(res.id);
      setStep('organizer');
      setLoadingState('idle');
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Unexpected error.');
      setLoadingState('error');
    }
  }

  async function handleSubmitOrganizer(e: React.FormEvent) {
    e.preventDefault();
    if (!orgEmail.trim()) return;
    setLoadingState('loading');
    setErrorMsg('');
    try {
      await api.submitLeader({ name: orgName, email: orgEmail, role: orgRole, communityId });
      setStep('success');
      setLoadingState('idle');
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Unexpected error.');
      setLoadingState('error');
    }
  }

const canSubmitCommunity = name.trim() && region;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(26,26,26,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: T.paper, maxWidth: 560, width: '100%',
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          border: `1px solid ${T.rule}`,
          fontFamily: '"Space Grotesk", sans-serif',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 28px', borderBottom: `1px solid ${T.rule}`, flexShrink: 0,
        }}>
          <div>
            <div style={{
              fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
              color: SITE.green, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4,
            }}>
              {step === 'community' ? 'Step 1 of 2' : step === 'organizer' ? 'Step 2 of 2' : 'Done'}
            </div>
            <h2 style={{ fontWeight: 700, fontSize: 20, letterSpacing: '-0.01em', color: T.ink, margin: 0 }}>
              {step === 'community' ? 'Add your community' : step === 'organizer' ? 'Your details' : 'Submitted!'}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 20, color: T.mute, padding: 4, lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Step indicator */}
        {step !== 'success' && (
          <div style={{
            display: 'flex', gap: 4, padding: '12px 28px 0',
            flexShrink: 0,
          }}>
            {(['community', 'organizer'] as const).map((s, i) => (
              <div key={s} style={{
                flex: 1, height: 3,
                background: step === s || (step === 'organizer' && i === 0) ? SITE.green : T.rule,
                transition: 'background 0.2s',
              }} />
            ))}
          </div>
        )}

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>

          {/* ── Step 1: Community ── */}
          {step === 'community' && (
            <form onSubmit={handleSubmitCommunity} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={labelStyle}>Community name *</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder="e.g. Lisboa JS"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Brief description of the community..."
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' as const }}
                />
              </div>

              <div>
                <label style={labelStyle}>Website / community page</label>
                <input
                  type="url"
                  value={communityPage}
                  onChange={e => setCommunityPage(e.target.value)}
                  placeholder="https://..."
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>City *</label>
                  <select
                    value={REGIONS.includes(region) ? region : ''}
                    onChange={e => { setRegion(e.target.value); setCustomCity(''); }}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    <option value="" disabled>Select a city</option>
                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <input
                    value={customCity}
                    onChange={e => setCustomCity(e.target.value)}
                    onKeyDown={addCustomCity}
                    placeholder="Other city — press Enter"
                    style={{ ...inputStyle, marginTop: 6, fontSize: 13 }}
                  />
                  {region && !REGIONS.includes(region) && (
                    <div style={{
                      marginTop: 4, fontSize: 12,
                      fontFamily: '"JetBrains Mono", monospace', color: SITE.green,
                    }}>
                      ✓ {region}
                    </div>
                  )}
                </div>
                <div>
                  <label style={labelStyle}>Founded (year)</label>
                  <input
                    type="number"
                    min={1990}
                    max={new Date().getFullYear()}
                    value={founded}
                    onChange={e => setFounded(e.target.value)}
                    placeholder="e.g. 2018"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Topics</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {allTopics.map(t => (
                    <button key={t} type="button" onClick={() => toggleTopic(t)} style={chipStyle(topics.includes(t))}>
                      {t}
                    </button>
                  ))}
                </div>
                <input
                  value={customTopicInput}
                  onChange={e => setCustomTopicInput(e.target.value)}
                  onKeyDown={addCustomTopic}
                  placeholder="Add a topic — press Enter or ,"
                  style={{ ...inputStyle, marginTop: 10, fontSize: 13 }}
                />
              </div>

              {errorMsg && <ErrorBox msg={errorMsg} />}

              <button
                type="submit"
                disabled={loadingState === 'loading' || !canSubmitCommunity}
                style={submitBtnStyle(!!canSubmitCommunity)}
              >
                {loadingState === 'loading' ? 'Saving...' : 'Next — add your details →'}
              </button>
            </form>
          )}

          {/* ── Step 2: Organizer ── */}
          {step === 'organizer' && (
            <form onSubmit={handleSubmitOrganizer} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <p style={{ margin: 0, fontSize: 14, color: T.inkSoft, lineHeight: 1.6 }}>
                Your community has been saved. Now tell us who you are so we can get in touch and link you as the organizer.
              </p>

              <div>
                <label style={labelStyle}>Your name</label>
                <input
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  placeholder="e.g. Ana Silva"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Email *</label>
                <input
                  type="email"
                  value={orgEmail}
                  onChange={e => setOrgEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Role</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {ROLES.map(r => (
                    <button
                      key={r} type="button"
                      onClick={() => setOrgRole(r)}
                      style={chipStyle(orgRole === r)}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {errorMsg && <ErrorBox msg={errorMsg} />}

              <button
                type="submit"
                disabled={loadingState === 'loading' || !orgEmail.trim()}
                style={submitBtnStyle(!!orgEmail.trim())}
              >
                {loadingState === 'loading' ? 'Submitting...' : 'Submit'}
              </button>

            </form>
          )}

          {/* ── Success ── */}
          {step === 'success' && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 12, padding: '40px 0', textAlign: 'center',
            }}>
              <div style={{ fontSize: 36 }}>🎉</div>
              <div style={{ fontWeight: 700, fontSize: 18, color: T.ink }}>You're all set!</div>
              <p style={{ fontSize: 14, color: T.inkSoft, maxWidth: 320, lineHeight: 1.6 }}>
                Your community has been submitted for review. Once approved it will appear in the directory.
              </p>
              <button
                onClick={onClose}
                style={{
                  marginTop: 8, padding: '10px 24px',
                  background: SITE.green, color: '#fff',
                  border: 'none', cursor: 'pointer',
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase',
                }}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div style={{
      padding: '10px 14px', background: '#fff0f0',
      border: '1px solid #fca5a5', color: '#b91c1c', fontSize: 13,
    }}>
      {msg}
    </div>
  );
}

function submitBtnStyle(enabled: boolean): React.CSSProperties {
  return {
    padding: '12px 0', marginTop: 4,
    background: enabled ? SITE.green : T.rule,
    color: enabled ? '#fff' : T.mute,
    border: 'none', cursor: enabled ? 'pointer' : 'default',
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
    transition: 'background 0.15s',
  };
}
