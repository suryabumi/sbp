import React, { useEffect, useState } from 'react';
import type { SessionMeta, StudySession } from '../types/study';

interface ModalFrameProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function ModalFrame({ open, onClose, title, children }: ModalFrameProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#0b1a1c]/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="max-h-[90vh] w-[min(560px,94vw)] overflow-auto rounded-[22px] bg-[var(--panel)] p-[26px] shadow-xl">
        <h3 className="mt-0 text-xl font-bold">{title}</h3>
        {children}
      </div>
    </div>
  );
}

interface HelpDialogProps {
  open: boolean;
  onClose: () => void;
}

export function HelpDialog({ open, onClose }: HelpDialogProps) {
  return (
    <ModalFrame open={open} onClose={onClose} title="Butuh bicara dengan seseorang?">
      <p className="mt-0">
        Jika kamu merasa tertekan atau tidak aman, sampaikan kepada peneliti yang mendampingimu,
        hubungi konselor kampus, atau layanan kesehatan jiwa Kemenkes di <b>119 ext. 8</b>. Dalam
        keadaan darurat hubungi <b>112</b>.
      </p>
      <p className="text-[14px] text-[var(--mute)]">
        Kamu boleh menghentikan sesi kapan saja tanpa konsekuensi apa pun.
      </p>
      <div className="mt-5 flex flex-wrap justify-end gap-2.5">
        <button
          type="button"
          onClick={onClose}
          className="min-h-[48px] rounded-[14px] border-0 bg-[var(--teal)] px-[22px] py-3 font-extrabold text-white whitespace-nowrap shrink-0"
        >
          Tutup
        </button>
      </div>
    </ModalFrame>
  );
}

interface NewSessionDialogProps {
  open: boolean;
  existingSessions: StudySession[];
  onClose: () => void;
  onStart: (meta: SessionMeta) => Promise<void>;
}

