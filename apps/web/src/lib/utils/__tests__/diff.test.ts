import { describe, expect, it } from 'vitest';
import { createDiff, deepEqual, getValueAtPath, type DiffResult } from '../diff';

describe('diff utilities', () => {
  it('deepEqual compares primitives and structures', () => {
    expect(deepEqual(1, 1)).toBe(true);
    expect(deepEqual(1, 2)).toBe(false);
    expect(deepEqual('a', 'a')).toBe(true);
    expect(deepEqual({ a: 1 }, { a: 1 })).toBe(true);
    expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
    expect(deepEqual([1, 2], [1, 2])).toBe(true);
    expect(deepEqual([1, 2], [2, 1])).toBe(false);
  });

  it('createDiff identifies added fields', () => {
    const oldDoc = { a: 1 };
    const newDoc = { a: 1, b: 2 };
    const diff: DiffResult = createDiff(oldDoc, newDoc);
    expect(diff.summary.added).toBeGreaterThan(0);
    const hasAddedB = diff.changes.some((c) => c.path === 'b' && c.type === 'added');
    expect(hasAddedB).toBe(true);
  });

  it('createDiff identifies removed fields', () => {
    const oldDoc = { a: 1, b: 2 };
    const newDoc = { a: 1 };
    const diff: DiffResult = createDiff(oldDoc, newDoc);
    expect(diff.summary.removed).toBeGreaterThan(0);
    const hasRemovedB = diff.changes.some((c) => c.path === 'b' && c.type === 'removed');
    expect(hasRemovedB).toBe(true);
  });

  it('createDiff identifies modified fields and type changes', () => {
    const oldDoc = { a: 1, b: '2' };
    const newDoc = { a: 2, b: 2 };
    const diff: DiffResult = createDiff(oldDoc, newDoc);
    const aChanged = diff.changes.find((c) => c.path === 'a' && c.type === 'modified');
    const bTypeChanged = diff.changes.find((c) => c.path === 'b' && c.type === 'modified');
    expect(aChanged).toBeTruthy();
    expect(bTypeChanged).toBeTruthy();
  });

  it('handles nested objects and arrays', () => {
    const oldDoc = { user: { name: 'alice', tags: ['a', 'b'] } };
    const newDoc = { user: { name: 'alice', tags: ['a', 'b', 'c'] } };
    const diff = createDiff(oldDoc, newDoc);
    const tagAdded = diff.changes.find((c) => c.path.includes('user.tags[2]') && c.type === 'added');
    expect(tagAdded).toBeTruthy();
  });

  it('getValueAtPath reads nested values', () => {
    const doc = { a: { b: [{ c: 1 }] } };
    expect(getValueAtPath(doc, 'a.b[0].c')).toBe(1);
    expect(getValueAtPath(doc, 'a.b[1].c')).toBeUndefined();
  });
});


