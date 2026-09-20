import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import path from "node:path";

// Runs the Python pipeline for you, so the web board is the whole app —
// no separate terminal step for day-to-day use. `next dev`'s cwd is this
// `web/` folder (see lib/db.ts's DB_PATH default), so the repo root the
// Python scripts expect to run from is one level up.
const REPO_ROOT = path.join(process.cwd(), "..");
const PYTHON_BIN = process.env.PYTHON_BIN || (process.platform === "win32" ? "python" : "python3");

// No request timeout is imposed here by Next's dev/start server itself,
// but a stuck child process would otherwise hang the request forever —
// this is a personal local tool, not a public endpoint, so a generous
// fixed ceiling (10 min) is just a safety net, not a tuned budget.
const MAX_RUNTIME_MS = 10 * 60 * 1000;

type StepResult = { name: string; ok: boolean; code: number | null; output: string };

function runPython(args: string[], name: string): Promise<StepResult> {
  return new Promise((resolve) => {
    const child = spawn(/*turbopackIgnore: true*/ PYTHON_BIN, ["-m", ...args], { cwd: REPO_ROOT });
    let output = "";
    const timer = setTimeout(() => {
      child.kill();
      output += `\n[timed out after ${MAX_RUNTIME_MS / 1000}s, killed]`;
    }, MAX_RUNTIME_MS);

    child.stdout.on("data", (d) => (output += d.toString()));
    child.stderr.on("data", (d) => (output += d.toString()));
    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({
        name, ok: false, code: null,
        output: output + `\nFailed to start '${PYTHON_BIN}': ${err.message}. ` +
          `Set PYTHON_BIN in web/.env.local if 'python'/'python3' isn't on PATH.`,
      });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ name, ok: code === 0, code, output });
    });
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const runEvaluate = body?.runEvaluate === true;

  const steps: StepResult[] = [];

  const fetchStep = await runPython(["app.main"], "Fetch + filter (app.main)");
  steps.push(fetchStep);

  if (runEvaluate && fetchStep.ok) {
    steps.push(await runPython(["app.ai_evaluate"], "AI evaluation (app.ai_evaluate)"));
  }

  const ok = steps.every((s) => s.ok);
  return NextResponse.json({ ok, steps }, { status: ok ? 200 : 500 });
}
