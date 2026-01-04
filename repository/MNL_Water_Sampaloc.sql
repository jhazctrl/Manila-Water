USE MNL_Water_Sampaloc

CREATE TABLE Barangays (
brgy_id INTEGER IDENTITY(1,1) PRIMARY KEY,
brgy_number VARCHAR(55) NOT NULL, 
INDEX idx_brgy_number(brgy_number) 
);

INSERT INTO Barangays(brgy_number)
VALUES 
('BRGY-395'), ('BRGY-396'), ('BRGY-397'), ('BRGY-398'), ('BRGY-399'),
('BRGY-400'), ('BRGY-401'), ('BRGY-402'), ('BRGY-403'), ('BRGY-404'),
('BRGY-405'), ('BRGY-406'), ('BRGY-407'), ('BRGY-408'), ('BRGY-409'),
('BRGY-410'), ('BRGY-411'), ('BRGY-412'), ('BRGY-413'), ('BRGY-414'),
('BRGY-415'), ('BRGY-416'), ('BRGY-417'), ('BRGY-418'), ('BRGY-419'),
('BRGY-420'), ('BRGY-421'), ('BRGY-422'), ('BRGY-423'), ('BRGY-424'),
('BRGY-425'), ('BRGY-426'), ('BRGY-427'), ('BRGY-428'), ('BRGY-429'),
('BRGY-430'), ('BRGY-431'), ('BRGY-432'), ('BRGY-433'), ('BRGY-434'),
('BRGY-435'), ('BRGY-436'), ('BRGY-437'), ('BRGY-438'), ('BRGY-439'),
('BRGY-440'), ('BRGY-441'), ('BRGY-442'), ('BRGY-443'), ('BRGY-444'),
('BRGY-445'), ('BRGY-446'), ('BRGY-447'), ('BRGY-448'), ('BRGY-449'),
('BRGY-450'), ('BRGY-451'), ('BRGY-452'), ('BRGY-453'), ('BRGY-454'),
('BRGY-455'), ('BRGY-456'), ('BRGY-457'), ('BRGY-458'), ('BRGY-459'),
('BRGY-460'), ('BRGY-461'), ('BRGY-462'), ('BRGY-463'), ('BRGY-464'),
('BRGY-465'), ('BRGY-466'), ('BRGY-467'), ('BRGY-468'), ('BRGY-469'),
('BRGY-470'), ('BRGY-471'), ('BRGY-472'), ('BRGY-473'), ('BRGY-474'),
('BRGY-475'), ('BRGY-476'), ('BRGY-477'), ('BRGY-478'), ('BRGY-479'),
('BRGY-480'), ('BRGY-481'), ('BRGY-482'), ('BRGY-483'), ('BRGY-484'),
('BRGY-485'), ('BRGY-486'), ('BRGY-487'), ('BRGY-488'), ('BRGY-489'),
('BRGY-490'), ('BRGY-491'), ('BRGY-492'), ('BRGY-493'), ('BRGY-494'),
('BRGY-495'), ('BRGY-496'), ('BRGY-497'), ('BRGY-498'), ('BRGY-499'),
('BRGY-500'), ('BRGY-501'), ('BRGY-502'), ('BRGY-503'), ('BRGY-504'),
('BRGY-505'), ('BRGY-506'), ('BRGY-507'), ('BRGY-508'), ('BRGY-509'),
('BRGY-510'), ('BRGY-511'), ('BRGY-512'), ('BRGY-513'), ('BRGY-514'),
('BRGY-515'), ('BRGY-516'), ('BRGY-517'), ('BRGY-518'), ('BRGY-519'),
('BRGY-520'), ('BRGY-521'), ('BRGY-522'), ('BRGY-523'), ('BRGY-524'),
('BRGY-525'), ('BRGY-526'), ('BRGY-527'), ('BRGY-528'), ('BRGY-529'),
('BRGY-530'), ('BRGY-531'), ('BRGY-532'), ('BRGY-533'), ('BRGY-534'),
('BRGY-535'), ('BRGY-536'), ('BRGY-537'), ('BRGY-538'), ('BRGY-539'),
('BRGY-540'), ('BRGY-541'), ('BRGY-542'), ('BRGY-543'), ('BRGY-544'),
('BRGY-545'), ('BRGY-546'), ('BRGY-547'), ('BRGY-548'), ('BRGY-549'),
('BRGY-550'), ('BRGY-551'), ('BRGY-552'), ('BRGY-553'), ('BRGY-554'),
('BRGY-555'), ('BRGY-556'), ('BRGY-557'), ('BRGY-558'), ('BRGY-559'),
('BRGY-560'), ('BRGY-561'), ('BRGY-562'), ('BRGY-563'), ('BRGY-564'),
('BRGY-565'), ('BRGY-566'), ('BRGY-567'), ('BRGY-568'), ('BRGY-569'),
('BRGY-570'), ('BRGY-571'), ('BRGY-572'), ('BRGY-573'), ('BRGY-574'),
('BRGY-575'), ('BRGY-576'), ('BRGY-577'), ('BRGY-578'), ('BRGY-579'),
('BRGY-580'), ('BRGY-581'), ('BRGY-582'), ('BRGY-583'), ('BRGY-584'),
('BRGY-585'), ('BRGY-586'), ('BRGY-587');

