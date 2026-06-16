USE AgriFlowDB;

IF OBJECT_ID('dbo.usp_GetPemerintahDashboard', 'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_GetPemerintahDashboard;
GO

CREATE PROCEDURE dbo.usp_GetPemerintahDashboard
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
  JOIN ref.KODE_POS kp ON p.KodePos = kp.KodePosId
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
  JOIN ref.KODE_POS kp ON p.KodePos = kp.KodePosId
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
  JOIN ref.KODE_POS kp ON p.KodePos = kp.KodePosId
  WHERE pp.Status = 'Berhasil' AND p.Status = 'Aktif'
    AND (@Provinsi IS NULL OR kp.Provinsi = @Provinsi)
    AND (@PupukId IS NULL OR pp.PupukId = @PupukId);

  SELECT @TotalSisa = ISNULL(SUM(kp2.SisaKuota), 0)
  FROM master.KUOTA_PETANI kp2
  JOIN master.PETANI p2 ON kp2.PetaniId = p2.PetaniId
  JOIN ref.KODE_POS kpos ON p2.KodePos = kpos.KodePosId
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
  JOIN ref.KODE_POS kp ON p.KodePos = kp.KodePosId
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
  JOIN ref.KODE_POS kp ON p.KodePos = kp.KodePosId
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
  JOIN ref.KODE_POS kp ON p.KodePos = kp.KodePosId
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
