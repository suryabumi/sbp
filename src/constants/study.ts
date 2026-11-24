import type {
  DassDimension,
  DassScores,
  SessionOrder,
  SessionStep,
  SpeechTask,
  StudyConfig,
  StudySession,
} from '../types/study';

export const GUIDE = 'Kak Nara';

export const PASSAGE =
  'Pagi itu langit di atas kota tampak cerah. Budi berjalan pelan menuju pasar sambil membawa keranjang bambu. Di sepanjang jalan ia melihat penjual sayur, tukang roti, dan anak-anak yang bermain bola. Setelah membeli ikan, beras, dan buah jeruk, ia duduk sejenak di bawah pohon besar, lalu pulang sebelum matahari terasa panas.';

export const TASKS: SpeechTask[] = [
  {
    id: 'T1_vokal_a',
    name: 'Vokal panjang /a/',
    min: 4,
    msg: [
      'Kita mulai dengan pemanasan.',
      'Tarik napas, lalu ucapkan bunyi <b>“aaaa…”</b> dengan nada dan kekerasan yang nyaman, selama mungkin dalam satu napas (minimal 4 detik).',
    ],
  },
  {
    id: 'T2_membaca',
    name: 'Membaca teks',
    min: 12,
    msg: ['Bagus! Sekarang bacalah teks berikut dengan suara dan kecepatan seperti biasa.'],
    passage: true,
  },
  {
    id: 'T3_hitung',
    name: 'Menghitung 1–20',
    min: 6,
    msg: ['Selanjutnya, hitunglah dari <b>satu sampai dua puluh</b> dengan tempo biasa.'],
  },
  {
    id: 'T4_minggu_ini',
    name: 'Cerita: seminggu terakhir',
    min: 45,
    msg: [
      'Sekarang bagian bercerita. Tidak ada jawaban benar atau salah.',
      '<b>Ceritakan bagaimana perasaan dan keseharianmu selama satu minggu terakhir.</b> Misalnya tentang tidur, kuliah atau pekerjaan, dan hal yang membuatmu senang atau terbebani. Usahakan sekitar 1 menit.',
    ],
  },
  {
    id: 'T5_positif',
    name: 'Cerita: pengalaman menyenangkan',
    min: 30,
    msg: [
      'Terima kasih sudah berbagi.',
      '<b>Ceritakan satu pengalaman menyenangkan yang kamu alami baru-baru ini.</b> Apa yang terjadi, dengan siapa, dan bagaimana rasanya? Sekitar 30–60 detik.',
    ],
  },
  {
    id: 'T6_rencana',
    name: 'Cerita: rencana ke depan',
    min: 30,
    msg: [
      'Terakhir untuk bagian suara:',
      '<b>Ceritakan rencana atau harapanmu untuk beberapa bulan ke depan.</b> Sekitar 30–60 detik.',
    ],
  },
];

export const ITEMS: Array<[DassDimension, string]> = [
  ['S', 'Saya merasa sulit untuk menenangkan diri'],
  ['A', 'Saya menyadari mulut saya terasa kering'],
  ['D', 'Saya sama sekali tidak dapat merasakan perasaan positif'],
  ['A', 'Saya mengalami kesulitan bernapas (misalnya napas cepat atau terengah-engah padahal tidak sedang beraktivitas fisik)'],
  ['D', 'Saya merasa sulit untuk memulai inisiatif melakukan sesuatu'],
  ['S', 'Saya cenderung bereaksi berlebihan terhadap suatu situasi'],
  ['A', 'Saya mengalami gemetar (misalnya pada tangan)'],
  ['S', 'Saya merasa banyak menghabiskan energi karena cemas'],
  ['A', 'Saya khawatir dengan situasi yang mungkin membuat saya panik dan mempermalukan diri sendiri'],
  ['D', 'Saya merasa tidak ada hal yang dapat saya harapkan di masa depan'],
  ['S', 'Saya mendapati diri saya mudah gelisah'],
  ['S', 'Saya merasa sulit untuk bersantai'],
  ['D', 'Saya merasa sedih dan murung'],
  ['S', 'Saya tidak dapat memaklumi hal apa pun yang menghalangi saya menyelesaikan apa yang sedang saya lakukan'],
  ['A', 'Saya merasa hampir panik'],
  ['D', 'Saya tidak dapat merasa antusias terhadap hal apa pun'],
  ['D', 'Saya merasa tidak berharga sebagai seorang manusia'],
  ['S', 'Saya merasa mudah tersinggung'],
  ['A', 'Saya menyadari detak jantung saya padahal tidak sedang beraktivitas fisik (misalnya denyut meningkat atau tidak beraturan)'],
  ['A', 'Saya merasa takut tanpa alasan yang jelas'],
  ['D', 'Saya merasa hidup ini tidak berarti'],
];

export const SCALE = ['Tidak pernah', 'Kadang-kadang', 'Sering', 'Hampir selalu'];

export const NAMES: Record<DassDimension, string> = {
  D: 'Depresi',
  A: 'Kecemasan',
  S: 'Stres',
};

export const CUT: Record<DassDimension, number[]> = {
  D: [9, 13, 20, 27],
  A: [7, 9, 14, 19],
  S: [14, 18, 25, 33],
};

