import { Injectable, ForbiddenException, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { ListingsRepository } from './listings.repository';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { SearchListingsDto } from './dto/search-listings.dto';
import { Vehicle } from './entities/vehicle.entity';

@Injectable()
export class ListingsService {
  constructor(private readonly repository: ListingsRepository) {}

  async createListing(userId: string, dto: CreateListingDto): Promise<Vehicle> {
    // Verify KYC status
    const sellerProfile = await this.repository.getUserProfile(userId);
    if (!sellerProfile || sellerProfile.kyc_status !== 'verified') {
      throw new ForbiddenException('Debes verificar tu identidad para publicar');
    }
    return this.repository.create(userId, dto);
  }

  async getListings(filters: SearchListingsDto) {
    return this.repository.findAll(filters);
  }

  async getListingById(id: string): Promise<Vehicle> {
    const vehicle = await this.repository.findById(id);
    if (!vehicle) {
      throw new NotFoundException('Anuncio no encontrado');
    }
    return vehicle;
  }

  async getMyListings(userId: string): Promise<Vehicle[]> {
    return this.repository.findByUserId(userId);
  }

  async updateListing(id: string, userId: string, dto: UpdateListingDto): Promise<Vehicle> {
    const vehicle = await this.repository.findById(id);
    if (!vehicle) {
      throw new NotFoundException('Anuncio no encontrado');
    }
    if (vehicle.seller_id !== userId) {
      throw new ForbiddenException();
    }
    if (vehicle.deleted_at) {
      throw new NotFoundException('Anuncio no encontrado');
    }
    const isCriticalEdit = Object.keys(dto).some((k) =>
      (UpdateListingDto as any).CRITICAL_FIELDS.includes(k),
    );
    return this.repository.update(id, dto, isCriticalEdit);
  }

  async deleteListing(id: string, userId: string): Promise<void> {
    const vehicle = await this.repository.findById(id);
    if (!vehicle || vehicle.deleted_at) {
      throw new NotFoundException('Anuncio no encontrado');
    }
    if (vehicle.seller_id !== userId) {
      throw new ForbiddenException();
    }
    await this.repository.softDelete(id);
  }

  async getUploadUrls(vehicleId: string, userId: string, count: number) {
    const vehicle = await this.repository.findById(vehicleId);
    if (!vehicle) {
      throw new NotFoundException('Anuncio no encontrado');
    }
    if (vehicle.seller_id !== userId) {
      throw new ForbiddenException();
    }
    if (count < 1 || count > 20) {
      throw new BadRequestException('Count must be between 1 and 20');
    }
    return this.repository.getPhotoUploadUrls(vehicleId, count);
  }

  async confirmPhotoUpload(vehicleId: string, userId: string, photoData: any) {
    const vehicle = await this.repository.findById(vehicleId);
    if (!vehicle) {
      throw new NotFoundException('Anuncio no encontrado');
    }
    if (vehicle.seller_id !== userId) {
      throw new ForbiddenException();
    }
    if (photoData.is_primary) {
      await this.repository.unsetOtherPrimaryPhotos(vehicleId);
    }
    return this.repository.addPhoto(vehicleId, photoData);
  }

  async getPendingForAdmin(page: number, limit: number, filters: any) {
    return this.repository.findPendingForAdmin(page, limit, filters);
  }

  async approveListing(vehicleId: string, adminId: string) {
    const vehicle = await this.repository.findById(vehicleId);
    if (!vehicle) {
      throw new NotFoundException('Anuncio no encontrado');
    }
    if (vehicle.validation_status !== 'pending') {
      throw new ConflictException('Solo se pueden aprobar anuncios en estado Pendiente');
    }
    return this.repository.approveVehicle(vehicleId, adminId);
  }

  async rejectListing(vehicleId: string, adminId: string, reason: string) {
    const vehicle = await this.repository.findById(vehicleId);
    if (!vehicle) {
      throw new NotFoundException('Anuncio no encontrado');
    }
    if (vehicle.validation_status !== 'pending') {
      throw new ConflictException('Solo se pueden rechazar anuncios en estado Pendiente');
    }
    if (!reason || reason.length < 20) {
      throw new BadRequestException('El motivo debe tener al menos 20 caracteres');
    }
    return this.repository.rejectVehicle(vehicleId, adminId, reason);
  }
}
