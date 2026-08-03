require('dotenv').config();
const { Client } = require('pg');
const http = require('http');
const jwt = require('jsonwebtoken');

const API_HOST = process.env.API_HOST || '127.0.0.1';
const API_PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_ACCESS_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_ACCESS_SECRET not found in environment — check .env is in this directory");
}

const dbConfig = {
  host: process.env.PGHOST || '127.0.0.1',
  port: parseInt(process.env.PGPORT || '5433', 10),
  database: process.env.PGDATABASE || 'exam_system',
  user: process.env.PGUSER || 'app_exam',
  password: process.env.PGPASSWORD || 'judge0',
};

const QUESTION_ID = 122;

// ============================================================
// Reusable code snippets
// ============================================================

const CODE_NO_LOOP_UNGUARDED = `void swapPointers(int** ptrA, int** ptrB) {
    int* temp = *ptrA;
    *ptrA = *ptrB;
    *ptrB = temp;
}`;

const CODE_WITH_LOOP_GUARDED = `void swapPointers(int** ptrA, int** ptrB) {
    for (int i = 0; i < 1; i++) {
        if (ptrA && ptrB) {
            int* temp = *ptrA;
            *ptrA = *ptrB;
            *ptrB = temp;
        }
    }
}`;

const CODE_RAW_ALLOC_WRONG_LOGIC = `void swapPointers(int** ptrA, int** ptrB) {
    int* temp = new int(**ptrA);
    *ptrA = *ptrB;
    *ptrB = *ptrB;
    delete temp;
}`;

const CODE_TYPO_VARIABLE = `void swapPointers(int** ptrA, int** ptrB) {
    int* temp = *ptrA;
    *ptrA = *ptrB;
    *ptrB = tempPtr;
}`;

const CODE_MISSING_PAREN = `void swapPointers(int** ptrA, int** ptrB) {
    if (ptrA && ptrB {
        int* temp = *ptrA;
        *ptrA = *ptrB;
        *ptrB = temp;
    }
}`;

const CODE_TYPO_TEMPLATE_FUNC = `void swapPointers(int** ptrA, int** ptrB) {
    auto guard = std::make_uniq<int>(0);
    if (ptrA && ptrB) {
        int* temp = *ptrA;
        *ptrA = *ptrB;
        *ptrB = temp;
    }
}`;

const CODE_STRAY_CHARACTER = `void swapPointers(int** ptrA, int** ptrB) {
    int* temp = *ptrA;
    *ptrA = *ptrB;
    *ptrB = temp;
    §
}`;

const CODE_LOGARITHMIC_PASS = `void swapPointers(int** ptrA, int** ptrB) {
    for (int i = 16; i > 0; i /= 2) {
        if (ptrA && ptrB) {
            int* temp = *ptrA;
            *ptrA = *ptrB;
            *ptrB = temp;
        }
    }
}`;

const CODE_LOGARITHMIC_FAIL = `void swapPointers(int** ptrA, int** ptrB) {
    for (int i = 0; i < 1; i++) {
        if (ptrA && ptrB) {
            int* temp = *ptrA;
            *ptrA = *ptrB;
            *ptrB = temp;
        }
    }
}`;

const CODE_INCLUDE_INJECTION = `#include <iostream>
${CODE_WITH_LOOP_GUARDED}`;

const CODE_USING_NAMESPACE_INJECTION = `using namespace std;
${CODE_WITH_LOOP_GUARDED}`;

const CODE_MAIN_INJECTION = `${CODE_WITH_LOOP_GUARDED}

int main() {
    return 0;
}`;

const CODE_MISSING_SEMICOLON = `void swapPointers(int** ptrA, int** ptrB) {
    int* temp = *ptrA
    *ptrA = *ptrB;
    *ptrB = temp;
}`;

const CODE_UNCLOSED_BRACE = `void swapPointers(int** ptrA, int** ptrB) {
    int* temp = *ptrA;
    *ptrA = *ptrB;
    *ptrB = temp;`; // missing closing brace

// 16 sequential branches to try to push cyclomatic complexity past a "> 15" threshold
const highComplexityBranches = Array.from({ length: 16 }, (_, i) =>
  `    if (ptrA && *ptrA && **ptrA == ${i}) { /* branch ${i} */ }`
).join('\n');
const CODE_HIGH_COMPLEXITY = `void swapPointers(int** ptrA, int** ptrB) {
${highComplexityBranches}
    int* temp = *ptrA;
    *ptrA = *ptrB;
    *ptrB = temp;
}`;

