import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsInt, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';
import { VehicleCategory, FuelType } from '../enums/listing-status.enum';

export class SearchListingsDto {
  @ApiPropertyOptional({ description: 'Marca del vehículo' })
  @IsOptional()
  @IsString()
  make?: string;

  @ApiPropertyOptional({ description: 'Modelo del vehículo' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: 'Región del vehículo' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ description: 'Ciudad del vehículo' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ enum: VehicleCategory })
  @IsOptional()
  @IsEnum(VehicleCategory)
  category?: VehicleCategory;

  @ApiPropertyOptional({ enum: FuelType })
  @IsOptional()
  @IsEnum(FuelType)
  fuel_type?: FuelType;

  @ApiPropertyOptional({ description: 'Precio mínimo (CLP)' })
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  min_price?: number;

  @ApiPropertyOptional({ description: 'Precio máximo (CLP)' })
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  max_price?: number;

  @ApiPropertyOptional({ description: 'Año mínimo' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  min_year?: number;

  @ApiPropertyOptional({ description: 'Año máximo' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  max_year?: number;

  @ApiPropertyOptional({ description: 'Kilometraje máximo' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  max_km?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 12, maximum: 48 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  limit?: number = 12;

  @ApiPropertyOptional({ description: 'Ordenamiento', enum: ['price_asc', 'price_desc', 'newest', 'oldest'] })
  @IsOptional()
  @IsString()
  sort_by?: 'price_asc' | 'price_desc' | 'newest' | 'oldest';
}
