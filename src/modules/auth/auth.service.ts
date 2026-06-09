import prisma from '../../config/database';
import { hashPassword, comparePassword } from '../../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { AppError } from '../../common/middleware/error.middleware';
import logger from '../../utils/logger';
import redisClient from '../../config/redis';

function esc(val: string | null | undefined): string {
  if (val == null) return 'NULL';
  return `'${val.replace(/'/g, "''")}'`;
}

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
      if (error.message.includes('Email sudah terdaftar')) {
        throw new AppError('Email sudah terdaftar', 400);
      }
      throw error;
    }
  }

  async login(email: string, password: string) {
    const result = await prisma.$queryRawUnsafe<any[]>(`
      EXEC dbo.usp_LoginUser @Email = '${email.replace(/'/g, "''")}'
    `);

    const user = result[0];

    if (!user) {
      throw new AppError('Email atau password salah', 401);
    }

    if (user.Status === 'Rejected') {
      throw new AppError('Akun Anda telah ditolak', 403);
    }

    if (user.Status === 'Pending') {
      throw new AppError('Akun Anda masih menunggu persetujuan', 403);
    }

    const isPasswordValid = await comparePassword(password, user.HashedPassword);
    if (!isPasswordValid) {
      throw new AppError('Email atau password salah', 401);
    }

    const userId = Number(user.UserId);

    const payload = {
      userId,
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
        ${userId},
        GETDATE()
      )
    `);

    logger.info(`User logged in: ${email}`);

    return {
      accessToken,
      refreshToken,
      user: {
        userId,
        email: email,
        name: user.NamaLengkap,
        role: user.RoleName.toUpperCase(),
        status: user.Status,
      },
    };
  }

  async getPendingUsers() {
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
  }

  async approveUser(userId: number, approverId: number) {
    const user = await prisma.user.findUnique({
      where: { UserId: userId },
    });

    if (!user) {
      throw new AppError('Pengguna tidak ditemukan', 404);
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
  }

  async rejectUser(userId: number, approverId: number) {
    const user = await prisma.user.findUnique({
      where: { UserId: userId },
    });

    if (!user) {
      throw new AppError('Pengguna tidak ditemukan', 404);
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
      throw new AppError('Gagal logout', 500);
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = verifyRefreshToken(refreshToken);

      const userId = Number(payload.userId);
      if (isNaN(userId)) {
        throw new AppError('Token tidak valid, silakan login ulang', 401);
      }

      const user = await prisma.user.findUnique({
        where: { UserId: userId },
        include: { Role: true },
      });

      if (!user) {
        throw new AppError('Pengguna tidak ditemukan', 404);
      }

      if (user.Status !== 'Active') {
        throw new AppError('Akun tidak aktif', 403);
      }

      const newPayload = {
        userId: user.UserId,
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
        throw new AppError('Refresh token tidak valid atau sudah kadaluarsa', 401);
      }
      throw error;
    }
  }
}
