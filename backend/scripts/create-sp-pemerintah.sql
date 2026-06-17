USE AgriFlowDB;
GO

-- SP 1: Top 3 Notifikasi Pemerintah
CREATE OR ALTER PROCEDURE dbo.usp_GetPemerintahNotifikasiTop3
  @UserId INT
AS
BEGIN
  SET NOCOUNT ON;
  SELECT TOP 3
    NotifikasiId,
    Jenis,
    Judul,
    Pesan,
    FORMAT(Timestamp, 'dd/MM/yyyy') AS Tanggal
  FROM evt.NOTIFIKASI
  WHERE UserId = @UserId AND StatusDibaca = 0
  ORDER BY Timestamp DESC;
END
GO

-- SP 2: Dashboard Pemerintah
CREATE OR ALTER PROCEDURE dbo.usp_GetPemerintahDashboard
  @Provinsi NVARCHAR(100) = NULL,
  @TahunAwal INT = NULL,
  @TahunAkhir INT = NULL,
  @PupukId INT = NULL
AS
BEGIN
  SET NOCOUNT ON;

  -- Result Set 1: Peta per provinsi
  SELECT
    kp.Provinsi,
    ISNULL(SUM(pp.Jumlah), 0) AS TotalPupuk
  FROM master.PETANI p
  JOIN ref.KODE_POS kp ON p.KodePosId = kp.KodePosId
  LEFT JOIN trans.PENEBUSAN_PUPUK pp ON p.PetaniId = pp.PetaniId
    AND pp.Status = 'Berhasil'
    AND (@TahunAwal IS NULL OR YEAR(pp.TimestampPenebusan) >= @TahunAwal)
    AND (@TahunAkhir IS NULL OR YEAR(pp.TimestampPenebusan) <= @TahunAkhir)
    AND (@PupukId IS NULL OR pp.PupukId = @PupukId)
  WHERE p.Status = 'Aktif'
    AND (@Provinsi IS NULL OR kp.Provinsi = @Provinsi)
  GROUP BY kp.Provinsi;

  -- Result Set 2: Total terserap (ton)
  SELECT
    CAST(ISNULL(SUM(pp.Jumlah), 0) / 1000 AS DECIMAL(18,2)) AS TotalTerserapTon
  FROM trans.PENEBUSAN_PUPUK pp
  JOIN master.PETANI p ON pp.PetaniId = p.PetaniId
  JOIN ref.KODE_POS kp ON p.KodePosId = kp.KodePosId
  WHERE pp.Status = 'Berhasil'
    AND p.Status = 'Aktif'
    AND (@Provinsi IS NULL OR kp.Provinsi = @Provinsi)
    AND (@TahunAwal IS NULL OR YEAR(pp.TimestampPenebusan) >= @TahunAwal)
    AND (@TahunAkhir IS NULL OR YEAR(pp.TimestampPenebusan) <= @TahunAkhir)
    AND (@PupukId IS NULL OR pp.PupukId = @PupukId);

  -- Result Set 3: Realisasi persen
  DECLARE @TotalDitebus DECIMAL(18,2) = 0;
  DECLARE @TotalSisa DECIMAL(18,2) = 0;

  SELECT @TotalDitebus = ISNULL(SUM(pp.Jumlah), 0)
  FROM trans.PENEBUSAN_PUPUK pp
  JOIN master.PETANI p ON pp.PetaniId = p.PetaniId
  JOIN ref.KODE_POS kp ON p.KodePosId = kp.KodePosId
  WHERE pp.Status = 'Berhasil' AND p.Status = 'Aktif'
    AND (@Provinsi IS NULL OR kp.Provinsi = @Provinsi)
    AND (@PupukId IS NULL OR pp.PupukId = @PupukId);

  SELECT @TotalSisa = ISNULL(SUM(kp2.SisaKuota), 0)
  FROM master.KUOTA_PETANI kp2
  JOIN master.PETANI p2 ON kp2.PetaniId = p2.PetaniId
  JOIN ref.KODE_POS kpos ON p2.KodePosId = kpos.KodePosId
  WHERE p2.Status = 'Aktif'
    AND (@Provinsi IS NULL OR kpos.Provinsi = @Provinsi)
    AND (@PupukId IS NULL OR kp2.PupukId = @PupukId);

  DECLARE @TotalAlokasi DECIMAL(18,2) = @TotalDitebus + @TotalSisa;
  SELECT
    CASE WHEN @TotalAlokasi = 0 THEN '0.00'
    ELSE CAST(CAST(@TotalDitebus / @TotalAlokasi * 100 AS DECIMAL(18,2)) AS NVARCHAR(20))
    END AS RealisasiPersen;

  -- Result Set 4: Top 3 provinsi
  SELECT TOP 3
    kp.Provinsi,
    ISNULL(SUM(pp.Jumlah), 0) AS TotalPupuk
  FROM trans.PENEBUSAN_PUPUK pp
  JOIN master.PETANI p ON pp.PetaniId = p.PetaniId
  JOIN ref.KODE_POS kp ON p.KodePosId = kp.KodePosId
  WHERE pp.Status = 'Berhasil' AND p.Status = 'Aktif'
    AND (@Provinsi IS NULL OR kp.Provinsi = @Provinsi)
    AND (@TahunAwal IS NULL OR YEAR(pp.TimestampPenebusan) >= @TahunAwal)
    AND (@TahunAkhir IS NULL OR YEAR(pp.TimestampPenebusan) <= @TahunAkhir)
    AND (@PupukId IS NULL OR pp.PupukId = @PupukId)
  GROUP BY kp.Provinsi
  ORDER BY TotalPupuk DESC;

  -- Result Set 5: Tren bulanan
  SELECT
    YEAR(pp.TimestampPenebusan) AS Tahun,
    MONTH(pp.TimestampPenebusan) AS Bulan,
    SUM(pp.Jumlah) AS TotalPupuk
  FROM trans.PENEBUSAN_PUPUK pp
  JOIN master.PETANI p ON pp.PetaniId = p.PetaniId
  JOIN ref.KODE_POS kp ON p.KodePosId = kp.KodePosId
  WHERE pp.Status = 'Berhasil' AND p.Status = 'Aktif'
    AND (@Provinsi IS NULL OR kp.Provinsi = @Provinsi)
    AND (@TahunAwal IS NULL OR YEAR(pp.TimestampPenebusan) >= @TahunAwal)
    AND (@TahunAkhir IS NULL OR YEAR(pp.TimestampPenebusan) <= @TahunAkhir)
    AND (@PupukId IS NULL OR pp.PupukId = @PupukId)
  GROUP BY YEAR(pp.TimestampPenebusan), MONTH(pp.TimestampPenebusan)
  ORDER BY Tahun, Bulan;

  -- Result Set 6: Top 3 sektor
  SELECT TOP 3
    p.Sektor,
    SUM(pp.Jumlah) AS TotalPupuk
  FROM trans.PENEBUSAN_PUPUK pp
  JOIN master.PETANI p ON pp.PetaniId = p.PetaniId
  JOIN ref.KODE_POS kp ON p.KodePosId = kp.KodePosId
  WHERE pp.Status = 'Berhasil' AND p.Status = 'Aktif'
    AND p.Sektor IS NOT NULL
    AND (@Provinsi IS NULL OR kp.Provinsi = @Provinsi)
    AND (@TahunAwal IS NULL OR YEAR(pp.TimestampPenebusan) >= @TahunAwal)
    AND (@TahunAkhir IS NULL OR YEAR(pp.TimestampPenebusan) <= @TahunAkhir)
    AND (@PupukId IS NULL OR pp.PupukId = @PupukId)
  GROUP BY p.Sektor
  ORDER BY TotalPupuk DESC;
