import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function md5(str: string) {
  const s = unescape(encodeURIComponent(str));
  const l = s.length;
  const n = ((l + 8) >> 6) + 1;
  const words = new Uint32Array(n * 16);
  for (let i = 0; i < l; i++) {
    words[i >> 2] |= s.charCodeAt(i) << ((i % 4) * 8);
  }
  words[l >> 2] |= 0x80 << ((l % 4) * 8);
  words[n * 16 - 2] = l * 8;

  let a = 0x67452301;
  let b = 0xefcdab89;
  let c = 0x98badcfe;
  let d = 0x10325476;

  const rotate = (x: number, s: number) => (x << s) | (x >>> (32 - s));

  const k = new Uint32Array(64);
  for (let i = 0; i < 64; i++) k[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296);

  const r = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
  ];

  for (let i = 0; i < n; i++) {
    const aa = a;
    const bb = b;
    const cc = c;
    const dd = d;
    for (let j = 0; j < 64; j++) {
      let f, g;
      if (j < 16) {
        f = (b & c) | (~b & d);
        g = j;
      } else if (j < 32) {
        f = (d & b) | (~d & c);
        g = (5 * j + 1) % 16;
      } else if (j < 48) {
        f = b ^ c ^ d;
        g = (3 * j + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * j) % 16;
      }
      const temp = d;
      d = c;
      c = b;
      b = (b + rotate((a + f + k[j] + words[i * 16 + g]) | 0, r[j])) | 0;
      a = temp;
    }
    a = (a + aa) | 0;
    b = (b + bb) | 0;
    c = (c + cc) | 0;
    d = (d + dd) | 0;
  }

  const hex = (n: number) => {
    let s = '';
    for (let j = 0; j < 4; j++) {
      const v = (n >> (j * 8)) & 0xff;
      s += '0123456789abcdef'.charAt((v >> 4) & 0x0f) + '0123456789abcdef'.charAt(v & 0x0f);
    }
    return s;
  };
  return hex(a) + hex(b) + hex(c) + hex(d);
}