// Direct self-recursion: swapPointers calls itself once (guarded by a static
// depth counter so it terminates and is safe to invoke across multiple stdin
// lines in the same harness process). Functionally equivalent to
// CODE_WITH_LOOP_GUARDED (nullptr-guarded, correct swap), so black-box should
// fully pass — isolates the recursion structural check.
const CODE_RECURSION_DIRECT_SELF_CALL = `void swapPointers(int** ptrA, int** ptrB) {
    static int recursionDepth = 0;
    if (recursionDepth > 0) {
        if (ptrA && ptrB) {
            int* temp = *ptrA;
            *ptrA = *ptrB;
            *ptrB = temp;
        }
        return;
    }
    recursionDepth++;
    swapPointers(ptrA, ptrB);
    recursionDepth--;
}`;

// Mutual/indirect recursion: swapPointers calls swapHelper, swapHelper calls
// swapPointers back — neither function calls itself directly. This is the
// actual new capability added by the detectRecursion rewrite (call-graph
// reachability vs. direct self-call check). Custom boilerplate substitutes
// this whole block at file scope via [[STUDENT_CODE_ZONE]], so the forward
// declaration and global guard variable are valid C++ here.
const CODE_RECURSION_MUTUAL_INDIRECT = `int g_recursionGuard = 0;

void swapHelper(int** ptrA, int** ptrB);

void swapPointers(int** ptrA, int** ptrB) {
    if (g_recursionGuard > 0) {
        if (ptrA && ptrB) {
            int* temp = *ptrA;
            *ptrA = *ptrB;
            *ptrB = temp;
        }
        return;
    }
    g_recursionGuard++;
    swapHelper(ptrA, ptrB);
    g_recursionGuard--;
}

void swapHelper(int** ptrA, int** ptrB) {
    swapPointers(ptrA, ptrB);
}`;

// Explicit unique_ptr type declaration — should hit the `template_type`
// branch that detectSmartPointers actually checks.
const CODE_SMART_POINTER_EXPLICIT_TYPE = `void swapPointers(int** ptrA, int** ptrB) {
    std::unique_ptr<int> guard = std::make_unique<int>(0);
    if (ptrA && ptrB) {
        int* temp = *ptrA;
        *ptrA = *ptrB;
        *ptrB = temp;
    }
}`;

// Same idea via `auto` — no explicit unique_ptr/shared_ptr type token ever
// appears in the source; only a template_function call (make_unique<int>)
// does. detectSmartPointers only scans template_type nodes, so this is
// expected (per source reading) to NOT be detected — testing the exact gap
// flagged in Open Item #3.
const CODE_SMART_POINTER_AUTO_MAKE_UNIQUE = `void swapPointers(int** ptrA, int** ptrB) {
    auto guard = std::make_unique<int>(0);
    if (ptrA && ptrB) {
        int* temp = *ptrA;
        *ptrA = *ptrB;
        *ptrB = temp;
    }
}`;

const RULES_LOOP_AND_RAWPTR = JSON.stringify([
  { type: 'REQUIRE', target: 'loop', description: 'Must use a loop', weight: 40 },
  { type: 'FORBID', target: 'raw_pointers', description: 'No new/delete allowed', weight: 30 },
]);

const RULES_EMPTY = JSON.stringify([]);

const RULES_UNBALANCED_WEIGHTS = JSON.stringify([
  { type: 'REQUIRE', target: 'loop', description: 'Must use a loop', weight: 50 },
  { type: 'FORBID', target: 'raw_pointers', description: 'No new/delete allowed', weight: 70 },
]);

const RULES_RECURSION_REQUIRED = JSON.stringify([
  { type: 'REQUIRE', target: 'recursion', description: 'Must implement the swap via recursion (direct or mutual)', weight: 40 },
  { type: 'FORBID', target: 'raw_pointers', description: 'No new/delete allowed', weight: 30 },
]);

const RULES_SMART_POINTERS_REQUIRED = JSON.stringify([
  { type: 'REQUIRE', target: 'smart_pointers', description: 'Must use a smart pointer (unique_ptr/shared_ptr)', weight: 40 },
]);

