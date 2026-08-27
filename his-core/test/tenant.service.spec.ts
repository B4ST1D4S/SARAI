import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { TenantService } from '../src/core/tenancy/services/tenant.service';
import { Tenant, TenantStatus, TenantPlan } from '../src/core/tenancy/entities/tenant.entity';
import { MASTER_CONNECTION_NAME } from '../src/core/database/master-database.module';

describe('TenantService', () => {
  let service: TenantService;
  let repo: jest.Mocked<Repository<Tenant>>;

  const mockTenant: Tenant = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'Clínica San José',
    subdomain: 'sanjose',
    code: 'REPS-05001',
    status: TenantStatus.ACTIVE,
    plan: TenantPlan.PROFESSIONAL,
    dbName: 'his_tenant_sanjose',
    dbHost: 'localhost',
    dbPort: 5432,
    dbUser: 'sanjose_user',
    clinicalSettings: {
      enableOdontology: true,
      enableHospitalization: false,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantService,
        {
          provide: getRepositoryToken(Tenant, MASTER_CONNECTION_NAME),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TenantService>(TenantService);
    repo = module.get(getRepositoryToken(Tenant, MASTER_CONNECTION_NAME));
    service.clearAllCache();
  });

  describe('findBySubdomain', () => {
    it('debe retornar un tenant activo y almacenarlo en caché', async () => {
      repo.findOne.mockResolvedValue(mockTenant);

      const result1 = await service.findBySubdomain('sanjose');
      expect(result1).toEqual(mockTenant);
      expect(repo.findOne).toHaveBeenCalledTimes(1);

      // Segunda llamada debe resolverse desde caché sin consultar repo
      const result2 = await service.findBySubdomain('SANJOSE');
      expect(result2).toEqual(mockTenant);
      expect(repo.findOne).toHaveBeenCalledTimes(1);
    });

    it('debe lanzar NotFoundException si el tenant no existe', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findBySubdomain('no-existe')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe lanzar ForbiddenException si el tenant se encuentra SUSPENDIDO', async () => {
      const suspendedTenant: Tenant = {
        ...mockTenant,
        status: TenantStatus.SUSPENDED,
      };
      repo.findOne.mockResolvedValue(suspendedTenant);

      await expect(service.findBySubdomain('sanjose')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findById', () => {
    it('debe retornar un tenant por ID', async () => {
      repo.findOne.mockResolvedValue(mockTenant);

      const result = await service.findById(mockTenant.id);
      expect(result).toEqual(mockTenant);
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: mockTenant.id },
      });
    });

    it('debe lanzar NotFoundException si el ID no existe', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findById('uuid-inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('debe crear un nuevo tenant si no existe conflicto de subdominio ni código', async () => {
      repo.findOne.mockResolvedValue(null);
      repo.create.mockReturnValue(mockTenant);
      repo.save.mockResolvedValue(mockTenant);

      const result = await service.create({
        name: 'Clínica San José',
        subdomain: 'sanjose',
        code: 'REPS-05001',
        dbName: 'his_tenant_sanjose',
      });

      expect(result).toEqual(mockTenant);
      expect(repo.save).toHaveBeenCalled();
    });

    it('debe lanzar ConflictException si el subdominio ya existe', async () => {
      repo.findOne.mockResolvedValue(mockTenant);

      await expect(
        service.create({
          name: 'Otra Clínica',
          subdomain: 'sanjose',
          code: 'REPS-99999',
          dbName: 'his_tenant_otra',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