CREATE TABLE Guest_emails (
    guest_id INT IDENTITY(1,1) PRIMARY KEY,
    guest_email VARCHAR(55) NOT NULL UNIQUE
);

USE MNL_Water_Sampaloc
CREATE TABLE Streets (
	street_id INTEGER IDENTITY(1,1) PRIMARY KEY,
	street_name VARCHAR(75) NOT NULL,
	brgy_id INTEGER NOT NULL,
	FOREIGN KEY (brgy_id) REFERENCES Barangays(brgy_id),
	INDEX idx_brgy_id (brgy_id),
	INDEX idx_street_name (street_name)
	);

	INSERT INTO Streets(street_name, brgy_id)
	VALUES 
	('Reten', 7),
	('Dalupan',8),
	('Padre Noval', 64);


	CREATE TABLE Roles (
    role_id INT IDENTITY(1,1) PRIMARY KEY,
    role_name VARCHAR(20) NOT NULL
);

INSERT INTO Roles (role_name)
VALUES
('Account Holder'),
('Barangay Admin'),
('Central Admin');


CREATE TABLE Users (
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    role_id INT NOT NULL,
    first_name VARCHAR(75) NOT NULL,
    last_name VARCHAR(75) NOT NULL,
    address VARCHAR(75) NOT NULL,
    street_id INT NOT NULL,
    barangay_id INT NOT NULL,
    user_email VARCHAR(75) NOT NULL UNIQUE,
    contact_no BIGINT NULL,
    password VARCHAR(255),
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (role_id) REFERENCES Roles(role_id),
    FOREIGN KEY (street_id) REFERENCES Streets(street_id),
    FOREIGN KEY (barangay_id) REFERENCES Barangays(brgy_id)
);

ALTER TABLE Users
ADD user_photo VARCHAR(255) NULL;

CREATE TABLE Advisory_types (
    advisoryType_id INT IDENTITY(1,1) PRIMARY KEY,
    advisoryType_name VARCHAR(30) NOT NULL
);

INSERT INTO Advisory_types (advisoryType_name) VALUES 
('Scheduled Maintenance'),
('Service Interruption'), 
('Emergency Notice'),
('Water Quality'),
('Service Restoration');

CREATE TABLE Advisories (
    advisory_id INT IDENTITY(1,1) PRIMARY KEY,
    advisoryType_id INT NOT NULL,
    description TEXT NOT NULL,
    start_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_date DATE NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Upcoming', 'Ongoing', 'Resolved')),
    street_id INT NOT NULL,
    barangay_id INT NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (advisoryType_id) REFERENCES Advisory_types(advisoryType_id),
    FOREIGN KEY (street_id) REFERENCES Streets(street_id),
    FOREIGN KEY (barangay_id) REFERENCES Barangays(brgy_id),
    INDEX idx_advisory_brgy_id (barangay_id),
    INDEX idx_advisory_street_id (street_id)
);

