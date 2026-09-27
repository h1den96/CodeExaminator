// Ενδεικτικό (indicative) τεστ ταυτόχρονου φόρτου (concurrent load) για το
// endpoint POST /api/test/start του CodeExaminator, ενάντια στον πραγματικό
// backend + PostgreSQL σου. ΔΕΝ χρειάζεται Judge0 / Docker, γιατί το
// /test/start δεν καλεί καθόλου τον Judge0Service.
//
// Πώς το τρέχεις:
//   1) Ξεκίνα κανονικά το backend σου: cd backend && npm run dev
//      (χρειάζεται η PostgreSQL σου να τρέχει, όπως πάντα)
//   2) Σε άλλο τερματικό, μέσα στον ίδιο φάκελο με αυτό το αρχείο:
//        node codeexaminator_loadtest.js
//
// Παραμετροποίηση (προαιρετικά, μέσω environment variables):
//   BASE_URL   βασικό URL του backend            (default: http://localhost:3000)
//   TEST_ID    το test_id ενός ΔΙΑΘΕΣΙΜΟΥ τεστ    (default: 1)
//              (πρέπει να είναι μέσα στο [available_from, available_until]
//               του και να έχει slots με τουλάχιστον 1 αντίστοιχη ερώτηση,
//               αλλιώς θα δεις 400/404 σε όλα τα requests, όχι bug)
//   B_SIZES    πλήθη φοιτητών για το Σενάριο Β, χωρισμένα με κόμμα
//              (default: 12,50,100)
//
// Παράδειγμα:
//   BASE_URL=http://localhost:3000 TEST_ID=7 B_SIZES=10,40 node codeexaminator_loadtest.js
//
// Τι κάνει:
//   Σενάριο Α: 1 φοιτητής, Κ ταυτόχρονα POST /test/start για το ΙΔΙΟ τεστ
//              (διπλό κλικ / retry σε flaky δίκτυο). Δεν αφορά το deadlock
//              bug· ελέγχει τη λογική "already started" (race στο
//              check-then-insert). Αναμενόμενο: μερικά 500 σε πολύ υψηλή
//              ταυτοχρονία είναι γνωστό, ξεχωριστό, μη επικίνδυνο ζήτημα
//              (καμία διπλοεγγραφή στη βάση, απλώς μη κομψό error status).
//   Σενάριο Β: Ν διαφορετικοί φοιτητές, ταυτόχρονα POST /test/start για το
//              ΙΔΙΟ τεστ (ολόκληρο τμήμα ξεκινάει μαζί). Αυτό είναι το
//              σενάριο που πριν το fix "κρέμαγε" ολόκληρο τον server μόνιμα
//              για Ν >= 10 (μέγεθος pool). Μετά το fix, αναμένεται 100%
//              επιτυχία (status 200) σε όλα τα Ν.
//
// Μετά το τρέξιμο, μπορείς να επαληθεύσεις στη βάση ότι δεν υπάρχουν
// διπλές ενεργές υποβολές:
//   SELECT student_id, test_id, COUNT(*) FROM exam.submissions
//   WHERE status = 'in_progress' GROUP BY student_id, test_id HAVING COUNT(*) > 1;
// (should return 0 rows)

const http = require("http");
const https = require("https");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const TEST_ID = Number(process.env.TEST_ID || 343);
const B_SIZES = (process.env.B_SIZES || "12,50,100")
  .split(",")
  .map((s) => Number(s.trim()))
  .filter((n) => n > 0);

const isHttps = BASE.startsWith("https://");
const httpMod = isHttps ? https : http;
const agent = new httpMod.Agent({ keepAlive: false, maxSockets: 512 });
let reqCounter = 0;

function req(method, path, body, token, label) {
  const id = ++reqCounter;
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const t0 = performance.now();
    const r = httpMod.request(
      BASE + path,
      {
        method,
        agent,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}),
        },
      },
      (res) => {
        let chunks = "";
        res.on("data", (c) => (chunks += c));
        res.on("end", () => {
          const ms = performance.now() - t0;
          let json = null;
          try {
            json = JSON.parse(chunks);
          } catch {}
          if (process.env.VERBOSE)
            console.log(`  [${id}] ${label || path} -> ${res.statusCode} (${ms.toFixed(0)}ms)`);
          resolve({ status: res.statusCode, body: json, ms });
        });
      },
    );
    r.on("error", (e) => {
      const ms = performance.now() - t0;
      if (process.env.VERBOSE) console.log(`  [${id}] ${label || path} -> ERROR ${e.message} (${ms.toFixed(0)}ms)`);
      resolve({ status: 0, body: { error: e.message }, ms });
    });
    r.setTimeout(20000, () => {
      r.destroy(new Error("client-side timeout after 20s"));
    });
    if (data) r.write(data);
    r.end();
  });
}

