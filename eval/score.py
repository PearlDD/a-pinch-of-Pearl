#!/usr/bin/env python3
"""Eval script for the Software Factory — Next.js 14 / TypeScript project.

Runs each eval dimension as a subprocess and outputs JSON to stdout.

Output format:
    {"results": [{"name": str, "score": float, "weight": float, "passed": bool, "details": str}, ...]}
"""

import json
import os
import re
import subprocess
import sys
from pathlib import Path

# All commands run from the project root (repo root, not nextjs-app/).
PROJECT_ROOT = Path(__file__).resolve().parent.parent


def eval_tests() -> dict:
    """Run Jest unit tests."""
    try:
        result = subprocess.run(
            ["bash", "-c", "cd nextjs-app && npm test -- --ci --passWithNoTests 2>&1"],
            capture_output=True,
            text=True,
            timeout=120,
            cwd=str(PROJECT_ROOT),
        )
        output = result.stdout + result.stderr
        match = re.search(r"Tests:.*?(\d+) passed", output)
        if match:
            passed_count = int(match.group(1))
            score = 1.0 if passed_count > 0 else 0.0
            passed = True
            details = f"{passed_count} tests passed"
        elif result.returncode == 0:
            score = 1.0
            passed = True
            details = "Tests passed (no test count found in output)"
        else:
            score = 0.0
            passed = False
            # Check for failed count
            fail_match = re.search(r"Tests:.*?(\d+) failed", output)
            if fail_match:
                details = f"{fail_match.group(1)} tests failed"
            else:
                details = output.strip()[-500:]
        return {
            "name": "tests",
            "score": score,
            "weight": 0.3,
            "passed": passed,
            "details": details,
        }
    except subprocess.TimeoutExpired:
        return {
            "name": "tests",
            "score": 0.0,
            "weight": 0.3,
            "passed": False,
            "details": "Timed out after 120s",
        }


def eval_lint() -> dict:
    """Run ESLint."""
    try:
        result = subprocess.run(
            ["bash", "-c", "cd nextjs-app && npm run lint 2>&1"],
            capture_output=True,
            text=True,
            timeout=120,
            cwd=str(PROJECT_ROOT),
        )
        passed = result.returncode == 0
        score = 1.0 if passed else 0.0
        output = (result.stdout + result.stderr).strip()
        details = output[-500:] if output else ("No lint errors" if passed else "Lint failed")
        return {
            "name": "lint",
            "score": score,
            "weight": 0.2,
            "passed": passed,
            "details": details,
        }
    except subprocess.TimeoutExpired:
        return {
            "name": "lint",
            "score": 0.0,
            "weight": 0.2,
            "passed": False,
            "details": "Timed out after 120s",
        }


def eval_type_check() -> dict:
    """TypeScript type checking."""
    try:
        result = subprocess.run(
            ["bash", "-c", "cd nextjs-app && npx tsc --noEmit 2>&1"],
            capture_output=True,
            text=True,
            timeout=120,
            cwd=str(PROJECT_ROOT),
        )
        passed = result.returncode == 0
        output = (result.stdout + result.stderr).strip()
        if passed:
            score = 1.0
            details = "No type errors"
        else:
            error_lines = [ln for ln in output.splitlines() if "error TS" in ln]
            score = max(0.0, 1.0 - len(error_lines) * 0.1)
            details = f"{len(error_lines)} type errors found" if error_lines else output[-500:]
        return {
            "name": "type_check",
            "score": score,
            "weight": 0.2,
            "passed": passed,
            "details": details,
        }
    except subprocess.TimeoutExpired:
        return {
            "name": "type_check",
            "score": 0.0,
            "weight": 0.2,
            "passed": False,
            "details": "Timed out after 120s",
        }


def eval_build() -> dict:
    """Next.js production build."""
    try:
        result = subprocess.run(
            ["bash", "-c", "cd nextjs-app && npm run build 2>&1"],
            capture_output=True,
            text=True,
            timeout=300,
            cwd=str(PROJECT_ROOT),
        )
        passed = result.returncode == 0
        score = 1.0 if passed else 0.0
        output = (result.stdout + result.stderr).strip()
        details = output[-500:] if output else ("Build succeeded" if passed else "Build failed")
        return {
            "name": "build",
            "score": score,
            "weight": 0.2,
            "passed": passed,
            "details": details,
        }
    except subprocess.TimeoutExpired:
        return {
            "name": "build",
            "score": 0.0,
            "weight": 0.2,
            "passed": False,
            "details": "Timed out after 300s",
        }


def eval_observability() -> dict:
    """Analyze observability coverage in TypeScript/TSX source files."""
    skip = {
        "tests", "test", "__tests__", "node_modules", "__pycache__",
        ".git", ".factory", "eval", "dist", "build", ".next",
    }
    log_pats = [
        r"\bconsole\.(log|warn|error|info|debug)\(",
        r"\blogger\.\w+\(",
        r"\blog\.\w+\(",
    ]
    struct_pats = [r"\bpino\b", r"\bwinston\b", r"\bbunyan\b", r"\bloglevel\b"]
    trace_pats = [
        r"request\.id|req\.id|trace\.id",
        r"\bopentelemetry\b",
        r"trace\.context|TraceContext|span",
        r"x-request-id|x-trace-id",
    ]

    src_dir = PROJECT_ROOT / "nextjs-app" / "src"
    sources = []
    for ext in ("*.ts", "*.tsx"):
        for f in src_dir.rglob(ext):
            if not any(p in f.parts for p in skip):
                sources.append(f)

    total_files = len(sources)
    files_with_logging = 0
    total_log_calls = 0
    has_struct = False
    has_trace = False

    for src in sources:
        try:
            code = src.read_text(errors="replace")
        except OSError:
            continue

        file_has_log = False
        for pat in log_pats:
            matches = re.findall(pat, code)
            total_log_calls += len(matches)
            if matches:
                file_has_log = True
        if file_has_log:
            files_with_logging += 1

        for pat in struct_pats:
            if re.search(pat, code):
                has_struct = True
        for pat in trace_pats:
            if re.search(pat, code, re.IGNORECASE):
                has_trace = True

    if total_files == 0:
        return {
            "name": "observability",
            "score": 0.0,
            "weight": 0.1,
            "passed": True,
            "details": "No source files found to analyze",
        }

    coverage = files_with_logging / total_files
    density = min(1.0, total_log_calls / max(total_files, 1))
    score = (
        0.40 * coverage
        + 0.25 * float(has_struct)
        + 0.20 * float(has_trace)
        + 0.15 * density
    )

    details = (
        f"coverage={coverage:.0%} ({files_with_logging}/{total_files} files), "
        f"structured={'yes' if has_struct else 'no'}, "
        f"tracing={'yes' if has_trace else 'no'}, "
        f"density={density:.0%} ({total_log_calls} calls)"
    )

    return {
        "name": "observability",
        "score": round(score, 3),
        "weight": 0.1,
        "passed": score >= 0.1,
        "details": details,
    }


EVALS = [eval_tests, eval_lint, eval_type_check, eval_build, eval_observability]


def main() -> None:
    results = [fn() for fn in EVALS]
    output = {"results": results}
    json.dump(output, sys.stdout, indent=2)
    print()


if __name__ == "__main__":
    main()
