/**
 * @fileoverview Output comparison utility for the ThinkCode code execution engine.
 * Performs deep, type-aware equality checks between student output and expected output.
 */

'use strict';

/** Epsilon used for floating-point tolerance comparisons. */
const FLOAT_EPSILON = 1e-9;

/**
 * Compares two floating-point numbers within a tolerance.
 * @param {number} a
 * @param {number} b
 * @returns {boolean}
 */
const floatEquals = (a, b) => {
    if (a === b) return true;
    return Math.abs(a - b) <= FLOAT_EPSILON;
};

/**
 * Recursively compares two values for deep equality.
 * 
 * Rules:
 *  - Primitives: strict equality
 *  - Numbers: floating point tolerance
 *  - Arrays: ordered comparison
 *  - Objects: order independent keys
 *  - NaN, Infinity, null/undefined handled
 *
 * @param {*} actual   - Value returned by student code
 * @param {*} expected - Expected value from test case
 * @returns {boolean}
 */
const compareOutputs = (actual, expected) => {
    // 1. Strict identity
    if (actual === expected) return true;

    // 2. Handle null / undefined
    if (actual == null || expected == null) return actual === expected;

    // 3. Handle NaN
    if (typeof actual === 'number' && typeof expected === 'number') {
        if (Number.isNaN(actual) && Number.isNaN(expected)) return true;
        return floatEquals(actual, expected);
    }

    // 4. Type mismatch
    if (typeof actual !== typeof expected) return false;

    // 5. Strings and booleans
    if (typeof actual !== 'object') return actual === expected;

    // 6. Array comparison (ordered)
    if (Array.isArray(actual) && Array.isArray(expected)) {
        if (actual.length !== expected.length) return false;
        for (let i = 0; i < actual.length; i++) {
            if (!compareOutputs(actual[i], expected[i])) return false;
        }
        return true;
    }

    // One is array, other is object
    if (Array.isArray(actual) !== Array.isArray(expected)) return false;

    // 7. Object comparison (key order independent)
    const actualKeys = Object.keys(actual).sort();
    const expectedKeys = Object.keys(expected).sort();

    if (actualKeys.length !== expectedKeys.length) return false;
    for (let i = 0; i < actualKeys.length; i++) {
        const key = actualKeys[i];
        if (key !== expectedKeys[i]) return false;
        if (!compareOutputs(actual[key], expected[key])) return false;
    }

    return true;
};

module.exports = { compareOutputs };