END
GO

-- SP 3: Deteksi Anomali
CREATE OR ALTER PROCEDURE dbo.usp_GetPemerintahDeteksiAnomali
  @UserId INT,
  @PageNumber INT = 1
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @PageSize INT = 6;
  DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;

  SELECT
    Jenis AS JenisNotifikasi,
    Judul AS JudulNotifikasi,
    Pesan AS PesanNotifikasi,
    FORMAT(Timestamp, 'dd/MM/yyyy') AS Tanggal,
    COUNT(*) OVER() AS TotalRows
  FROM evt.NOTIFIKASI
  WHERE UserId = @UserId AND Jenis IN ('Warning', 'Stok')
  ORDER BY Timestamp DESC
  OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
END
GO

-- SP 4: Verifikasi Pendaftar
CREATE OR ALTER PROCEDURE dbo.usp_GetPemerintahVerifikasiPendaftar
  @PageNumber INT = 1,
  @PageSize INT = 6
AS
BEGIN
  SET NOCOUNT ON;

  -- Result Set 1: Summary
  SELECT
    COUNT(*) AS Total,
    SUM(CASE WHEN Status = 'Active' THEN 1 ELSE 0 END) AS TotalAktif,
    SUM(CASE WHEN Status = 'Rejected' THEN 1 ELSE 0 END) AS TotalDitolak
  FROM master.[USER];

  -- Result Set 2: Daftar Pending
  DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
  SELECT
    ROW_NUMBER() OVER (ORDER BY u.CreatedAt) AS No,
    u.UserId,
    LTRIM(RTRIM(u.FirstName + ISNULL(' ' + u.MiddleName, '') + ISNULL(' ' + u.LastName, ''))) AS NamaLengkap,
    u.Email,
    r.RoleName AS Role,
    u.RegistrationProof,
    COUNT(*) OVER() AS TotalRows
  FROM master.[USER] u
  JOIN ref.ROLE r ON u.RoleId = r.RoleId
  WHERE u.Status = 'Pending'
  ORDER BY u.CreatedAt
  OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
END
GO

-- SP 5: Approve User
CREATE OR ALTER PROCEDURE dbo.usp_ApproveUser
  @UserIdPenyetuju INT,
  @UserId INT
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE master.[USER]
  SET Status = 'Active',
      UserIdPenyetuju = @UserIdPenyetuju,
      TimestampDisetujui = GETDATE(),
      UpdatedAt = GETDATE()
  WHERE UserId = @UserId AND Status = 'Pending';

  IF @@ROWCOUNT = 0
    THROW 50040, 'User tidak ditemukan atau bukan Pending', 1;
END
GO

-- SP 6: Reject User
CREATE OR ALTER PROCEDURE dbo.usp_RejectUser
  @UserIdPemerintah INT,
  @UserId INT
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE master.[USER]
  SET Status = 'Rejected',
      UpdatedAt = GETDATE()
  WHERE UserId = @UserId AND Status = 'Pending';

  IF @@ROWCOUNT = 0
    THROW 50041, 'User tidak ditemukan atau bukan Pending', 1;
END
GO

-- SP 7: Bantuan/Keluhan
CREATE OR ALTER PROCEDURE dbo.usp_GetPemerintahBantuan
  @PageNumber INT = 1
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @PageSize INT = 8;
  DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;

  SELECT
    ROW_NUMBER() OVER (ORDER BY Timestamp DESC) AS No,
    LTRIM(RTRIM(FirstName + ISNULL(' ' + MiddleName, '') + ISNULL(' ' + LastName, ''))) AS NamaLengkap,
    Email,
    Topik,
    Ringkasan,
    COUNT(*) OVER() AS TotalRows
  FROM evt.BANTUAN
  ORDER BY Timestamp DESC
  OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
END
GO
