import { num } from "./index.js";
/** Check shallow array equality */
export function equals(a, b) {
    if (a === b)
        return true;
    if (a.length !== b.length)
        return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i])
            return false;
    }
    return true;
}
export function wrap(arr, index) {
    return arr[num.remainder(index, arr.length)];
}
/**
 * Map an array, but only keep non-nullish values.
 *
 * Useful for combining `map` and `filter` into one operation.
 */
export function map_non_nullable(array, fn) {
    const result = Array(array.length);
    let i = 0;
    for (const item of array) {
        const mapped = fn(item);
        if (mapped != null) {
            result[i] = mapped;
            i += 1;
        }
    }
    result.length = i;
    return result;
}
/**
 * Checks if both arrays contain the same values. Order doesn't matter. Arrays must not contain
 * duplicates. (be the same lengths)
 */
export function includes_same_members(a, b) {
    if (a === b)
        return true;
    if (a.length !== b.length)
        return false;
    const copy = b.slice();
    let found = 0;
    a_loop: for (let i = 0; i < a.length; i++) {
        const a_item = a[i];
        for (let j = found; j < b.length; j++) {
            const b_item = copy[j];
            if (a_item === b_item) {
                ;
                [copy[j], copy[found]] = [copy[found], copy[j]];
                found = j + 1;
                continue a_loop;
            }
        }
        return false;
    }
    return true;
}
export function deduped(array) {
    return Array.from(new Set(array));
}
export function mutate_filter(array, predicate) {
    const temp = array.filter(predicate);
    array.length = 0;
    array.push.apply(array, temp);
}
export function unordered_remove(array, idx) {
    [array[idx], array[array.length - 1]] = [array[array.length - 1], array[idx]];
    array.length -= 1;
}
export function remove(array, item) {
    array.splice(array.indexOf(item), 1);
}
export const pick_random = (arr) => arr[num.random_int(arr.length)];
export function pick_random_excliding_one(arr, excluding) {
    let pick_index = num.random_int(arr.length), pick = arr[pick_index];
    if (pick === excluding) {
        pick_index = (pick_index + 1) % arr.length;
        pick = arr[pick_index];
    }
    return pick;
}
export function* random_iterate(arr) {
    const copy = arr.slice();
    while (copy.length) {
        const index = num.random_int(copy.length);
        yield copy.splice(index, 1)[0];
    }
}
/**
 * Push to the end of the array, but shift all items to the left, removing the first item and
 * keeping the length the same.
 */
export function fixedPush(arr, value) {
    const end = arr.length - 1;
    for (let i = 0; i < end; i += 1) {
        arr[i] = arr[i + 1];
    }
    arr[end] = value;
}
/**
 * Push to the end of the array, but shift all items to the left, removing the first item and
 * keeping the length the same.
 */
export function fixedPushMany(arr, ...values) {
    const end = arr.length - values.length;
    for (let i = 0; i < end; i += 1) {
        arr[i] = arr[i + values.length];
    }
    for (let i = 0; i < values.length; i += 1) {
        arr[end + i] = values[i];
    }
}
/**
 * Push to the start of the array, and shift all items to the right, removing the last item and
 * keeping the length the same.
 */
export function fixedUnshift(arr, value) {
    for (let i = arr.length - 1; i > 0; i -= 1) {
        arr[i] = arr[i - 1];
    }
    arr[0] = value;
}
/**
 * Push to the start of the array, and shift all items to the right, removing the last item and
 * keeping the length the same.
 */
export function fixedUnshiftMany(arr, ...values) {
    const end = arr.length - values.length;
    for (let i = end - 1; i >= 0; i -= 1) {
        arr[i + values.length] = arr[i];
    }
    for (let i = 0; i < values.length; i += 1) {
        arr[i] = values[i];
    }
}
/**
 * Returns a new array with {@link top_n} top items from the given {@link arr}. The score is
 * determined by the {@link getScore} function. The returned array is sorted from highest to lowest
 * score.
 */
export const top_n_with = (arr, top_n, getScore) => {
    if (top_n <= 0)
        return [];
    /* highest to lowest */
    const top_items = new Array(top_n);
    const top_scores = new Array(top_n).fill(-Infinity);
    for (let i = 0; i < arr.length; i++) {
        const item = arr[i];
        const score = getScore(item);
        if (score < top_scores[top_n - 1])
            continue;
        let j = top_n - 2;
        while (j >= 0 && top_scores[j] < score) {
            top_items[j + 1] = top_items[j];
            top_scores[j + 1] = top_scores[j];
            j--;
        }
        top_items[j + 1] = item;
        top_scores[j + 1] = score;
    }
    top_items.length = Math.min(top_n, arr.length);
    return top_items;
};
export function binary_search(arr, item) {
    let low = 0, high = arr.length - 1, mid, guess;
    while (low <= high) {
        mid = (low + high) >> 1;
        guess = arr[mid];
        if (guess === item) {
            return mid;
        }
        else if (guess > item) {
            high = mid - 1;
        }
        else {
            low = mid + 1;
        }
    }
    return;
}
export function binary_search_with(arr, item, get_comparable) {
    const search_for = get_comparable(item);
    let low = 0, high = arr.length - 1, mid, guess_item, guess_for;
    while (low <= high) {
        mid = (low + high) >> 1;
        guess_item = arr[mid];
        guess_for = get_comparable(guess_item);
        if (guess_item === item) {
            return mid;
        }
        else if (guess_for === search_for) {
            //
            let i = mid - 1;
            for (; i >= 0 && get_comparable(arr[i]) === guess_for; i--) {
                if (arr[i] === item)
                    return i;
            }
            i = mid + 1;
            for (; i < arr.length && get_comparable(arr[i]) === guess_for; i++) {
                if (arr[i] === item)
                    return i;
            }
        }
        else if (guess_for > search_for) {
            high = mid - 1;
        }
        else {
            low = mid + 1;
        }
    }
    return;
}
export function binary_insert_unique(arr, item) {
    let low = 0, high = arr.length - 1, mid, guess;
    while (low <= high) {
        mid = (low + high) >> 1;
        guess = arr[mid];
        if (guess === item) {
            return;
        }
        else if (guess > item) {
            high = mid - 1;
        }
        else {
            low = mid + 1;
        }
    }
    arr.splice(low, 0, item);
}
export function binary_insert(arr, item) {
    let low = 0, high = arr.length - 1, mid, guess;
    while (low <= high) {
        mid = (low + high) >> 1;
        guess = arr[mid];
        if (guess === item) {
            arr.splice(mid, 0, item);
            return;
        }
        else if (guess > item) {
            high = mid - 1;
        }
        else {
            low = mid + 1;
        }
    }
    arr.splice(low, 0, item);
}
export function binary_insert_with(arr, item, get_comparable) {
    const search_for = get_comparable(item);
    let low = 0, high = arr.length - 1, mid, guess_item, guess_for;
    while (low <= high) {
        mid = (low + high) >> 1;
        guess_item = arr[mid];
        guess_for = get_comparable(guess_item);
        if (guess_for === search_for) {
            arr.splice(mid, 0, item);
            return;
        }
        else if (guess_for > search_for) {
            high = mid - 1;
        }
        else {
            low = mid + 1;
        }
    }
    arr.splice(low, 0, item);
}
