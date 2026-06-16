USE AgriFlowDB;

IF OBJECT_ID('dbo.usp_GetPemerintahDeteksiAnomali', 'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_GetPemerintahDeteksiAnomali;
GO

CREATE PROCEDURE dbo.usp_GetPemerintahDeteksiAnomali
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
  WHERE Jenis IN ('Warning', 'Stok')
  ORDER BY Timestamp DESC
  OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
END
GO
