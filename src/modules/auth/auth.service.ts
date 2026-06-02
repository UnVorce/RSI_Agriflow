import prisma from '../../config/database';
import { hashPassword, comparePassword } from '../../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { AppError } from '../../common/middleware/error.middleware';
import logger from '../../utils/logger';
import redisClient from '../../config/redis';

export class AuthService {
  async register(data: {
    fullname: string;
    email: string;
    password: string;
    role: string;
    proofPath?: string;
  }) {
    try {
      // Get role ID
      const role = await prisma.role.findUnique({
        where: { RoleName: data.role },
      });

      if (!role) {
        throw new AppError('Role tidak valid', 400);
      }

      // Parse fullname
      const nameParts = data.fullname.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : null;
      const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : null;

      // Hash password
      const hashedPassword = await hashPassword(data.password);

      // Escape single quotes in strings for SQL
      const escapeSQL = (str: string | null) => str ? str.replace(/'/g, "''") : null;
      
      const firstNameEsc = escapeSQL(firstName);
      const middleNameEsc = middleName ? `'${escapeSQL(middleName)}'` : 'NULL';
      const lastNameEsc = lastName ? `'${escapeSQL(lastName)}'` : 'NULL';
      const emailEsc = escapeSQL(data.email);
      const proofEsc = data.proofPath ? `'${escapeSQL(data.proofPath)}'` : 'NULL';

      // Execute stored procedure: dbo.usp_RegisterUser
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

      // Log activity
      await prisma.logAktivitas.create({
        data: {
          Aksi: 'REGISTER',
          Deskripsi: `Pengguna baru mendaftar: ${data.email}`,
          UserId: userResult.UserId.toString(),
        },
      });

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
    // Execute stored procedure: dbo.usp_LoginUser
    const result = await prisma.$queryRawUnsafe<any[]>(`
      EXEC dbo.usp_LoginUser @Email = '${email.replace(/'/g, "''")}'
    `);

    const user = result[0];

    if (!user) {
      throw new AppError('Email atau password salah', 401);
    }

    // Check if user is rejected
    if (user.Status === 'Rejected') {
      throw new AppError('Akun Anda telah ditolak', 403);
    }

    // Check if user is pending
    if (user.Status === 'Pending') {
      throw new AppError('Akun Anda masih menunggu persetujuan', 403);
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.HashedPassword);
    if (!isPasswordValid) {
      throw new AppError('Email atau password salah', 401);
    }

    // Generate tokens
    const payload = {
      userId: user.UserId,
      email: email,
      role: user.RoleName,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Log activity
    await prisma.logAktivitas.create({
      data: {
        Aksi: 'LOGIN',
        Deskripsi: `Pengguna login: ${email}`,
        UserId: user.UserId.toString(),
      },
    });

    logger.info(`User logged in: ${email}`);

    return {
      accessToken,
      refreshToken,
      user: {
        userId: user.UserId,
        email: email,
        name: user.NamaLengkap,
        role: user.RoleName,
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

  async approveUser(userId: string, approverId: string) {
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

    // Log activity
    await prisma.logAktivitas.create({
      data: {
        Aksi: 'APPROVE_USER',
        Deskripsi: `Pengguna disetujui: ${user.Email}`,
        UserId: approverId,
      },
    });

    // Create notification for approved user
    await prisma.notifikasi.create({
      data: {
        Jenis: 'APPROVAL',
        Judul: 'Akun Disetujui',
        Pesan: 'Akun Anda telah disetujui dan sekarang aktif.',
        UserId: userId,
      },
    });

    logger.info(`User approved: ${user.Email} by ${approverId}`);

    return updatedUser;
  }

  async rejectUser(userId: string, approverId: string) {
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

    // Log activity
    await prisma.logAktivitas.create({
      data: {
        Aksi: 'REJECT_USER',
        Deskripsi: `Pengguna ditolak: ${user.Email}`,
        UserId: approverId,
      },
    });

    // Create notification for rejected user
    await prisma.notifikasi.create({
      data: {
        Jenis: 'REJECTION',
        Judul: 'Akun Ditolak',
        Pesan: 'Maaf, akun Anda telah ditolak.',
        UserId: userId,
      },
    });

    logger.info(`User rejected: ${user.Email} by ${approverId}`);

    return updatedUser;
  }

  async logout(token: string, userId: string) {
    try {
      // Add token to blacklist (8 hours = 28800 seconds)
      await redisClient.setEx(`blacklist:${token}`, 28800, 'true');

      // Log activity
      await prisma.logAktivitas.create({
        data: {
          Aksi: 'LOGOUT',
          Deskripsi: 'Pengguna logout',
          UserId: userId,
        },
      });

      logger.info(`User logged out: ${userId}`);

      return { message: 'Logout berhasil' };
    } catch (error) {
      logger.error('Logout error:', error);
      throw new AppError('Gagal logout', 500);
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      // Verify refresh token
      const payload = verifyRefreshToken(refreshToken);

      // Check if user still exists and is active
      const user = await prisma.user.findUnique({
        where: { UserId: payload.userId },
        include: { Role: true },
      });

      if (!user) {
        throw new AppError('Pengguna tidak ditemukan', 404);
      }

      if (user.Status !== 'Active') {
        throw new AppError('Akun tidak aktif', 403);
      }

      // Generate new access token
      const newPayload = {
        userId: user.UserId,
        email: user.Email,
        role: user.Role.RoleName,
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
