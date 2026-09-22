export function number(value, name, min = 0, max = 1e13) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max)
    throw new RangeError(`${name}: cần số hữu hạn trong [${min}, ${max}]`);
  return value;
}
export function integer(value, name, min = 0, max = 1e13) {
  number(value, name, min, max);
  if (!Number.isSafeInteger(value)) throw new RangeError(`${name}: cần số nguyên an toàn`);
  return value;
}
export function text(value, name) {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${name}: không được trống`);
  return value;
}
