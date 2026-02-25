/**
 * @fileoverview Bridge to the Code Execution Worker Threads.
 */

'use strict';

const { Worker } = require('worker_threads');
const path = require('path');
const logger = require('../utils/logger');
const { parseError } = require('../utils/errorHandler');

const EXECUTION_TIMEOUT = 3000;

/**
 * Extracts function name using a high-performance regex.
 */
const extractFunctionName = (code) => {
    const declaration = code.match(/function\s+(\w+)\s*\(/);
    if (declaration) return declaration[1];
    const expression = code.match(/(?:const|let|var)\s+(\w+)\s*=\s*(?:function|\(|\w+\s*=>)/);
    if (expression) return expression[1];
    throw new Error('No valid function found.');
};

/**
 * Offloads execution to a Worker Thread.
 * @param {string} code
 * @param {Array} testCases
 * @returns {Promise<Object>}
 */
const executeCode = (code, testCases) => {
    return new Promise((resolve, reject) => {
        let functionName;
        try {
            functionName = extractFunctionName(code);
        } catch (err) {
            const parsed = parseError(err);
            return resolve({
                syntaxError: true,
                errorType: parsed.type,
                message: parsed.message,
                line: parsed.line,
                column: parsed.column
            });
        }

        // CRITICAL: Mongoose documents cannot be cloned by Worker Threads.
        // We must serialize to plain objects first to avoid "[object Array] could not be cloned".
        const plainTestCases = JSON.parse(JSON.stringify(testCases));

        const worker = new Worker(path.join(__dirname, 'codeExecutionWorker.js'), {
            workerData: {
                code,
                testCases: plainTestCases,
                functionName,
                timeout: EXECUTION_TIMEOUT
            }
        });

        const timer = setTimeout(() => {
            worker.terminate();
            resolve({
                success: true,
                errorType: 'TimeoutError',
                message: 'Execution Timed Out (>3000ms)',
                summary: { timeoutOccurred: true }
            });
        }, EXECUTION_TIMEOUT + 500); // 500ms grace for worker overhead

        worker.on('message', (msg) => {
            clearTimeout(timer);
            if (msg.success) {
                resolve(msg);
            } else {
                // Handle critical syntax/runtime errors caught by the worker root
                const parsed = parseError(msg);
                resolve({
                    syntaxError: true,
                    errorType: parsed.type,
                    message: parsed.message,
                    line: parsed.line,
                    column: parsed.column
                });
            }
            worker.terminate();
        });

        worker.on('error', (err) => {
            clearTimeout(timer);
            logger.error(`Worker Error: ${err.message}`);
            resolve({
                success: false,
                message: 'Worker Thread Crash'
            });
            worker.terminate();
        });

        worker.on('exit', (code) => {
            clearTimeout(timer);
            if (code !== 0) {
                logger.error(`Worker stopped with exit code ${code}`);
            }
        });
    });
};

module.exports = { executeCode };
