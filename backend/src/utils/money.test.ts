import { add, sub, mul, div, gte, gt } from '../utils/money';

describe('money utils', () => {
  test('add', () => expect(add('1.5', '2.5')).toBe('4'));
  test('sub', () => expect(sub('10', '3.5')).toBe('6.5'));
  test('sub – insufficient funds', () => expect(() => sub('1', '2')).toThrow('Insufficient funds'));
  test('mul by string', () => expect(mul('100', '0.005')).toBe('0.5'));
  test('mul by number', () => expect(mul('200', 3)).toBe('600'));
  test('div', () => expect(div('9', '3')).toBe('3'));
  test('div by zero', () => expect(() => div('1', '0')).toThrow('Division by zero'));
  test('gte true', () => expect(gte('5', '5')).toBe(true));
  test('gte false', () => expect(gte('4.9', '5')).toBe(false));
  test('gt', () => expect(gt('5.1', '5')).toBe(true));
});
