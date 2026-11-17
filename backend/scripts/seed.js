import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";
import { env } from "../config/env.js";

/**
 * Creates the three development demo accounts.
 *
 * Run it with: npm run db:seed
 *
 * Passwords are hashed with bcrypt here at run time. The repository never
 * contains a plain-text password or a reusable password hash.
 *
 * These accounts are for local development only. The script refuses to run
 * in production unless FORCE_SEED=true is set explicitly.
 */
const DEMO_ACCOUNTS = [
  {
    fullName: "Aarav Sharma",
    email: "student@kodewar.test",
    password: "Student@123",
    role: "student",
  },
  {
    fullName: "Meera Iyer",
    email: "trainer@kodewar.test",
    password: "Trainer@123",
    role: "trainer",
  },
  {
    fullName: "Rohan Verma",
    email: "admin@kodewar.test",
    password: "Admin@123",
    role: "admin",
  },
];

const ROLE_DESCRIPTIONS = {
  student: "Learns courses, completes lessons and earns certificates",
  trainer: "Creates and reviews learning content and assessments",
  admin: "Manages users, roles, courses and platform operations",
};

/**
 * A small, development-only course so the student flow can be exercised.
 * It demonstrates lessons, a quiz per week, an assignment and the unlock
 * chain (week 2 opens only after week 1 is complete).
 */
const DEMO_COURSE = {
  slug: "javascript-foundations",
  title: "JavaScript Foundations",
  description:
    "A short hands-on course covering JavaScript fundamentals, async code and working with APIs. Built for the Kodewar learning workspace.",
  category: "Web Development",
  level: "Beginner",
  durationMinutes: 120,
  modules: [
    {
      weekNumber: 1,
      title: "JavaScript foundations",
      description:
        "Variables, scope, functions and the building blocks used in every JavaScript project.",
      lessons: [
        {
          title: "Variables and scope",
          description:
            "Declare values with let and const, understand block scope and avoid accidental globals.",
          durationMinutes: 18,
        },
        {
          title: "Functions and arrow syntax",
          description:
            "Write reusable functions, pass arguments and read arrow function syntax confidently.",
          durationMinutes: 22,
        },
      ],
      assessment: {
        title: "Week 1 knowledge check",
        description:
          "Three quick questions on variables, arrays and strict equality.",
        passingScore: 67,
        maxAttempts: 3,
        questions: [
          {
            prompt:
              "Which keyword declares a constant that cannot be reassigned?",
            explanation:
              "const creates a binding that cannot be reassigned. let allows reassignment and var is function-scoped.",
            points: 1,
            options: [
              { text: "const", isCorrect: true },
              { text: "let", isCorrect: false },
              { text: "var", isCorrect: false },
              { text: "static", isCorrect: false },
            ],
          },
          {
            prompt: "What does Array.prototype.map return?",
            explanation:
              "map returns a new array containing the values returned by the callback; it does not mutate the original array.",
            points: 1,
            options: [
              {
                text: "A new array with the transformed values",
                isCorrect: true,
              },
              { text: "The original array, mutated in place", isCorrect: false },
              { text: "The number of matching elements", isCorrect: false },
              { text: "undefined", isCorrect: false },
            ],
          },
          {
            prompt: 'Which value is strictly equal to "5" when using ===?',
            explanation:
              "Strict equality compares both type and value, so only the string \"5\" matches.",
            points: 1,
            options: [
              { text: '"5"', isCorrect: true },
              { text: "5", isCorrect: false },
              { text: "true", isCorrect: false },
              { text: "null", isCorrect: false },
            ],
          },
        ],
      },
      assignment: {
        title: "Build a small to-do list",
        description:
          "Practise variables, functions and arrays by building a small to-do list.",
        instructions:
          "Create a to-do list with at least three items. Add a function to add an item and a function to mark one complete. Describe how you stored the items and paste a link to your code if it is hosted online.",
        maxPoints: 100,
      },
    },
    {
      weekNumber: 2,
      title: "Async JavaScript and HTTP",
      description:
        "Promises, async/await and the HTTP basics you need to talk to an API.",
      lessons: [
        {
          title: "Promises and async/await",
          description:
            "Understand pending, resolved and rejected promises and how async/await makes them readable.",
          durationMinutes: 25,
        },
        {
          title: "Fetching data from an API",
          description:
            "Use fetch, check response.ok and parse JSON without assuming the request succeeded.",
          durationMinutes: 20,
        },
      ],
      assessment: {
        title: "Week 2 knowledge check",
        description:
          "Two questions on HTTP status codes and creating resources.",
        passingScore: 60,
        maxAttempts: 3,
        questions: [
          {
            prompt: 'Which HTTP status code means "Not Found"?',
            explanation:
              "404 tells the client that the requested resource does not exist.",
            points: 1,
            options: [
              { text: "404", isCorrect: true },
              { text: "200", isCorrect: false },
              { text: "201", isCorrect: false },
              { text: "500", isCorrect: false },
            ],
          },
          {
            prompt:
              "Which status code means the request succeeded and created a resource?",
            explanation:
              "201 Created is the standard response after successfully creating a resource.",
            points: 1,
            options: [
              { text: "201", isCorrect: true },
              { text: "204", isCorrect: false },
              { text: "301", isCorrect: false },
              { text: "401", isCorrect: false },
            ],
          },
        ],
      },
    },
  ],
};

