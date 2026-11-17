import bcrypt from "bcryptjs";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { parsePositiveId } from "../utils/parseId.js";
import {
  validateManagedUserInput,
  validateUserRoleInput,
  validateUserStatusInput,
} from "../validators/manage.validators.js";
import {
  createUser,
  findRoleByName,
  findUserByEmail,
  findUserById,
  listRoles,
  listUsersWithRoles,
  updateUserRole,
  updateUserStatus,
} from "../models/user.model.js";

const BCRYPT_ROUNDS = 12;

/**
 * Administrator-only user access directory.
 * Returns every account with its role so an admin can grant or revoke
 * access without touching the database.
 */
export const listUserDirectory = asyncHandler(async (req, res) => {
  const search =
    typeof req.query.search === "string"
      ? req.query.search.trim().slice(0, 100)
      : "";

  const [users, roles] = await Promise.all([
    listUsersWithRoles(search),
    listRoles(),
  ]);

  res.status(200).json({
    success: true,
    message: "User directory",
    data: { users, roles },
  });
});

export const createManagedUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, role } = validateManagedUserInput(req.body);

  const existing = await findUserByEmail(email);

  if (existing) {
    throw ApiError.conflict("An account with this email already exists.", [
      { field: "email", message: "This email is already registered." },
    ]);
  }

  const roleRecord = await findRoleByName(role);

  if (!roleRecord) {
    throw new ApiError(
      500,
      "That role is missing. Run npm run db:migrate and npm run db:seed."
    );
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  let user;

  try {
    user = await createUser({
      roleId: roleRecord.id,
      fullName,
      email,
      passwordHash,
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      throw ApiError.conflict("An account with this email already exists.", [
        { field: "email", message: "This email is already registered." },
      ]);
    }

    throw error;
  }

  res.status(201).json({
    success: true,
    message: `${user.fullName} was created.`,
    data: { user },
  });
});

export const updateManagedUserRole = asyncHandler(async (req, res) => {
  const userId = parsePositiveId(req.params.userId, "User ID");

  if (Number(userId) === Number(req.user.id)) {
    throw ApiError.badRequest(
      "You cannot change your own role. Ask another administrator."
    );
  }

  const { role } = validateUserRoleInput(req.body);
  const user = await findUserById(userId);

  if (!user) {
    throw ApiError.notFound("This account could not be found.");
  }

  const roleRecord = await findRoleByName(role);

  if (!roleRecord) {
    throw ApiError.badRequest("That role does not exist.", [
      { field: "role", message: "Choose an existing role." },
    ]);
  }

  const updated = await updateUserRole(userId, roleRecord.id);

  res.status(200).json({
    success: true,
    message: `${updated.fullName} is now a ${role.replace("_", " ")}.`,
    data: { user: updated },
  });
});

export const updateManagedUserStatus = asyncHandler(async (req, res) => {
  const userId = parsePositiveId(req.params.userId, "User ID");

  if (Number(userId) === Number(req.user.id)) {
    throw ApiError.badRequest(
      "You cannot suspend your own account. Ask another administrator."
    );
  }

  const { status } = validateUserStatusInput(req.body);
  const user = await findUserById(userId);

  if (!user) {
    throw ApiError.notFound("This account could not be found.");
  }

  const updated = await updateUserStatus(userId, status);

  res.status(200).json({
    success: true,
    message:
      status === "active"
        ? `${updated.fullName} can sign in again.`
        : `${updated.fullName} has been suspended.`,
    data: { user: updated },
  });
});
