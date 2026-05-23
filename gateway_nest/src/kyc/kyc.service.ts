import { Injectable, BadRequestException } from '@nestjs/common';
import { supabase } from '../supabase/client';

@Injectable()
export class KycService {
  async processKyc(userId: string, paths: { ciFrontPath: string; ciBackPath: string; selfiePath: string }) {
    // Insert or update kyc_profiles table
    const { data: profile, error: selectError } = await supabase
      .from('kyc_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    let result;
    if (profile) {
      const { data, error } = await supabase
        .from('kyc_profiles')
        .update({
          ci_front_path: paths.ciFrontPath,
          ci_back_path: paths.ciBackPath,
          selfie_path: paths.selfiePath,
          status: 'Pendiente',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .single();
      if (error) throw new BadRequestException(error.message);
      result = data;
    } else {
      const { data, error } = await supabase
        .from('kyc_profiles')
        .insert({
          user_id: userId,
          ci_front_path: paths.ciFrontPath,
          ci_back_path: paths.ciBackPath,
          selfie_path: paths.selfiePath,
          status: 'Pendiente',
        })
        .single();
      if (error) throw new BadRequestException(error.message);
      result = data;
    }

    // Update profiles table or users table to set kyc_estado to 'Pendiente'
    await supabase
      .from('profiles')
      .update({ kyc_estado: 'Pendiente' })
      .eq('id', userId);

    return result;
  }
}