async function resetDemoProgress(connection, studentId, courseId) {
  await connection.execute(
    `DELETE aa
       FROM assessment_answers aa
       JOIN assessment_attempts at ON at.id = aa.attempt_id
       JOIN assessments a ON a.id = at.assessment_id
       JOIN course_modules cm ON cm.id = a.module_id
      WHERE at.user_id = ? AND cm.course_id = ?`,
    [studentId, courseId]
  );

  await connection.execute(
    `DELETE at
       FROM assessment_attempts at
       JOIN assessments a ON a.id = at.assessment_id
       JOIN course_modules cm ON cm.id = a.module_id
      WHERE at.user_id = ? AND cm.course_id = ?`,
    [studentId, courseId]
  );

  await connection.execute(
    `DELETE s
       FROM assignment_submissions s
       JOIN assignments a ON a.id = s.assignment_id
       JOIN course_modules cm ON cm.id = a.module_id
      WHERE s.user_id = ? AND cm.course_id = ?`,
    [studentId, courseId]
  );

  await connection.execute(
    `DELETE lc
       FROM lesson_completions lc
       JOIN lessons l ON l.id = lc.lesson_id
       JOIN course_modules cm ON cm.id = l.module_id
      WHERE lc.user_id = ? AND cm.course_id = ?`,
    [studentId, courseId]
  );
}

async function seedDemoCourse(connection, studentId) {
  await connection.execute(
    `INSERT INTO courses
       (slug, title, description, category, level, duration_minutes, is_published)
     VALUES (?, ?, ?, ?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE
       title = VALUES(title),
       description = VALUES(description),
       category = VALUES(category),
       level = VALUES(level),
       duration_minutes = VALUES(duration_minutes),
       is_published = 1`,
    [
      DEMO_COURSE.slug,
      DEMO_COURSE.title,
      DEMO_COURSE.description,
      DEMO_COURSE.category,
      DEMO_COURSE.level,
      DEMO_COURSE.durationMinutes,
    ]
  );

  const [courseRows] = await connection.execute(
    "SELECT id FROM courses WHERE slug = ? LIMIT 1",
    [DEMO_COURSE.slug]
  );
  const courseId = courseRows[0].id;

  for (const [index, module] of DEMO_COURSE.modules.entries()) {
    await connection.execute(
      `INSERT INTO course_modules
         (course_id, title, description, week_number, position)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         title = VALUES(title),
         description = VALUES(description),
         position = VALUES(position)`,
      [
        courseId,
        module.title,
        module.description,
        module.weekNumber,
        index + 1,
      ]
    );

    const [moduleRows] = await connection.execute(
      "SELECT id FROM course_modules WHERE course_id = ? AND week_number = ? LIMIT 1",
      [courseId, module.weekNumber]
    );
    const moduleId = moduleRows[0].id;

    for (const [lessonIndex, lesson] of module.lessons.entries()) {
      await connection.execute(
        `INSERT INTO lessons
           (module_id, title, description, position, duration_minutes)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           title = VALUES(title),
           description = VALUES(description),
           duration_minutes = VALUES(duration_minutes)`,
        [
          moduleId,
          lesson.title,
          lesson.description,
          lessonIndex + 1,
          lesson.durationMinutes,
        ]
      );
    }

    if (module.assessment) {
      const assessment = module.assessment;
      const [assessmentRows] = await connection.execute(
        "SELECT id FROM assessments WHERE module_id = ? AND title = ? LIMIT 1",
        [moduleId, assessment.title]
      );

      let assessmentId = assessmentRows[0]?.id;

      if (assessmentId) {
        await connection.execute(
          `UPDATE assessments
              SET description = ?, passing_score = ?, max_attempts = ?, is_published = 1
            WHERE id = ?`,
          [
            assessment.description,
            assessment.passingScore,
            assessment.maxAttempts,
            assessmentId,
          ]
        );
      } else {
        const [result] = await connection.execute(
          `INSERT INTO assessments
             (module_id, title, description, passing_score, max_attempts, is_published)
           VALUES (?, ?, ?, ?, ?, 1)`,
          [
            moduleId,
            assessment.title,
            assessment.description,
            assessment.passingScore,
            assessment.maxAttempts,
          ]
        );
        assessmentId = result.insertId;
      }

      const [questionCountRows] = await connection.execute(
        "SELECT COUNT(*) AS total FROM assessment_questions WHERE assessment_id = ?",
        [assessmentId]
      );

      if (Number(questionCountRows[0].total) === 0) {
        for (const [questionIndex, question] of assessment.questions.entries()) {
          const [questionResult] = await connection.execute(
            `INSERT INTO assessment_questions
               (assessment_id, prompt, explanation, points, position)
             VALUES (?, ?, ?, ?, ?)`,
            [
              assessmentId,
              question.prompt,
              question.explanation,
              question.points,
              questionIndex + 1,
            ]
          );

          for (const [optionIndex, option] of question.options.entries()) {
            await connection.execute(
              `INSERT INTO assessment_options
                 (question_id, option_text, is_correct, position)
               VALUES (?, ?, ?, ?)`,
              [
                questionResult.insertId,
                option.text,
                option.isCorrect ? 1 : 0,
                optionIndex + 1,
              ]
            );
          }
        }
      }
    }

    if (module.assignment) {
      const assignment = module.assignment;
      const [assignmentRows] = await connection.execute(
        "SELECT id FROM assignments WHERE module_id = ? AND title = ? LIMIT 1",
        [moduleId, assignment.title]
      );

      if (assignmentRows.length) {
        await connection.execute(
          `UPDATE assignments
              SET description = ?, instructions = ?, max_points = ?, is_published = 1
            WHERE id = ?`,
          [
            assignment.description,
            assignment.instructions,
            assignment.maxPoints,
            assignmentRows[0].id,
          ]
        );
      } else {
        await connection.execute(
          `INSERT INTO assignments
             (module_id, title, description, instructions, max_points, is_published)
           VALUES (?, ?, ?, ?, ?, 1)`,
          [
            moduleId,
            assignment.title,
            assignment.description,
            assignment.instructions,
            assignment.maxPoints,
          ]
        );
      }
    }
  }

  // The demo account should start from a clean state so the unlock chain is
  // visible every time the seed runs. This is development-only data.
  await resetDemoProgress(connection, studentId, courseId);

  await connection.execute(
    `INSERT IGNORE INTO course_enrollments (user_id, course_id)
     VALUES (?, ?)`,
    [studentId, courseId]
  );

  return courseId;
}


