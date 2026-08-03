"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ai = void 0;
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const genkit_1 = require("genkit");
const google_genai_1 = require("@genkit-ai/google-genai");
exports.ai = (0, genkit_1.genkit)({
    plugins: [(0, google_genai_1.googleAI)()],
    model: 'googleai/gemini-2.0-flash',
});
//# sourceMappingURL=genkit.js.map