'use strict'

const { writeFileSync } = require('fs')
const { join } = require('path')

const sampleRate = 44100
const outPath = join(__dirname, '..', 'public', 'sounds', 'round-windup.wav')

function envelope (i, len, attack, release) {
  const a = Math.min(1, i / attack)
  const r = Math.min(1, (len - 1 - i) / release)
  return Math.min(a, r)
}

function silence (durationSec) {
  return new Float32Array(Math.floor(sampleRate * durationSec))
}

function tone (freqHz, durationSec, vol) {
  const len = Math.floor(sampleRate * durationSec)
  const attack = sampleRate * 0.01
  const release = sampleRate * 0.05
  const buf = new Float32Array(len)
  for (let i = 0; i < len; i++) {
    const t = i / sampleRate
    buf[i] = vol * envelope(i, len, attack, release) * Math.sin(2 * Math.PI * freqHz * t)
  }
  return buf
}

function chirp (f0, f1, durationSec, vol) {
  const len = Math.floor(sampleRate * durationSec)
  const k = (f1 - f0) / durationSec
  const attack = sampleRate * 0.025
  const release = sampleRate * 0.1
  const buf = new Float32Array(len)
  for (let i = 0; i < len; i++) {
    const t = i / sampleRate
    const phase = 2 * Math.PI * (f0 * t + 0.5 * k * t * t)
    buf[i] = vol * envelope(i, len, attack, release) * Math.sin(phase)
  }
  return buf
}

function concat (...parts) {
  let total = 0
  for (const p of parts) total += p.length
  const out = new Float32Array(total)
  let o = 0
  for (const p of parts) {
    out.set(p, o)
    o += p.length
  }
  let peak = 0
  for (let i = 0; i < out.length; i++) peak = Math.max(peak, Math.abs(out[i]))
  const norm = peak > 0.99 ? 0.92 / peak : 1
  for (let i = 0; i < out.length; i++) out[i] *= norm
  return out
}

function floatTo16BitPCM (float32) {
  const buf = Buffer.alloc(float32.length * 2)
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]))
    buf.writeInt16LE(s < 0 ? s * 0x8000 : s * 0x7fff, i * 2)
  }
  return buf
}

function writeWavMono16 (float32) {
  const pcm = floatTo16BitPCM(float32)
  const dataSize = pcm.length
  const header = Buffer.alloc(44)
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + dataSize, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20)
  header.writeUInt16LE(1, 22)
  header.writeUInt32LE(sampleRate, 24)
  header.writeUInt32LE(sampleRate * 2, 28)
  header.writeUInt16LE(2, 32)
  header.writeUInt16LE(16, 34)
  header.write('data', 36)
  header.writeUInt32LE(dataSize, 40)
  return Buffer.concat([header, pcm])
}

const windup = concat(
  chirp(200, 480, 0.42, 0.2),
  silence(0.035),
  tone(392, 0.07, 0.24),
  tone(523, 0.08, 0.22),
  tone(784, 0.14, 0.2)
)
writeFileSync(outPath, writeWavMono16(windup))
console.log('Wrote', outPath)
