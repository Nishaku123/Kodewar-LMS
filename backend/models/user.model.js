import { pool } from "../config/db.js";

/**
 * Database access for users.
 * All queries select a safe public shape: password_hash is only included
 * when a caller explicitly needs it for password verification.
 */

const PUBLIC_COLUMNS = `
  u.id,
  u.full_name AS fullName,
  u.email,
  u.status,
  u.last_login_at AS lastLoginAt,
  u.created_at AS createdAt,
  r.name AS role
`;

export async function findUserByEmail(email) {
  const [rows] = await pool.execute(
    `SELECT ${PUBLIC_COLUMNS}, u.password_hash AS passwordHash
       FROM users u
       JOIN roles r ON r.id = u.role_id
      WHERE u.email = ?
      LIMIT 1`,
    [email]
  );

  return rows[0] || null;
}

export async function findUserById(id) {
  const [rows] = await pool.execute(
    `SELECT ${PUBLIC_COLUMNS}
       FROM users u
       JOIN roles r ON r.id = u.role_id
      WHERE u.id = ?
      LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

export async function findRoleByName(name) {
  const [rows] = await pool.execute(
    "SELECT id, name FROM roles WHERE name = ? LIMIT 1",
    [name]
  );

  return rows[0] || null;
}

/**
 * Student directory for the staff enrolment picker.
 */
export async function listStudents(search = "") {
  const like = `%${search}%`;

  const [rows] = await pool.execute(
    `SELECT u.id,
            u.full_name AS fullName,
            u.email,
            u.status,
            u.created_at AS createdAt,
            (SELECT COUNT(*) FROM course_enrollments ce WHERE ce.user_id = u.id)
              AS enrollmentCount
       FROM users u
       JOIN roles r ON r.id = u.role_id
      WHERE r.name = 'student'
        AND (? = '' OR u.full_name LIKE ? OR u.email LIKE ?)
      ORDER BY u.full_name, u.id
      LIMIT 200`,
    [search, like, like]
  );

  return rows;
}

export async function listRoles() {
  const [rows] = await pool.execute(
    `SELECT id, name, description
       FROM roles
      ORDER BY FIELD(name, 'student', 'trainer', 'admin'), name`
  );

  return rows;
}

/**
 * Full account directory for the administrator's user-access screen.
 * Passwords are never selected here.
 */
export async function listUsersWithRoles(search = "") {
  const like = `%${search}%`;

  const [rows] = await pool.execute(
    `SELECT ${PUBLIC_COLUMNS}
       FROM users u
       JOIN roles r ON r.id = u.role_id
      WHERE (? = '' OR u.full_name LIKE ? OR u.email LIKE ?)
      ORDER BY u.created_at DESC, u.id DESC
      LIMIT 500`,
    [search, like, like]
  );

  return rows;
}

export async function updateUserRole(userId, roleId) {
  await pool.execute("UPDATE users SET role_id = ? WHERE id = ?", [
    roleId,
    userId,
  ]);

  return findUserById(userId);
}

export async function updateUserStatus(userId, status) {
  await pool.execute("UPDATE users SET status = ? WHERE id = ?", [
    status,
    userId,
  ]);

  return findUserById(userId);
}

export async function createUser({
  roleId,
  fullName,
  email,
  passwordHash,
}) {
  const [result] = await pool.execute(
    `INSERT INTO users (role_id, full_name, email, password_hash, status)
     VALUES (?, ?, ?, ?, 'active')`,
    [roleId, fullName, email, passwordHash]
  );

  return findUserById(result.insertId);
}

export async function updateLastLogin(userId) {
  await pool.execute(
    "UPDATE users SET last_login_at = UTC_TIMESTAMP() WHERE id = ?",
    [userId]
  );
}

export async function updateUserName(userId, fullName) {
  await pool.execute("UPDATE users SET full_name = ? WHERE id = ?", [
    fullName,
    userId,
  ]);

  return findUserById(userId);
}

export async function updateUserPassword(userId, passwordHash) {
  await pool.execute("UPDATE users SET password_hash = ? WHERE id = ?", [
    passwordHash,
    userId,
  ]);
}

export async function getPasswordHash(userId) {
  const [rows] = await pool.execute(
    "SELECT password_hash AS passwordHash FROM users WHERE id = ? LIMIT 1",
    [userId]
  );

  return rows[0]?.passwordHash || null;
}
