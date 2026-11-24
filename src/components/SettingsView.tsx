import { useState } from 'react';
import {
  evaluateQuality,
  getBlobUrl,
  startAudioCapture,
  stopAudioCapture,
} from '../lib/audio';
import type { RecordingData, SessionOrder, StudyConfig } from '../types/study';

interface SettingsViewProps {
  cfg: StudyConfig;
  onSaveConfig: (next: StudyConfig) => void;
  onMicStatusChange: (ok: boolean, text: string) => void;
}

export function SettingsView({
  cfg,
  onSaveConfig,
  onMicStatusChange,
}: SettingsViewProps) {
  const [study, setStudy] = useState(cfg.study);
  const [sr, setSr] = useState(cfg.sr);
  const [order, setOrder] = useState<SessionOrder>(cfg.order);
  const [showResult, setShowResult] = useState(cfg.showResult);
  const [savedMsg, setSavedMsg] = useState('');

  const [testing, setTesting] = useState(false);
  const [testError, setTestError] = useState('');
  const [testResult, setTestResult] = useState<RecordingData | null>(null);

  const handleSave = () => {
    const next: StudyConfig = {
      study: study.trim() || cfg.study,
      sr,
      order,
      showResult,
    };
    onSaveConfig(next);
    setSavedMsg('Pengaturan tersimpan.');
  };

  const handleMicTest = async () => {
    setTesting(true);
    setTestError('');
    setTestResult(null);

    try {
      const capture = await startAudioCapture();
      onMicStatusChange(true, 'Mikrofon aktif · merekam');

      setTimeout(async () => {
        try {
          const rec = await stopAudioCapture(capture, sr);
          setTestResult(rec);
          onMicStatusChange(true, 'Mikrofon siap');
        } catch (err) {
          setTestError(err instanceof Error ? err.message : 'Gagal menghentikan tes mikrofon.');
        } finally {
          setTesting(false);
        }
      }, 3000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Mikrofon tidak dapat diakses.';
      setTestError(message);
      onMicStatusChange(false, 'Mikrofon tidak tersedia');
      setTesting(false);
    }
  };

  const warnings = testResult ? evaluateQuality(testResult, 2) : [];

  return (
    <div className="mx-auto max-w-[1080px] p-[clamp(18px,3vw,36px)]">
      <div className="rounded-[22px] border border-[var(--line)] bg-[var(--panel)] p-[clamp(18px,3vw,28px)]">
        <h2 className="mt-0 text-2xl font-bold">Pengaturan studi</h2>

        <label htmlFor="sStudy" className="mt-3.5 mb-1.5 block text-[14px] font-bold">
          Judul studi
        </label>
        <input
          id="sStudy"
          value={study}
          onChange={(e) => {
            setStudy(e.target.value);
            setSavedMsg('');
          }}
          className="min-h-[48px] w-full rounded-[12px] border-[1.5px] border-[var(--line)] bg-white px-3.5 py-2.5 text-[16px] text-[var(--ink)]"
        />

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,210px),1fr))] gap-x-4">
          <div>
            <label htmlFor="sSr" className="mt-3.5 mb-1.5 block text-[14px] font-bold">
              Frekuensi sampel WAV
            </label>
            <select
              id="sSr"
              value={sr}
              onChange={(e) => {
                setSr(Number(e.target.value));
                setSavedMsg('');
              }}
              className="min-h-[48px] w-full rounded-[12px] border-[1.5px] border-[var(--line)] bg-white px-3.5 py-2.5 text-[16px] text-[var(--ink)]"
            >
              {[16000, 22050, 44100, 48000].map((val) => (
                <option key={val} value={val}>
                  {val / 1000} kHz
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="sOrder" className="mt-3.5 mb-1.5 block text-[14px] font-bold">
              Urutan sesi
            </label>
            <select
              id="sOrder"
              value={order}
              onChange={(e) => {
                setOrder(e.target.value as SessionOrder);
                setSavedMsg('');
              }}
              className="min-h-[48px] w-full rounded-[12px] border-[1.5px] border-[var(--line)] bg-white px-3.5 py-2.5 text-[16px] text-[var(--ink)]"
            >
              <option value="speech">Rekam suara → DASS-21</option>
              <option value="dass">DASS-21 → rekam suara</option>
            </select>
          </div>
        </div>

        <label className="mt-4 flex items-start gap-3 cursor-pointer">
          <input
            id="sShow"
            type="checkbox"
            checked={showResult}
            onChange={(e) => {
              setShowResult(e.target.checked);
              setSavedMsg('');
            }}
            className="mt-0.5 h-[22px] w-[22px] shrink-0"
          />
          <span>Tampilkan hasil skor DASS-21 kepada responden di akhir sesi</span>
        </label>

        <p className="mt-[18px] mb-0 text-[14px] text-[var(--mute)]">
          Perekaman memakai satu kanal tanpa <i>echo cancellation</i>, <i>noise suppression</i>,
          maupun <i>auto gain</i> agar sinyal akustik tidak diubah oleh browser. Pengaturan baru
          berlaku untuk sesi berikutnya.
        </p>

        <div className="mt-5 flex flex-wrap justify-end gap-2.5">
          <button
            type="button"
            onClick={handleSave}
            className="min-h-[48px] rounded-[14px] border-0 bg-[var(--teal)] px-[22px] py-3 font-extrabold text-white whitespace-nowrap shrink-0"
          >
            Simpan pengaturan
          </button>
        </div>
        {savedMsg && (
          <p role="status" className="mt-2 mb-0 text-[14px] font-semibold text-[var(--ok)]">
            {savedMsg}
          </p>
        )}
      </div>

      <div className="mt-5 rounded-[22px] border border-[var(--line)] bg-[var(--panel)] p-[clamp(18px,3vw,28px)]">
        <h3 className="mt-0 mb-2 text-lg font-bold">Cek mikrofon</h3>
        <p className="mt-0 mb-3 text-[14px] text-[var(--mute)]">
          Rekam 3 detik untuk memastikan mikrofon dan level suara sudah baik sebelum sesi dimulai.
        </p>
        <button
          type="button"
          disabled={testing}
          onClick={handleMicTest}
          className="min-h-[48px] rounded-[14px] border-[1.5px] border-[var(--line)] bg-white px-[22px] py-3 font-extrabold text-[var(--teal)] whitespace-nowrap shrink-0 transition-opacity hover:bg-[var(--soft)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {testing ? 'Merekam 3 detik…' : 'Tes mikrofon 3 detik'}
        </button>

        {testing && (
          <p className="mt-3 mb-0 text-[14px] text-[var(--mute)]">
            Merekam… bicaralah seperti biasa.
          </p>
        )}

        {testError && (
          <p className="mt-2 mb-0 text-[14px] font-semibold text-[var(--red)]">{testError}</p>
        )}

        {testResult && (
          <div className="mt-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <audio controls src={getBlobUrl(testResult.blob)} className="h-10 min-w-[220px] flex-1" />
            </div>
            <p className="mt-2 mb-0 text-[14px] text-[var(--mute)] tabular-nums">
              Puncak {testResult.peak} · level {testResult.rmsDb} dBFS · sampel asli{' '}
              {testResult.srcRate} Hz
            </p>
            {warnings.length > 0 ? (
              warnings.map((w, i) => (
                <div key={i} className="mt-2 text-[14px] font-semibold text-[var(--warn)]">
                  ⚠ {w}
                </div>
              ))
            ) : (
              <p className="mt-2 mb-0 font-bold text-[var(--ok)]">
                Mikrofon baik dan siap digunakan.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
