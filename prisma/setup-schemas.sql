-- AgriFlow Database Setup Script
-- Run this script to create the database and schemas

-- Create database if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'AgriFlowDB')
BEGIN
    CREATE DATABASE AgriFlowDB;
END
GO

-- Use the database
USE AgriFlowDB;
GO

-- Create schemas
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'ref')
BEGIN
    EXEC('CREATE SCHEMA ref');
END
GO

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'master')
BEGIN
    EXEC('CREATE SCHEMA master');
END
GO

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'trans')
BEGIN
    EXEC('CREATE SCHEMA trans');
END
GO

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'evt')
BEGIN
    EXEC('CREATE SCHEMA evt');
END
GO

PRINT 'Database and schemas created successfully!';
