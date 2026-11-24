import type { RecordingData } from '../types/study';

export interface ActiveCapture {
  ctx: AudioContext;
  stream: MediaStream;
  srcNode: MediaStreamAudioSourceNode;
  proc: ScriptProcessorNode;
  analyser: AnalyserNode;
  chunks: Float32Array[];
  startedAt: number;
}

export async function startAudioCapture(): Promise<ActiveCapture> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('Mikrofon hanya bisa dipakai lewat HTTPS atau localhost.');
  }

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });
  } catch {
    const isSecure =
      location.protocol === 'file:' ||
      location.protocol === 'https:' ||
      location.hostname === 'localhost' ||
      location.hostname === '127.0.0.1';
    throw new Error(
      isSecure
        ? 'Akses mikrofon ditolak. Izinkan mikrofon di pengaturan browser lalu coba lagi.'
        : 'Mikrofon hanya bisa dipakai lewat HTTPS atau localhost.',
    );
  }

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioCtx();
  await ctx.resume();

  const srcNode = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;

  const proc = ctx.createScriptProcessor(4096, 1, 1);
  const chunks: Float32Array[] = [];
  proc.onaudioprocess = (e) => {
    chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
  };

  srcNode.connect(analyser);
  srcNode.connect(proc);
  proc.connect(ctx.destination);

  return {
    ctx,
    stream,
    srcNode,
    proc,
    analyser,
    chunks,
    startedAt: performance.now(),
  };
}

export async function stopAudioCapture(
  capture: ActiveCapture,
  targetSr: number,
): Promise<RecordingData> {
  capture.proc.disconnect();
  capture.srcNode.disconnect();
  capture.stream.getTracks().forEach((track) => track.stop());

  const srcRate = capture.ctx.sampleRate;
  await capture.ctx.close();

  const len = capture.chunks.reduce((acc, c) => acc + c.length, 0);
  const pcm = new Float32Array(len);
  let offset = 0;
  for (const chunk of capture.chunks) {
    pcm.set(chunk, offset);
    offset += chunk.length;
  }

  let out = pcm;
  let sr = srcRate;

  if (targetSr && targetSr !== srcRate && len > 0) {
    const frameCount = Math.ceil((len * targetSr) / srcRate);
    const offline = new OfflineAudioContext(1, frameCount, targetSr);
    const buffer = offline.createBuffer(1, len, srcRate);
    buffer.copyToChannel(pcm, 0);
    const source = offline.createBufferSource();
    source.buffer = buffer;
    source.connect(offline.destination);
    source.start();
    const rendered = await offline.startRendering();
    out = rendered.getChannelData(0);
    sr = targetSr;
  }

  let peak = 0;
  let sum = 0;
  for (let i = 0; i < out.length; i++) {
    const abs = Math.abs(out[i]);
    if (abs > peak) peak = abs;
    sum += out[i] * out[i];
  }

  const rms = Math.sqrt(sum / (out.length || 1));

  return {
    blob: encodeWav16BitMono(out, sr),
    dur: out.length / sr,
    sr,
    peak: Number(peak.toFixed(3)),
    rmsDb: Number((20 * Math.log10(rms || 1e-9)).toFixed(1)),
    srcRate,
    ts: Date.now(),
  };
}

export function encodeWav16BitMono(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

export function evaluateQuality(rec: RecordingData, minSeconds: number): string[] {
  const warnings: string[] = [];
  if (rec.dur < minSeconds) {
    warnings.push(
      `Durasi ${rec.dur.toFixed(1)} dtk, kurang dari ${minSeconds} dtk yang disarankan.`,
    );
  }
  if (rec.peak >= 0.99) {
    warnings.push('Suara terpotong (clipping). Jauhkan mikrofon sedikit.');
  }
  if (rec.rmsDb < -45) {
    warnings.push('Suara terlalu pelan. Dekatkan mikrofon atau bicara lebih keras.');
  }
  return warnings;
}

export function drawWaveformFrame(canvas: HTMLCanvasElement, analyser: AnalyserNode): void {
  const dpr = window.devicePixelRatio || 1;
  const W = (canvas.width = canvas.clientWidth * dpr);
  const H = (canvas.height = canvas.clientHeight * dpr);
  const ctx = canvas.getContext('2d');
  if (!ctx || W === 0 || H === 0) return;

  const data = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(data);

  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = '#00796f';
  ctx.lineWidth = 2 * dpr;
  ctx.beginPath();

  for (let i = 0; i < data.length; i += 4) {
    const x = (i / data.length) * W;
    const y = H / 2 + data[i] * H * 1.6;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
}

const blobUrlCache = new WeakMap<Blob, string>();

export function getBlobUrl(blob: Blob): string {
  const cached = blobUrlCache.get(blob);
  if (cached) return cached;
  const url = URL.createObjectURL(blob);
  blobUrlCache.set(blob, url);
  return url;
}
