import { GUIDE, TASKS } from '../constants/study';
import type { AppView, StudyConfig, StudySession } from '../types/study';

interface HomeViewProps {
  cfg: StudyConfig;
  sessions: StudySession[];
  onNavigate: (view: AppView) => void;
}

export function HomeView({ cfg, sessions, onNavigate }: HomeViewProps) {
  const doneCount = sessions.filter((s) => s.done).length;
  const recCount = sessions.reduce((acc, s) => acc + Object.keys(s.recs || {}).length, 0);

  return (
    <div className="mx-auto max-w-[1080px] p-[clamp(18px,3vw,36px)]">
      <section
        className="rounded-[24px] p-[clamp(22px,3.5vw,40px)] text-white"
        style={{ background: 'linear-gradient(120deg, var(--teal), var(--teal2))' }}
      >
        <p className="mb-1.5 text-[13px] font-extrabold tracking-[0.18em] opacity-90">
          PUSAT PENGAMBILAN DATA
        </p>
        <h1 className="mb-2.5 text-[clamp(26px,4vw,38px)] leading-[1.1] font-extrabold text-balance">
          {cfg.study}
        </h1>
        <p className="m-0 max-w-[66ch] opacity-95">
          Setiap sesi berisi {TASKS.length} tugas rekaman suara dan kuesioner DASS-21, dipandu{' '}
          {GUIDE} dalam format percakapan. Semua data tersimpan di browser perangkat ini sampai
          Anda mengekspornya.
        </p>
      </section>

      <div className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(min(100%,290px),1fr))] gap-[18px]">
        <div className="flex flex-col gap-2 rounded-[22px] border border-[var(--line)] bg-[var(--soft)] p-6">
          <span className="grid h-[54px] w-[54px] place-items-center rounded-[16px] border border-[var(--line)] bg-white">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#00796f"
              strokeWidth="2"
              aria-hidden="true"
            >
              <rect x="9" y="3" width="6" height="11" rx="3" />
              <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
            </svg>
          </span>
          <h3 className="mt-1 mb-0 text-[21px] font-bold">Sesi rekam suara</h3>
          <p className="m-0 text-[var(--mute)]">
            Vokal panjang, membaca teks, menghitung, dan tiga tugas bercerita. WAV mono{' '}
            {cfg.sr / 1000} kHz, 16-bit.
          </p>
          <div className="mt-auto flex items-center justify-between border-t border-[var(--line)] pt-3.5 text-[13px] font-extrabold tracking-[0.06em] text-[var(--teal)]">
            <span className="tabular-nums">{recCount} REKAMAN</span>
            <button
              type="button"
              onClick={() => onNavigate('sesi')}
              className="min-h-[44px] border-0 bg-transparent py-2 font-extrabold text-[var(--teal)] whitespace-nowrap shrink-0 hover:underline"
            >
              Mulai →
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-[22px] border border-[var(--line)] bg-[var(--soft)] p-6">
          <span className="grid h-[54px] w-[54px] place-items-center rounded-[16px] border border-[var(--line)] bg-white">
            <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="4" y="12" width="4" height="8" fill="#0f8a4a" />
              <rect x="10" y="6" width="4" height="14" fill="#e23b3b" />
              <rect x="16" y="9" width="4" height="11" fill="#0390b5" />
            </svg>
          </span>
          <h3 className="mt-1 mb-0 text-[21px] font-bold">Asesmen DASS-21</h3>
          <p className="m-0 text-[var(--mute)]">
            Mengukur tingkat depresi, kecemasan, dan stres selama satu minggu terakhir, ditanyakan
            langsung di dalam percakapan.
          </p>
          <div className="mt-auto flex items-center justify-between border-t border-[var(--line)] pt-3.5 text-[13px] font-extrabold tracking-[0.06em] text-[var(--teal)]">
            <span className="tabular-nums">{doneCount} SESI LENGKAP</span>
            <button
              type="button"
              onClick={() => onNavigate('data')}
              className="min-h-[44px] border-0 bg-transparent py-2 font-extrabold text-[var(--teal)] whitespace-nowrap shrink-0 hover:underline"
            >
              Kelola →
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-[22px] border border-[var(--line)] bg-[var(--soft)] p-6">
          <span className="grid h-[54px] w-[54px] place-items-center rounded-[16px] border border-[var(--line)] bg-white">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#00796f"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M12 3v12M7 10l5 5 5-5M4 21h16" />
            </svg>
          </span>
          <h3 className="mt-1 mb-0 text-[21px] font-bold">Ekspor data</h3>
          <p className="m-0 text-[var(--mute)]">
            Unduh ZIP berisi file WAV, metadata JSON, dan CSV skor DASS-21 per sesi atau seluruh
            sesi sekaligus.
          </p>
          <div className="mt-auto flex items-center justify-between border-t border-[var(--line)] pt-3.5 text-[13px] font-extrabold tracking-[0.06em] text-[var(--teal)]">
            <span className="tabular-nums">{sessions.length} SESI TERSIMPAN</span>
            <button
              type="button"
              onClick={() => onNavigate('data')}
              className="min-h-[44px] border-0 bg-transparent py-2 font-extrabold text-[var(--teal)] whitespace-nowrap shrink-0 hover:underline"
            >
              Ekspor →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
