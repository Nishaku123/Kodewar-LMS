import { pool } from "../config/db.js";

/**
 * Database access for password reset tokens.
 * Only the SHA-256 hash of a token is ever stored.
 */

export async function createResetToken({ userId, tokenHash, expiresAt }) {
  // Invalidate previous unused tokens so only the newest link works.
  await pool.execute(
    `UPDATE password_reset_tokens
        SET used_at = UTC_TIMESTAMP()
      WHERE user_id = ? AND used_at IS NULL`,
    [userId]
  );

  await pool.execute(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES (?, ?, ?)`,
    [userId, tokenHash, expiresAt]
  );
}

export async function findValidResetToken(tokenHash) {
  const [rows] = await pool.execute(
    `SELECT id, user_id AS userId, expires_at AS expiresAt
       FROM password_reset_tokens
      WHERE token_hash = ?
        AND used_at IS NULL
        AND expires_at > UTC_TIMESTAMP()
      LIMIT 1`,
    [tokenHash]
  );

  return rows[0] || null;
}

export async function markResetTokenUsed(tokenId) {
  await pool.execute(
    "UPDATE password_reset_tokens SET used_at = UTC_TIMESTAMP() WHERE id = ?",
    [tokenId]
  );
}

export async function deleteResetTokensForUser(userId) {
  await pool.execute("DELETE FROM password_reset_tokens WHERE user_id = ?", [
    userId,
  ]);
}
