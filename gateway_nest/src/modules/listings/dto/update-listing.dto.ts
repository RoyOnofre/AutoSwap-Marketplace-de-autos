import { PartialType } from '@nestjs/mapped-types';
import { CreateListingDto } from './create-listing.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateListingDto extends PartialType(CreateListingDto) {
  /**
   * List of fields that, when edited, require the listing to be set back to pending validation.
   */
  static get CRITICAL_FIELDS(): string[] {
    return [
      'title',
      'description',
      'price_clp',
      'mileage_km',
      'make',
      'model',
      'year',
      'category',
    ];
  }

  @ApiProperty({ description: 'Critical fields list', example: ['title', 'price_clp'] })
  readonly _criticalFields?: string[]; // placeholder to satisfy Swagger, not used in logic
}
