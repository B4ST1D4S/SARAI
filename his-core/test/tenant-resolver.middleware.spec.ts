import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import { TenantResolverMiddleware } from '../src/core/tenancy/middleware/tenant-resolver.middleware';
import { TenantService } from '../src/core/tenancy/services/tenant.service';
import { TenantContextService } from '../src/core/tenancy/services/tenant-context.service';
import {
  Tenant,
  TenantStatus,
  TenantPlan,
} from '../src/core/tenancy/entities/tenant.entity';

describe('TenantResolverMiddleware', () => {
  let middleware: TenantResolverMiddleware;
  let tenantService: jest.Mocked<TenantService>;
  let contextService: TenantContextService;
  let configService: jest.Mocked<ConfigService>;

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
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock<NextFunction>;

  beforeEach(async () => {
    contextService = new TenantContextService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantResolverMiddleware,
        {
          provide: TenantService,
          useValue: {
            findById: jest.fn(),
            findBySubdomain: jest.fn(),
          },
        },
        {
          provide: TenantContextService,
          useValue: contextService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string, defaultVal: string) => {
              if (key === 'app.baseDomain') return 'hisapp.local';
              return defaultVal;
            }),
          },
        },
      ],
    }).compile();

    middleware = module.get<TenantResolverMiddleware>(TenantResolverMiddleware);
    tenantService = module.get(TenantService);
    configService = module.get(ConfigService);

    mockReq = {
      headers: {},
      method: 'GET',
      originalUrl: '/api/v1/pacientes',
    };

    mockRes = {
      setHeader: jest.fn(),
    };

    mockNext = jest.fn();
  });

  it('debe resolver el tenant mediante el header x-tenant-id (UUID) y ejecutar next() con contexto ALS', async () => {
    mockReq.headers = { 'x-tenant-id': mockTenant.id };
    tenantService.findById.mockResolvedValue(mockTenant);

    await middleware.use(
      mockReq as Request,
      mockRes as Response,
      () => {
        mockNext();
        // Verificar que dentro del next() el ALS tiene el contexto activo
        expect(contextService.getTenantId()).toBe(mockTenant.id);
        expect(contextService.getSubdomain()).toBe('sanjose');
        expect(contextService.getTenantDbConfig()?.database).toBe(
          'his_tenant_sanjose',
        );
      },
    );

    expect(tenantService.findById).toHaveBeenCalledWith(mockTenant.id);
    expect(mockRes.setHeader).toHaveBeenCalledWith(
      'X-Resolved-Tenant-Id',
      mockTenant.id,
    );
    expect(mockNext).toHaveBeenCalled();
  });

  it('debe resolver el tenant mediante el subdominio del header Host (ej: sanjose.hisapp.local:3000)', async () => {
    mockReq.headers = { host: 'sanjose.hisapp.local:3000' };
    tenantService.findBySubdomain.mockResolvedValue(mockTenant);

    await middleware.use(
      mockReq as Request,
      mockRes as Response,
      () => {
        mockNext();
        expect(contextService.getTenantId()).toBe(mockTenant.id);
      },
    );

    expect(tenantService.findBySubdomain).toHaveBeenCalledWith('sanjose');
    expect(mockNext).toHaveBeenCalled();
  });

  it('debe resolver el tenant mediante subdominio genérico (ej: sanjose.app.com)', async () => {
    mockReq.headers = { host: 'sanjose.app.com' };
    tenantService.findBySubdomain.mockResolvedValue(mockTenant);

    await middleware.use(
      mockReq as Request,
      mockRes as Response,
      () => {
        mockNext();
        expect(contextService.getTenantId()).toBe(mockTenant.id);
      },
    );

    expect(tenantService.findBySubdomain).toHaveBeenCalledWith('sanjose');
    expect(mockNext).toHaveBeenCalled();
  });

  it('debe lanzar UnauthorizedException si no se proporciona subdominio ni header', async () => {
    mockReq.headers = { host: 'localhost:3000' };

    await expect(
      middleware.use(mockReq as Request, mockRes as Response, mockNext),
    ).rejects.toThrow(UnauthorizedException);

    expect(mockNext).not.toHaveBeenCalled();
  });

  it('debe propagar NotFoundException si el tenant no existe en his_master', async () => {
    mockReq.headers = { 'x-tenant-id': 'no-existe' };
    tenantService.findBySubdomain.mockRejectedValue(
      new NotFoundException('Tenant no encontrado'),
    );

    await expect(
      middleware.use(mockReq as Request, mockRes as Response, mockNext),
    ).rejects.toThrow(NotFoundException);

    expect(mockNext).not.toHaveBeenCalled();
  });

  it('debe propagar ForbiddenException si el tenant está suspendido', async () => {
    mockReq.headers = { 'x-tenant-id': mockTenant.id };
    tenantService.findById.mockRejectedValue(
      new ForbiddenException('Tenant suspendido'),
    );

    await expect(
      middleware.use(mockReq as Request, mockRes as Response, mockNext),
    ).rejects.toThrow(ForbiddenException);

    expect(mockNext).not.toHaveBeenCalled();
  });
});
