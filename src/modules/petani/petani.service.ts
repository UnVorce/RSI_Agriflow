import prisma from '../../config/database';
import logger from '../../utils/logger';
import { parseDatabaseError } from '../../utils/fsdErrorHandler';
import { ERR_BUS_04, ERR_VAL_05, ERR_VAL_03 } from '../../common/errors/fsdErrors';

interface GetFarmersParams {
  page: number;
  limit: number;
  status?: string;
  search?: string;
}

interface CreateFarmerInput {
  petaniId: string;
  firstName: string;
  middleName?: string;
  lastName?: string;
  nomorHp: string;
  jalan: string;
  rt: string;
  rw: string;
  kodePosId: string;
  sektor: string;
  luasLahan: number;
  userIdPengecer: number;
  awalTerdaftar: Date;
  akhirTerdaftar: Date;
  status: string;
}

/**
 * Petani Service - FSD-Compliant Error Handling
 * ERR-VAL-05: Format ID Petani (16 digit)
 * ERR-BUS-04: Petani not found
 * ERR-VAL-03: Duplicate ID Petani
 */
export class PetaniService {
  async getFarmersByRetailer(
    userIdPengecer: number,
    params: GetFarmersParams
  ) {
    try {
      const { page, limit, status, search } = params;
      const skip = (page - 1) * limit;

      const where: any = {
        UserIdPengecer: userIdPengecer,
      };

      if (status) {
        where.Status = status;
      }

      if (search) {
        where.OR = [
          { PetaniId: { contains: search } },
          { FirstName: { contains: search } },
          { LastName: { contains: search } },
        ];
      }

      const [data, total] = await Promise.all([
        prisma.petani.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            AwalTerdaftar: 'desc',
          },
          include: {
            KodePos: true,
            KuotaPetani: {
              include: {
                Pupuk: true,
              },
            },
          },
        }),
        prisma.petani.count({ where }),
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
      logger.error(`Error getting farmers: ${error.message}`);
      throw parseDatabaseError(error);
    }
  }

  async getFarmerById(petaniId: string, userIdPengecer: number) {
    try {
      const farmer = await prisma.petani.findFirst({
        where: {
          PetaniId: petaniId,
          UserIdPengecer: userIdPengecer,
        },
        include: {
          KodePos: true,
          Pengecer: {
            select: {
              UserId: true,
              FirstName: true,
              MiddleName: true,
              LastName: true,
              Email: true,
            },
          },
          KuotaPetani: {
            include: {
              Pupuk: true,
            },
          },
        },
      });

      if (!farmer) {
        throw ERR_BUS_04();
      }

      return farmer;
    } catch (error: any) {
      if (error.name === 'BusinessRuleError' || error.name === 'FSDError') throw error;
      logger.error(`Error getting farmer by ID: ${error.message}`);
      throw parseDatabaseError(error);
    }
  }

  async getFarmerQuota(petaniId: string, userIdPengecer: number) {
    try {
      // Verify farmer belongs to retailer
      const farmer = await prisma.petani.findFirst({
        where: {
          PetaniId: petaniId,
          UserIdPengecer: userIdPengecer,
        },
      });

      if (!farmer) {
        throw ERR_BUS_04();
      }

      const quota = await prisma.kuotaPetani.findMany({
        where: {
          PetaniId: petaniId,
        },
        include: {
          Pupuk: true,
        },
      });

      return quota;
    } catch (error: any) {
      if (error.name === 'BusinessRuleError' || error.name === 'FSDError') throw error;
      logger.error(`Error getting farmer quota: ${error.message}`);
      throw parseDatabaseError(error);
    }
  }

  async createFarmer(input: CreateFarmerInput) {
    try {
      // ERR-VAL-05: Validate 16-digit ID
      if (!/^\d{16}$/.test(input.petaniId)) {
        throw ERR_VAL_05();
      }

      // Check if farmer already exists
      const existing = await prisma.petani.findUnique({
        where: {
          PetaniId: input.petaniId,
        },
      });

      if (existing) {
        throw ERR_VAL_03(); // Duplicate (generic message)
      }

      const farmer = await prisma.petani.create({
        data: {
          PetaniId: input.petaniId,
          FirstName: input.firstName,
          MiddleName: input.middleName,
          LastName: input.lastName,
          NomorHp: input.nomorHp,
          Jalan: input.jalan,
          Rt: input.rt,
          Rw: input.rw,
          KodePosId: input.kodePosId,
          Sektor: input.sektor,
          LuasLahan: input.luasLahan,
          UserIdPengecer: input.userIdPengecer,
          AwalTerdaftar: input.awalTerdaftar,
          AkhirTerdaftar: input.akhirTerdaftar,
          Status: input.status,
        },
        include: {
          KodePos: true,
        },
      });

      logger.info(`Farmer created: ${farmer.PetaniId}`);

      return farmer;
    } catch (error: any) {
      if (error.name === 'ValidationError' || error.name === 'FSDError') throw error;
      logger.error(`Error creating farmer: ${error.message}`);
      throw parseDatabaseError(error);
    }
  }

  async updateFarmer(
    petaniId: string,
    userIdPengecer: number,
    updateData: Partial<CreateFarmerInput>
  ) {
    try {
      // Verify farmer belongs to retailer
      const existing = await prisma.petani.findFirst({
        where: {
          PetaniId: petaniId,
          UserIdPengecer: userIdPengecer,
        },
      });

      if (!existing) {
        throw ERR_BUS_04();
      }

      const farmer = await prisma.petani.update({
        where: {
          PetaniId: petaniId,
        },
        data: {
          FirstName: updateData.firstName,
          MiddleName: updateData.middleName,
          LastName: updateData.lastName,
          NomorHp: updateData.nomorHp,
          Jalan: updateData.jalan,
          Rt: updateData.rt,
          Rw: updateData.rw,
          KodePosId: updateData.kodePosId,
          Sektor: updateData.sektor,
          LuasLahan: updateData.luasLahan,
          AwalTerdaftar: updateData.awalTerdaftar,
          AkhirTerdaftar: updateData.akhirTerdaftar,
          Status: updateData.status,
        },
        include: {
          KodePos: true,
        },
      });

      logger.info(`Farmer updated: ${farmer.PetaniId}`);

      return farmer;
    } catch (error: any) {
      if (error.name === 'BusinessRuleError' || error.name === 'FSDError') throw error;
      logger.error(`Error updating farmer: ${error.message}`);
      throw parseDatabaseError(error);
    }
  }

  async deleteFarmer(petaniId: string, userIdPengecer: number) {
    try {
      // Verify farmer belongs to retailer
      const existing = await prisma.petani.findFirst({
        where: {
          PetaniId: petaniId,
          UserIdPengecer: userIdPengecer,
        },
      });

      if (!existing) {
        throw ERR_BUS_04();
      }

      // Delete farmer quotas first
      await prisma.kuotaPetani.deleteMany({
        where: {
          PetaniId: petaniId,
        },
      });

      // Delete farmer
      await prisma.petani.delete({
        where: {
          PetaniId: petaniId,
        },
      });

      logger.info(`Farmer deleted: ${petaniId}`);
    } catch (error: any) {
      if (error.name === 'BusinessRuleError' || error.name === 'FSDError') throw error;
      logger.error(`Error deleting farmer: ${error.message}`);
      throw parseDatabaseError(error);
    }
  }
}
