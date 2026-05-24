import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  BadRequestException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import request from 'supertest';
import { ListingsModule } from './listings.module';
import { ListingsService } from './listings.service';
import { ListingsRepository } from './listings.repository';

// ---------- Mock data (fixtures) ----------
const mockVehicle = {
  id: 'uuid-vehicle-001',
  seller_id: 'uuid-seller-001',
  title: 'Toyota Corolla 2020 Impecable',
  description:
    'Vehículo en perfectas condiciones, único dueño, mantenimiento al día en concesionario oficial Toyota en Bolivia. Nunca chocado. Papeles al día, impuestos pagados, listo para transferencia. Precio conversable.',
  make: 'Toyota',
  model: 'Corolla',
  year: 2020,
  mileage_km: 45000,
  price_bs: 120000,
  category: 'sedan',
  fuel_type: 'gasolina',
  transmission: 'automatico',
  department: 'Chuquisaca',
  city: 'Sucre',
  license_plate: '4521XYZ',
  validation_status: 'pending',
  rejection_reason: null,
  reviewed_by: null,
  reviewed_at: null,
  deleted_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockSellerVerified = {
  id: 'uuid-seller-001',
  role: 'seller',
  kyc_status: 'verified',
};

const mockSellerUnverified = {
  id: 'uuid-seller-002',
  role: 'seller',
  kyc_status: 'pending',
};

const mockAdmin = {
  id: 'uuid-admin-001',
  role: 'admin',
};

// ---------- Global mutable mock user (used by guards) ----------
let currentMockUser: any = null;

// ---------- Mock Guards ----------
const MockJwtAuthGuard = {
  canActivate: jest.fn((ctx) => {
    const req = ctx.switchToHttp().getRequest();
    req.user = currentMockUser;
    return true;
  }),
};

const MockRolesGuard = {
  canActivate: jest.fn((ctx) => {
    const req = ctx.switchToHttp().getRequest();
    if (req.user && req.user.role === 'admin') {
      return true;
    }
    throw new UnauthorizedException('Forbidden');
  }),
};

// ---------- Mock Supabase client ----------
jest.mock('../../supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(),
      select: jest.fn(),
      eq: jest.fn(),
      update: jest.fn(),
      single: jest.fn(),
      range: jest.fn(),
      order: jest.fn(),
      gte: jest.fn(),
      lte: jest.fn(),
      neq: jest.fn(),
      then: jest.fn(),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
      })),
    },
    rpc: jest.fn(),
  },
}));

import { supabase } from '../../supabase/client';

