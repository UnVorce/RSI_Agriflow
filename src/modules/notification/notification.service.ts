import prisma from '../../config/database';
import { AppError } from '../../common/middleware/error.middleware';

export class NotificationService {
  async getNotifications(userId: string, unreadOnly: boolean = false) {
    const where: any = {
      UserId: userId,
    };

    if (unreadOnly) {
      where.StatusDibaca = false;
    }

    const notifications = await prisma.notifikasi.findMany({
      where,
      orderBy: {
        Timestamp: 'desc',
      },
    });

    return notifications;
  }

  async markAsRead(notificationId: string, userId: string) {
    // Verify notification belongs to user
    const notification = await prisma.notifikasi.findUnique({
      where: { NotifikasiId: notificationId },
    });

    if (!notification) {
      throw new AppError('Notifikasi tidak ditemukan', 404);
    }

    if (notification.UserId !== userId) {
      throw new AppError('Notifikasi bukan milik Anda', 403);
    }

    const updated = await prisma.notifikasi.update({
      where: { NotifikasiId: notificationId },
      data: { StatusDibaca: true },
    });

    return updated;
  }

  async markAllAsRead(userId: string) {
    const result = await prisma.notifikasi.updateMany({
      where: {
        UserId: userId,
        StatusDibaca: false,
      },
      data: {
        StatusDibaca: true,
      },
    });

    return { count: result.count };
  }

  async getUnreadCount(userId: string) {
    const count = await prisma.notifikasi.count({
      where: {
        UserId: userId,
        StatusDibaca: false,
      },
    });

    return { count };
  }

  async deleteNotification(notificationId: string, userId: string) {
    // Verify notification belongs to user
    const notification = await prisma.notifikasi.findUnique({
      where: { NotifikasiId: notificationId },
    });

    if (!notification) {
      throw new AppError('Notifikasi tidak ditemukan', 404);
    }

    if (notification.UserId !== userId) {
      throw new AppError('Notifikasi bukan milik Anda', 403);
    }

    await prisma.notifikasi.delete({
      where: { NotifikasiId: notificationId },
    });

    return { message: 'Notifikasi berhasil dihapus' };
  }

  async createNotification(data: {
    userId: string;
    jenis: string;
    judul: string;
    pesan: string;
  }) {
    const notification = await prisma.notifikasi.create({
      data: {
        UserId: data.userId,
        Jenis: data.jenis,
        Judul: data.judul,
        Pesan: data.pesan,
      },
    });

    return notification;
  }

  // Complaint/Help system
  async submitComplaint(data: {
    firstName: string;
    middleName?: string;
    lastName?: string;
    email: string;
    topik: string;
    ringkasan: string;
    userId?: string;
  }) {
    if (data.ringkasan.length > 100) {
      throw new AppError('Ringkasan maksimal 100 karakter', 400);
    }

    const complaint = await prisma.bantuan.create({
      data: {
        FirstName: data.firstName,
        MiddleName: data.middleName,
        LastName: data.lastName,
        Email: data.email,
        Topik: data.topik,
        Ringkasan: data.ringkasan,
        UserId: data.userId,
      },
    });

    // Log activity
    if (data.userId) {
      await prisma.logAktivitas.create({
        data: {
          Aksi: 'SUBMIT_COMPLAINT',
          Deskripsi: `Mengajukan bantuan: ${data.topik}`,
          UserId: data.userId,
        },
      });
    }

    return complaint;
  }

  async getComplaints() {
    const complaints = await prisma.bantuan.findMany({
      orderBy: {
        Timestamp: 'desc',
      },
      include: {
        User: {
          select: {
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

    return complaints;
  }

  async getComplaintById(complaintId: string) {
    const complaint = await prisma.bantuan.findUnique({
      where: { BantuanId: complaintId },
      include: {
        User: {
          select: {
            Email: true,
            FirstName: true,
            LastName: true,
            Role: {
              select: {
                RoleName: true,
              },
            },
          },
        },
      },
    });

    if (!complaint) {
      throw new AppError('Bantuan tidak ditemukan', 404);
    }

    return complaint;
  }
}
