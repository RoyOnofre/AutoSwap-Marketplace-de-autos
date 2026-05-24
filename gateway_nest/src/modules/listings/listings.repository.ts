import { supabase } from '../../supabase/client';
import { Injectable } from '@nestjs/common';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { SearchListingsDto } from './dto/search-listings.dto';
import { Vehicle } from './entities/vehicle.entity';

/**
 * Simple repository layer using Supabase client.
 * All methods return plain objects matching the Vehicle interface.
 * In a real application you would handle pagination, error mapping, etc.
 */
@Injectable()
export class ListingsRepository {
  /**
   * Retrieve user profile (e.g., KYC status). Assumes a 'kv_profiles' table exists.
   */
  async getUserProfile(userId: string): Promise<any> {
    const { data, error } = await supabase
      .from('kv_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error) {
      // Return null if not found; let service decide.
      return null;
    }
    return data;
  }

  async create(userId: string, dto: CreateListingDto): Promise<Vehicle> {
    const { data, error } = await supabase
      .from('vehicles')
      .insert({ ...dto, seller_id: userId })
      .single();
    if (error) throw error;
    return data as Vehicle;
  }

  async findAll(filters: SearchListingsDto): Promise<Vehicle[]> {
    let query = supabase.from('vehicles').select('*');
    // Apply simple filters – expand as needed.
    if (filters.make) query = query.eq('make', filters.make);
    if (filters.model) query = query.eq('model', filters.model);
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.fuel_type) query = query.eq('fuel_type', filters.fuel_type);
    if (filters.min_price) query = query.gte('price', filters.min_price);
    if (filters.max_price) query = query.lte('price', filters.max_price);
    if (filters.min_year) query = query.gte('year', filters.min_year);
    if (filters.max_year) query = query.lte('year', filters.max_year);
    if (filters.max_km) query = query.lte('kilometers', filters.max_km);
    if (filters.sort_by) {
      const [field, dir] = (() => {
        switch (filters.sort_by) {
          case 'price_asc':
            return ['price', { ascending: true }];
          case 'price_desc':
            return ['price', { ascending: false }];
          case 'newest':
            return ['created_at', { ascending: false }];
          case 'oldest':
            return ['created_at', { ascending: true }];
          default:
            return ['created_at', { ascending: false }];
        }
      })();
      query = query.order(field, { ascending: (dir as any).ascending });
    }
    const { data, error } = await query;
    if (error) throw error;
    return data as Vehicle[];
  }

  async findById(id: string): Promise<Vehicle | null> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data as Vehicle;
  }

  async findByUserId(userId: string): Promise<Vehicle[]> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('seller_id', userId);
    if (error) throw error;
    return data as Vehicle[];
  }

  async update(id: string, dto: Partial<UpdateListingDto>, isCritical: boolean): Promise<Vehicle> {
    // If critical, you might want to reset validation_status, but keep simple.
    const updatePayload: any = { ...dto };
    if (isCritical) updatePayload.validation_status = 'pending';
    const { data, error } = await supabase
      .from('vehicles')
      .update(updatePayload)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Vehicle;
  }

  async softDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from('vehicles')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  }

  /** Photo handling */
  async getPhotoUploadUrls(vehicleId: string, count: number): Promise<string[]> {
    // Simulate signed URLs via storage bucket 'vehicle-photos'.
    const bucket = 'vehicle-photos';
    const urls: string[] = [];
    for (let i = 0; i < count; i++) {
      const path = `${vehicleId}/${Date.now()}_${i}.jpg`;
      // Mock upload returns fullPath; in real Supabase you would request a signed URL.
      urls.push(`${bucket}/${path}`);
    }
    return urls;
  }

  async addPhoto(vehicleId: string, photoData: any): Promise<any> {
    const { error, data } = await supabase
      .from('vehicle_photos')
      .insert({ vehicle_id: vehicleId, ...photoData })
      .single();
    if (error) throw error;
    return data;
  }

  async unsetOtherPrimaryPhotos(vehicleId: string): Promise<void> {
    const { error } = await supabase
      .from('vehicle_photos')
      .update({ is_primary: false })
      .eq('vehicle_id', vehicleId)
      .neq('is_primary', false);
    if (error) throw error;
  }

  /** Admin queries */
  async findPendingForAdmin(page: number, limit: number, filters: any): Promise<any> {
    const offset = (page - 1) * limit;
    let query = supabase
      .from('vehicles')
      .select('*')
      .eq('validation_status', 'pending')
      .range(offset, offset + limit - 1);
    // Apply optional filters (e.g., category)
    if (filters?.category) query = query.eq('category', filters.category);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async approveVehicle(vehicleId: string, adminId: string): Promise<Vehicle> {
    const { data, error } = await supabase
      .from('vehicles')
      .update({ validation_status: 'approved', approved_by: adminId, approved_at: new Date().toISOString() })
      .eq('id', vehicleId)
      .single();
    if (error) throw error;
    return data as Vehicle;
  }

  async rejectVehicle(vehicleId: string, adminId: string, reason: string): Promise<Vehicle> {
    const { data, error } = await supabase
      .from('vehicles')
      .update({ validation_status: 'rejected', rejected_by: adminId, rejected_at: new Date().toISOString(), rejection_reason: reason })
      .eq('id', vehicleId)
      .single();
    if (error) throw error;
    return data as Vehicle;
  }
}
