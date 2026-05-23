import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseKey = process.env.SUPABASE_PUBLIC_KEY || 'placeholder-key';

let client: any;

// A robust mock Supabase client for when the environment variable is a PostgreSQL URL or dummy
class MockSupabaseClient {
  private db: Record<string, any[]> = {
    transactions: [],
    escrows: [],
    inspections: [],
    kyc_profiles: [],
    notifications: []
  };

  from(table: string) {
    const list = this.db[table] || [];
    return {
      insert: (dto: any) => {
        const item = { id: Math.random().toString(36).substring(7), ...dto, created_at: new Date().toISOString() };
        list.push(item);
        return {
          single: async () => ({ data: item, error: null })
        };
      },
      select: (query: string = '*') => {
        return {
          eq: (field: string, value: any) => {
            const found = list.filter(item => item[field] === value);
            return {
              single: async () => ({ data: found[0] || null, error: found[0] ? null : { message: 'Not found' } }),
              order: (by: string, { ascending } = { ascending: false }) => {
                const sorted = [...found].sort((a, b) => {
                  if (a[by] < b[by]) return ascending ? -1 : 1;
                  if (a[by] > b[by]) return ascending ? 1 : -1;
                  return 0;
                });
                return Promise.resolve({ data: sorted, error: null });
              },
              then: (resolve: any) => resolve({ data: found, error: null })
            };
          },
          order: (by: string, { ascending } = { ascending: false }) => {
            const sorted = [...list].sort((a, b) => {
              if (a[by] < b[by]) return ascending ? -1 : 1;
              if (a[by] > b[by]) return ascending ? 1 : -1;
              return 0;
            });
            return Promise.resolve({ data: sorted, error: null });
          },
          then: (resolve: any) => resolve({ data: list, error: null })
        };
      },
      update: (dto: any) => {
        return {
          eq: (field: string, value: any) => {
            list.forEach(item => {
              if (item[field] === value) {
                Object.assign(item, dto);
              }
            });
            const updated = list.filter(item => item[field] === value);
            return {
              single: async () => ({ data: updated[0] || null, error: updated[0] ? null : { message: 'Not found' } }),
              then: (resolve: any) => resolve({ data: updated, error: null })
            };
          }
        };
      }
    };
  }

  storage = {
    from: (bucket: string) => ({
      upload: async (path: string, buffer: Buffer, options: any) => {
        return {
          data: { fullPath: `${bucket}/${path}` },
          error: null
        };
      }
    })
  };
}

const isPostgresUrl = supabaseUrl.startsWith('postgres://') || supabaseUrl.startsWith('postgresql://');
const isPlaceholder = supabaseUrl.includes('placeholder-url') || supabaseKey === 'placeholder-key';

if (isPostgresUrl || isPlaceholder) {
  console.warn('⚠️ Environment is using a PostgreSQL URL or dummy placeholder for SUPABASE_URL. Falling back to MockSupabaseClient for routing.');
  client = new MockSupabaseClient();
} else {
  client = createClient(supabaseUrl, supabaseKey);
}

export const supabase = client;
export default supabase;
