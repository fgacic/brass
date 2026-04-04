'use strict'

const { writeFileSync } = require('fs')
const { join } = require('path')

const sampleRate = 44100
const outPath = join(__dirname, '..', 'public', 'sounds', 'your-turn.wav')

function envelope (i, len, attack, release) {
  const a = Math.min(1, i / attack)
  const r = Math.min(1, (len - 1 - i) / release)
  return Math.min(a, r)
}

function tone (freqHz, durationSec, vol) {
  const len = Math.floor(sampleRate * durationSec)
  const attack = sampleRate * 0.012
  const release = sampleRate * 0.06
  const buf = new Float32Array(len)
  for (let i = 0; i < len; i++) {
    const t = i / sampleRate
    buf[i] = vol * envelope(i, len, attack, release) * Math.sin(2 * Math.PI * freqHz * t)
  }
  return buf
}

function mix (a, b, offsetB) {
  const len = Math.max(a.length, offsetB + b.length)
  const out = new Float32Array(len)
  for (let i = 0; i < a.length; i++) out[i] += a[i]
  for (let i = 0; i < b.length; i++) {
    const j = offsetB + i
    if (j < out.length) out[j] += b[i]
  }
  let peak = 0
  for (let i = 0; i < out.length; i++) peak = Math.max(peak, Math.abs(out[i]))
  const norm = peak > 0.99 ? 0.98 / peak : 1
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

const first = tone(784, 0.11, 0.22)
const second = tone(1046, 0.14, 0.18)
const combined = mix(first, second, Math.floor(sampleRate * 0.055))
writeFileSync(outPath, writeWavMono16(combined))
console.log('Wrote', outPath)
