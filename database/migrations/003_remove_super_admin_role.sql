-- The super admin role has been removed. Administrator accounts now own
-- user-access management, so any existing super admin is moved to admin
-- before the unused role row is deleted.
--
-- Accounts are preserved on purpose: only the role is removed.

UPDATE users u
JOIN roles current_role ON current_role.id = u.role_id
JOIN roles admin_role ON admin_role.name = 'admin'
SET u.role_id = admin_role.id
WHERE current_role.name = 'super_admin';

DELETE FROM roles WHERE name = 'super_admin';
