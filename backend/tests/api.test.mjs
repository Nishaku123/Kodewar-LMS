/**
 * Repeatable API smoke test for the Kodewar LMS.
 *
 * Start the API first (npm run dev:backend), then run:
 *   npm run test:api
 *
 * The test uses the seeded developer accounts and creates a temporary course.
 * It deletes the course in a finally block, so it can be run repeatedly.
 */
const BASE = (process.env.API_BASE_URL || "http://localhost:5000/api").replace(
  /\/$/,
  ""
);

const results = [];
let failures = 0;

function record(name, ok, detail = "") {
  results.push({ name, ok });
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function login(email, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json().catch(() => null);
  const cookies = res.headers.getSetCookie?.() ?? [];
  const cookie = cookies.map((item) => item.split(";")[0]).join("; ");

  if (!res.ok) {
    throw new Error(
      `Login failed for ${email}: ${json?.message || res.status}`
    );
  }

  return { cookie, user: json?.data?.user };
}

function client(cookie) {
  return async function request(method, path, body) {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        ...(cookie ? { Cookie: cookie } : {}),
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    let json = null;

    try {
      json = await res.json();
    } catch {
      // Some responses intentionally have no body.
    }

    return { status: res.status, json };
  };
}

function expect(name, res, status) {
  record(
    name,
    res.status === status,
    `status ${res.status} (expected ${status}) ${res.json?.message ?? ""}`
  );
}

const stamp = Date.now();
const anonymous = client(null);
let courseId = null;
let admin = client(null);

try {
  expect("health endpoint responds", await anonymous("GET", "/health"), 200);

  const trainerLogin = await login("trainer@kodewar.test", "Trainer@123");
  const adminLogin = await login("admin@kodewar.test", "Admin@123");
  const studentLogin = await login("student@kodewar.test", "Student@123");

  const trainer = client(trainerLogin.cookie);
  admin = client(adminLogin.cookie);
  const student = client(studentLogin.cookie);

  /* Certificate access rules ------------------------------------------- */
  expect(
    "anonymous certificate list is rejected",
    await anonymous("GET", "/certificates"),
    401
  );
  expect(
    "staff cannot view student certificates",
    await trainer("GET", "/certificates"),
    403
  );
  expect(
    "student certificate list is available",
    await student("GET", "/certificates"),
    200
  );

  const malformed = await anonymous("GET", "/certificates/verify/not-a-code");
  expect("malformed verification code is rejected", malformed, 400);
  record(
    "error responses keep the standard shape",
    malformed.json?.success === false && Boolean(malformed.json?.message)
  );

  const unknownCode = "KDW-0000000000000000";
  expect(
    "unknown certificate code returns 404",
    await anonymous("GET", `/certificates/verify/${unknownCode}`),
    404
  );

  /* Build a temporary completed course -------------------------------- */
  const created = await trainer("POST", "/manage/courses", {
    title: `Phase 10 certificate QA ${stamp}`,
    description: "Temporary course for the certificate API test.",
    category: "QA",
    level: "Beginner",
    durationMinutes: 20,
  });
  expect("trainer creates a temporary course", created, 201);
  courseId = created.json?.data?.course?.id;

  const module = await trainer(
    "POST",
    `/manage/courses/${courseId}/modules`,
    {
      title: "Certificate week",
      description: "The only module in the test course.",
      weekNumber: 1,
    }
  );
  expect("trainer creates a module", module, 201);
  const moduleId = module.json?.data?.module?.id;

  const lesson = await trainer("POST", `/manage/modules/${moduleId}/lessons`, {
    title: "Completion lesson",
    description: "Completing this lesson completes the course.",
    durationMinutes: 5,
    videoProvider: "youtube",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  });
  expect("trainer creates a lesson", lesson, 201);
  const lessonId = lesson.json?.data?.lesson?.id;

  expect(
    "course can be published",
    await trainer("POST", `/manage/courses/${courseId}/publish`),
    200
  );

  expect(
    "admin enrols the demo student",
    await admin("POST", `/manage/courses/${courseId}/enrollments`, {
      userId: studentLogin.user.id,
    }),
    201
  );

  /* No certificate before completion ---------------------------------- */
  const before = await student("GET", "/certificates");
  const beforeMatch = (before.json?.data?.certificates ?? []).filter(
    (item) => item.course.id === courseId
  );
  record(
    "certificate is not issued before completion",
    before.status === 200 && beforeMatch.length === 0,
    `${beforeMatch.length} matching certificate(s)`
  );

  /* Completing the course issues exactly one certificate --------------- */
  expect(
    "student completes the only lesson",
    await student("POST", `/lessons/${lessonId}/complete`),
    200
  );

  const after = await student("GET", "/certificates");
  const issued = (after.json?.data?.certificates ?? []).filter(
    (item) => item.course.id === courseId
  );
  record(
    "certificate is issued after completion",
    after.status === 200 && issued.length === 1,
    `${issued.length} matching certificate(s)`
  );

  const certificate = issued[0];
  record(
    "certificate code is well formed",
    /^KDW-[A-F0-9]{16}$/.test(certificate?.code ?? ""),
    certificate?.code
  );
  record(
    "certificate carries the course title",
    certificate?.course?.title === `Phase 10 certificate QA ${stamp}`
  );

  const repeated = await student("GET", "/certificates");
  const repeatedMatch = (repeated.json?.data?.certificates ?? []).filter(
    (item) => item.course.id === courseId
  );
  record(
    "issuance is idempotent",
    repeatedMatch.length === 1,
    `${repeatedMatch.length} matching certificate(s)`
  );

  /* Public verification ------------------------------------------------ */
  const verified = await anonymous(
    "GET",
    `/certificates/verify/${encodeURIComponent(certificate.code.toLowerCase())}`
  );
  expect("public verification succeeds with a lowercase code", verified, 200);
  record(
    "verification returns the recipient and course",
    verified.json?.data?.certificate?.recipientName ===
      studentLogin.user.fullName &&
      verified.json?.data?.certificate?.course?.title ===
        `Phase 10 certificate QA ${stamp}`
  );
  record(
    "verification does not expose the student email",
    verified.json?.data?.certificate?.email === undefined
  );

  /* Cleanup and revoked certificate ------------------------------------ */
  expect(
    "admin deletes the temporary course",
    await admin("DELETE", `/manage/courses/${courseId}`),
    200
  );
  courseId = null;

  expect(
    "deleted-course certificate no longer verifies",
    await anonymous("GET", `/certificates/verify/${certificate.code}`),
    404
  );
} catch (error) {
  record("test run completed without an exception", false, error.message);
} finally {
  if (courseId) {
    const cleanup = await admin("DELETE", `/manage/courses/${courseId}`);
    record(
      "cleanup deletes the temporary course",
      cleanup.status === 200,
      `status ${cleanup.status}`
    );
  }
}

console.log(`\n${results.length - failures}/${results.length} checks passed.`);
process.exit(failures ? 1 : 0);