CREATE TABLE Reports (
    report_id INT IDENTITY(1,1) PRIMARY KEY,
    description TEXT NULL,
    duration VARCHAR(80) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'verified', 'rejected', 'resolved')),
    contact_no BIGINT NULL,
    issue_type VARCHAR(100) NOT NULL,
    street_id INT NOT NULL,
    barangay_id INT NOT NULL,
    submitted_by INT NOT NULL,
    report_date DATETIME NOT NULL,
    supporting_img VARCHAR(255) NULL,
    FOREIGN KEY (street_id) REFERENCES Streets(street_id),
    FOREIGN KEY (barangay_id) REFERENCES Barangays(brgy_id),
    FOREIGN KEY (submitted_by) REFERENCES Users(user_id),
    INDEX idx_report_brgy_id (barangay_id),
    INDEX idx_report_street_id (street_id),
    INDEX idx_report_submitted_by (submitted_by)
);

CREATE TABLE GuestUsers_Address (
    id INT IDENTITY(1,1) PRIMARY KEY,
    guest_id INT NOT NULL,
    brgy_id INT NOT NULL,
    street_id INT NULL,
    FOREIGN KEY (guest_id) REFERENCES Guest_emails(guest_id),
    FOREIGN KEY (street_id) REFERENCES Streets(street_id),
    FOREIGN KEY (brgy_id) REFERENCES Barangays(brgy_id)
);

CREATE TABLE Complaint_types (
    complaint_type_id INT IDENTITY(1,1) PRIMARY KEY,
    complaint_type VARCHAR(75) NOT NULL
);

INSERT INTO Complaint_types (complaint_type )
VALUES
('No water supply'),
('Low water pressure'),
('Water leakage'),
('Water quality issue'),
('others');

CREATE TABLE Complaint_duration(
    complaint_duration_id INT IDENTITY(1,1) PRIMARY KEY,
    complaint_duration VARCHAR(75) NOT NULL
);

INSERT INTO Complaint_duration (complaint_duration  )
VALUES
('Just today'),
('Few days'),
('About a week'),
('More than a month'),
('Recurring issue');

CREATE TABLE Complaints(
    complaint_id INT IDENTITY(1,1) PRIMARY KEY,
    complaint_description TEXT NULL,
    complaint_type INT NOT NULL,
    complaint_duration INT NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'verified', 'rejected', 'resolved')),
    complaint_date DATETIME DEFAULT GETDATE(),
    address_detail VARCHAR(75) NOT NULL,
    street_id INT NULL,
    barangay_id INT NOT NULL,
    contact_no BIGINT NULL,
    submitted_by INT NOT NULL,
    supporting_img VARCHAR(255) NULL,
    FOREIGN KEY (complaint_type) REFERENCES Complaint_types (complaint_type_id),
    FOREIGN KEY (complaint_duration) REFERENCES Complaint_duration(complaint_duration_id),
    FOREIGN KEY (street_id) REFERENCES Streets(street_id),
    FOREIGN KEY (barangay_id) REFERENCES Barangays(brgy_id),
    FOREIGN KEY (submitted_by) REFERENCES Users(user_id),
    INDEX idx_report_brgy_id (barangay_id),
    INDEX idx_report_street_id (street_id),
    INDEX idx_report_submitted_by (submitted_by)
);

