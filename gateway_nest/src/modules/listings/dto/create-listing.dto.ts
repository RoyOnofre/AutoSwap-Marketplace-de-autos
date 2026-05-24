import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, MinLength, IsInt, Min, Max, IsPositive, IsEnum, IsOptional, Matches, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { VehicleCategory, FuelType, TransmissionType } from '../enums/listing-status.enum';

class FeatureDto {
  @ApiProperty({ description: 'Clave interna de la característica' })
  @IsString()
  @IsNotEmpty()
  feature_key: string;

  @ApiProperty({ description: 'Etiqueta legible de la característica' })
  @IsString()
  @IsNotEmpty()
  feature_label: string;

  @ApiProperty({ description: 'Categoría de la característica' })
  @IsString()
  @IsNotEmpty()
  category: string;
}

export class CreateListingDto {
  @ApiProperty({ maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title: string;

  @ApiProperty({ minLength: 100, maxLength: 2000 })
  @IsString()
  @MinLength(100)
  @MaxLength(2000)
  description: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  make: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  model: string;

  @ApiProperty({ description: `Año del vehículo (>=1990 y <= ${new Date().getFullYear()})` })
  @IsInt()
  @Min(1990)
  @Max(new Date().getFullYear())
  year: number;

  @ApiProperty({ description: 'Kilometraje en km' })
  @IsInt()
  @Min(0)
  mileage_km: number;

  @ApiProperty({ description: 'Precio en CLP' })
  @IsInt()
  @IsPositive()
  price_clp: number;

  @ApiProperty({ enum: VehicleCategory })
  @IsEnum(VehicleCategory)
  category: VehicleCategory;

  @ApiProperty({ enum: FuelType })
  @IsEnum(FuelType)
  fuel_type: FuelType;

  @ApiProperty({ enum: TransmissionType })
  @IsEnum(TransmissionType)
  transmission: TransmissionType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  color_exterior?: string;

  @ApiProperty({ required: false, description: 'Patente formato: AA BB 12' })
  @IsOptional()
  @Matches(/^[A-Z]{2}[A-Z]{2}\d{2}$/)
  license_plate?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  region: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ type: [FeatureDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureDto)
  features?: FeatureDto[];
}
