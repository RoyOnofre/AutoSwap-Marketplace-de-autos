import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateTransactionDto {
  /**
   * ID of the listing being purchased
   */
  @IsNotEmpty()
  @IsString()
  listingId: string;

  /**
   * Amount the buyer will pay (in Bolivianos)
   */
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  /**
   * Optional notes from buyer
   */
  @IsOptional()
  @IsString()
  notes?: string;
}