// ============================================================
// Test case definitions
// structural_rules: null = don't touch (leave whatever is currently set)
// expect: { type: 'exact', value, tolerance } | { type: 'note' } — 'note' cases
//          just print full output for manual review, no pass/fail assertion
// ============================================================

const TEST_CASES = [
  {
    name: 'baseline_blend_regression',
    description: 'Known-good blend: no loop, no raw ptr misuse, fails nullptr edge case',
    structuralRules: RULES_LOOP_AND_RAWPTR,
    code: CODE_NO_LOOP_UNGUARDED,
    expect: { type: 'exact', value: 6.8, tolerance: 0.01 },
  },
  {
    name: 'full_pass_boundary',
    description: 'Loop present, no raw ptr, passes all test cases including nullptr guard',
    structuralRules: RULES_LOOP_AND_RAWPTR,
    code: CODE_WITH_LOOP_GUARDED,
    expect: { type: 'exact', value: 10.0, tolerance: 0.01 },
  },
  {
    name: 'full_fail_boundary',
    description: 'No loop, raw new/delete, wrong swap logic',
    structuralRules: RULES_LOOP_AND_RAWPTR,
    code: CODE_RAW_ALLOC_WRONG_LOGIC,
    expect: { type: 'note' },
  },
  {
    name: 'empty_structural_rules_fallback',
    description: 'structural_rules=[] should force effectiveWeightBb=1.0, S_wb ignored entirely',
    structuralRules: RULES_EMPTY,
    code: CODE_NO_LOOP_UNGUARDED,
    expect: { type: 'exact', value: 7.0, tolerance: 0.01 },
  },
  {
    name: 'hard_gate_include',
    description: 'Raw code containing #include should force S_wb=0 regardless of structural rules',
    structuralRules: RULES_LOOP_AND_RAWPTR,
    code: CODE_INCLUDE_INJECTION,
    expect: { type: 'note' },
  },
  {
    name: 'hard_gate_using_namespace',
    description: 'Raw code containing "using namespace" should force S_wb=0',
    structuralRules: RULES_LOOP_AND_RAWPTR,
    code: CODE_USING_NAMESPACE_INJECTION,
    expect: { type: 'note' },
  },
  {
    name: 'hard_gate_main_defined',
    description: 'Raw code defining main() should force S_wb=0 (and likely breaks compilation via duplicate main)',
    structuralRules: RULES_LOOP_AND_RAWPTR,
    code: CODE_MAIN_INJECTION,
    expect: { type: 'note' },
  },
  {
    name: 'syntax_error_missing_semicolon',
    description: 'Missing semicolon — does white-box still score via tree-sitter error tolerance despite compile failure?',
    structuralRules: RULES_LOOP_AND_RAWPTR,
    code: CODE_MISSING_SEMICOLON,
    expect: { type: 'note' },
  },
  {
    name: 'syntax_error_unclosed_brace',
    description: 'Unclosed brace — more severe malformed input for tree-sitter',
    structuralRules: RULES_LOOP_AND_RAWPTR,
    code: CODE_UNCLOSED_BRACE,
    expect: { type: 'note' },
  },
  {
    name: 'unbalanced_rule_weights',
    description: 'Custom rule weights sum to 120 (not 100) — check whether engine normalizes by actual total',
    structuralRules: RULES_UNBALANCED_WEIGHTS,
    code: CODE_NO_LOOP_UNGUARDED,
    expect: { type: 'note' },
    predicted: 'If normalized by actual weight sum (30 complexity + 0 security + 50 loop + 70 rawptr = 150): ' +
      'earned=30+0+0+70=100 -> S_wb=0.667 -> blended=0.8*0.7+0.2*0.667=0.693 -> grade≈6.93',
  },
  {
    name: 'high_cyclomatic_complexity',
    description: '16 sequential branches — tests whether the default Cyclomatic Complexity SCORE rule actually penalizes above threshold',
    structuralRules: RULES_LOOP_AND_RAWPTR,
    code: CODE_HIGH_COMPLEXITY,
    expect: { type: 'note' },
  },
  {
    name: 'recursion_direct_self_call',
    description: 'Regression check: direct self-recursion (f calls f) must still be detected after the mutual-recursion rewrite. ' +
      'Functionally correct + nullptr-guarded, so black-box should fully pass.',
    structuralRules: RULES_RECURSION_REQUIRED,
    code: CODE_RECURSION_DIRECT_SELF_CALL,
    expect: { type: 'exact', value: 10.0, tolerance: 0.01 },
    predicted: 'complexity(30, full)+recursion(40, detected)+rawptr(30, none used)=100/100 -> S_wb=1.0; ' +
      'functionally correct & guarded -> S_bb=1.0; blended=0.8*1+0.2*1=1.0 -> grade=10.0',
  },
  {
    name: 'recursion_mutual_indirect',
    description: 'New capability under test: mutual/indirect recursion (A calls B, B calls A, neither calls itself ' +
      'directly) must be detected via call-graph reachability, not just direct self-calls. This is the actual fix ' +
      'from Open Item #2 — zero coverage before this case.',
    structuralRules: RULES_RECURSION_REQUIRED,
    code: CODE_RECURSION_MUTUAL_INDIRECT,
    expect: { type: 'exact', value: 10.0, tolerance: 0.01 },
    predicted: 'complexity(30, full)+recursion(40, detected via reachability)+rawptr(30, none used)=100/100 -> S_wb=1.0; ' +
      'functionally correct & guarded -> S_bb=1.0; blended=0.8*1+0.2*1=1.0 -> grade=10.0',
  },
  {
    name: 'recursion_negative_control_iterative',
    description: 'False-positive guard: iterative code (loop-based, no recursive calls at all — reuses the known-good ' +
      'loop-guarded swap) must NOT be flagged as recursive by the rewritten reachability check. Required because the ' +
      'rewrite is a graph traversal now, not a simple name match, so it is worth confirming it doesn\'t over-fire.',
    structuralRules: RULES_RECURSION_REQUIRED,
    code: CODE_WITH_LOOP_GUARDED,
    expect: { type: 'exact', value: 9.2, tolerance: 0.01 },
    predicted: 'complexity(30, full)+recursion(0, correctly not detected)+rawptr(30, none used)=60/100 -> S_wb=0.6; ' +
      'same logic as full_pass_boundary -> S_bb=1.0; blended=0.8*1+0.2*0.6=0.92 -> grade=9.2',
  },
  {
    name: 'smart_pointers_explicit_type',
    description: 'REQUIRE smart_pointers with an explicit std::unique_ptr<int> type declaration — should hit the ' +
      'template_type node branch that detectSmartPointers actually scans.',
    structuralRules: RULES_SMART_POINTERS_REQUIRED,
    code: CODE_SMART_POINTER_EXPLICIT_TYPE,
    expect: { type: 'exact', value: 10.0, tolerance: 0.01 },
    predicted: 'complexity(30, full)+smart_pointers(40, detected via template_type)=70/70 -> S_wb=1.0; ' +
      'functionally correct & guarded -> S_bb=1.0; blended=0.8*1+0.2*1=1.0 -> grade=10.0',
  },
  {
    name: 'smart_pointers_auto_make_unique',
    description: 'Suspected gap (Open Item #3): `auto guard = std::make_unique<int>(...)` never spells out ' +
      'unique_ptr/shared_ptr as a type — only a template_function call node exists. detectSmartPointers only checks ' +
      'descendantsOfType("template_type"), so per source reading this should silently NOT detect the smart pointer ' +
      'usage despite make_unique clearly being used. Marked as a note rather than an exact assertion since this ' +
      'depends on tree-sitter-cpp grammar specifics not independently verified against a live parse.',
    structuralRules: RULES_SMART_POINTERS_REQUIRED,
    code: CODE_SMART_POINTER_AUTO_MAKE_UNIQUE,
    expect: { type: 'note' },
    predicted: 'IF the suspected gap is real: complexity(30, full)+smart_pointers(0, NOT detected)=30/70 -> S_wb≈0.4286; ' +
      'S_bb=1.0 (functionally identical to the explicit-type case) -> blended=0.8*1+0.2*0.4286≈0.8857 -> grade≈8.86. ' +
      'If instead it DOES detect (grammar assumption wrong), expect 10.0 matching smart_pointers_explicit_type.',
  },
  {
    name: 'grace_mode_missing_semicolon',
    description: 'Tests Grace Mode: code fails to compile due to a missing semicolon, but has high AST health, so it should receive partial credit via the grace cap.',
    structuralRules: RULES_LOOP_AND_RAWPTR,
    code: CODE_MISSING_SEMICOLON,
    expect: { type: 'note' }, // set to 'note' first to inspect the exact AST health and score output
    predicted: 'Compilation fails; H_ast should be >= 0.90, triggering grace mode award (S_bb = 0.15 * H_ast).',
  },
  {
    name: 'grace_mode_typo_variable',
    description: 'Minor error edge case: typo in variable name (undeclared identifier). Tests AST health and grace award.',
    structuralRules: RULES_LOOP_AND_RAWPTR,
    code: CODE_TYPO_VARIABLE,
    expect: { type: 'note' },
    predicted: 'Compilation fails due to undeclared tempPtr; AST health should remain high, triggering grace award.',
  },
  {
    name: 'grace_mode_missing_paren',
    description: 'Minor error edge case: missing closing parenthesis in if statement. Tests parser error tolerance.',
    structuralRules: RULES_LOOP_AND_RAWPTR,
    code: CODE_MISSING_PAREN,
    expect: { type: 'note' },
    predicted: 'Compilation fails due to syntax error; checking if AST health stays above 0.90 threshold.',
  },
  {
    name: 'grace_mode_typo_template_func',
    description: 'Minor error edge case: misspelled template function call (make_uniq).',
    structuralRules: RULES_SMART_POINTERS_REQUIRED,
    code: CODE_TYPO_TEMPLATE_FUNC,
    expect: { type: 'note' },
    predicted: 'Compilation fails on unknown function; evaluates how structure score and grace interact.',
  },
  {
    name: 'grace_mode_stray_character',
    description: 'Minor error edge case: completely invalid random token inserted into otherwise clean code.',
    structuralRules: RULES_LOOP_AND_RAWPTR,
    code: CODE_STRAY_CHARACTER,
    expect: { type: 'note' },
    predicted: 'Compilation fails on invalid token; tests how tree-sitter handles unexpected symbols for health calculation.',
  },
  {
    name: 'logarithmic_complexity_pass',
    description: 'Tests logarithmic complexity requirement with a valid log-scale loop (i /= 2).',
    structuralRules: JSON.stringify([
      { type: 'REQUIRE', target: 'logarithmic_complexity', description: 'Must implement a logarithmic complexity algorithm', weight: 40 },
      { type: 'FORBID', target: 'raw_pointers', description: 'No new/delete allowed', weight: 30 }
    ]),
    code: CODE_LOGARITHMIC_PASS,
    expect: { type: 'note' },
    predicted: 'Logarithmic loop is detected; structural score passes successfully.',
  },
  {
    name: 'logarithmic_complexity_fail',
    description: 'Negative control: standard linear loop should fail the logarithmic complexity requirement.',
    structuralRules: JSON.stringify([
      { type: 'REQUIRE', target: 'logarithmic_complexity', description: 'Must implement a logarithmic complexity algorithm', weight: 40 },
      { type: 'FORBID', target: 'raw_pointers', description: 'No new/delete allowed', weight: 30 }
    ]),
    code: CODE_LOGARITHMIC_FAIL,
    expect: { type: 'note' },
    predicted: 'Linear loop is not recognized as logarithmic; structural check fails and applies score penalty.',
  },
];

