import { describe, it, expect } from 'vitest';
import { ATTRIBUTES } from './attribute';

describe('ATTRIBUTES', () => {
  it('contains exactly the five locked attributes', () => {
    expect([...ATTRIBUTES].sort()).toEqual(['AGI', 'HP', 'INT', 'MP', 'STR']);
  });

  it('has no duplicate entries', () => {
    expect(new Set(ATTRIBUTES).size).toBe(ATTRIBUTES.length);
  });
});
