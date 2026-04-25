import { cn } from '@/utils/cn';

describe('cn', () => {
  it('returns empty string with no arguments', () => {
    expect(cn()).toBe('');
  });

  it('merges multiple string class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('filters out false', () => {
    expect(cn('foo', false, 'bar')).toBe('foo bar');
  });

  it('filters out undefined', () => {
    expect(cn('foo', undefined, 'bar')).toBe('foo bar');
  });

  it('filters out null', () => {
    expect(cn('foo', null, 'bar')).toBe('foo bar');
  });

  it('handles conditional object syntax', () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
  });

  it('deduplicates conflicting Tailwind padding classes', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('deduplicates conflicting Tailwind text-color classes', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('handles array inputs', () => {
    expect(cn(['a', 'b', 'c'])).toBe('a b c');
  });

  it('merges mixed conditional objects with strings', () => {
    expect(cn('base', { active: true, disabled: false })).toBe('base active');
  });

  it('handles empty string input', () => {
    expect(cn('')).toBe('');
  });

  it('resolves conflicting tailwind variants from mixed sources', () => {
    expect(cn('px-2 py-1', { 'px-4': true })).toBe('py-1 px-4');
  });
});
