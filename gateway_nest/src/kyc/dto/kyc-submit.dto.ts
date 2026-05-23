import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class KycSubmitDto {
  @ApiProperty({ description: 'ID del usuario' })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Imagen frontal de la Cédula de Identidad en formato Base64' })
  @IsNotEmpty()
  @IsString()
  ciFrontBase64: string;

  @ApiProperty({ description: 'Imagen posterior de la Cédula de Identidad en formato Base64' })
  @IsNotEmpty()
  @IsString()
  ciBackBase64: string;

  @ApiProperty({ description: 'Selfie del usuario en formato Base64' })
  @IsNotEmpty()
  @IsString()
  selfieBase64: string;
}
