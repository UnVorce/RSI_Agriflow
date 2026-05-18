-- AgriFlow Database Setup Script
-- Run this script once to create the database.
-- Prisma migrations will create the required schemas and tables.

-- Create database if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'AgriFlowDB')
BEGIN
    CREATE DATABASE AgriFlowDB;
END
GO

PRINT 'Database created successfully. Continue with Prisma migrations.';
