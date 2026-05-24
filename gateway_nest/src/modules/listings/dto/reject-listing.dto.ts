import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RejectListingDto {
  @ApiProperty({ description: 'Motivo del rechazo (mínimo 20 caracteres)' })
  @IsString()
  @MinLength(20)
  reason: string;
}
