import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../src/config/database';
import { NotificationService } from '../src/modules/notification/notification.service';

describe('Notification Module Tests', () => {
  const notificationService = new NotificationService();
  let testUserId: number;

  beforeAll(async () => {
    const role = await prisma.role.findFirst();
    
    const testUser = await prisma.user.create({
      data: {
        UserId: Math.floor(Math.random() * 1000000) + 100000,
        FirstName: 'Test',
        LastName: 'Notif',
        Email: `test-notif-${Date.now()}@example.com`,
        Status: 'Active',
        RoleId: role!.RoleId,
        HashedPassword: 'password',
      },
    });
    testUserId = testUser.UserId;

    // Create some initial notifications
    await notificationService.createNotification({
      userId: testUserId,
      jenis: 'INFO',
      judul: 'Test Notification 1',
      pesan: 'This is a test notification',
    });

    await notificationService.createNotification({
      userId: testUserId,
      jenis: 'WARNING',
      judul: 'Test Notification 2',
      pesan: 'This is another test notification',
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.notifikasi.deleteMany({
      where: { UserId: testUserId },
    });
    await prisma.logAktivitas.deleteMany({
      where: { UserId: testUserId },
    });
    await prisma.user.delete({
      where: { UserId: testUserId },
    });
  });

  it('should get user notifications', async () => {
    const notifications = await notificationService.getNotifications(testUserId);
    expect(notifications).toBeDefined();
    expect(notifications.length).toBeGreaterThanOrEqual(2);
    expect(notifications[0].StatusDibaca).toBe(false);
  });

  it('should get unread count', async () => {
    const result = await notificationService.getUnreadCount(testUserId);
    expect(result.count).toBeGreaterThanOrEqual(2);
  });

  it('should mark notification as read', async () => {
    const notifications = await notificationService.getNotifications(testUserId);
    const notificationId = notifications[0].NotifikasiId;

    const updated = await notificationService.markAsRead(notificationId, testUserId);
    expect(updated.StatusDibaca).toBe(true);
  });

  it('should mark all notifications as read', async () => {
    await notificationService.markAllAsRead(testUserId);
    const result = await notificationService.getUnreadCount(testUserId);
    expect(result.count).toBe(0);
  });

  it('should submit complaint successfully', async () => {
    const email = `complaint-${Date.now()}@example.com`;
    const complaintData = {
      firstName: 'John',
      lastName: 'Doe',
      email: email,
      topik: 'Test Complaint',
      ringkasan: 'This is a short complaint',
      userId: testUserId,
    };

    const complaint = await notificationService.submitComplaint(complaintData);
    expect(complaint).toBeDefined();
    
    // Clean up complaint
    await prisma.bantuan.deleteMany({
      where: { Email: email },
    });
  });

  it('should validate complaint ringkasan max 100 chars', async () => {
    const ringkasan = 'a'.repeat(101);
    
    const complaintData = {
      firstName: 'John',
      email: `complaint-invalid-${Date.now()}@example.com`,
      topik: 'Test',
      ringkasan: ringkasan,
    };

    await expect(notificationService.submitComplaint(complaintData)).rejects.toThrow('Ringkasan maksimal 100 karakter');
  });
});
