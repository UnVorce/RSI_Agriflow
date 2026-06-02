import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';

interface CreateBantuanInput {
  firstName: string;
  middleName?: string;
  lastName?: string;
  email: string;
  topik: string;
  ringkasan: string;
  userId?: string;
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
      const userIdParam = input.userId ? `'${input.userId}'` : 'NULL';

      // Execute stored procedure: dbo.usp_CreateBantuan
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

      const bantuanResult = result[0];

      logger.info(`Bantuan created: ${bantuanResult.BantuanId} by ${input.email}`);

      return {
        BantuanId: bantuanResult.BantuanId,
        Pesan: bantuanResult.Pesan,
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

  async getBantuanById(bantuanId: string) {
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

  async getBantuanByUserId(userId: string) {
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
