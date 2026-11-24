import { useEffect, useRef } from 'react';
import {
  LCOL,
  LEV,
  NAMES,
  TASKS,
  fmtDate,
  fmtDuration,
} from '../constants/study';
import type { DassDimension, StudySession } from '../types/study';

interface DataViewProps {
  sessions: StudySession[];
  selectedResultId: string | null;
  onSelectResult: (id: string) => void;
  onOpenSession: (id: string) => void;
  onExportSessionZip: (s: StudySession) => void;
  onExportAllZip: () => void;
  onExportCsv: () => void;
  onRequestDelete: (s: StudySession) => void;
  onGoToSessions: () => void;
}

export function DataView({
  sessions,
  selectedResultId,
  onSelectResult,
  onOpenSession,
  onExportSessionZip,
  onExportAllZip,
  onExportCsv,
  onRequestDelete,
  onGoToSessions,
}: DataViewProps) {
  const sorted = [...sessions].sort((a, b) => a.createdAt - b.createdAt);
  const resultSession = sorted.find((s) => s.id === selectedResultId && s.dass);
  const resRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (resultSession && resRef.current) {
      resRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [resultSession]);

  return (
    <div className="mx-auto max-w-[1080px] p-[clamp(18px,3vw,36px)]">
      <div className="mt-5 rounded-[22px] border border-[var(--line)] bg-[var(--panel)] p-[clamp(18px,3vw,28px)] first:mt-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="m-0 text-2xl font-bold">Data &amp; ekspor</h2>
            <p className="mt-1 mb-0 text-[14px] text-[var(--mute)]">
              {sorted.length} sesi tersimpan di browser ini. Ekspor secara berkala dan simpan
              cadangannya.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onExportCsv}
              className="min-h-[48px] rounded-[14px] border-[1.5px] border-[var(--line)] bg-white px-[22px] py-3 font-extrabold text-[var(--teal)] whitespace-nowrap shrink-0 transition-colors hover:bg-[var(--soft)]"
            >
              Unduh CSV
            </button>
            <button
              type="button"
              onClick={onExportAllZip}
              disabled={sorted.length === 0}
              className="min-h-[48px] rounded-[14px] border-0 bg-[var(--teal)] px-[22px] py-3 font-extrabold text-white whitespace-nowrap shrink-0 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            >
              Unduh semua (ZIP)
            </button>
          </div>
        </div>

        {sorted.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-[14px]">
              <thead>
                <tr>
                  <th className="border-b border-[var(--line)] px-2 py-2.5 text-left font-bold whitespace-nowrap text-[var(--mute)]">
                    Kode
                  </th>
                  <th className="border-b border-[var(--line)] px-2 py-2.5 text-left font-bold whitespace-nowrap text-[var(--mute)]">
                    Tanggal
                  </th>
                  <th className="border-b border-[var(--line)] px-2 py-2.5 text-right font-bold whitespace-nowrap text-[var(--mute)]">
                    Usia
                  </th>
                  <th className="border-b border-[var(--line)] px-2 py-2.5 text-left font-bold whitespace-nowrap text-[var(--mute)]">
                    JK
                  </th>
                  <th className="border-b border-[var(--line)] px-2 py-2.5 text-left font-bold whitespace-nowrap text-[var(--mute)]">
                    Status
                  </th>
                  <th className="border-b border-[var(--line)] px-2 py-2.5 text-right font-bold whitespace-nowrap text-[var(--mute)]">
                    Rekaman
                  </th>
                  <th className="border-b border-[var(--line)] px-2 py-2.5 text-right font-bold whitespace-nowrap text-[var(--mute)]">
                    Durasi total
                  </th>
                  <th className="border-b border-[var(--line)] px-2 py-2.5 text-right font-bold whitespace-nowrap text-[var(--mute)]">
                    D
                  </th>
                  <th className="border-b border-[var(--line)] px-2 py-2.5 text-right font-bold whitespace-nowrap text-[var(--mute)]">
                    A
                  </th>
                  <th className="border-b border-[var(--line)] px-2 py-2.5 text-right font-bold whitespace-nowrap text-[var(--mute)]">
                    S
                  </th>
                  <th className="border-b border-[var(--line)] px-2 py-2.5 text-left font-bold whitespace-nowrap text-[var(--mute)]" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((s) => {
                  const d = s.dass;
                  const totalDur = Object.values(s.recs).reduce((acc, r) => acc + r.dur, 0);
                  return (
                    <tr key={s.id} className="hover:bg-[#f9fcfc]">
                      <td className="border-b border-[var(--line)] px-2 py-2.5 whitespace-nowrap">
                        <strong className="font-bold">{s.meta.code}</strong>
                      </td>
                      <td className="border-b border-[var(--line)] px-2 py-2.5 whitespace-nowrap">
                        {fmtDate(s.createdAt)}
                      </td>
                      <td className="border-b border-[var(--line)] px-2 py-2.5 text-right whitespace-nowrap tabular-nums">
                        {s.meta.age}
                      </td>
                      <td className="border-b border-[var(--line)] px-2 py-2.5 whitespace-nowrap">
                        {s.meta.sex}
                      </td>
                      <td className="border-b border-[var(--line)] px-2 py-2.5 whitespace-nowrap">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
                            s.done
                              ? 'bg-[#dcf5e6] text-[var(--ok)]'
                              : 'bg-[#fff3d6] text-[var(--warn)]'
                          }`}
                        >
                          {s.done ? 'Selesai' : 'Berjalan'}
                        </span>
                      </td>
                      <td className="border-b border-[var(--line)] px-2 py-2.5 text-right whitespace-nowrap tabular-nums">
                        {Object.keys(s.recs).length}/{TASKS.length}
                      </td>
                      <td className="border-b border-[var(--line)] px-2 py-2.5 text-right whitespace-nowrap tabular-nums">
                        {fmtDuration(totalDur)}
                      </td>
                      {(['D', 'A', 'S'] as DassDimension[]).map((k) => (
                        <td
                          key={k}
                          className="border-b border-[var(--line)] px-2 py-2.5 text-right whitespace-nowrap tabular-nums"
                        >
                          {d ? (
                            <span style={{ color: LCOL[d.lv[k]], fontWeight: 800 }}>
                              {d.raw[k]}
                            </span>
                          ) : (
                            '–'
                          )}
                        </td>
                      ))}
                      <td className="border-b border-[var(--line)] px-2 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenSession(s.id)}
                            className="min-h-[38px] rounded-[11px] border-[1.5px] border-[var(--line)] bg-white px-3.5 py-1.5 text-[14px] font-extrabold text-[var(--teal)] whitespace-nowrap shrink-0 hover:bg-[var(--soft)]"
                          >
                            Buka
                          </button>
                          <button
                            type="button"
                            disabled={!d}
                            onClick={() => onSelectResult(s.id)}
                            className="min-h-[38px] rounded-[11px] border-[1.5px] border-[var(--line)] bg-white px-3.5 py-1.5 text-[14px] font-extrabold text-[var(--teal)] whitespace-nowrap shrink-0 hover:bg-[var(--soft)] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Hasil
                          </button>
                          <button
                            type="button"
                            onClick={() => onExportSessionZip(s)}
                            className="min-h-[38px] rounded-[11px] border-0 bg-[var(--teal)] px-3.5 py-1.5 text-[14px] font-extrabold text-white whitespace-nowrap shrink-0"
                          >
                            ZIP
                          </button>
                          <button
                            type="button"
                            onClick={() => onRequestDelete(s)}
                            className="min-h-[38px] rounded-[11px] border-[1.5px] border-[#f3c7c7] bg-white px-3.5 py-1.5 text-[14px] font-extrabold text-[var(--red)] whitespace-nowrap shrink-0 hover:bg-[#fff5f5]"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 mb-0">
            Belum ada data.{' '}
            <button
              type="button"
              onClick={onGoToSessions}
              className="min-h-[44px] border-0 bg-transparent py-2 font-extrabold text-[var(--teal)] hover:underline"
            >
              Mulai sesi pertama →
            </button>
          </p>
        )}

        {resultSession && resultSession.dass && (
          <div
            ref={resRef}
            className="mt-5 rounded-[22px] border border-[var(--line)] bg-[var(--soft)] p-[clamp(18px,3vw,28px)]"
          >
            <h3 className="mt-0 text-xl font-bold">
              Hasil skrining · {resultSession.meta.code}
            </h3>
            {(['D', 'A', 'S'] as DassDimension[]).map((k) => {
              const rawScore = resultSession.dass!.raw[k];
              const levelIdx = resultSession.dass!.lv[k];
              return (
                <div key={k} className="mt-3.5">
                  <div className="flex flex-wrap justify-between gap-2 font-bold tabular-nums">
                    <span>
                      {NAMES[k]} · {rawScore}
                    </span>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[13px] text-white"
                      style={{ backgroundColor: LCOL[levelIdx] }}
                    >
                      {LEV[levelIdx]}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2.5 overflow-hidden rounded-[9px] bg-[var(--line)]">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${(rawScore / 42) * 100}%`,
                        backgroundColor: LCOL[levelIdx],
                      }}
                    />
                  </div>
                </div>
              );
            })}

            {(resultSession.dass.lv.D >= 3 ||
              (resultSession.ans[20] ?? 0) >= 2 ||
              (resultSession.ans[16] ?? 0) >= 2) && (
              <div className="mt-3 rounded-[10px] border-l-4 border-[var(--red)] bg-[#fff1f1] px-3.5 py-3 text-[15px]">
                Perlu tindak lanjut: skor depresi tinggi atau butir 17/21 bernilai ≥2. Ikuti
                protokol rujukan dalam penelitian Anda.
              </div>
            )}

            <p className="mt-3 mb-0 text-[14px] text-[var(--mute)]">
              Skor ×2 (setara DASS-42), kategori menurut Lovibond &amp; Lovibond (1995). Ini hasil
              skrining, bukan diagnosis.
            </p>
          </div>
        )}
      </div>

      <div className="mt-5 rounded-[22px] border border-[var(--line)] bg-[var(--panel)] p-[clamp(18px,3vw,28px)]">
        <h3 className="mt-0 mb-2 text-lg font-bold">Struktur file ekspor</h3>
        <p className="m-0 text-[14px] text-[var(--mute)]">
          Setiap sesi menjadi satu folder <code className="font-mono">KODE_YYYYMMDDHHMM/</code>{' '}
          yang berisi <code className="font-mono">audio/KODE_T1_vokal_a.wav</code> …{' '}
          <code className="font-mono">T6</code>, <code className="font-mono">metadata.json</code>{' '}
          (identitas, perangkat, waktu, durasi, puncak, dan level setiap rekaman), serta{' '}
          <code className="font-mono">dass21.csv</code>. Ekspor semua sesi menambahkan{' '}
          <code className="font-mono">dass21_semua.csv</code> dan{' '}
          <code className="font-mono">rekaman_semua.csv</code>. Kolom{' '}
          <code className="font-mono">file</code> di CSV dapat langsung dipakai untuk ekstraksi
          fitur (openSMILE, librosa, wav2vec 2.0).
        </p>
      </div>
    </div>
  );
}
