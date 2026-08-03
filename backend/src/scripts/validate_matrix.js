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

function generateTestToken(userId, role = 'student') {
  return jwt.sign(
    { user_id: userId, role: role },
    JWT_SECRET,
    { expiresIn: '2h' }
  );
}

async function postJson(path, payload, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request(
      {
        hostname: API_HOST,
        port: API_PORT,
        path: path,
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
            resolve({ statusCode: res.statusCode, body: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function prepareTestSubmissionContext(client, questionIds) {
  console.log('Fetching existing student & teacher IDs...');
  
  const userRes = await client.query(`SELECT user_id, role FROM auth.users LIMIT 5;`);
  let teacherId = userRes.rows.find(u => u.role === 'teacher')?.user_id || 1;
  let studentId = userRes.rows.find(u => u.role === 'student')?.user_id || 1;

  console.log(`Creating temporary test context with Teacher ID ${teacherId} and Student ID ${studentId}...`);

  const testRes = await client.query(
    `INSERT INTO exam.tests (title, description, created_by, duration_minutes, is_published)
     VALUES ('Matrix Validation Harness', 'Automated solution validation', $1, 60, true)
     RETURNING test_id;`,
    [teacherId]
  );
  const testId = testRes.rows[0].test_id;

  const subRes = await client.query(
    `INSERT INTO exam.submissions (test_id, student_id, status)
     VALUES ($1, $2, 'in_progress')
     RETURNING submission_id;`,
    [testId, String(studentId)]
  );
  const submissionId = subRes.rows[0].submission_id;

  for (let i = 0; i < questionIds.length; i++) {
    await client.query(
      `INSERT INTO exam.submission_questions (submission_id, question_id, q_order, points)
       VALUES ($1, $2, $3, $4);`,
      [submissionId, questionIds[i], i + 1, 10.0]
    );
  }

  const token = generateTestToken(studentId, 'student');
  return { testId, submissionId, token };
}

async function cleanupTestSubmissionContext(client, testId, submissionId) {
  console.log('Cleaning up temporary harness context...');
  await client.query(`DELETE FROM exam.submission_questions WHERE submission_id = $1;`, [submissionId]);
  await client.query(`DELETE FROM exam.submissions WHERE submission_id = $1;`, [submissionId]);
  await client.query(`DELETE FROM exam.tests WHERE test_id = $1;`, [testId]);
}

async function runValidation() {
  console.log('Connecting to PostgreSQL database...');
  const client = new Client(dbConfig);
  await client.connect();

  let testId = null;
  let submissionId = null;

  try {
    const query = `
      SELECT 
        q.question_id, 
        q.title, 
        pq.reference_solution
      FROM exam.questions q
      JOIN exam.programming_questions pq ON q.question_id = pq.question_id
      ORDER BY q.question_id ASC;
    `;

    const res = await client.query(query);
    const questions = res.rows;
    const questionIds = questions.map((q) => q.question_id);

    console.log(`Found ${questions.length} programming questions to validate.`);

    const context = await prepareTestSubmissionContext(client, questionIds);
    testId = context.testId;
    submissionId = context.submissionId;
    const authToken = context.token;

    let passedCount = 0;
    let failedCount = 0;
    const failures = [];

    console.log(`\nValidating solutions against backend endpoint (/api/submissions/submit-code)...\n`);
    console.log('='.repeat(80));
    console.log(`ID   | Title                                    | Score | Status`);
    console.log('='.repeat(80));

    for (const q of questions) {
      const qId = q.question_id;
      const title = q.title.padEnd(40, ' ').substring(0, 40);

      if (!q.reference_solution || q.reference_solution.trim() === '') {
        console.log(`${String(qId).padEnd(4)} | ${title} | N/A   | MISSING SOLUTION`);
        failures.push({ id: qId, title: q.title, reason: 'Empty reference solution' });
        failedCount++;
        continue;
      }

      try {
        const payload = {
          submission_id: submissionId,
          question_id: qId,
          code: q.reference_solution,
        };

        const res = await postJson(`/api/submissions/submit-code`, payload, authToken);
        const body = res.body;

        const grade = body && body.question_grade !== undefined ? body.question_grade : 0;
        const isPassed = res.statusCode === 200 && grade >= 9.9;

        if (isPassed) {
          console.log(`${String(qId).padEnd(4)} | ${title} | ${grade}/10 | PASS`);
          passedCount++;
        } else {
          console.log(`${String(qId).padEnd(4)} | ${title} | ${grade}/10 | FAIL (HTTP ${res.statusCode})`);
          
          // Isolate targeted questions (e.g. 91, 116) for complete JSON payload trace printing

            console.log(`\n========== FULL DEBUG PAYLOAD FOR TARGET Q${qId} ==========`);
            console.dir(body, { depth: null });
            console.log(`===========================================================\n`);
          

          failures.push({ id: qId, title: q.title, response: body });
          failedCount++;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (err) {
        console.log(`${String(qId).padEnd(4)} | ${title} | ERR   | ERROR`);
        failures.push({ id: qId, title: q.title, error: err.message });
        failedCount++;
      }
    }

    console.log('='.repeat(80));
    console.log(`Summary: Passed ${passedCount}/${questions.length}`);

    if (failures.length > 0) {
      console.log(`\nTotal failures: ${failures.length}`);
    }
  } finally {
    if (testId && submissionId) {
      await cleanupTestSubmissionContext(client, testId, submissionId);
    }
    await client.end();
  }
}

runValidation().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});