export const LEV = ['Normal', 'Ringan', 'Sedang', 'Berat', 'Sangat berat'];
export const LCOL = ['#0f8a4a', '#7aa514', '#d08a00', '#e2612b', '#c81e1e'];

export const DEFAULT_CONFIG: StudyConfig = {
  sr: 16000,
  order: 'speech',
  showResult: false,
  study: 'Studi Suara dan Kesejahteraan Psikologis',
};

export function fmtDate(t: number): string {
  return new Date(t).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function fmtDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function stamp(t: number): string {
  return new Date(t).toISOString().slice(0, 16).replace(/[-:T]/g, '');
}

export function scoreDass(ans: Array<number | null>): DassScores {
  const raw: Record<DassDimension, number> = { D: 0, A: 0, S: 0 };
  ans.forEach((v, i) => {
    raw[ITEMS[i][0]] += v || 0;
  });
  const lv: Record<DassDimension, number> = { D: 0, A: 0, S: 0 };
  (Object.keys(raw) as DassDimension[]).forEach((k) => {
    raw[k] *= 2;
    lv[k] = CUT[k].filter((c) => raw[k] > c).length;
  });
  return { raw, lv };
}

export function buildSteps(order: SessionOrder): SessionStep[] {
  const sp: SessionStep[] = [
    {
      t: 'say',
      m: [
        `Halo, aku ${GUIDE}! Terima kasih sudah mau ikut penelitian ini.`,
        'Pertama kita akan merekam suaramu. Cari posisi yang nyaman, jaga jarak mulut ke mikrofon sekitar 20–30 cm, dan usahakan ruangan tenang.',
        'Tekan tombol mikrofon untuk mulai, dan tekan lagi untuk berhenti.',
      ],
    },
    ...TASKS.map((_, i): SessionStep => ({ t: 'rec', i })),
  ];

  const dq: SessionStep[] = [
    {
      t: 'say',
      m: [
        order === 'speech'
          ? 'Bagian suara selesai. Terima kasih!'
          : `Halo, aku ${GUIDE}! Terima kasih sudah mau ikut penelitian ini.`,
        'Sekarang ada 21 pernyataan singkat. Pilih jawaban yang paling sesuai dengan yang kamu alami <b>selama satu minggu terakhir</b>.',
      ],
    },
    ...ITEMS.map((_, i): SessionStep => ({ t: 'dass', i })),
  ];

  if (order === 'dass') {
    dq.push({
      t: 'say',
      m: [
        'Terima kasih! Sekarang kita lanjut merekam suaramu. Jaga jarak mulut ke mikrofon sekitar 20–30 cm dan usahakan ruangan tenang.',
      ],
    });
    return [...dq, ...sp.slice(1), { t: 'end' }];
  }

  return [...sp, ...dq, { t: 'end' }];
}

export function advanceSession(session: StudySession, showResult: boolean): StudySession {
  const next: StudySession = {
    ...session,
    steps: session.steps.map((step) => ({ ...step })),
    log: [...session.log],
  };

  while (true) {
    const step = next.steps[next.idx];
    if (!step) return next;

    if (step.t === 'say') {
      step.m.forEach((m) => next.log.push({ w: 'bot', h: m }));
      next.idx += 1;
      continue;
    }

    if (step.t === 'rec' && !step.asked) {
      const task = TASKS[step.i];
      task.msg.forEach((m, j) =>
        next.log.push({
          w: 'bot',
          h: m,
          task: j === 0 ? `Tugas ${step.i + 1}/${TASKS.length} · ${task.name}` : null,
          passage: Boolean(task.passage && j === task.msg.length - 1),
        }),
      );
      step.asked = true;
      return next;
    }

    if (step.t === 'dass' && !step.asked) {
      next.log.push({
        w: 'bot',
        h: ITEMS[step.i][1],
        task: `DASS-21 · ${step.i + 1}/21`,
      });
      step.asked = true;
      return next;
    }

    if (step.t === 'end' && !next.done) {
      next.done = true;
      next.finishedAt = Date.now();
      next.dass = scoreDass(next.ans);
      next.log.push({
        w: 'bot',
        h: 'Sesi selesai. Terima kasih banyak atas waktumu!',
      });
      if (showResult) {
        const summary = (['D', 'A', 'S'] as DassDimension[])
          .map((k) => `${NAMES[k]} <b>${next.dass!.raw[k]}</b> (${LEV[next.dass!.lv[k]]})`)
          .join(', ');
        next.log.push({
          w: 'bot',
          h: `Ringkasan skrining DASS-21 (bukan diagnosis): ${summary}.`,
        });
      }
      const severe =
        next.dass.lv.D >= 3 || (next.ans[20] ?? 0) >= 2 || (next.ans[16] ?? 0) >= 2;
      if (severe) {
        next.log.push({
          w: 'bot',
          h: 'Beberapa jawabanmu menunjukkan kamu mungkin sedang melalui masa yang berat. Kamu tidak sendirian. Sampaikan kepada peneliti yang mendampingimu, atau hubungi konselor maupun layanan 119 ext. 8.',
          alert: true,
        });
      }
      return next;
    }

    return next;
  }
}

export function sessionProgressText(s: StudySession): string {
  const r = Object.keys(s.recs).length;
  const d = s.ans.filter((v) => v !== null).length;
  return `${r}/${TASKS.length} rekaman · ${d}/21 DASS`;
}
