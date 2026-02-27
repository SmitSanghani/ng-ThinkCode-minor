const dotenv = require('dotenv');
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = 'gemini-3-flash-preview';

/**
 * Service to interact with Google Gemini AI
 */
class AIService {
    /**
     * Get professional feedback for student code
     * @param {string} studentCode - The code written by the student
     * @param {Object} problemContext - Details about the problem (title, difficulty, etc.)
     * @param {Array} history - Previous chat messages for context
     * @returns {Promise<Object>} - JSON feedback object
     */
    async getCodeFeedback(studentCode, problemContext = {}, history = []) {
        if (!GEMINI_API_KEY) {
            throw new Error('Gemini API Key is not configured.');
        }

        const part1 = "You are a Senior Software Engineer and strict Code Mentor. Your job is to analyze student code and give surgical feedback. You NEVER provide full solutions.\n\n";

        const part2 = "STRICT RULES:\n" +
            "1. Do NOT rewrite the full function.\n" +
            "2. Do NOT provide the full working solution.\n" +
            "3. Only fix the specific syntax error if needed.\n" +
            "4. If there is a small typo (missing ;, missing number, missing bracket), you may show the corrected single line only.\n" +
            "5. Explain clearly where the error is, what is wrong, and why the compiler throws this error.\n" +
            "6. Keep explanation short and professional.\n" +
            "7. You may give 1 small pro tip.\n" +
            "8. Do NOT include markdown outside of the JSON structure.\n" +
            "9. Do NOT include full code blocks.\n" +
            "10. Respond ONLY in valid JSON format.\n\n";

        const part3 = "GRADING:\n" +
            "- If code uses optimal approach = Grade A\n" +
            "- If code works but is inefficient = Grade B\n" +
            "- If code is brute force = Grade C\n" +
            "- If syntax errors exist = Grade: Needs Fix\n\n";

        const part4 = `Problem: ${problemContext.title || 'Coding Challenge'}\n` +
            `Student Code:\n\`\`\`\n${studentCode}\n\`\`\`\n\n` +
            `Respond in this JSON format:\n` +
            `{\n` +
            `  "grade": "A | B | C | Needs Fix | N/A",\n` +
            `  "explanation": "Format your response EXACTLY like this inside this string:\\n\\nError Location:\\nLine X:\\n\\nWhat is Wrong:\\n...\\n\\nWhy This Causes Error:\\n...\\n\\nCorrected Line:\\n...\\n\\nAdditional Notes:\\n...",\n` +
            `  "improvementHints": "Pro Tip: ..."\n` +
            `}`;

        // Using system_instruction on v1beta
        const system_instruction = {
            parts: [{ text: part1 + part2 + part3 + part4 }]
        };

        const contents = [];

        // Build contents from history
        if (history && history.length > 0) {
            // Gemini requires alternating roles starting with 'user'
            if (history[0].role === 'assistant' || history[0].role === 'model') {
                contents.push({
                    role: 'user',
                    parts: [{ text: "Please analyze the code provided in your system instructions." }]
                });
            }

            history.forEach(msg => {
                contents.push({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{
                        text: msg.role === 'user' ? msg.content : JSON.stringify({
                            grade: msg.grade,
                            explanation: msg.explanation,
                            improvementHints: msg.hints
                        })
                    }]
                });
            });
        } else {
            // First time request
            contents.push({
                role: 'user',
                parts: [{ text: "Please analyze my code based on the problem description." }]
            });
        }

        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction,
                    contents
                })
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('Gemini API Error details:', JSON.stringify(data, null, 2));
                throw new Error(data.error?.message || 'Failed to get feedback from AI.');
            }

            if (!data.candidates || data.candidates.length === 0) {
                throw new Error('No feedback received from the AI Mentor.');
            }

            let text = data.candidates[0].content.parts[0].text;

            // Clean JSON
            text = text.replace(/```json\n?/, '').replace(/\n?```/, '').trim();

            try {
                return JSON.parse(text);
            } catch (parseErr) {
                console.warn('AI response was not valid JSON, returning as text content:', text);
                return {
                    grade: "N/A",
                    explanation: text,
                    improvementHints: "Follow the mentor style."
                };
            }

        } catch (error) {
            console.error('AIService Error:', error);
            throw error;
        }
    }
}

module.exports = new AIService();
