export class CreateTransactionDto {
  /**
   * ID of the listing being purchased
   */
  listingId: string;

  /**
   * Amount the buyer will pay (in Bolivianos)
   */
  amount: number;

  /**
   * Optional notes from buyer
   */
  notes?: string;
}
