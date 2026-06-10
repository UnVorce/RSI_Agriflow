import prisma from '../../config/database';
import { hashPassword, comparePassword } from '../../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { AppError } from '../../common/middleware/error.middleware';
import logger from '../../utils/logger';
import { parseDatabaseError } from '../../utils/fsdErrorHandler';
import redisClient from '../../config/redis';
import { 
  ERR_VAL_03, 
  ERR_AUTH_02, 
  ERR_AUTHZ_01,
  ERR_USER_NOT_FOUND,
  ERR_SYS_01
} from '../../common/errors/fsdErrors';

function esc(val: string | null | undefined): string {
  if (val == null) return 'NULL';
  return `'${val.replace(/'/g, "''")}'`;
}

/**
 * Auth Service - FSD-Compliant Error Handling
 * CRITICAL: Login errors MUST be generic (ERR-AUTH-02) to prevent user enumeration
 */
export class AuthService {
  async register(data: {
    fullname: string;
    email: string;
    password: string;
    role: string;
    proofPath?: string;
  }) {
    try {
      const role = await prisma.role.findUnique({
        where: { RoleName: data.role },
      });

      if (!role) {
        throw new AppError('Role tidak valid', 400);
      }

      const nameParts = data.fullname.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : null;
      const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : null;

      const hashedPassword = await hashPassword(data.password);

      const escapeSQL = (str: string | null) => str ? str.replace(/'/g, "''") : null;

      const firstNameEsc = escapeSQL(firstName);
      const middleNameEsc = middleName ? `'${escapeSQL(middleName)}'` : 'NULL';
      const lastNameEsc = lastName ? `'${escapeSQL(lastName)}'` : 'NULL';
      const emailEsc = escapeSQL(data.email);
      const proofEsc = data.proofPath ? `'${escapeSQL(data.proofPath)}'` : 'NULL';

      const result = await prisma.$queryRawUnsafe<any[]>(`
        EXEC dbo.usp_RegisterUser
          @FirstName = '${firstNameEsc}',
          @MiddleName = ${middleNameEsc},
          @LastName = ${lastNameEsc},
          @Email = '${emailEsc}',
          @HashedPassword = '${hashedPassword}',
          @RoleId = ${role.RoleId},
          @RegistrationProof = ${proofEsc}
      `);

      const userResult = result[0];
      const userId = Number(userResult.UserId);

      await prisma.$executeRawUnsafe(`
        INSERT INTO evt.LOG_AKTIVITAS (LogId, Aksi, Deskripsi, UserId, Timestamp)
        VALUES (
          (SELECT ISNULL(MAX(LogId), 0) + 1 FROM evt.LOG_AKTIVITAS WITH (TABLOCKX)),
          'REGISTER',
          ${esc(`Pengguna baru mendaftar: ${data.email}`)},
          ${userId},
          GETDATE()
        )
      `);

      logger.info(`New user registered: ${data.email}`);

      return {
        userId: userResult.UserId,
        message: userResult.Message,
        email: data.email,
        status: 'Pending',
        role: data.role,
      };
    } catch (error: any) {
      // ERR-VAL-03: Generic message for duplicate email (prevent user enumeration)
      if (error.code === 'P2002' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
        throw ERR_VAL_03();
      }
      
      logger.error('Registration failed', { email: data.email, error: error.message });
      throw parseDatabaseError(error);
    }
  }

  async login(email: string, password: string) {
    try {
      const result = await prisma.$queryRawUnsafe<any[]>(`
        EXEC dbo.usp_LoginUser @Email = '${email.replace(/'/g, "''")}'
      `);

      const user = result[0];

      // ERR-AUTH-02: ALWAYS use generic message (don't reveal if email exists)
      if (!user) {
        throw ERR_AUTH_02();
      }

      // ERR-AUTHZ-01: Account not active (Rejected or Pending)
      if (user.Status === 'Rejected') {
        throw ERR_AUTHZ_01();
      }

      if (user.Status === 'Pending') {
        throw ERR_AUTHZ_01();
      }

      const isPasswordValid = await comparePassword(password, user.HashedPassword);
      
      // ERR-AUTH-02: ALWAYS use generic message (don't reveal if password is wrong)
      if (!isPasswordValid) {
        throw ERR_AUTH_02();
      }

      const payload = {
        userId: String(user.UserId),
        email: email,
        role: user.RoleName.toUpperCase(),
      };

      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      await prisma.$executeRawUnsafe(`
        INSERT INTO evt.LOG_AKTIVITAS (LogId, Aksi, Deskripsi, UserId, Timestamp)
        VALUES (
          (SELECT ISNULL(MAX(LogId), 0) + 1 FROM evt.LOG_AKTIVITAS WITH (TABLOCKX)),
          'LOGIN',
          ${esc(`Pengguna login: ${email}`)},
          ${user.UserId},
          GETDATE()
        )
      `);

      logger.info(`User logged in: ${email}`);

      return {
        accessToken,
        refreshToken,
        user: {
          userId: user.UserId,
          email: email,
          name: user.NamaLengkap,
          role: user.RoleName.toUpperCase(),
          status: user.Status,
        },
      };
    } catch (error: any) {
      // Pass through FSD errors
      if (error.name === 'AuthenticationError' || error.name === 'AuthorizationError' || error.name === 'FSDError') {
        throw error;
      }
      
      logger.error('Login failed', { email, error: error.message });
      
      // All other errors: generic message to prevent enumeration
      throw ERR_AUTH_02();
    }
  }

  async getPendingUsers() {
    try {
      const users = await prisma.user.findMany({
        where: {
          Status: 'Pending',
        },
        select: {
          UserId: true,
          FirstName: true,
          MiddleName: true,
          LastName: true,
          Email: true,
          RegistrationProof: true,
          CreatedAt: true,
          Role: {
            select: {
              RoleName: true,
            },
          },
        },
        orderBy: {
          CreatedAt: 'desc',
        },
      });

      return users;
    } catch (error: any) {
      logger.error('Failed to get pending users', { error: error.message });
      throw parseDatabaseError(error);
    }
  }

  async approveUser(userId: number, approverId: number) {
    try {
      const user = await prisma.user.findUnique({
        where: { UserId: userId },
      });

      if (!user) {
        throw ERR_USER_NOT_FOUND();
      }

      if (user.Status !== 'Pending') {
        throw new AppError('Pengguna sudah diproses', 400);
      }

      const updatedUser = await prisma.user.update({
        where: { UserId: userId },
        data: {
          Status: 'Active',
          UserIdPenyetuju: approverId,
          TimestampDisetujui: new Date(),
        },
        select: {
          UserId: true,
          Email: true,
          Status: true,
        },
      });

      await prisma.$executeRawUnsafe(`
        INSERT INTO evt.LOG_AKTIVITAS (LogId, Aksi, Deskripsi, UserId, Timestamp)
        VALUES (
          (SELECT ISNULL(MAX(LogId), 0) + 1 FROM evt.LOG_AKTIVITAS WITH (TABLOCKX)),
          'APPROVE_USER',
          ${esc(`Pengguna disetujui: ${user.Email}`)},
          ${approverId},
          GETDATE()
        )
      `);

      await prisma.$executeRawUnsafe(`
        INSERT INTO evt.NOTIFIKASI (NotifikasiId, Jenis, Judul, Pesan, StatusDibaca, UserId, Timestamp)
        VALUES (
          (SELECT ISNULL(MAX(NotifikasiId), 0) + 1 FROM evt.NOTIFIKASI WITH (TABLOCKX)),
          'APPROVAL',
          'Akun Disetujui',
          'Akun Anda telah disetujui dan sekarang aktif.',
          0,
          ${userId},
          GETDATE()
        )
      `);

      logger.info(`User approved: ${user.Email} by ${approverId}`);

      return updatedUser;
    } catch (error: any) {
      if (error instanceof AppError || error.name === 'FSDError') throw error;
      logger.error('Failed to approve user', { userId, approverId, error: error.message });
      throw parseDatabaseError(error);
    }
  }

  async rejectUser(userId: number, approverId: number) {
    try {
      const user = await prisma.user.findUnique({
        where: { UserId: userId },
      });

      if (!user) {
        throw ERR_USER_NOT_FOUND();
      }

      if (user.Status !== 'Pending') {
        throw new AppError('Pengguna sudah diproses', 400);
      }

      const updatedUser = await prisma.user.update({
        where: { UserId: userId },
        data: {
          Status: 'Rejected',
          UserIdPenyetuju: approverId,
          TimestampDisetujui: new Date(),
        },
        select: {
          UserId: true,
          Email: true,
          Status: true,
        },
      });

      await prisma.$executeRawUnsafe(`
        INSERT INTO evt.LOG_AKTIVITAS (LogId, Aksi, Deskripsi, UserId, Timestamp)
        VALUES (
          (SELECT ISNULL(MAX(LogId), 0) + 1 FROM evt.LOG_AKTIVITAS WITH (TABLOCKX)),
          'REJECT_USER',
          ${esc(`Pengguna ditolak: ${user.Email}`)},
          ${approverId},
          GETDATE()
        )
      `);

      await prisma.$executeRawUnsafe(`
        INSERT INTO evt.NOTIFIKASI (NotifikasiId, Jenis, Judul, Pesan, StatusDibaca, UserId, Timestamp)
        VALUES (
          (SELECT ISNULL(MAX(NotifikasiId), 0) + 1 FROM evt.NOTIFIKASI WITH (TABLOCKX)),
          'REJECTION',
          'Akun Ditolak',
          'Maaf, akun Anda telah ditolak.',
          0,
          ${userId},
          GETDATE()
        )
      `);

      logger.info(`User rejected: ${user.Email} by ${approverId}`);

      return updatedUser;
    } catch (error: any) {
      if (error instanceof AppError || error.name === 'FSDError') throw error;
      logger.error('Failed to reject user', { userId, approverId, error: error.message });
      throw parseDatabaseError(error);
    }
  }

  async logout(token: string, userId: number) {
    try {
      await redisClient.setEx(`blacklist:${token}`, 28800, 'true');

      await prisma.$executeRawUnsafe(`
        INSERT INTO evt.LOG_AKTIVITAS (LogId, Aksi, Deskripsi, UserId, Timestamp)
        VALUES (
          (SELECT ISNULL(MAX(LogId), 0) + 1 FROM evt.LOG_AKTIVITAS WITH (TABLOCKX)),
          'LOGOUT',
          ${esc('Pengguna logout')},
          ${userId},
          GETDATE()
        )
      `);

      logger.info(`User logged out: ${userId}`);

      return { message: 'Logout berhasil' };
    } catch (error) {
      logger.error('Logout error:', error);
      throw ERR_SYS_01('Gagal logout');
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = verifyRefreshToken(refreshToken);

      const user = await prisma.user.findUnique({
        where: { UserId: Number(payload.userId) },
        include: { Role: true },
      });

      if (!user) {
        throw ERR_USER_NOT_FOUND();
      }

      if (user.Status !== 'Active') {
        throw ERR_AUTHZ_01();
      }

      const newPayload = {
        userId: String(user.UserId),
        email: user.Email,
        role: user.Role.RoleName.toUpperCase(),
      };

      const newAccessToken = generateAccessToken(newPayload);

      logger.info(`Token refreshed for user: ${user.Email}`);

      return {
        accessToken: newAccessToken,
      };
    } catch (error: any) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        throw ERR_AUTH_02();
      }
      if (error.name === 'FSDError') throw error;
      throw parseDatabaseError(error);
    }
  }
}
