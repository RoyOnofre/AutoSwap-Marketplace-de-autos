import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { supabase } from '../supabase/client';

@Injectable()
export class InspectionService {
  /** Create/register a new vehicle inspection */
  async createInspection(inspectorId: string, dto: any) {
    const { vehicle_id, status, details, notes } = dto;

    if (!vehicle_id) {
      throw new BadRequestException('Falta vehicle_id en la solicitud');
    }

    const { data, error } = await supabase
      .from('inspections')
      .insert({
        vehicle_id,
        inspector_id: inspectorId,
        status: status || 'pending',
        details: details || {},
        notes: notes || '',
      })
      .single();

    if (error) {
      throw new BadRequestException(`Error al registrar inspección: ${error.message}`);
    }

    // Update vehicle's inspection status in the db (under listings or products table)
    await supabase
      .from('products') // or 'vehicles'
      .update({ inspection_status: status || 'pending' })
      .eq('id', vehicle_id);

    return data;
  }

  /** Find inspection by ID */
  async findOne(id: string) {
    const { data, error } = await supabase
      .from('inspections')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Inspección no encontrada');
    }
    return data;
  }

  /** Verify if a vehicle requires mandatory inspection and whether it has passed */
  async verifyInspectionRequirement(vehicleId: string, price: number): Promise<{ required: boolean; passed: boolean }> {
    const mandatoryThreshold = 140000; // 140,000 Bs.
    const required = price >= mandatoryThreshold;

    if (!required) {
      return { required, passed: true }; // Not required, so free to proceed
    }

    // Check if there is an approved inspection
    const { data: inspections, error } = await supabase
      .from('inspections')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .eq('status', 'approved');

    if (error || !inspections || inspections.length === 0) {
      return { required, passed: false };
    }

    return { required, passed: true };
  }
}
