import { z } from "zod";

const PISTON_LANGUAGES: Record<string, string> = {
    javascript: "javascript",
    typescript: "typescript",
    python: "python",
    java: "java",
    c: "c",
    cpp: "c++",
    go: "go",
    rust: "rust",
    ruby: "ruby",
    php: "php",
    swift: "swift",
    kotlin: "kotlin",
    csharp: "c#",
    scala: "scala",
    r: "r",
    bash: "bash",
    sql: "sql",
};

export const executeCodeSchema = z.object({
    language: z.string().trim().min(1).max(50),
    code: z.string().min(1).max(50000),
    stdin: z.string().max(10000).optional().default(""),
});

export const runTestCasesSchema = z.object({
    language: z.string().trim().min(1).max(50),
    code: z.string().min(1).max(50000),
    testCases: z.array(z.object({
        input: z.string().max(5000),
        expected: z.string().max(5000),
    })).min(1).max(20),
});

export type ExecuteCodeInput = z.infer<typeof executeCodeSchema>;
export type RunTestCasesInput = z.infer<typeof runTestCasesSchema>;

export function getPistonLanguage(lang: string): string {
    return PISTON_LANGUAGES[lang.toLowerCase()] ?? lang.toLowerCase();
}