async function registerStudent(i) {
  const email = `loadtest_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 7)}@test.local`;
  const r = await req("POST", "/api/auth/register", {
    first_name: "Load",
    last_name: `Student${i}`,
    email,
    password: "loadtest123",
  });
  if (r.status !== 201) {
    throw new Error(`register failed for ${email}: ${r.status} ${JSON.stringify(r.body)}`);
  }
  return r.body.accessToken;
}

function percentile(arr, p) {
  const s = [...arr].sort((a, b) => a - b);
  const idx = Math.min(s.length - 1, Math.floor((p / 100) * s.length));
  return s[idx];
}

function summarize(label, results) {
  const ms = results.map((r) => r.ms);
  const byStatus = {};
  for (const r of results) byStatus[r.status] = (byStatus[r.status] || 0) + 1;
  console.log(`\n--- ${label} ---`);
  console.log(`n=${results.length}  statuses=${JSON.stringify(byStatus)}`);
  console.log(
    `latency ms: min=${Math.min(...ms).toFixed(1)} p50=${percentile(ms, 50).toFixed(1)} p95=${percentile(ms, 95).toFixed(1)} max=${Math.max(...ms).toFixed(1)}`,
  );
  return byStatus;
}

async function scenarioA(concurrency) {
  const token = await registerStudent("A");
  const results = await Promise.all(
    Array.from({ length: concurrency }, () => req("POST", "/api/test/start", { test_id: TEST_ID }, token)),
  );
  summarize(`Σενάριο Α: 1 φοιτητής, ${concurrency} ταυτόχρονα /test/start (ίδιος φοιτητής+τεστ)`, results);
  return results;
}

async function scenarioB(numStudents) {
  const tReg0 = performance.now();
  const tokens = await Promise.all(Array.from({ length: numStudents }, (_, i) => registerStudent(`B${i}`)));
  console.log(`(εγγραφή ${numStudents} φοιτητών σε ${(performance.now() - tReg0).toFixed(0)} ms)`);
  const t0 = performance.now();
  const results = await Promise.all(
    tokens.map((tok) => req("POST", "/api/test/start", { test_id: TEST_ID }, tok, "start")),
  );
  const wallMs = performance.now() - t0;
  const byStatus = summarize(
    `Σενάριο Β: ${numStudents} διαφορετικοί φοιτητές, ταυτόχρονα /test/start (ίδιο τεστ)`,
    results,
  );
  console.log(
    `συνολικός χρόνος: ${wallMs.toFixed(1)} ms (${(numStudents / (wallMs / 1000)).toFixed(1)} req/s)`,
  );
  return { byStatus, results };
}

(async () => {
  console.log("=== CodeExaminator - Ενδεικτικό τεστ ταυτόχρονου φόρτου ===");
  console.log("Target:", BASE, " test_id:", TEST_ID);
  console.log("(αν όλα τα requests γυρνάνε 400/404, πιθανότατα το TEST_ID δεν είναι έγκυρο/διαθέσιμο τώρα)\n");

  await scenarioA(20);

  let anyFailure = false;
  for (const n of B_SIZES) {
    const { byStatus } = await scenarioB(n);
    const failed = Object.entries(byStatus).some(([status, count]) => status !== "200" && count > 0);
    if (failed) anyFailure = true;
  }

  console.log("\n=== Τέλος ===");
  if (anyFailure) {
    console.log(
      "Σε τουλάχιστον ένα Σενάριο Β υπήρξαν μη-200 απαντήσεις. Αν το backend δεν απάντησε καθόλου (status 0 / ERROR)\n" +
        "σε μεγάλο αριθμό ταυτόχρονων φοιτητών, αυτό είναι το σύμπτωμα του deadlock στο connection pool.",
    );
  } else {
    console.log("Όλα τα Σενάρια Β ολοκληρώθηκαν με 100% επιτυχία (200) σε όλα τα Ν.");
  }
})();
