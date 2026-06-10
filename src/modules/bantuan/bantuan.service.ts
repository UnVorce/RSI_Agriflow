import prisma from '../../config/database';
import logger from '../../utils/logger';
import { parseDatabaseError } from '../../utils/fsdErrorHandler';
import { ERR_VAL_02, ERR_SYS_02 } from '../../common/errors/fsdErrors';

interface CreateBantuanInput {
  firstName: string;
  middleName?: string;
  lastName?: string;
  email: string;
  topik: string;
  ringkasan: string;
  userId?: number;
}

interface GetAllBantuanParams {
  page: number;
  limit: number;
  topik?: string;
}

/**
 * Bantuan Service - FSD-Compliant Error Handling
 * ERR-VAL-06: Field wajib kosong
 * ERR-SYS-02: Gagal menyimpan bantuan
 */
export class BantuanService {
  async createBantuan(input: CreateBantuanInput) {
    try {
      // Validate required fields
      if (!input.firstName || !input.email || !input.topik || !input.ringkasan) {
        throw ERR_VAL_02();
      }

      // Escape single quotes for SQL
      const escapeSQL = (str: string | null | undefined) => 
        str ? str.replace(/'/g, "''") : null;

      const firstNameEsc = escapeSQL(input.firstName);
      const middleNameParam = input.middleName ? `'${escapeSQL(input.middleName)}'` : 'NULL';
      const lastNameParam = input.lastName ? `'${escapeSQL(input.lastName)}'` : 'NULL';
      const emailEsc = escapeSQL(input.email);
      const topikEsc = escapeSQL(input.topik);
      const ringkasanEsc = escapeSQL(input.ringkasan);
      const userIdParam = input.userId != null ? `${input.userId}` : 'NULL';

      const result = await prisma.$queryRawUnsafe<any[]>(`
        EXEC dbo.usp_CreateBantuan
          @FirstName = '${firstNameEsc}',
          @MiddleName = ${middleNameParam},
          @LastName = ${lastNameParam},
          @Email = '${emailEsc}',
          @Topik = '${topikEsc}',
          @Ringkasan = '${ringkasanEsc}',
          @UserId = ${userIdParam}
      `);

      const bantuanResult = Array.isArray(result) && result.length > 0 ? result[0] : result;

      if (!bantuanResult) {
        throw ERR_SYS_02('Stored procedure tidak mengembalikan hasil');
      }

      logger.info(`Bantuan created: ${bantuanResult.BantuanId || 'unknown'} by ${input.email}`);

      return {
        BantuanId: bantuanResult.BantuanId || null,
        Pesan: bantuanResult.Pesan || 'Bantuan berhasil dikirim',
        FirstName: input.firstName,
        Email: input.email,
        Topik: input.topik,
      };
    } catch (error: any) {
      if (error.name === 'ValidationError' || error.name === 'SystemError' || error.name === 'FSDError') throw error;
      
      logger.error(`Error creating bantuan: ${error.message}`, { error });
      throw parseDatabaseError(error);
    }
  }

  async getAllBantuan(params: GetAllBantuanParams) {
    try {
      const { page, limit, topik } = params;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (topik) {
        where.Topik = {
          contains: topik,
        };
      }

      const [data, total] = await Promise.all([
        prisma.bantuan.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            Timestamp: 'desc',
          },
          include: {
            User: {
              select: {
                UserId: true,
                FirstName: true,
                MiddleName: true,
                LastName: true,
                Email: true,
                Role: {
                  select: {
                    RoleName: true,
                  },
                },
              },
            },
          },
        }),
        prisma.bantuan.count({ where }),
      ]);

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      logger.error(`Error getting all bantuan: ${error.message}`);
      throw parseDatabaseError(error);
    }
  }

  async getBantuanById(bantuanId: number) {
    try {
      const bantuan = await prisma.bantuan.findUnique({
        where: {
          BantuanId: bantuanId,
        },
        include: {
          User: {
            select: {
              UserId: true,
              FirstName: true,
              MiddleName: true,
              LastName: true,
              Email: true,
              Role: {
                select: {
                  RoleName: true,
                },
              },
            },
          },
        },
      });

      return bantuan;
    } catch (error: any) {
      logger.error(`Error getting bantuan by ID: ${error.message}`);
      throw parseDatabaseError(error);
    }
  }

  async getBantuanByUserId(userId: number) {
    try {
      const bantuan = await prisma.bantuan.findMany({
        where: {
          UserId: userId,
        },
        orderBy: {
          Timestamp: 'desc',
        },
      });

      return bantuan;
    } catch (error: any) {
      logger.error(`Error getting bantuan by user ID: ${error.message}`);
      throw parseDatabaseError(error);
    }
  }
}
