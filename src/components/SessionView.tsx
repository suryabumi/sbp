import { useEffect, useRef, useState } from 'react';
import {
  GUIDE,
  PASSAGE,
  SCALE,
  TASKS,
  fmtDate,
  fmtDuration,
  sessionProgressText,
} from '../constants/study';
import {
  type ActiveCapture,
  drawWaveformFrame,
  evaluateQuality,
  getBlobUrl,
  startAudioCapture,
  stopAudioCapture,
} from '../lib/audio';
import type { RecordingData, StudyConfig, StudySession } from '../types/study';
import { KakNaraAvatar, RichPromptText } from './KakNaraAvatar';

interface SessionViewProps {
  cfg: StudyConfig;
  sessions: StudySession[];
  currentSession: StudySession | null;
  recording: boolean;
  onRecordingChange: (active: boolean) => void;
  onMicStatusChange: (ok: boolean, text: string) => void;
  onSelectSession: (id: string) => void;
  onOpenNewModal: () => void;
  onSaveRecording: (taskId: string, rec: RecordingData) => Promise<void>;
  onAnswerDass: (val: number) => Promise<void>;
  onUndoDass: () => Promise<void>;
  onViewResult: (id: string) => void;
  onExportSessionZip: (s: StudySession) => void;
}

export function SessionView({
  cfg,
  sessions,
  currentSession,
  recording,
  onRecordingChange,
  onMicStatusChange,
  onSelectSession,
  onOpenNewModal,
  onSaveRecording,
  onAnswerDass,
  onUndoDass,
  onViewResult,
  onExportSessionZip,
}: SessionViewProps) {
  const [showMobileList, setShowMobileList] = useState(false);
  const [pending, setPending] = useState<RecordingData | null>(null);
  const [recError, setRecError] = useState('');
  const [elapsedSec, setElapsedSec] = useState(0);

  const captureRef = useRef<ActiveCapture | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const msgsRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number>(0);
  const tickRef = useRef<number | null>(null);

  const sortedSessions = [...sessions].sort((a, b) => b.createdAt - a.createdAt);

  // Clear pending preview when switching sessions
  useEffect(() => {
    setPending(null);
    setRecError('');
    setShowMobileList(false);
  }, [currentSession?.id]);

  // Scroll chat log to bottom when messages change
  useEffect(() => {
    if (msgsRef.current) {
      msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
    }
  }, [currentSession?.id, currentSession?.log.length]);

  // Cleanup active capture on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (tickRef.current !== null) clearInterval(tickRef.current);
      if (captureRef.current) {
        captureRef.current.proc.disconnect();
        captureRef.current.srcNode.disconnect();
        captureRef.current.stream.getTracks().forEach((t) => t.stop());
        captureRef.current.ctx.close().catch(() => {});
        captureRef.current = null;
      }
    };
  }, []);

  const handleStartRec = async () => {
    setRecError('');
    try {
      const capture = await startAudioCapture();
      captureRef.current = capture;
      setElapsedSec(0);
      onRecordingChange(true);
      onMicStatusChange(true, 'Mikrofon aktif · merekam');

      const drawLoop = () => {
        if (canvasRef.current && captureRef.current) {
          drawWaveformFrame(canvasRef.current, captureRef.current.analyser);
        }
        rafRef.current = requestAnimationFrame(drawLoop);
      };
      rafRef.current = requestAnimationFrame(drawLoop);

      tickRef.current = window.setInterval(() => {
        if (captureRef.current) {
          setElapsedSec((performance.now() - captureRef.current.startedAt) / 1000);
        }
      }, 250);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Mikrofon tidak dapat diakses.';
      setRecError(msg);
      onMicStatusChange(false, 'Mikrofon tidak tersedia');
    }
  };

  const handleStopRec = async () => {
    cancelAnimationFrame(rafRef.current);
    if (tickRef.current !== null) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    const capture = captureRef.current;
    captureRef.current = null;
    onRecordingChange(false);

    if (!capture) return;
    try {
      const rec = await stopAudioCapture(capture, cfg.sr);
      setPending(rec);
      onMicStatusChange(true, 'Mikrofon siap');
    } catch (err) {
      setRecError(err instanceof Error ? err.message : 'Gagal memproses rekaman.');
      onMicStatusChange(false, 'Mikrofon bermasalah');
    }
  };

  const currentStep = currentSession ? currentSession.steps[currentSession.idx] : undefined;

  return (
    <div className="grid h-full grid-cols-1 min-[981px]:grid-cols-[330px_minmax(0,1fr)]">
      {/* Left session history */}
      <aside
        className={`${
          showMobileList ? 'block' : 'hidden'
        } min-[981px]:block overflow-auto border-r border-[var(--line)] bg-[var(--panel)] px-5 py-6`}
      >
        <h2 className="mt-0 mb-[18px] text-[22px] font-bold">Riwayat sesi</h2>
        <button
          type="button"
          disabled={recording}
          onClick={() => {
            if (!recording) onOpenNewModal();
          }}
          className="min-h-[56px] w-full rounded-[16px] border-0 bg-[var(--teal)] font-extrabold tracking-[0.06em] text-white shadow-[0_8px_18px_rgba(0,121,111,0.2)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          + SESI BARU
        </button>

        {sortedSessions.length > 0 ? (
          sortedSessions.map((x) => {
            const active = x.id === currentSession?.id;
            return (
              <button
                key={x.id}
                type="button"
                aria-current={active ? 'true' : 'false'}
                onClick={() => {
                  if (recording) return;
                  onSelectSession(x.id);
                  setShowMobileList(false);
                }}
                className={`mt-3 block w-full rounded-[16px] border px-[18px] py-3.5 text-left text-[var(--ink)] transition-colors ${
                  active
                    ? 'border-[#9fdccf] bg-[var(--soft)]'
                    : 'border-[var(--line)] bg-white hover:bg-[#f9fcfc]'
                }`}
              >
                <strong className="block font-bold">
                  {x.meta.code}
                  <span
                    className={`ml-1.5 inline-block rounded-full px-2 py-0.5 align-[2px] text-[11px] font-extrabold ${
                      x.done
                        ? 'bg-[#dcf5e6] text-[var(--ok)]'
                        : 'bg-[#fff3d6] text-[var(--warn)]'
                    }`}
                  >
                    {x.done ? 'Selesai' : 'Berjalan'}
                  </span>
                </strong>
                <small className="font-bold tracking-[0.08em] text-[var(--mute)]">
                  {fmtDate(x.createdAt).toUpperCase()}
                </small>
              </button>
            );
          })
        ) : (
          <p className="mt-4 text-[14px] text-[var(--mute)]">Belum ada sesi.</p>
        )}
      </aside>

      {/* Main conversational room */}
      <section
        className={`${
          showMobileList ? 'hidden' : 'flex'
        } min-[981px]:flex h-full min-h-0 flex-col`}
      >
        {/* Top bar */}
        <div className="flex flex-wrap items-center gap-3.5 border-b border-[var(--line)] bg-[var(--panel)] px-6 py-3.5">
          <button
            type="button"
            aria-label="Daftar sesi"
            onClick={() => setShowMobileList(true)}
            className="min-[981px]:hidden min-h-[44px] rounded-[14px] border-[1.5px] border-[var(--line)] bg-white px-3 py-[9px] text-[13px] font-extrabold tracking-[0.08em] text-[var(--teal)]"
          >
            ←
          </button>
          <KakNaraAvatar size={46} />
          <div>
            <strong className="block text-[19px] leading-[1.2] font-bold">{GUIDE}</strong>
            <small className="inline-flex items-center text-[12px] font-extrabold tracking-[0.12em] text-[var(--mute)]">
              <span
                className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[var(--ok)]"
                aria-hidden="true"
              />
              PEMANDU SESI
            </small>
          </div>
          <span className="flex-1" />
          {currentSession && (
            <span className="text-[14px] text-[var(--mute)] tabular-nums">
              {currentSession.meta.code} · {sessionProgressText(currentSession)}
            </span>
          )}
          <button
            type="button"
            disabled={recording}
            onClick={() => {
              if (!recording) onOpenNewModal();
            }}
            className="min-h-[44px] rounded-[14px] border-[1.5px] border-[var(--line)] bg-white px-4 py-[9px] text-[13px] font-extrabold tracking-[0.08em] text-[var(--teal)] whitespace-nowrap shrink-0 hover:bg-[var(--soft)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            SESI BARU
          </button>
        </div>

        {/* Messages stream */}
        <div
          ref={msgsRef}
          className="flex flex-1 flex-col gap-3 overflow-auto px-[clamp(14px,3vw,40px)] py-6"
        >
          {currentSession ? (
            currentSession.log.map((m, idx) => {
              if (m.w === 'me') {
                if ('rec' in m) {
                  const task = TASKS.find((t) => t.id === m.rec);
                  const rec = currentSession.recs[m.rec];
                  return (
                    <div
                      key={idx}
                      className="flex max-w-[min(680px,92%)] flex-row-reverse gap-2.5 self-end"
                    >
                      <div className="rounded-[18px_18px_6px_18px] bg-[var(--teal)] px-4 py-3 text-white">
                        <div className="font-bold">{task?.name ?? m.rec}</div>
                        {rec && (
                          <>
                            <audio
                              controls
                              src={getBlobUrl(rec.blob)}
                              className="mt-1.5 block h-[38px] w-[260px] max-w-full"
                            />
                            <div className="mt-1 text-[12px] opacity-90 tabular-nums">
                              {rec.dur.toFixed(1)} dtk · {rec.sr / 1000} kHz · puncak {rec.peak} ·{' '}
                              {rec.rmsDb} dBFS
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                }
                return (
                  <div
                    key={idx}
                    className="flex max-w-[min(680px,92%)] flex-row-reverse gap-2.5 self-end"
                  >
                    <div className="rounded-[18px_18px_6px_18px] bg-[var(--teal)] px-4 py-3 text-white">
                      <p className="m-0">{m.t}</p>
                    </div>
                  </div>
                );
              }

              return (
                <div key={idx} className="flex max-w-[min(680px,92%)] gap-2.5">
                  <KakNaraAvatar size={34} />
                  <div
                    className={`rounded-[18px_18px_18px_6px] border px-4 py-3 ${
                      m.alert
                        ? 'border-[#f3c7c7] bg-[#fff7f7]'
                        : 'border-[var(--line)] bg-white'
                    }`}
                  >
                    {m.task && (
                      <div className="text-[12px] font-extrabold tracking-[0.1em] text-[var(--teal)]">
                        {m.task}
                      </div>
                    )}
                    <p className="m-0">
                      <RichPromptText text={m.h} />
                    </p>
                    {m.passage && (
                      <div className="mt-2 rounded-[10px] border-l-4 border-[var(--teal)] bg-[var(--soft)] px-3.5 py-3 text-[18px] leading-[1.7] text-[var(--ink)]">
                        {PASSAGE}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="m-auto flex max-w-[440px] flex-col items-center text-center text-[var(--mute)]">
              <KakNaraAvatar size={120} />
              <h3 className="mt-3.5 mb-1.5 text-[26px] font-bold text-[var(--ink)]">
                Halo, aku {GUIDE}!
              </h3>
              <p className="m-0">
                Aku memandu responden melalui perekaman suara dan kuesioner DASS-21. Tekan{' '}
                <b>+ Sesi baru</b> untuk memulai.
              </p>
            </div>
          )}
        </div>

        {/* Bottom action bar */}
        <div className="border-t border-[var(--line)] bg-[var(--panel)] px-[clamp(14px,3vw,40px)] py-4">
          {!currentSession ? (
            <div className="flex items-center gap-3.5">
              <div className="flex min-h-[64px] flex-1 items-center gap-3.5 rounded-full border-2 border-[#b5e5dc] bg-white px-[22px] text-[var(--mute)]">
                Mulai sesi baru untuk merekam…
              </div>
              <button
                type="button"
                aria-label="Sesi baru"
                onClick={onOpenNewModal}
                className="grid h-[68px] w-[68px] shrink-0 place-items-center rounded-[22px] border-0 bg-[var(--teal)] text-white shadow-[0_8px_18px_rgba(0,121,111,0.27)]"
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2.4"
                  aria-hidden="true"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            </div>
          ) : currentSession.done ? (
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="flex-1 font-bold">
                Sesi lengkap: {Object.keys(currentSession.recs).length} rekaman dan DASS-21
                tersimpan.
              </span>
              <button
                type="button"
                onClick={() => onViewResult(currentSession.id)}
                className="min-h-[38px] rounded-[11px] border-[1.5px] border-[var(--line)] bg-white px-3.5 py-1.5 text-[14px] font-extrabold text-[var(--teal)] whitespace-nowrap shrink-0 hover:bg-[var(--soft)]"
              >
                {cfg.showResult ? 'Lihat hasil' : 'Hasil (peneliti)'}
              </button>
              <button
                type="button"
                onClick={() => onExportSessionZip(currentSession)}
                className="min-h-[38px] rounded-[11px] border-0 bg-[var(--teal)] px-3.5 py-1.5 text-[14px] font-extrabold text-white whitespace-nowrap shrink-0"
              >
                Unduh ZIP sesi
              </button>
            </div>
          ) : currentStep?.t === 'dass' ? (
            <div>
              <div className="mb-2.5 flex flex-wrap items-center gap-2.5 text-[13px] font-bold text-[var(--mute)]">
                <span className="tabular-nums">DASS-21 {currentStep.i + 1}/21</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-[9px] bg-[var(--line)]">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${(currentStep.i / 21) * 100}%`,
                      background: 'linear-gradient(90deg, var(--teal), var(--teal2))',
                    }}
                  />
                </div>
                {currentStep.i > 0 &&
                  currentSession.steps[currentSession.idx - 1]?.t === 'dass' && (
                    <button
                      type="button"
                      onClick={onUndoDass}
                      className="min-h-[44px] border-0 bg-transparent py-2 font-extrabold text-[var(--teal)] whitespace-nowrap shrink-0 hover:underline"
                    >
                      ← Ubah jawaban sebelumnya
                    </button>
                  )}
              </div>
              <div className="flex flex-wrap gap-2.5">
                {SCALE.map((label, val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => onAnswerDass(val)}
                    className="min-h-[46px] rounded-full border-[1.5px] border-[#9fdccf] bg-white px-[18px] py-2.5 font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--soft)]"
                  >
                    <strong className="mr-1.5 font-bold text-[var(--teal)]">{val}</strong>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : currentStep?.t === 'rec' ? (
            (() => {
              const task = TASKS[currentStep.i];
              if (pending) {
                const warnings = evaluateQuality(pending, task.min);
                return (
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <audio
                        controls
                        src={getBlobUrl(pending.blob)}
                        className="h-10 min-w-[220px] flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => setPending(null)}
                        className="min-h-[48px] rounded-[14px] border-[1.5px] border-[var(--line)] bg-white px-[22px] py-3 font-extrabold text-[var(--teal)] whitespace-nowrap shrink-0 hover:bg-[var(--soft)]"
                      >
                        Rekam ulang
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const toSave = pending;
                          setPending(null);
                          await onSaveRecording(task.id, toSave);
                        }}
                        className="min-h-[48px] rounded-[14px] border-0 bg-[var(--teal)] px-[22px] py-3 font-extrabold text-white whitespace-nowrap shrink-0"
                      >
                        Simpan &amp; lanjut
                      </button>
                    </div>
                    {warnings.map((w, i) => (
                      <div key={i} className="mt-2 text-[14px] font-semibold text-[var(--warn)]">
                        ⚠ {w}
                      </div>
                    ))}
                  </div>
                );
              }

              return (
                <div>
                  <div className="flex items-center gap-3.5">
                    <div className="flex min-h-[64px] flex-1 items-center gap-3.5 rounded-full border-2 border-[#b5e5dc] bg-white px-[22px] text-[var(--mute)]">
                      {recording ? (
                        <>
                          <span className="font-extrabold whitespace-nowrap text-[var(--ink)] tabular-nums">
                            {fmtDuration(elapsedSec)}
                          </span>
                          <canvas ref={canvasRef} className="h-10 w-full flex-1" />
                          <span className="text-[14px] whitespace-nowrap text-[var(--mute)]">
                            min {task.min} dtk
                          </span>
                        </>
                      ) : (
                        <span>
                          Tekan mikrofon untuk mulai merekam:{' '}
                          <strong className="font-bold text-[var(--ink)]">{task.name}</strong>
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={recording ? handleStopRec : handleStartRec}
                      aria-label={recording ? 'Berhenti merekam' : 'Mulai merekam'}
                      className={`grid h-[68px] w-[68px] shrink-0 place-items-center rounded-[22px] border-0 text-white ${
                        recording
                          ? 'mic-pulse bg-[var(--red)]'
                          : 'bg-[var(--teal)] shadow-[0_8px_18px_rgba(0,121,111,0.27)]'
                      }`}
                    >
                      {recording ? (
                        <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
                          <rect x="6" y="6" width="12" height="12" rx="2" fill="#fff" />
                        </svg>
                      ) : (
                        <svg
                          width="30"
                          height="30"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#fff"
                          strokeWidth="2.2"
                          aria-hidden="true"
                        >
                          <rect x="9" y="3" width="6" height="11" rx="3" />
                          <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {recError && (
                    <div className="mt-2 text-[14px] font-semibold text-[var(--red)]">
                      {recError}
                    </div>
                  )}
                </div>
              );
            })()
          ) : null}
        </div>
      </section>
    </div>
  );
}
