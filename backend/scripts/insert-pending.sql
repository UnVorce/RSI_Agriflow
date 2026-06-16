USE AgriFlowDB;

INSERT INTO master.[USER] (UserId, FirstName, Email, HashedPassword, Status, RoleId, CreatedAt, UpdatedAt)
VALUES 
(5, 'Budi Baru', 'budi2@test.com', 'dummy', 'Pending', 
 (SELECT RoleId FROM ref.ROLE WHERE RoleName='Pengecer'), GETDATE(), GETDATE()),
(6, 'Rina Kusuma', 'rina@test.com', 'dummy', 'Pending', 
 (SELECT RoleId FROM ref.ROLE WHERE RoleName='Distributor'), GETDATE(), GETDATE());

SELECT UserId, FirstName, Email, Status FROM master.[USER] WHERE Status = 'Pending';
