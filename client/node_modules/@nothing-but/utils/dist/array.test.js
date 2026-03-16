import * as vi from 'vitest';
import * as array from './array.js';
void vi.describe('top_n_with', () => {
    vi.test('x => x', () => {
        const input = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        const r = array.top_n_with(input, 3, x => x);
        vi.expect(r).toEqual([9, 8, 7]);
    });
    vi.test('x => -x', () => {
        const input = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        const r = array.top_n_with(input, 3, x => -x);
        vi.expect(r).toEqual([1, 2, 3]);
    });
    vi.test('x => x % 3', () => {
        const input = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        const r = array.top_n_with(input, 3, x => x % 3);
        vi.expect(r).toEqual([2, 5, 8]);
    });
    vi.test('smaller input', () => {
        const input = [1, 2];
        const r = array.top_n_with(input, 3, x => x);
        vi.expect(r).toEqual([2, 1]);
    });
    vi.test('empty input', () => {
        const input = [];
        const r = array.top_n_with(input, 3, x => x);
        vi.expect(r).toEqual([]);
    });
    vi.test('1 n x => x', () => {
        const input = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        const r = array.top_n_with(input, 1, x => x);
        vi.expect(r).toEqual([9]);
    });
    vi.test('1 n x => -x', () => {
        const input = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        const r = array.top_n_with(input, 1, x => -x);
        vi.expect(r).toEqual([1]);
    });
    vi.test('0 n', () => {
        const input = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        const r = array.top_n_with(input, 0, x => x);
        vi.expect(r).toEqual([]);
    });
});
