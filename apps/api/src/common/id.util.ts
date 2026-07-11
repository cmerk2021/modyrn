import { randomBytes } from 'node:crypto';

const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford's Base32
const ENCODING_LEN = ENCODING.length;
const TIME_LEN = 10;
const RANDOM_LEN = 16;

/**
 * Generates a ULID: a 26-character, lexicographically sortable, URL-safe unique
 * identifier. Used as the primary key for most Modyrn entities.
 *
 * @see https://github.com/ulid/spec
 */
export function ulid(now: number = Date.now()): string {
  return encodeTime(now) + encodeRandom();
}

function encodeTime(now: number): string {
  let time = now;
  let out = '';
  for (let i = TIME_LEN - 1; i >= 0; i--) {
    const mod = time % ENCODING_LEN;
    out = ENCODING[mod] + out;
    time = (time - mod) / ENCODING_LEN;
  }
  return out;
}

function encodeRandom(): string {
  const bytes = randomBytes(RANDOM_LEN);
  let out = '';
  for (let i = 0; i < RANDOM_LEN; i++) {
    out += ENCODING[bytes[i]! % ENCODING_LEN];
  }
  return out;
}