export function NewSessionDialog({
  open,
  existingSessions,
  onClose,
  onStart,
}: NewSessionDialogProps) {
  const [consent, setConsent] = useState(false);
  const [code, setCode] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');
  const [lang, setLang] = useState('');
  const [inst, setInst] = useState('');
  const [mic, setMic] = useState('');
  const [err, setErr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setConsent(false);
      setCode('');
      setAge('');
      setSex('');
      setLang('');
      setInst('');
      setMic('');
      setErr('');
      setSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const meta: SessionMeta = {
      code: code.trim(),
      age: age.trim(),
      sex: sex.trim(),
      lang: lang.trim(),
      inst: inst.trim(),
      mic: mic.trim(),
    };

    if (!consent) {
      setErr('Persetujuan responden wajib dicentang.');
      return;
    }
    if (!meta.code || !meta.age || !meta.sex) {
      setErr('Kode, usia, dan jenis kelamin wajib diisi.');
      return;
    }
    if (
      existingSessions.some(
        (s) => s.meta.code.toLowerCase() === meta.code.toLowerCase(),
      )
    ) {
      setErr('Kode responden ini sudah dipakai. Gunakan kode lain.');
      return;
    }

    setSubmitting(true);
    await onStart(meta);
    setSubmitting(false);
  };

  return (
    <ModalFrame open={open} onClose={onClose} title="Sesi baru">
      <form onSubmit={handleSubmit}>
        <p className="mt-0 text-[14px] text-[var(--mute)]">
          Penelitian ini mengkaji hubungan karakteristik suara dengan kondisi depresi, kecemasan,
          dan stres. Responden akan merekam beberapa tugas bicara (±6 menit) dan mengisi DASS-21
          (±5 menit).
        </p>
        <ul className="list-disc pl-5 text-[14px] text-[var(--mute)]">
          <li>Partisipasi sukarela dan dapat dihentikan kapan saja.</li>
          <li>Rekaman suara dan jawaban disimpan dengan kode, tanpa nama.</li>
          <li>Hasil skrining DASS-21 bukan diagnosis.</li>
        </ul>

        <label className="mt-4 flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-[22px] w-[22px] shrink-0"
          />
          <span>
            Responden telah membaca informasi di atas dan menyetujui perekaman suara serta
            pengisian kuesioner.
          </span>
        </label>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,210px),1fr))] gap-x-4">
          <div>
            <label htmlFor="nCode" className="mt-3.5 mb-1.5 block text-[14px] font-bold">
              Kode responden *
            </label>
            <input
              id="nCode"
              placeholder="R-001"
              autoComplete="off"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="min-h-[48px] w-full rounded-[12px] border-[1.5px] border-[var(--line)] bg-white px-3.5 py-2.5 text-[16px] text-[var(--ink)]"
            />
          </div>

          <div>
            <label htmlFor="nAge" className="mt-3.5 mb-1.5 block text-[14px] font-bold">
              Usia *
            </label>
            <input
              id="nAge"
              type="number"
              min={15}
              max={99}
              inputMode="numeric"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="min-h-[48px] w-full rounded-[12px] border-[1.5px] border-[var(--line)] bg-white px-3.5 py-2.5 text-[16px] text-[var(--ink)]"
            />
          </div>

          <div>
            <label htmlFor="nSex" className="mt-3.5 mb-1.5 block text-[14px] font-bold">
              Jenis kelamin *
            </label>
            <select
              id="nSex"
              value={sex}
              onChange={(e) => setSex(e.target.value)}
              className="min-h-[48px] w-full rounded-[12px] border-[1.5px] border-[var(--line)] bg-white px-3.5 py-2.5 text-[16px] text-[var(--ink)]"
            >
              <option value="">Pilih…</option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>

          <div>
            <label htmlFor="nLang" className="mt-3.5 mb-1.5 block text-[14px] font-bold">
              Bahasa ibu
            </label>
            <input
              id="nLang"
              placeholder="mis. Bali, Jawa, Indonesia"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="min-h-[48px] w-full rounded-[12px] border-[1.5px] border-[var(--line)] bg-white px-3.5 py-2.5 text-[16px] text-[var(--ink)]"
            />
          </div>

          <div>
            <label htmlFor="nInst" className="mt-3.5 mb-1.5 block text-[14px] font-bold">
              Institusi
            </label>
            <input
              id="nInst"
              value={inst}
              onChange={(e) => setInst(e.target.value)}
              className="min-h-[48px] w-full rounded-[12px] border-[1.5px] border-[var(--line)] bg-white px-3.5 py-2.5 text-[16px] text-[var(--ink)]"
            />
          </div>

          <div>
            <label htmlFor="nMic" className="mt-3.5 mb-1.5 block text-[14px] font-bold">
              Perangkat / mikrofon
            </label>
            <input
              id="nMic"
              placeholder="mis. headset USB, mic laptop"
              value={mic}
              onChange={(e) => setMic(e.target.value)}
              className="min-h-[48px] w-full rounded-[12px] border-[1.5px] border-[var(--line)] bg-white px-3.5 py-2.5 text-[16px] text-[var(--ink)]"
            />
          </div>
        </div>

        {err && <p className="mt-2 mb-0 text-[14px] font-semibold text-[var(--red)]">{err}</p>}

        <div className="mt-5 flex flex-wrap justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] rounded-[14px] border-[1.5px] border-[var(--line)] bg-white px-[22px] py-3 font-extrabold text-[var(--teal)] whitespace-nowrap shrink-0 hover:bg-[var(--soft)]"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="min-h-[48px] rounded-[14px] border-0 bg-[var(--teal)] px-[22px] py-3 font-extrabold text-white whitespace-nowrap shrink-0 disabled:opacity-40"
          >
            Mulai sesi
          </button>
        </div>
      </form>
    </ModalFrame>
  );
}

interface ConfirmDialogProps {
  sessionToDelete: StudySession | null;
  onClose: () => void;
  onConfirmDelete: (id: string) => Promise<void>;
}

export function ConfirmDialog({
  sessionToDelete,
  onClose,
  onConfirmDelete,
}: ConfirmDialogProps) {
  return (
    <ModalFrame
      open={Boolean(sessionToDelete)}
      onClose={onClose}
      title={sessionToDelete ? `Hapus sesi ${sessionToDelete.meta.code}?` : ''}
    >
      <p className="mt-0">
        Rekaman suara dan jawaban DASS-21 sesi ini akan dihapus permanen dari browser. Pastikan
        sudah diekspor.
      </p>
      <div className="mt-5 flex flex-wrap justify-end gap-2.5">
        <button
          type="button"
          onClick={onClose}
          className="min-h-[48px] rounded-[14px] border-[1.5px] border-[var(--line)] bg-white px-[22px] py-3 font-extrabold text-[var(--teal)] whitespace-nowrap shrink-0 hover:bg-[var(--soft)]"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={() => {
            if (sessionToDelete) void onConfirmDelete(sessionToDelete.id);
          }}
          className="min-h-[48px] rounded-[14px] border-[1.5px] border-[#f3c7c7] bg-white px-[22px] py-3 font-extrabold text-[var(--red)] whitespace-nowrap shrink-0 hover:bg-[#fff5f5]"
        >
          Hapus
        </button>
      </div>
    </ModalFrame>
  );
}
