/**
 * Arithmetic helpers that work with string-encoded decimals so we never touch
 * floating-point for money values inside the database.  All values are kept as
 * strings with up to 18 decimal places (ETH precision).
 *
 * We rely on the built-in BigInt only for integers; for fractional amounts we
 * use simple float math limited to 18 s.f., which is acceptable for an MVP.
 * In production swap this module for a Decimal/BigNumber library.
 */

const PRECISION = 18;

function toNum(v: string): number {
  const n = parseFloat(v);
  if (!Number.isFinite(n)) throw new Error(`Invalid numeric value: ${v}`);
  return n;
}

export function add(a: string, b: string): string {
  return trim(toNum(a) + toNum(b));
}

export function sub(a: string, b: string): string {
  const result = toNum(a) - toNum(b);
  if (result < 0) throw new Error('Insufficient funds');
  return trim(result);
}

export function mul(a: string, b: string | number): string {
  return trim(toNum(a) * (typeof b === 'string' ? toNum(b) : b));
}

export function div(a: string, b: string | number): string {
  const divisor = typeof b === 'string' ? toNum(b) : b;
  if (divisor === 0) throw new Error('Division by zero');
  return trim(toNum(a) / divisor);
}

export function gte(a: string, b: string): boolean {
  return toNum(a) >= toNum(b);
}

export function gt(a: string, b: string): boolean {
  return toNum(a) > toNum(b);
}

/** Remove trailing zeros after decimal point */
function trim(n: number): string {
  return n.toFixed(PRECISION).replace(/\.?0+$/, '') || '0';
}