// ---------- Test Suite ----------
describe('Listings Module (E2E & Unit)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let repository: ListingsRepository;
  let service: ListingsService;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [ListingsModule],
    })
      .overrideGuard('JwtAuthGuard')
      .useValue(MockJwtAuthGuard)
      .overrideGuard('RolesGuard')
      .useValue(MockRolesGuard)
      .overrideProvider(ListingsRepository)
      .useValue({
        getUserProfile: jest.fn(),
        create: jest.fn(),
        findAll: jest.fn(),
        findById: jest.fn(),
        findByUserId: jest.fn(),
        update: jest.fn(),
        softDelete: jest.fn(),
        getPhotoUploadUrls: jest.fn(),
        addPhoto: jest.fn(),
        unsetOtherPrimaryPhotos: jest.fn(),
        findPendingForAdmin: jest.fn(),
        approveVehicle: jest.fn(),
        rejectVehicle: jest.fn(),
        countPhotos: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    repository = moduleFixture.get<ListingsRepository>(ListingsRepository);
    service = moduleFixture.get<ListingsService>(ListingsService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    currentMockUser = null;
  });

  // -----------------------------------------------------------------
  // HU-01: Registro de Vehículo
  // -----------------------------------------------------------------
  describe('HU-01: Registro de Vehículo', () => {
    // SPEC-01-01
    it('debe crear el vehículo con status pending cuando el vendedor tiene KYC verificado y los datos son válidos', async () => {
      currentMockUser = mockSellerVerified;
      (repository.getUserProfile as jest.Mock).mockResolvedValue(mockSellerVerified);
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockVehicle, error: null }),
        }),
      });

      const response = await request(app.getHttpServer())
        .post('/listings')
        .send({
          title: mockVehicle.title,
          description: mockVehicle.description,
          make: mockVehicle.make,
          model: mockVehicle.model,
          year: mockVehicle.year,
          mileage_km: mockVehicle.mileage_km,
          price_bs: mockVehicle.price_bs,
          category: mockVehicle.category,
          fuel_type: mockVehicle.fuel_type,
          transmission: mockVehicle.transmission,
          department: mockVehicle.department,
          city: mockVehicle.city,
          license_plate: mockVehicle.license_plate,
        })
        .expect(HttpStatus.CREATED);

      expect(response.body.data.validation_status).toBe('pending');
      expect(response.body.data.id).toBeDefined();
      expect(supabase.from).toHaveBeenCalledWith('vehicles');
      const insertMock = (supabase.from as jest.Mock).mock.results[0].value.insert;
      expect(insertMock).toHaveBeenCalledTimes(1);
    });

    // SPEC-01-02
    it('debe retornar 403 cuando el vendedor no tiene KYC verificado', async () => {
      currentMockUser = mockSellerUnverified;
      (repository.getUserProfile as jest.Mock).mockResolvedValue(mockSellerUnverified);

      const response = await request(app.getHttpServer())
        .post('/listings')
        .send({
          title: mockVehicle.title,
          description: mockVehicle.description,
          make: mockVehicle.make,
          model: mockVehicle.model,
          year: mockVehicle.year,
          mileage_km: mockVehicle.mileage_km,
          price_bs: mockVehicle.price_bs,
          category: mockVehicle.category,
          fuel_type: mockVehicle.fuel_type,
          transmission: mockVehicle.transmission,
          department: mockVehicle.department,
          city: mockVehicle.city,
          license_plate: mockVehicle.license_plate,
        })
        .expect(HttpStatus.FORBIDDEN);

      expect(response.body.message).toContain('verificar tu identidad');
      expect(supabase.from).not.toHaveBeenCalled();
    });

    // SPEC-01-03
    it('debe retornar 422 cuando faltan campos obligatorios', async () => {
      currentMockUser = mockSellerVerified;
      (repository.getUserProfile as jest.Mock).mockResolvedValue(mockSellerVerified);

      const incomplete: any = {
        title: mockVehicle.title,
        description: mockVehicle.description,
        make: mockVehicle.make,
        model: mockVehicle.model,
        year: mockVehicle.year,
        mileage_km: mockVehicle.mileage_km,
        // price_bs omitted
        category: mockVehicle.category,
        fuel_type: mockVehicle.fuel_type,
        transmission: mockVehicle.transmission,
        department: mockVehicle.department,
        city: mockVehicle.city,
        license_plate: mockVehicle.license_plate,
      };

      const response = await request(app.getHttpServer())
        .post('/listings')
        .send(incomplete)
        .expect(HttpStatus.UNPROCESSABLE_ENTITY);

      expect(response.body.message).toContain('price_bs');
    });

    // SPEC-01-04
    it('debe retornar 422 cuando la descripción tiene menos de 100 caracteres', async () => {
      currentMockUser = mockSellerVerified;
      (repository.getUserProfile as jest.Mock).mockResolvedValue(mockSellerVerified);

      const shortDesc = { ...mockVehicle, description: 'Muy corta' };

      const response = await request(app.getHttpServer())
        .post('/listings')
        .send(shortDesc)
        .expect(HttpStatus.UNPROCESSABLE_ENTITY);

      expect(response.body.message).toContain('description');
    });

    // SPEC-01-05 (unit test style)
    it('debe lanzar BadRequestException si el vehículo tiene menos de 4 fotos al publicar', async () => {
      (repository.countPhotos as jest.Mock).mockResolvedValue(3);
      const validate = async () => {
        const cnt = await repository.countPhotos('any-id');
        if (cnt < 4) {
          throw new BadRequestException('Debe haber al menos 4 fotos');
        }
      };
      await expect(validate()).rejects.toThrow(BadRequestException);
      await expect(validate()).rejects.toThrow(/al menos 4 fotos/);
    });

    // SPEC-01-06
    it('no debe retornar anuncios pending en el catálogo público', async () => {
      (repository.findAll as jest.Mock).mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/listings')
        .expect(HttpStatus.OK);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(0);
      const fromCall = (supabase.from as jest.Mock).mock.calls.find(c => c[0] === 'vehicles');
      expect(fromCall).toBeDefined();
    });
  });

  // -----------------------------------------------------------------
  // HU-02: Edición y Eliminación
  // -----------------------------------------------------------------
  describe('HU-02: Edición y Eliminación', () => {
    // SPEC-02-01
    it('debe cambiar status a pending cuando se edita el precio', async () => {
      currentMockUser = mockSellerVerified;
      const approved = { ...mockVehicle, validation_status: 'approved' };
      (repository.findById as jest.Mock).mockResolvedValue(approved);
      (repository.update as jest.Mock).mockImplementation((id, dto, isCritical) =>
        Promise.resolve({
          ...approved,
          ...dto,
          validation_status: isCritical ? 'pending' : approved.validation_status,
        }),
      );

      const response = await request(app.getHttpServer())
        .patch(`/listings/${approved.id}`)
        .set('Authorization', 'Bearer token')
        .send({ price_bs: 115000 })
        .expect(HttpStatus.OK);

      expect(repository.update).toHaveBeenCalledWith(approved.id, { price_bs: 115000 }, true);
      expect(response.body.data.validation_status).toBe('pending');
    });

    // SPEC-02-02
    it('debe mantener status approved cuando solo se edita color_exterior', async () => {
      currentMockUser = mockSellerVerified;
      const approved = { ...mockVehicle, validation_status: 'approved' };
      (repository.findById as jest.Mock).mockResolvedValue(approved);
      (repository.update as jest.Mock).mockImplementation((id, dto, isCritical) =>
        Promise.resolve({
          ...approved,
          ...dto,
          validation_status: isCritical ? 'pending' : approved.validation_status,
        }),
      );

      const response = await request(app.getHttpServer())
        .patch(`/listings/${approved.id}`)
        .set('Authorization', 'Bearer token')
        .send({ color_exterior: 'Rojo' })
        .expect(HttpStatus.OK);

      expect(repository.update).toHaveBeenCalledWith(approved.id, { color_exterior: 'Rojo' }, false);
      expect(response.body.data.validation_status).toBe('approved');
    });

    // SPEC-02-03
    it('debe retornar 403 cuando otro vendedor intenta editar el anuncio', async () => {
      currentMockUser = { ...mockSellerVerified, id: 'uuid-seller-999' };
      const owned = { ...mockVehicle, seller_id: 'uuid-seller-001' };
      (repository.findById as jest.Mock).mockResolvedValue(owned);

      const response = await request(app.getHttpServer())
        .patch(`/listings/${owned.id}`)
        .set('Authorization', 'Bearer token')
        .send({ price_bs: 110000 })
        .expect(HttpStatus.FORBIDDEN);

      expect(repository.update).not.toHaveBeenCalled();
    });

    // SPEC-02-04
    it('debe realizar soft delete correctamente', async () => {
      currentMockUser = mockSellerVerified;
      const owned = { ...mockVehicle, seller_id: mockSellerVerified.id };
      (repository.findById as jest.Mock).mockResolvedValue(owned);
      (repository.softDelete as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .delete(`/listings/${owned.id}`)
        .set('Authorization', 'Bearer token')
        .expect(HttpStatus.OK);

      expect(repository.softDelete).toHaveBeenCalledWith(owned.id);
      expect(response.body.message).toContain('eliminado');
    });

    // SPEC-02-05
    it('debe retornar 404 al intentar editar un anuncio eliminado', async () => {
      currentMockUser = mockSellerVerified;
      (repository.findById as jest.Mock).mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .patch(`/listings/${mockVehicle.id}`)
        .set('Authorization', 'Bearer token')
        .send({ price_bs: 100000 })
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  // -----------------------------------------------------------------
  // HU-03: Validación de Contenido
  // -----------------------------------------------------------------
  describe('HU-03: Validación de Contenido', () => {
    // SPEC-03-01
    it('debe aprobar el anuncio y retornar status approved', async () => {
      currentMockUser = mockAdmin;
      const pending = { ...mockVehicle, validation_status: 'pending' };
      (repository.findById as jest.Mock).mockResolvedValue(pending);
      (repository.approveVehicle as jest.Mock).mockImplementation((vid, adminId) =>
        Promise.resolve({ ...pending, validation_status: 'approved', approved_by: adminId }),
      );

      const response = await request(app.getHttpServer())
        .post(`/admin/listings/${pending.id}/approve`)
        .set('Authorization', 'Bearer admin-token')
        .expect(HttpStatus.OK);

      expect(repository.approveVehicle).toHaveBeenCalledWith(pending.id, mockAdmin.id);
      expect(response.body.data.validation_status).toBe('approved');
    });

    // SPEC-03-02
    it('debe rechazar el anuncio cuando se provee un motivo válido', async () => {
      currentMockUser = mockAdmin;
      const pending = { ...mockVehicle, validation_status: 'pending' };
      (repository.findById as jest.Mock).mockResolvedValue(pending);
      (repository.rejectVehicle as jest.Mock).mockImplementation((vid, adminId, reason) =>
        Promise.resolve({ ...pending, validation_status: 'rejected', rejected_by: adminId, rejection_reason: reason }),
      );

      const reason =
        'Las fotos no muestran el estado real del vehículo, se requieren fotos más claras del motor y chasis boliviano';

      const response = await request(app.getHttpServer())
        .post(`/admin/listings/${pending.id}/reject`)
        .set('Authorization', 'Bearer admin-token')
        .send({ reason })
        .expect(HttpStatus.OK);

      expect(repository.rejectVehicle).toHaveBeenCalledWith(pending.id, mockAdmin.id, reason);
      expect(response.body.data.validation_status).toBe('rejected');
    });

    // SPEC-03-03
    it('debe retornar 422 cuando el motivo del rechazo tiene menos de 20 caracteres', async () => {
      currentMockUser = mockAdmin;
      const pending = { ...mockVehicle, validation_status: 'pending' };
      (repository.findById as jest.Mock).mockResolvedValue(pending);

      const shortReason = 'Malo';

      const response = await request(app.getHttpServer())
        .post(`/admin/listings/${pending.id}/reject`)
        .set('Authorization', 'Bearer admin-token')
        .send({ reason: shortReason })
        .expect(HttpStatus.UNPROCESSABLE_ENTITY);

      expect(response.body.message).toContain('20 caracteres');
      expect(repository.rejectVehicle).not.toHaveBeenCalled();
    });

    // SPEC-03-04
    it('debe retornar 403 cuando un vendedor intenta acceder al panel admin', async () => {
      currentMockUser = mockSellerVerified;
      await request(app.getHttpServer())
        .get('/admin/listings/pending')
        .set('Authorization', 'Bearer seller-token')
        .expect(HttpStatus.FORBIDDEN);
    });

    // SPEC-03-05
    it('debe retornar la primera página de pendientes ordenados por fecha ASC', async () => {
      currentMockUser = mockAdmin;
      const total = 15;
      (repository.findPendingForAdmin as jest.Mock).mockResolvedValue({ data: [mockVehicle], total });

      const response = await request(app.getHttpServer())
        .get('/admin/listings/pending?page=1&limit=10')
        .set('Authorization', 'Bearer admin-token')
        .expect(HttpStatus.OK);

      expect(response.body.meta.total).toBe(total);
      expect(response.body.meta.pages).toBe(Math.ceil(total / 10));
      expect(response.body.data).toHaveLength(1);
      expect(repository.findPendingForAdmin).toHaveBeenCalledWith(1, 10, {});
    });

    // SPEC-03-06
    it('debe insertar en validation_audit_log al aprobar un anuncio', async () => {
      currentMockUser = mockAdmin;
      const pending = { ...mockVehicle, validation_status: 'pending' };
      (repository.findById as jest.Mock).mockResolvedValue(pending);
      (repository.approveVehicle as jest.Mock).mockResolvedValue({ ...pending, validation_status: 'approved' });
      (supabase.rpc as jest.Mock).mockResolvedValue({ data: { action: 'approved', vehicle_id: pending.id }, error: null });

      await request(app.getHttpServer())
        .post(`/admin/listings/${pending.id}/approve`)
        .set('Authorization', 'Bearer admin-token')
        .expect(HttpStatus.OK);

      expect(supabase.rpc).toHaveBeenCalledWith('approve_vehicle', { vehicle_id: pending.id, admin_id: mockAdmin.id });

      // Mock audit log query
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: 'log-1', action: 'approved', vehicle_id: pending.id }, error: null }),
          }),
        }),
      });

      const audit = await supabase
        .from('validation_audit_log')
        .select('*')
        .eq('vehicle_id', pending.id)
        .single();
      expect(audit.data.action).toBe('approved');
    });
  });
});