-- =============================================
-- Stored Procedure: Insert Guest Email
-- Description: Adds a new guest email subscription
-- =============================================
CREATE PROCEDURE sp_InsertGuestEmail
    @Email VARCHAR(55),
    @StatusCode INT OUTPUT,
    @StatusMessage VARCHAR(255) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Validate email parameter
        IF @Email IS NULL OR @Email = ''
        BEGIN
            SET @StatusCode = 400;
            SET @StatusMessage = 'Email address is required';
            RETURN;
        END
        
        -- Trim and normalize email
        SET @Email = LTRIM(RTRIM(LOWER(@Email)));
        
        -- Insert new email (UNIQUE constraint will handle duplicates)
        INSERT INTO Guest_emails (guest_email) VALUES (@Email);
        
        -- Success response
        SET @StatusCode = 200;
        SET @StatusMessage = 'Email subscribed successfully';
        
    END TRY
    BEGIN CATCH
        -- Handle duplicate email error
        IF ERROR_NUMBER() = 2627 -- Unique constraint violation
        BEGIN
            SET @StatusCode = 409;
            SET @StatusMessage = 'Email is already subscribed';
        END
        ELSE
        BEGIN
            SET @StatusCode = 500;
            SET @StatusMessage = 'Subscription failed';
        END
    END CATCH
END
GO

-- =============================================
-- Stored Procedure: Get All Guest Emails
-- Description: Retrieves all subscribed guest emails
-- =============================================
CREATE PROCEDURE sp_GetAllGuestEmails
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        guest_id,
        guest_email
    FROM Guest_emails
    ORDER BY guest_id DESC;
END
GO

-- FOR Test the stored procedure directly DO NOT EXECUTE
DECLARE @StatusCode INT, @StatusMessage VARCHAR(255);
EXEC sp_InsertGuestEmail 
    @Email = 'test@example.com',
    @StatusCode = @StatusCode OUTPUT,
    @StatusMessage = @StatusMessage OUTPUT;
    
SELECT @StatusCode as StatusCode, @StatusMessage as StatusMessage;

-- Check Guest_emails
SELECT * FROM Guest_emails ORDER BY guest_id DESC;

-- Check GuestUsers_Address with joined data
SELECT 
    ge.guest_email,
    s.street_name,
    b.brgy_number,
    gua.*
FROM GuestUsers_Address gua
JOIN Guest_emails ge ON gua.guest_id = ge.guest_id
JOIN Streets s ON gua.street_id = s.street_id
JOIN Barangays b ON gua.brgy_id = b.brgy_id
ORDER BY gua.id DESC;


SELECT * FROM Barangays;
SELECT * FROM Streets;
SELECT * FROM Guest_emails;
SELECT * FROM GuestUsers_Address;
SELECT * FROM Roles;
SELECT * FROM Users;
SELECT * FROM Advisory_types;
SELECT * FROM Advisories;
SELECT * FROM Complaint_types;
SELECT * FROM Complaint_duration;
SELECT * FROM Complaints;


DELETE FROM Guest_emails;


DELETE FROM Advisories
WHERE advisory_id = 4;

DELETE FROM Advisory_types
WHERE advisoryType_id = 2;

SELECT * FROM Streets
WHERE street_id = 3;

----
EXEC sp_rename 
    'Advisories.description',
    'advisory_description',
    'COLUMN';

EXEC sp_rename 
    'Advisories.advisoryType_id',
    'advisory_type_id',
    'COLUMN';

EXEC sp_rename 
    'Advisories.barangay_id',
    'brgy_id',
    'COLUMN';

EXEC sp_rename 
    'Advisory_types.advisoryType_id',
    'advisory_type_id',
    'COLUMN';

EXEC sp_rename 
    'Advisory_types.advisoryType_name',
    'advisory_type',
    'COLUMN';

EXEC sp_fkeys 'Advisory_types';


INSERT INTO Users (
    role_id,
    first_name,
    last_name,
    address,
    street_id,
    barangay_id,
    user_email,
    contact_no,
    password
)
VALUES (
    2, -- must exist in Roles
    'Luke',
    'Monte',
    '9203, St. S.H Loyola St.',
    28, -- must exist in Streets
    5, -- must exist in Barangays
    'monteluke@gmail.com',
    9125436058,
    '$2y$10$zAfgrj.wiwLvnnZ4DigQx.6U8d3rtJR99F91sRx3Cz588xjcm8yqm'
);

---------





