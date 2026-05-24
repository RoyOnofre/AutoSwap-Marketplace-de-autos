import { ApiProperty } from '@nestjs/swagger';
import { Vehicle, VehiclePhoto, VehicleFeature } from '../entities/vehicle.entity';
import { ListingStatus } from '../enums/listing-status.enum';

export class ListingResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  seller_id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  make: string;

  @ApiProperty()
  model: string;

  @ApiProperty()
  year: number;

  @ApiProperty()
  mileage_km: number;

  @ApiProperty()
  price_clp: number;

  @ApiProperty({ enum: ['sedan','suv','hatchback','pickup','van','otro'] })
  category: string;

  @ApiProperty({ enum: ['gasolina','diesel','electrico','hibrido'] })
  fuel_type: string;

  @ApiProperty({ enum: ['manual','automatico'] })
  transmission: string;

  @ApiProperty({ required: false })
  color_exterior?: string;

  @ApiProperty({ required: false })
  license_plate?: string;

  @ApiProperty()
  region: string;

  @ApiProperty()
  city: string;

  @ApiProperty({ enum: ListingStatus })
  validation_status: ListingStatus;

  @ApiProperty({ required: false })
  rejection_reason?: string;

  @ApiProperty({ type: [Object], required: false })
  photos?: VehiclePhoto[];

  @ApiProperty({ type: [Object], required: false })
  features?: VehicleFeature[];
}
