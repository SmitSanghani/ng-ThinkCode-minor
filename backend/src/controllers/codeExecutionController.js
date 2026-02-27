/**
 * @fileoverview Senior Backend: Code Execution Controller.
 * Handles rate limiting, validation, and branching execution logic.
 */

'use strict';

const Joi = require('joi');
const Question = require('../models/question.model');
const { executeCode } = require('../services/codeExecutionEngine');
const logger = require('../utils/logger');

// In-memory rate limiter (10 runs / minute)
const rateLimits = new Map();
const LIMIT = 10;
const WINDOW = 60000;

const isRateLimited = (userId) => {
    const now = Date.now();
    const userLimit = rateLimits.get(userId) || { count: 0, resetAt: now + WINDOW };

    if (now > userLimit.resetAt) {
        userLimit.count = 1;
        userLimit.resetAt = now + WINDOW;
    } else {
        userLimit.count++;
    }

    rateLimits.set(userId, userLimit);
    return userLimit.count > LIMIT;
};

const executeSchema = Joi.object({
    problemId: Joi.string().hex().length(24).required(),
    code: Joi.string().min(1).max(10000).required(),
    customInput: Joi.object().optional(),
    language: Joi.string().valid('javascript').required()
});

class CodeExecutionController {
    /**
     * POST /api/student/execute-code
     */
    async executeCode(req, res) {
        try {
            const userId = req.user._id.toString();

            if (isRateLimited(userId)) {
                return res.status(429).json({ success: false, message: 'Rate limit exceeded. Try again later.' });
            }

            const { error: valError, value: body } = executeSchema.validate(req.body);
            if (valError) return res.status(400).json({ success: false, message: valError.details[0].message });

            const { problemId, code, customInput } = body;
            const problem = await Question.findById(problemId);
            if (!problem) return res.status(404).json({ success: false, message: 'Problem not found.' });

            // Branching Logic: Custom Input vs DB Testcases
            const testCases = customInput ? [{ input: customInput }] : problem.testCases;

            const execution = await executeCode(code, testCases);

            // Handle Syntax Errors (Requirement 5)
            if (execution.syntaxError) {
                const codeLines = code.split('\n');
                const faultyLine = execution.line ? codeLines[execution.line - 1] : null;

                return res.status(200).json({
                    success: true,
                    errorType: execution.errorType,
                    message: execution.message,
                    line: execution.line,
                    column: execution.column,
                    codeLine: faultyLine
                });
            }

            // Handle Custom Run Response (Requirement 5)
            if (customInput) {
                const result = execution.results[0];
                return res.status(200).json({
                    success: true,
                    customRun: true,
                    input: result.input,
                    output: result.actualOutput,
                    runtime: result.runtime,
                    error: result.error,
                    performance: execution.summary
                });
            }

            // Handle DB Testcases Response (Requirement 5)
            const summary = {
                totalTests: execution.results.length,
                passed: execution.results.filter(r => r.passed).length,
                failed: execution.results.filter(r => !r.passed).length,
                allPassed: execution.results.every(r => r.passed),
                ...execution.summary // Include totalExecutionTime, avgPerTest, etc.
            };

            // ✅ Log to backend terminal when all test cases pass
            if (summary.allPassed) {
                logger.info(
                    `✅ ALL PASSED | Student: ${userId} | Problem: ${problemId} | ` +
                    `Tests: ${summary.totalTests} | ` +
                    `TotalTime: ${summary.totalExecutionTime}ms | ` +
                    `AvgPerTest: ${summary.avgPerTest}ms`
                );
            }

            return res.status(200).json({
                success: true,
                results: execution.results,
                summary,
                canSubmit: summary.allPassed
            });

        } catch (err) {
            logger.error(`Critical Error in Controller: ${err.stack || err.message}`);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }
}

module.exports = new CodeExecutionController();
