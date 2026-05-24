import { IsOptional, IsString } from 'class-validator';

export class PayTransactionDto {
  /** Transaction id is passed via URL, this DTO only carries optional extra data */
  // For future extensions (e.g., coupon codes)
  @IsOptional()
  @IsString()
  couponCode?: string;
}
