USE AgriFlowDB;

-- Delete existing test users if any, then re-insert as Pending
DELETE FROM master.[USER] WHERE UserId IN (10, 11, 12);

INSERT INTO master.[USER] (UserId, FirstName, Email, HashedPassword, Status, RoleId, CreatedAt, UpdatedAt)
VALUES 
(10, 'Budi Santoso', 'budi.pending@test.com', 'dummy', 'Pending', (SELECT RoleId FROM ref.ROLE WHERE RoleName='Pengecer'), GETDATE(), GETDATE()),
(11, 'Siti Rahayu', 'siti.pending@test.com', 'dummy', 'Pending', (SELECT RoleId FROM ref.ROLE WHERE RoleName='Pengecer'), GETDATE(), GETDATE()),
(12, 'Andi Wijaya', 'andi.pending@test.com', 'dummy', 'Pending', (SELECT RoleId FROM ref.ROLE WHERE RoleName='Distributor'), GETDATE(), GETDATE());
