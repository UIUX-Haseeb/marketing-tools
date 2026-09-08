/* eslint-disable */
// @ts-nocheck
// Baseline JPEG encoder ported verbatim from the original General Post Generator
// (src/lib/jpeg.ts). Used so exports are pixel-faithful across browsers instead of
// relying on each browser's own canvas JPEG encoder.

var ZIGZAG = [
  0,
  1,
  8,
  16,
  9,
  2,
  3,
  10,
  17,
  24,
  32,
  25,
  18,
  11,
  4,
  5,
  12,
  19,
  26,
  33,
  40,
  48,
  41,
  34,
  27,
  20,
  13,
  6,
  7,
  14,
  21,
  28,
  35,
  42,
  49,
  56,
  57,
  50,
  43,
  36,
  29,
  22,
  15,
  23,
  30,
  37,
  44,
  51,
  58,
  59,
  52,
  45,
  38,
  31,
  39,
  46,
  53,
  60,
  61,
  54,
  47,
  55,
  62,
  63
];
var STD_LUMA_Q = [
  16,
  11,
  10,
  16,
  24,
  40,
  51,
  61,
  12,
  12,
  14,
  19,
  26,
  58,
  60,
  55,
  14,
  13,
  16,
  24,
  40,
  57,
  69,
  56,
  14,
  17,
  22,
  29,
  51,
  87,
  80,
  62,
  18,
  22,
  37,
  56,
  68,
  109,
  103,
  77,
  24,
  35,
  55,
  64,
  81,
  104,
  113,
  92,
  49,
  64,
  78,
  87,
  103,
  121,
  120,
  101,
  72,
  92,
  95,
  98,
  112,
  100,
  103,
  99
];
var STD_CHROMA_Q = [
  17,
  18,
  24,
  47,
  99,
  99,
  99,
  99,
  18,
  21,
  26,
  66,
  99,
  99,
  99,
  99,
  24,
  26,
  56,
  99,
  99,
  99,
  99,
  99,
  47,
  66,
  99,
  99,
  99,
  99,
  99,
  99,
  99,
  99,
  99,
  99,
  99,
  99,
  99,
  99,
  99,
  99,
  99,
  99,
  99,
  99,
  99,
  99,
  99,
  99,
  99,
  99,
  99,
  99,
  99,
  99,
  99,
  99,
  99,
  99,
  99,
  99,
  99,
  99
];
var DC_LUMA_BITS = [0, 0, 1, 5, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0];
var DC_LUMA_VALS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
var DC_CHROMA_BITS = [0, 0, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0];
var DC_CHROMA_VALS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
var AC_LUMA_BITS = [0, 0, 2, 1, 3, 3, 2, 4, 3, 5, 5, 4, 4, 0, 0, 1, 125];
var AC_LUMA_VALS = [
  1,
  2,
  3,
  0,
  4,
  17,
  5,
  18,
  33,
  49,
  65,
  6,
  19,
  81,
  97,
  7,
  34,
  113,
  20,
  50,
  129,
  145,
  161,
  8,
  35,
  66,
  177,
  193,
  21,
  82,
  209,
  240,
  36,
  51,
  98,
  114,
  130,
  9,
  10,
  22,
  23,
  24,
  25,
  26,
  37,
  38,
  39,
  40,
  41,
  42,
  52,
  53,
  54,
  55,
  56,
  57,
  58,
  67,
  68,
  69,
  70,
  71,
  72,
  73,
  74,
  83,
  84,
  85,
  86,
  87,
  88,
  89,
  90,
  99,
  100,
  101,
  102,
  103,
  104,
  105,
  106,
  115,
  116,
  117,
  118,
  119,
  120,
  121,
  122,
  131,
  132,
  133,
  134,
  135,
  136,
  137,
  138,
  146,
  147,
  148,
  149,
  150,
  151,
  152,
  153,
  154,
  162,
  163,
  164,
  165,
  166,
  167,
  168,
  169,
  170,
  178,
  179,
  180,
  181,
  182,
  183,
  184,
  185,
  186,
  194,
  195,
  196,
  197,
  198,
  199,
  200,
  201,
  202,
  210,
  211,
  212,
  213,
  214,
  215,
  216,
  217,
  218,
  225,
  226,
  227,
  228,
  229,
  230,
  231,
  232,
  233,
  234,
  241,
  242,
  243,
  244,
  245,
  246,
  247,
  248,
  249,
  250
];
var AC_CHROMA_BITS = [0, 0, 2, 1, 2, 4, 4, 3, 4, 7, 5, 4, 4, 0, 1, 2, 119];
var AC_CHROMA_VALS = [
  0,
  1,
  2,
  3,
  17,
  4,
  5,
  33,
  49,
  6,
  18,
  65,
  81,
  7,
  97,
  113,
  19,
  34,
  50,
  129,
  8,
  20,
  66,
  145,
  161,
  177,
  193,
  9,
  35,
  51,
  82,
  240,
  21,
  98,
  114,
  209,
  10,
  22,
  36,
  52,
  225,
  37,
  241,
  23,
  24,
  25,
  26,
  38,
  39,
  40,
  41,
  42,
  53,
  54,
  55,
  56,
  57,
  58,
  67,
  68,
  69,
  70,
  71,
  72,
  73,
  74,
  83,
  84,
  85,
  86,
  87,
  88,
  89,
  90,
  99,
  100,
  101,
  102,
  103,
  104,
  105,
  106,
  115,
  116,
  117,
  118,
  119,
  120,
  121,
  122,
  130,
  131,
  132,
  133,
  134,
  135,
  136,
  137,
  138,
  146,
  147,
  148,
  149,
  150,
  151,
  152,
  153,
  154,
  162,
  163,
  164,
  165,
  166,
  167,
  168,
  169,
  170,
  178,
  179,
  180,
  181,
  182,
  183,
  184,
  185,
  186,
  194,
  195,
  196,
  197,
  198,
  199,
  200,
  201,
  202,
  210,
  211,
  212,
  213,
  214,
  215,
  216,
  217,
  218,
  226,
  227,
  228,
  229,
  230,
  231,
  232,
  233,
  234,
  242,
  243,
  244,
  245,
  246,
  247,
  248,
  249,
  250
];
function buildHuffTable(bits, values) {
  const table = new Int32Array(256 * 2);
  let code = 0;
  let k = 0;
  for (let length = 1; length <= 16; length++) {
    for (let i = 0; i < bits[length]; i++) {
      const symbol = values[k++];
      table[symbol * 2] = code;
      table[symbol * 2 + 1] = length;
      code++;
    }
    code <<= 1;
  }
  if (k !== values.length) {
    throw new Error(`Huffman spec mismatch: consumed ${k} of ${values.length} values`);
  }
  return table;
}
var DC_LUMA = buildHuffTable(DC_LUMA_BITS, DC_LUMA_VALS);
var AC_LUMA = buildHuffTable(AC_LUMA_BITS, AC_LUMA_VALS);
var DC_CHROMA = buildHuffTable(DC_CHROMA_BITS, DC_CHROMA_VALS);
var AC_CHROMA = buildHuffTable(AC_CHROMA_BITS, AC_CHROMA_VALS);
function scaleQuantTable(base, quality) {
  const q = Math.max(1, Math.min(100, Math.round(quality)));
  const factor = q < 50 ? Math.floor(5e3 / q) : 200 - q * 2;
  const out = new Int32Array(64);
  for (let i = 0; i < 64; i++) {
    const value = Math.floor((Math.min(base[i], HF_CAP) * factor + 50) / 100);
    out[i] = Math.max(1, Math.min(255, value));
  }
  return out;
}
var HF_CAP = 40;
var DCT_MATRIX = (() => {
  const m = new Float32Array(64);
  for (let u = 0; u < 8; u++) {
    const cu = u === 0 ? Math.SQRT1_2 : 1;
    for (let x = 0; x < 8; x++) {
      m[u * 8 + x] = 0.5 * cu * Math.cos((2 * x + 1) * u * Math.PI / 16);
    }
  }
  return m;
})();
function forwardDct(block, out, tmp) {
  for (let y = 0; y < 8; y++) {
    const row = y * 8;
    for (let u = 0; u < 8; u++) {
      const mu = u * 8;
      let sum = 0;
      for (let x = 0; x < 8; x++) sum += block[row + x] * DCT_MATRIX[mu + x];
      tmp[row + u] = sum;
    }
  }
  for (let u = 0; u < 8; u++) {
    for (let v = 0; v < 8; v++) {
      const mv = v * 8;
      let sum = 0;
      for (let y = 0; y < 8; y++) sum += tmp[y * 8 + u] * DCT_MATRIX[mv + y];
      out[v * 8 + u] = sum;
    }
  }
}
var BitWriter = class {
  constructor(capacity) {
    this.length = 0;
    this.accumulator = 0;
    this.bitCount = 0;
    this.bytes = new Uint8Array(Math.max(1024, capacity));
  }
  push(byte) {
    if (this.length === this.bytes.length) {
      const grown = new Uint8Array(this.bytes.length * 2);
      grown.set(this.bytes);
      this.bytes = grown;
    }
    this.bytes[this.length++] = byte;
  }
  /** Writes a raw marker/header byte. Never stuffed — headers are outside entropy data. */
  byte(value) {
    this.push(value & 255);
  }
  word(value) {
    this.push(value >> 8 & 255);
    this.push(value & 255);
  }
  raw(values) {
    for (let i = 0; i < values.length; i++) this.push(values[i] & 255);
  }
  /** Writes `length` bits of `code`, most significant first. */
  bits(code, length) {
    if (length === 0) return;
    this.accumulator = this.accumulator << length | code & (1 << length) - 1;
    this.bitCount += length;
    while (this.bitCount >= 8) {
      this.bitCount -= 8;
      const byte = this.accumulator >> this.bitCount & 255;
      this.push(byte);
      if (byte === 255) this.push(0);
    }
    this.accumulator &= (1 << this.bitCount) - 1;
  }
  /** Pads the final partial byte with 1-bits, as the standard requires. */
  flushBits() {
    if (this.bitCount > 0) {
      const pad = 8 - this.bitCount;
      this.bits((1 << pad) - 1, pad);
    }
  }
  result() {
    return this.bytes.subarray(0, this.length);
  }
};
function magnitudeCategory(value) {
  let v = value < 0 ? -value : value;
  let n = 0;
  while (v > 0) {
    n++;
    v >>= 1;
  }
  return n;
}
function encodeJpeg(data, width, height, { quality }) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
    throw new Error(`encodeJpeg: bad dimensions ${width}x${height}`);
  }
  if (data.length < width * height * 4) {
    throw new Error(`encodeJpeg: expected ${width * height * 4} bytes, got ${data.length}`);
  }
  const lumaQ = scaleQuantTable(STD_LUMA_Q, quality);
  const chromaQ = scaleQuantTable(STD_CHROMA_Q, quality);
  const w = new BitWriter(width * height + 65536);
  w.word(65496);
  w.word(65504);
  w.word(16);
  w.raw([74, 70, 73, 70, 0]);
  w.word(257);
  w.byte(0);
  w.word(1);
  w.word(1);
  w.byte(0);
  w.byte(0);
  w.word(65499);
  w.word(2 + 2 * 65);
  w.byte(0);
  for (let i = 0; i < 64; i++) w.byte(lumaQ[ZIGZAG[i]]);
  w.byte(1);
  for (let i = 0; i < 64; i++) w.byte(chromaQ[ZIGZAG[i]]);
  w.word(65472);
  w.word(8 + 3 * 3);
  w.byte(8);
  w.word(height);
  w.word(width);
  w.byte(3);
  w.byte(1);
  w.byte(17);
  w.byte(0);
  w.byte(2);
  w.byte(17);
  w.byte(1);
  w.byte(3);
  w.byte(17);
  w.byte(1);
  const writeHuffSpec = (id, bits, values) => {
    w.word(65476);
    w.word(3 + 16 + values.length);
    w.byte(id);
    for (let i = 1; i <= 16; i++) w.byte(bits[i]);
    w.raw(values);
  };
  writeHuffSpec(0, DC_LUMA_BITS, DC_LUMA_VALS);
  writeHuffSpec(16, AC_LUMA_BITS, AC_LUMA_VALS);
  writeHuffSpec(1, DC_CHROMA_BITS, DC_CHROMA_VALS);
  writeHuffSpec(17, AC_CHROMA_BITS, AC_CHROMA_VALS);
  w.word(65498);
  w.word(6 + 2 * 3);
  w.byte(3);
  w.byte(1);
  w.byte(0);
  w.byte(2);
  w.byte(17);
  w.byte(3);
  w.byte(17);
  w.byte(0);
  w.byte(63);
  w.byte(0);
  const pixels = width * height;
  const Y = new Float32Array(pixels);
  const Cb = new Float32Array(pixels);
  const Cr = new Float32Array(pixels);
  for (let i = 0, p = 0; i < pixels; i++, p += 4) {
    const r = data[p];
    const g = data[p + 1];
    const b = data[p + 2];
    Y[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    Cb[i] = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
    Cr[i] = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
  }
  const block = new Float32Array(64);
  const tmp = new Float32Array(64);
  const coeffs = new Float32Array(64);
  const quantised = new Int32Array(64);
  const gather = (plane, bx, by) => {
    for (let y = 0; y < 8; y++) {
      const sy = Math.min(by + y, height - 1);
      const row = sy * width;
      for (let x = 0; x < 8; x++) {
        const sx = Math.min(bx + x, width - 1);
        block[y * 8 + x] = plane[row + sx] - 128;
      }
    }
  };
  const encodeBlock = (quant, dcTable, acTable, previousDc) => {
    forwardDct(block, coeffs, tmp);
    for (let i = 0; i < 64; i++) {
      const z = ZIGZAG[i];
      const value = coeffs[z] / quant[z];
      quantised[i] = value < 0 ? -Math.round(-value) : Math.round(value);
    }
    const dc = quantised[0];
    const diff = dc - previousDc;
    const dcCategory = magnitudeCategory(diff);
    w.bits(dcTable[dcCategory * 2], dcTable[dcCategory * 2 + 1]);
    if (dcCategory > 0) w.bits(diff < 0 ? diff - 1 : diff, dcCategory);
    let end = 63;
    while (end > 0 && quantised[end] === 0) end--;
    let run = 0;
    for (let i = 1; i <= end; i++) {
      if (quantised[i] === 0) {
        run++;
        continue;
      }
      while (run > 15) {
        w.bits(acTable[240 * 2], acTable[240 * 2 + 1]);
        run -= 16;
      }
      const value = quantised[i];
      const category = magnitudeCategory(value);
      const symbol = run << 4 | category;
      w.bits(acTable[symbol * 2], acTable[symbol * 2 + 1]);
      w.bits(value < 0 ? value - 1 : value, category);
      run = 0;
    }
    if (end < 63) w.bits(acTable[0], acTable[1]);
    return dc;
  };
  let dcY = 0;
  let dcCb = 0;
  let dcCr = 0;
  for (let by = 0; by < height; by += 8) {
    for (let bx = 0; bx < width; bx += 8) {
      gather(Y, bx, by);
      dcY = encodeBlock(lumaQ, DC_LUMA, AC_LUMA, dcY);
      gather(Cb, bx, by);
      dcCb = encodeBlock(chromaQ, DC_CHROMA, AC_CHROMA, dcCb);
      gather(Cr, bx, by);
      dcCr = encodeBlock(chromaQ, DC_CHROMA, AC_CHROMA, dcCr);
    }
  }
  w.flushBits();
  w.word(65497);
  return w.result();
}

// src/lib/loaders.ts

export { encodeJpeg };