// ============================================================
// Harness plumbing
// ============================================================

function generateTestToken(userId, role = 'student') {
  return jwt.sign({ user_id: userId, role }, JWT_SECRET, { expiresIn: '2h' });
}

async function postJson(path, payload, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request(
      {
        hostname: API_HOST,
        port: API_PORT,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          'Authorization': `Bearer ${token}`,
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, body: JSON.parse(body) });
          } catch (e) {
            resolve({ statusCode: res.statusCode, body });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function getUserIds(client) {
  const userRes = await client.query(`SELECT user_id, role FROM auth.users LIMIT 5;`);
  const teacherId = userRes.rows.find((u) => u.role === 'teacher')?.user_id || 1;
  const studentId = userRes.rows.find((u) => u.role === 'student')?.user_id || 1;
  return { teacherId, studentId };
}

async function prepareContext(client, teacherId, studentId, testName) {
  const testRes = await client.query(
    `INSERT INTO exam.tests (title, description, created_by, duration_minutes, is_published)
     VALUES ($1, 'Automated grading suite', $2, 60, true)
     RETURNING test_id;`,
    [`Q122 Suite: ${testName}`, teacherId]
  );
  const testId = testRes.rows[0].test_id;

  const subRes = await client.query(
    `INSERT INTO exam.submissions (test_id, student_id, status)
     VALUES ($1, $2, 'in_progress')
     RETURNING submission_id;`,
    [testId, String(studentId)]
  );
  const submissionId = subRes.rows[0].submission_id;

  await client.query(
    `INSERT INTO exam.submission_questions (submission_id, question_id, q_order, points)
     VALUES ($1, $2, 1, 10.0);`,
    [submissionId, QUESTION_ID]
  );

  const token = generateTestToken(studentId, 'student');
  return { testId, submissionId, token };
}

async function cleanupContext(client, testId, submissionId) {
  await client.query(`DELETE FROM exam.submission_questions WHERE submission_id = $1;`, [submissionId]);
  await client.query(`DELETE FROM exam.submissions WHERE submission_id = $1;`, [submissionId]);
  await client.query(`DELETE FROM exam.tests WHERE test_id = $1;`, [testId]);
}

async function runCase(client, teacherId, studentId, tc) {
  console.log('\n' + '#'.repeat(70));
  console.log(`CASE: ${tc.name}`);
  console.log(tc.description);
  if (tc.predicted) console.log(`Predicted: ${tc.predicted}`);
  console.log('#'.repeat(70));

  if (tc.structuralRules !== null) {
    await client.query(
      `UPDATE exam.questions SET structural_rules = $1::jsonb WHERE question_id = $2;`,
      [tc.structuralRules, QUESTION_ID]
    );
  }

  const { testId, submissionId, token } = await prepareContext(client, teacherId, studentId, tc.name);

  let result = { name: tc.name, verdict: 'ERROR' };

  try {
    const res = await postJson('/api/submissions/submit-code', {
      submission_id: submissionId,
      question_id: QUESTION_ID,
      code: tc.code,
    }, token);

    console.log(`HTTP ${res.statusCode}`);
    console.dir(res.body, { depth: null });

    const grade = res.body && res.body.question_grade !== undefined ? Number(res.body.question_grade) : null;

    const answerRes = await client.query(
      `SELECT sa.question_grade, sa.eval_result
       FROM exam.student_answers sa
       JOIN exam.submission_questions sq ON sq.submission_question_id = sa.submission_question_id
       WHERE sq.submission_id = $1 AND sq.question_id = $2;`,
      [submissionId, QUESTION_ID]
    );
    console.log('DB eval_result.structural_analysis:');
    console.dir(answerRes.rows[0]?.eval_result?.structural_analysis, { depth: null });

    if (tc.expect.type === 'exact') {
      if (grade !== null && Math.abs(grade - tc.expect.value) < tc.expect.tolerance) {
        result.verdict = `PASS (grade=${grade}, expected=${tc.expect.value})`;
      } else {
        result.verdict = `FAIL (grade=${grade}, expected=${tc.expect.value})`;
      }
    } else {
      result.verdict = `NOTE — grade=${grade}, review structural_analysis/test_results above manually`;
    }
  } catch (err) {
    result.verdict = `ERROR — ${err.message}`;
  } finally {
    await cleanupContext(client, testId, submissionId);
    await new Promise((r) => setTimeout(r, 150));
  }

  return result;
}

async function main() {
  const client = new Client(dbConfig);
  await client.connect();

  const snapshot = await client.query(
    `SELECT structural_rules FROM exam.questions WHERE question_id = $1;`,
    [QUESTION_ID]
  );
  const originalRules = snapshot.rows[0]?.structural_rules ?? null;

  const { teacherId, studentId } = await getUserIds(client);
  const results = [];

  try {
    for (const tc of TEST_CASES) {
      const r = await runCase(client, teacherId, studentId, tc);
      results.push(r);
    }
  } finally {
    console.log('\n==> Restoring original structural_rules on question 122...');
    await client.query(
      `UPDATE exam.questions SET structural_rules = $1::jsonb WHERE question_id = $2;`,
      [originalRules ? JSON.stringify(originalRules) : null, QUESTION_ID]
    );
    await client.end();
  }

  console.log('\n\n' + '='.repeat(70));
  console.log('SUITE SUMMARY');
  console.log('='.repeat(70));
  for (const r of results) {
    console.log(`${r.name.padEnd(35)} : ${r.verdict}`);
  }
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});