import { describe, it, expect } from 'vitest';
import { Character } from './character';

const BASE_STATS = { HP: 100, MP: 50, STR: 8, AGI: 10, INT: 6 };

describe('Character.getStat', () => {
  // Step 3.1 — milestone acceptance test
  it('returns base + flat modifier for the same attribute (headline acceptance test)', () => {
    const c = new Character(BASE_STATS, [
      { attribute: 'AGI', kind: 'flat', value: 5 },
    ]);
    expect(c.getStat('AGI')).toBe(15);
  });

  it('computes on every read without storing a result', () => {
    const c = new Character(BASE_STATS, [
      { attribute: 'AGI', kind: 'flat', value: 5 },
    ]);
    // Call twice — must return the same value both times (no mutation side-effect)
    expect(c.getStat('AGI')).toBe(15);
    expect(c.getStat('AGI')).toBe(15);
  });

  // Step 3.2 — attribute isolation
  it('ignores modifiers targeting a different attribute', () => {
    const c = new Character(BASE_STATS, [
      { attribute: 'STR', kind: 'flat', value: 5 },
    ]);
    expect(c.getStat('AGI')).toBe(10);
  });

  it('returns exact base value for an attribute with no modifiers', () => {
    const c = new Character(BASE_STATS, []);
    expect(c.getStat('HP')).toBe(100);
  });

  it('applies mixed modifiers only to the correct attribute', () => {
    const c = new Character(BASE_STATS, [
      { attribute: 'AGI', kind: 'flat', value: 5 },
      { attribute: 'AGI', kind: 'percentage', value: 0.1 },
    ]);
    // (10 + 5) * 1.1 = 16.5
    expect(c.getStat('AGI')).toBeCloseTo(16.5);
    // STR is unaffected
    expect(c.getStat('STR')).toBe(8);
  });
});
