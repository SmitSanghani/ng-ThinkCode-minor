/**
 * @fileoverview High-Performance Execution Worker.
 * Runs in a separate thread to avoid blocking the Express event loop.
 */

'use strict';

const { parentPort, workerData } = require('worker_threads');
const { VM, VMScript } = require('vm2');

// We re-use the outputMatcher logic inside the worker for speed
// Normalize: parse JSON strings so "[0,1]" becomes [0,1]
function normalize(val) {
    if (typeof val === 'string') {
        try { return JSON.parse(val); } catch (e) { return val; }
    }
    return val;
}

function compareOutputs(actual, expected) {
    actual = normalize(actual);
    expected = normalize(expected);

    if (actual === expected) return true;
    if (actual == null || expected == null) return actual === expected;
    if (typeof actual === 'number' && typeof expected === 'number') {
        if (Number.isNaN(actual) && Number.isNaN(expected)) return true;
        return Math.abs(actual - expected) <= 1e-9;
    }
    if (typeof actual !== typeof expected) return false;
    if (typeof actual !== 'object') return actual === expected;
    if (Array.isArray(actual) && Array.isArray(expected)) {
        if (actual.length !== expected.length) return false;
        for (let i = 0; i < actual.length; i++) {
            if (!compareOutputs(actual[i], expected[i])) return false;
        }
        return true;
    }
    if (Array.isArray(actual) !== Array.isArray(expected)) return false;
    const actualKeys = Object.keys(actual).sort();
    const expectedKeys = Object.keys(expected).sort();
    if (actualKeys.length !== expectedKeys.length) return false;
    for (let i = 0; i < actualKeys.length; i++) {
        const key = actualKeys[i];
        if (key !== expectedKeys[i] || !compareOutputs(actual[key], expected[key])) return false;
    }
    return true;
}

const { code, testCases, functionName, timeout } = workerData;

async function run() {
    const results = [];
    const executionStart = Date.now();
    let maxMemoryUsed = 0;

    try {
        // 1. Pre-compile script once
        const script = new VMScript(code).compile();

        // 2. Single VM instance for all test cases
        const vm = new VM({
            timeout,
            sandbox: {},
            eval: false,
            wasm: false,
            fixAsync: true
        });

        // Load the code into the VM context
        vm.run(script);

        // 3. Execution Loop
        for (const [index, tc] of testCases.entries()) {
            const start = Date.now();
            const memBefore = process.memoryUsage().heapUsed;

            let actualOutput = null;
            let passed = false;
            let error = null;

            try {
                // Call function directly without rebuilding code strings
                const inputValues = Object.values(tc.input);
                // We use vm.run with a pre-built call string for maximum speed
                const callString = `${functionName}(...${JSON.stringify(inputValues)})`;
                actualOutput = vm.run(callString);

                if (tc.expectedOutput !== undefined) {
                    passed = compareOutputs(actualOutput, tc.expectedOutput);
                }
            } catch (runErr) {
                // Return structured error for the specific test case
                error = {
                    type: runErr.name || 'RuntimeError',
                    message: runErr.message,
                    stack: runErr.stack
                };
            }

            const runtime = Date.now() - start;
            const memAfter = process.memoryUsage().heapUsed;
            const memory = Math.max(0, Math.round((memAfter - memBefore) / 1024 / 1024 * 100) / 100);
            maxMemoryUsed = Math.max(maxMemoryUsed, memory);

            results.push({
                testNumber: index + 1,
                input: tc.input,
                expectedOutput: tc.expectedOutput,
                actualOutput,
                passed,
                runtime,
                error
            });
        }

        const totalExecutionTime = Date.now() - executionStart;

        // CRITICAL: vm2 returns proxied values that cannot be cloned by Worker Threads.
        // We must serialize through JSON to strip all proxy state before postMessage.
        const safeResults = JSON.parse(JSON.stringify(results));

        parentPort.postMessage({
            success: true,
            results: safeResults,
            summary: {
                totalExecutionTime,
                avgPerTest: testCases.length > 0 ? Math.round(totalExecutionTime / testCases.length) : 0,
                maxMemoryUsed,
                timeoutOccurred: false
            }
        });

    } catch (criticalErr) {
        parentPort.postMessage({
            success: false,
            errorType: criticalErr.name || 'CriticalError',
            message: criticalErr.message || 'Unknown error occurred'
        });
    }
}

run();
