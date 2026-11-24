import { useCallback, useEffect, useState } from 'react';
import { DataView } from './components/DataView';
import { HomeView } from './components/HomeView';
import { ConfirmDialog, HelpDialog, NewSessionDialog } from './components/Modals';
import { SessionView } from './components/SessionView';
import { SettingsView } from './components/SettingsView';
import {
  SCALE,
  advanceSession,
  buildSteps,
} from './constants/study';
import { exportAllZip, exportDassCsv, exportSessionZip } from './lib/export';
import {
  deleteSession,
  getAllSessions,
  loadConfig,
  saveConfig,
  saveSession,
} from './lib/storage';
import type {
  AppView,
  MicStatus,
  RecordingData,
  SessionMeta,
  StudyConfig,
  StudySession,
} from './types/study';

export default function App() {
  const [view, setView] = useState<AppView>('sesi');
  const [cfg, setCfg] = useState<StudyConfig>(() => loadConfig());
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [micStatus, setMicStatus] = useState<MicStatus>({
    ok: false,
    text: 'Mikrofon belum dicek',
  });

  const [helpOpen, setHelpOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StudySession | null>(null);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);

  // Initialize IndexedDB sessions and check microphone permissions
  useEffect(() => {
    let active = true;

    getAllSessions().then((list) => {
      if (!active) return;
      setSessions(list);
      const openSession = list
        .filter((s) => !s.done)
        .sort((a, b) => b.createdAt - a.createdAt)[0];
      if (openSession) {
        setCurrentId(openSession.id);
      }
    });

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicStatus({ ok: false, text: 'Butuh HTTPS/localhost' });
    } else if (navigator.permissions) {
      navigator.permissions
        .query({ name: 'microphone' as PermissionName })
        .then((perm) => {
          if (!active) return;
          const updatePerm = () => {
            setMicStatus({
              ok: perm.state !== 'denied',
              text:
                perm.state === 'granted'
                  ? 'Mikrofon siap'
                  : perm.state === 'denied'
                    ? 'Mikrofon diblokir'
                    : 'Mikrofon belum diizinkan',
            });
          };
          updatePerm();
          perm.onchange = updatePerm;
        })
        .catch(() => {});
    }

    return () => {
      active = false;
    };
  }, []);

  // Warn before closing tab during active recording
  useEffect(() => {
    if (!recording) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [recording]);

  const currentSession = sessions.find((s) => s.id === currentId) ?? null;

  const updateMicStatus = useCallback((ok: boolean, text: string) => {
    setMicStatus({ ok, text });
  }, []);

  const handleNavigate = (nextView: AppView) => {
    if (recording) return;
    setView(nextView);
  };

  const handleStartNewSession = async (meta: SessionMeta) => {
    const initial: StudySession = {
      id: `s${Date.now()}`,
      meta,
      createdAt: Date.now(),
      consentAt: Date.now(),
      order: cfg.order,
      steps: buildSteps(cfg.order),
      idx: 0,
      log: [],
      recs: {},
      ans: Array(21).fill(null),
      done: false,
      ua: navigator.userAgent,
    };

    const advanced = advanceSession(initial, cfg.showResult);
    setSessions((prev) => [...prev, advanced]);
    setCurrentId(advanced.id);
    setView('sesi');
    setNewOpen(false);
    await saveSession(advanced);
  };

  const handleSaveRecording = async (taskId: string, rec: RecordingData) => {
    if (!currentSession) return;
    const updatedBase: StudySession = {
      ...currentSession,
      recs: { ...currentSession.recs, [taskId]: rec },
      log: [...currentSession.log, { w: 'me', rec: taskId }],
      idx: currentSession.idx + 1,
    };
    const advanced = advanceSession(updatedBase, cfg.showResult);
    setSessions((prev) => prev.map((s) => (s.id === advanced.id ? advanced : s)));
    await saveSession(advanced);
  };

  const handleAnswerDass = async (val: number) => {
    if (!currentSession) return;
    const step = currentSession.steps[currentSession.idx];
    if (!step || step.t !== 'dass') return;

    const nextAns = [...currentSession.ans];
    nextAns[step.i] = val;

    const updatedBase: StudySession = {
      ...currentSession,
      ans: nextAns,
      log: [...currentSession.log, { w: 'me', t: `${val} · ${SCALE[val]}` }],
      idx: currentSession.idx + 1,
    };
    const advanced = advanceSession(updatedBase, cfg.showResult);
    setSessions((prev) => prev.map((s) => (s.id === advanced.id ? advanced : s)));
    await saveSession(advanced);
  };

  const handleUndoDass = async () => {
    if (!currentSession) return;
    const prevIdx = currentSession.idx - 1;
    const prevStep = currentSession.steps[prevIdx];
    if (!prevStep || prevStep.t !== 'dass') return;

    const nextSteps = currentSession.steps.map((st, idx) => {
      if (idx === prevIdx || idx === currentSession.idx) {
        return { ...st, asked: false };
      }
      return st;
    });

    const nextAns = [...currentSession.ans];
    nextAns[prevStep.i] = null;

    const updatedBase: StudySession = {
      ...currentSession,
      steps: nextSteps,
      ans: nextAns,
      log: currentSession.log.slice(0, -3),
      idx: prevIdx,
    };

    const advanced = advanceSession(updatedBase, cfg.showResult);
    setSessions((prev) => prev.map((s) => (s.id === advanced.id ? advanced : s)));
    await saveSession(advanced);
  };

  const handleDeleteSession = async (id: string) => {
    await deleteSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (currentId === id) setCurrentId(null);
    if (selectedResultId === id) setSelectedResultId(null);
    setDeleteTarget(null);
  };

  const handleSaveConfig = (next: StudyConfig) => {
    setCfg(next);
    saveConfig(next);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex min-h-[68px] flex-wrap items-center gap-3.5 border-b border-[var(--line)] bg-[var(--panel)] px-5 py-3">
        <div className="flex items-center gap-2.5 leading-[1.1] font-extrabold">
          <i className="grid h-[42px] w-[42px] place-items-center rounded-[12px] bg-gradient-to-br from-[var(--teal)] to-[var(--teal2)]">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2.4"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2" />
            </svg>
          </i>
          <div>
            STUDI SUARA
            <small className="block text-[12px] tracking-[0.08em] text-[var(--teal)]">
              DATA COLLECTION
            </small>
          </div>
        </div>

        <span className="flex-1" />

        <button
          type="button"
          onClick={() => setHelpOpen(true)}
          className="min-h-[44px] rounded-full border-0 bg-[var(--red)] px-5 py-2.5 font-extrabold tracking-[0.06em] text-white whitespace-nowrap shrink-0"
        >
          BUTUH BANTUAN
        </button>

        <div className="hidden min-[761px]:flex items-center gap-2.5 rounded-[16px] border border-[var(--line)] py-1.5 pr-2 pl-3.5 text-right text-[12px] leading-[1.2] text-[var(--mute)]">
          <div>
            RESPONDEN AKTIF
            <b className="block text-[15px] text-[var(--ink)]">
              {currentSession ? currentSession.meta.code : '–'}
            </b>
          </div>
          <span className="grid h-[38px] w-[38px] place-items-center rounded-[12px] bg-[var(--teal)] text-[15px] font-extrabold text-white">
            {currentSession ? currentSession.meta.code.slice(0, 1).toUpperCase() : '?'}
          </span>
        </div>
      </header>

      {/* Main app grid */}
      <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[auto_1fr] min-[761px]:grid-cols-[240px_minmax(0,1fr)] min-[761px]:grid-rows-1">
        {/* Sidebar navigation */}
        <nav
          aria-label="Navigasi utama"
          className="flex flex-row gap-1 overflow-x-auto border-b border-[var(--line)] bg-[var(--panel)] p-2 min-[761px]:flex-col min-[761px]:border-r min-[761px]:border-b-0 min-[761px]:px-3.5 min-[761px]:py-5"
        >
          {(
            [
              {
                id: 'home' as const,
                label: 'Beranda',
                icon: (
                  <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
                ),
              },
              {
                id: 'sesi' as const,
                label: 'Sesi rekam',
                icon: (
                  <>
                    <rect x="9" y="3" width="6" height="11" rx="3" />
                    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
                  </>
                ),
              },
              {
                id: 'data' as const,
                label: 'Data & ekspor',
                icon: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
              },
              {
                id: 'set' as const,
                label: 'Pengaturan',
                icon: (
                  <>
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
                  </>
                ),
              },
            ] as const
          ).map((item) => {
            const active = view === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={active ? 'true' : undefined}
                onClick={() => handleNavigate(item.id)}
                className={`flex min-h-[50px] shrink-0 items-center gap-3 rounded-[14px] border-0 px-3.5 py-3 text-left whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-[var(--soft)] font-bold text-[var(--teal)]'
                    : 'bg-transparent font-medium text-[var(--ink)] hover:bg-[#f6f9f9]'
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`h-5 w-5 shrink-0 ${
                    active ? 'text-[var(--teal)]' : 'text-[var(--mute)]'
                  }`}
                  aria-hidden="true"
                >
                  {item.icon}
                </svg>
                {item.label}
              </button>
            );
          })}

          <div className="mt-auto hidden rounded-[14px] bg-[var(--soft)] p-3.5 text-[12px] font-extrabold tracking-[0.08em] text-[var(--teal)] min-[761px]:block">
            STATUS SISTEM
            <b className="mt-1 flex items-center text-[14px] tracking-normal text-[var(--ink)]">
              <span
                className="mr-1.5 inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: micStatus.ok ? 'var(--ok)' : 'var(--warn)' }}
              />
              <span>{micStatus.text}</span>
            </b>
          </div>
        </nav>

        {/* Active View */}
        <main className="min-h-0 overflow-auto">
          {view === 'home' && (
            <HomeView cfg={cfg} sessions={sessions} onNavigate={handleNavigate} />
          )}

          {view === 'sesi' && (
            <SessionView
              cfg={cfg}
              sessions={sessions}
              currentSession={currentSession}
              recording={recording}
              onRecordingChange={setRecording}
              onMicStatusChange={updateMicStatus}
              onSelectSession={(id) => setCurrentId(id)}
              onOpenNewModal={() => setNewOpen(true)}
              onSaveRecording={handleSaveRecording}
              onAnswerDass={handleAnswerDass}
              onUndoDass={handleUndoDass}
              onViewResult={(id) => {
                setSelectedResultId(id);
                setView('data');
              }}
              onExportSessionZip={(s) => void exportSessionZip(s, cfg)}
            />
          )}

          {view === 'data' && (
            <DataView
              sessions={sessions}
              selectedResultId={selectedResultId}
              onSelectResult={(id) => setSelectedResultId(id)}
              onOpenSession={(id) => {
                setCurrentId(id);
                setView('sesi');
              }}
              onExportSessionZip={(s) => void exportSessionZip(s, cfg)}
              onExportAllZip={() => void exportAllZip(sessions, cfg)}
              onExportCsv={() => exportDassCsv(sessions)}
              onRequestDelete={(s) => setDeleteTarget(s)}
              onGoToSessions={() => setView('sesi')}
            />
          )}

          {view === 'set' && (
            <SettingsView
              cfg={cfg}
              onSaveConfig={handleSaveConfig}
              onMicStatusChange={updateMicStatus}
            />
          )}
        </main>
      </div>

      {/* Global Dialogs */}
      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
      <NewSessionDialog
        open={newOpen}
        existingSessions={sessions}
        onClose={() => setNewOpen(false)}
        onStart={handleStartNewSession}
      />
      <ConfirmDialog
        sessionToDelete={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirmDelete={handleDeleteSession}
      />
    </div>
  );
}
