import prisma from '../../config/database';
import logger from '../../utils/logger';

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

export class BantuanService {
  async createBantuan(input: CreateBantuanInput) {
    try {
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

      const idResult = await prisma.$queryRawUnsafe<{ NextId: number }[]>(
        `SELECT ISNULL(MAX(BantuanId), 0) + 1 AS NextId FROM evt.BANTUAN`
      );
      const nextId = idResult[0].NextId;

      await prisma.$executeRawUnsafe(`
        EXEC dbo.usp_CreateBantuan
          ${nextId},
          N'${firstNameEsc}',
          ${middleNameParam},
          ${lastNameParam},
          N'${emailEsc}',
          N'${topikEsc}',
          N'${ringkasanEsc}',
          ${userIdParam}
      `);

      logger.info(`Bantuan created: ${nextId} by ${input.email}`);

      return {
        BantuanId: nextId,
        Pesan: 'Laporan bantuan berhasil dikirim.',
        FirstName: input.firstName,
        Email: input.email,
        Topik: input.topik,
      };
    } catch (error: any) {
      logger.error(`Error creating bantuan: ${error.message}`);
      if (error.message.includes('tidak boleh kosong')) {
        throw new Error(error.message);
      }
      throw new Error('Gagal membuat bantuan');
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
      throw new Error('Gagal mengambil data bantuan');
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
      throw new Error('Gagal mengambil data bantuan');
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
      throw new Error('Gagal mengambil data bantuan');
    }
  }
}
