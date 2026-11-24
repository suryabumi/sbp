export type AppView = 'home' | 'sesi' | 'data' | 'set';

export type SessionOrder = 'speech' | 'dass';

export type DassDimension = 'D' | 'A' | 'S';

export interface StudyConfig {
  sr: number;
  order: SessionOrder;
  showResult: boolean;
  study: string;
}

export interface SessionMeta {
  code: string;
  age: string;
  sex: string;
  lang: string;
  inst: string;
  mic: string;
}

export interface SpeechTask {
  id: string;
  name: string;
  min: number;
  msg: string[];
  passage?: boolean;
}

export interface RecordingData {
  blob: Blob;
  dur: number;
  sr: number;
  peak: number;
  rmsDb: number;
  srcRate: number;
  ts: number;
}

export interface DassScores {
  raw: Record<DassDimension, number>;
  lv: Record<DassDimension, number>;
}

export type SessionStep =
  | { t: 'say'; m: string[] }
  | { t: 'rec'; i: number; asked?: boolean }
  | { t: 'dass'; i: number; asked?: boolean }
  | { t: 'end' };

export type ChatMessage =
  | {
      w: 'bot';
      h: string;
      task?: string | null;
      passage?: boolean;
      alert?: boolean;
    }
  | {
      w: 'me';
      rec: string;
    }
  | {
      w: 'me';
      t: string;
    };

export interface StudySession {
  id: string;
  meta: SessionMeta;
  createdAt: number;
  consentAt: number;
  finishedAt?: number;
  order: SessionOrder;
  steps: SessionStep[];
  idx: number;
  log: ChatMessage[];
  recs: Record<string, RecordingData>;
  ans: Array<number | null>;
  dass?: DassScores;
  done: boolean;
  ua: string;
}

export interface MicStatus {
  ok: boolean;
  text: string;
}
