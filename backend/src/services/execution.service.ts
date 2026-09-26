import { env } from "../config/env.js";
import { getPistonLanguage, type ExecuteCodeInput, type RunTestCasesInput } from "../validators/execution.schema.js";
import { badRequest } from "../utils/errors.js";

const PISTON_URL = env.pistonUrl;
const TIMEOUT_MS = 10_000;
const MEMORY_LIMIT = 128_000_000;

const PYTHON_PRINT_WRAPPER = (code: string, input: string) => `${code}\n\nprint((${input}))`;
const JS_PRINT_WRAPPER = (code: string, input: string) => `${code}\n\nconsole.log((${input}));`;
const DEFAULT_WRAPPER = (code: string, input: string) => `${code}\n\nprint((${input}))`;

function getPrintWrapper(language: string) {
    const lang = language.toLowerCase();
    if (lang === "javascript" || lang === "typescript" || lang === "nodejs") return JS_PRINT_WRAPPER;
    if (lang === "python" || lang === "python3") return PYTHON_PRINT_WRAPPER;
    return DEFAULT_WRAPPER;
}

type PistonResponse = {
    run: {
        stdout: string;
        stderr: string;
        code: number | null;
        signal: string | null;
        output: string;
        message?: string;
    };
};

async function executeOnPiston(language: string, code: string, stdin: string): Promise<PistonResponse> {
    try {
        const baseUrl = PISTON_URL.replace(/\/$/, "");
        const url = baseUrl.endsWith("/piston/execute")
            ? baseUrl
            : baseUrl.endsWith("/api/v2")
            ? `${baseUrl}/piston/execute`
            : `${baseUrl}/api/v2/piston/execute`;

        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                language: getPistonLanguage(language),
                version: "*",
                files: [{ content: code }],
                stdin,
                run_timeout: TIMEOUT_MS,
                run_memory_limit: MEMORY_LIMIT,
            }),
            signal: AbortSignal.timeout(TIMEOUT_MS + 2000),
        });

        if (!res.ok) {
            const errBody = await res.json().catch(() => ({ message: res.statusText }));
            const msg = (errBody as { message?: string })?.message || `HTTP ${res.status}`;
            throw badRequest(`Code execution failed: ${msg}`);
        }

        return res.json() as Promise<PistonResponse>;
    } catch (err) {
        if (typeof err === "object" && err !== null && "statusCode" in err) throw err;
        throw badRequest(`Code execution service error: ${(err as Error).message}`);
    }
}

export const executionService = {
    async execute(input: ExecuteCodeInput) {
        const result = await executeOnPiston(input.language, input.code, input.stdin ?? "");

        return {
            stdout: result.run.stdout,
            stderr: result.run.stderr,
            exitCode: result.run.code,
            signal: result.run.signal,
            language: input.language,
        };
    },

    async runTestCases(input: RunTestCasesInput) {
        const wrap = getPrintWrapper(input.language);
        const results = await Promise.all(
            input.testCases.map(async (tc, i) => {
                const fullCode = wrap(input.code, tc.input);
                const result = await executeOnPiston(input.language, fullCode, "");

                const actual = result.run.stdout.trim();
                const passed = actual === tc.expected.trim();

                return {
                    index: i,
                    input: tc.input,
                    expected: tc.expected,
                    actual,
                    passed,
                    stderr: result.run.stderr,
                    exitCode: result.run.code,
                };
            })
        );

        const passed = results.filter((r) => r.passed).length;

        return {
            results,
            total: results.length,
            passed,
            failed: results.length - passed,
        };
    },
};