async function main() {
  if (env.nodeEnv === "production" && process.env.FORCE_SEED !== "true") {
    throw new Error(
      "Refusing to seed production. Set FORCE_SEED=true only if this is intended."
    );
  }

  const connection = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.name,
    ssl: env.db.ssl ? { minVersion: "TLSv1.2" } : undefined,
    connectTimeout: 20_000,
  });

  try {
    console.log(`\nSeeding "${env.db.name}" ...`);

    for (const [name, description] of Object.entries(ROLE_DESCRIPTIONS)) {
      await connection.execute(
        `INSERT INTO roles (name, description)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE description = VALUES(description)`,
        [name, description]
      );
    }

    const [roleRows] = await connection.query(
      "SELECT id, name FROM roles WHERE name IN (?, ?, ?)",
      ["student", "trainer", "admin"]
    );

    const roleIds = new Map(roleRows.map((row) => [row.name, row.id]));

    if (roleIds.size !== 3) {
      throw new Error("Could not find all three roles after inserting them.");
    }

    for (const account of DEMO_ACCOUNTS) {
      const roleId = roleIds.get(account.role);
      const passwordHash = await bcrypt.hash(account.password, 12);

      const [existing] = await connection.execute(
        "SELECT id FROM users WHERE email = ?",
        [account.email]
      );

      if (existing.length > 0) {
        await connection.execute(
          `UPDATE users
             SET role_id = ?, full_name = ?, password_hash = ?, status = 'active'
           WHERE email = ?`,
          [roleId, account.fullName, passwordHash, account.email]
        );
        console.log(`  updated ${account.role.padEnd(11)} ${account.email}`);
      } else {
        await connection.execute(
          `INSERT INTO users (role_id, full_name, email, password_hash, status)
           VALUES (?, ?, ?, ?, 'active')`,
          [roleId, account.fullName, account.email, passwordHash]
        );
        console.log(`  created ${account.role.padEnd(11)} ${account.email}`);
      }
    }

    const [studentRows] = await connection.execute(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      ["student@kodewar.test"]
    );

    const courseId = await seedDemoCourse(connection, studentRows[0].id);

    console.log("\nDemo accounts ready (development only):\n");
    for (const account of DEMO_ACCOUNTS) {
      console.log(
        `  ${account.role.padEnd(11)} ${account.email} / ${account.password}`
      );
    }
    console.log(
      `  demo course  id ${courseId} — ${DEMO_COURSE.title} (student enrolled, progress reset)`
    );
    console.log("\nSeed complete.\n");
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error("\nSeed failed.");
  console.error(`Reason: ${error.message}`);
  console.error("\nRun npm run db:migrate first, then try again.\n");
  process.exitCode = 1;
});
