/**
 * @fileoverview Error parsing and categorization utility for the ThinkCode code execution engine.
 */

'use strict';

/**
 * Known error categories.
 * @readonly
 * @enum {string}
 */
const ERROR_TYPES = {
    SYNTAX: 'SyntaxError',
    REFERENCE: 'ReferenceError',
    TYPE: 'TypeError',
    RANGE: 'RangeError',
    TIMEOUT: 'TimeoutError',
    MEMORY: 'MemoryError',
    RUNTIME: 'RuntimeError',
};

/**
 * Extracts line and column from the stack trace.
 * @param {string} stack
 * @returns {{ line: number|null, column: number|null }}
 */
const extractPosition = (stack) => {
    if (!stack) return { line: null, column: null };
    const match = stack.match(/(?:evalmachine\.<anonymous>|<anonymous>):(\d+):(\d+)/) || stack.match(/:(\d+):(\d+)/);
    return match ? { line: parseInt(match[1], 10), column: parseInt(match[2], 10) } : { line: null, column: null };
};

/**
 * Categorizes the error.
 * @param {Error} error
 * @returns {string}
 */
const categorizeError = (error) => {
    const name = error.name || error.constructor?.name || '';
    const msg = (error.message || '').toLowerCase();

    if (name === 'SyntaxError') return ERROR_TYPES.SYNTAX;
    if (name === 'ReferenceError') return ERROR_TYPES.REFERENCE;
    if (name === 'TypeError') return ERROR_TYPES.TYPE;
    if (name === 'RangeError') return ERROR_TYPES.RANGE;
    if (msg.includes('timed out') || msg.includes('timeout') || name === 'TimeoutError') return ERROR_TYPES.TIMEOUT;
    if (msg.includes('out of memory') || msg.includes('heap')) return ERROR_TYPES.MEMORY;

    return ERROR_TYPES.RUNTIME;
};

/**
 * Parses raw error into structured object.
 * @param {Error} error
 * @returns {Object}
 */
const parseError = (error) => {
    const type = categorizeError(error);
    const { line, column } = extractPosition(error.stack || '');
    let message = error.message;

    if (type === ERROR_TYPES.TIMEOUT) message = 'Time Limit Exceeded (>3s)';
    if (type === ERROR_TYPES.MEMORY) message = 'Memory Limit Exceeded';

    return { type, message, line, column };
};

module.exports = { parseError, ERROR_TYPES };
