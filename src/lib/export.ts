import JSZip from 'jszip';
import { ITEMS, LEV, PASSAGE, TASKS, scoreDass, stamp } from '../constants/study';
import type { StudyConfig, StudySession } from '../types/study';

const DASS_HEADERS = [
  'kode',
  'waktu',
  'usia',
  'jenis_kelamin',
  'bahasa_ibu',
  'institusi',
  'urutan',
  ...ITEMS.map((_, i) => `item${i + 1}`),
  'depresi',
  'kecemasan',
  'stres',
  'kat_depresi',
  'kat_kecemasan',
  'kat_stres',
  'lengkap',
];

const REC_HEADERS = [
  'kode',
  'tugas',
  'nama_tugas',
  'file',
  'durasi_dtk',
  'sample_rate',
  'puncak',
  'rms_dbfs',
  'sr_asli',
  'waktu',
];

function csvEscape(value: unknown): string {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(headers: string[], rows: Array<Array<unknown>>): string {
  return [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
}

export function sessionFolderName(s: StudySession): string {
  return `${s.meta.code.replace(/[^\w-]/g, '_')}_${stamp(s.createdAt)}`;
}

function dassRow(s: StudySession): Array<unknown> {
  const d = s.dass || scoreDass(s.ans);
  return [
    s.meta.code,
    new Date(s.createdAt).toISOString(),
    s.meta.age,
    s.meta.sex,
    s.meta.lang,
    s.meta.inst,
    s.order,
    ...s.ans.map((v) => v ?? ''),
    d.raw.D,
    d.raw.A,
    d.raw.S,
    LEV[d.lv.D],
    LEV[d.lv.A],
    LEV[d.lv.S],
    s.done ? 1 : 0,
  ];
}

function recRows(s: StudySession): Array<Array<unknown>> {
  const folder = sessionFolderName(s);
  return TASKS.filter((t) => s.recs[t.id]).map((t) => {
    const r = s.recs[t.id];
    return [
      s.meta.code,
      t.id,
      t.name,
      `${folder}/audio/${s.meta.code}_${t.id}.wav`,
      r.dur.toFixed(2),
      r.sr,
      r.peak,
      r.rmsDb,
      r.srcRate,
      new Date(r.ts).toISOString(),
    ];
  });
}

function addSessionToZip(zip: JSZip, s: StudySession, cfg: StudyConfig): void {
  const folder = zip.folder(sessionFolderName(s));
  if (!folder) return;

  TASKS.forEach((t) => {
    const r = s.recs[t.id];
    if (r) {
      folder.file(`audio/${s.meta.code}_${t.id}.wav`, r.blob);
    }
  });

  const metadata = {
    studi: cfg.study,
    kode: s.meta.code,
    identitas: s.meta,
    urutan: s.order,
    mulai: new Date(s.createdAt).toISOString(),
    selesai: s.finishedAt ? new Date(s.finishedAt).toISOString() : null,
    user_agent: s.ua,
    teks_bacaan: PASSAGE,
    rekaman: Object.fromEntries(
      Object.entries(s.recs).map(([k, r]) => [
        k,
        {
          durasi: r.dur,
          sample_rate: r.sr,
          puncak: r.peak,
          rms_dbfs: r.rmsDb,
          sr_asli: r.srcRate,
        },
      ]),
    ),
    dass21: {
      jawaban: s.ans,
      skor: s.dass ?? null,
    },
  };

  folder.file('metadata.json', JSON.stringify(metadata, null, 2));
  folder.file('dass21.csv', toCsv(DASS_HEADERS, [dassRow(s)]));
}

function triggerDownload(blob: Blob, filename: string): void {
  const a = document.createElement('a');
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 2000);
}

export async function exportSessionZip(s: StudySession, cfg: StudyConfig): Promise<void> {
  const zip = new JSZip();
  addSessionToZip(zip, s, cfg);
  const blob = await zip.generateAsync({ type: 'blob' });
  triggerDownload(blob, `${sessionFolderName(s)}.zip`);
}

export async function exportAllZip(sessions: StudySession[], cfg: StudyConfig): Promise<void> {
  const zip = new JSZip();
  sessions.forEach((s) => addSessionToZip(zip, s, cfg));
  if (sessions.length > 1) {
    zip.file('dass21_semua.csv', toCsv(DASS_HEADERS, sessions.map(dassRow)));
    zip.file('rekaman_semua.csv', toCsv(REC_HEADERS, sessions.flatMap(recRows)));
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  triggerDownload(blob, `studi_suara_${stamp(Date.now())}.zip`);
}

export function exportDassCsv(sessions: StudySession[]): void {
  const csv = `\uFEFF${toCsv(DASS_HEADERS, sessions.map(dassRow))}`;
  triggerDownload(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `dass21_${stamp(Date.now())}.csv`);
}
