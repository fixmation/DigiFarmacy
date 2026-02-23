// Compatibility layer for Supabase migration
// This file provides mock implementations to maintain compatibility during migration

const createQueryBuilder = () => ({
  select: (fields?: string) => ({
    eq: (column: string, value: any) => ({
      single: () => Promise.resolve({ data: null, error: null }),
      order: (col: string, opts?: any) => Promise.resolve({ data: [], error: null })
    }),
    order: (column: string, opts?: any) => Promise.resolve({ data: [], error: null }),
    limit: (n: number) => Promise.resolve({ data: [], error: null })
  }),
  order: (column: string, opts?: any) => ({
    limit: (n: number) => ({
      single: () => Promise.resolve({ data: null, error: null })
    }),
    single: () => Promise.resolve({ data: null, error: null })
  }),
  eq: (column: string, value: any) => ({
    single: () => Promise.resolve({ data: null, error: null }),
    order: (col: string, opts?: any) => Promise.resolve({ data: [], error: null })
  }),
  insert: (data: any) => ({
    select: () => Promise.resolve({ data: [], error: null })
  }),
  update: (data: any) => ({
    eq: (column: string, value: any) => ({
      select: () => Promise.resolve({ data: null, error: null })
    })
  }),
  delete: () => ({
    eq: (column: string, value: any) => Promise.resolve({ data: null, error: null })
  }),
  upsert: (data: any, opts?: any) => Promise.resolve({ data: null, error: null })
});

export const supabase = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signUp: () => Promise.resolve({ data: null, error: null }),
    signInWithPassword: () => Promise.resolve({ data: null, error: null }),
    signOut: () => Promise.resolve({ error: null })
  },
  from: (table: string) => createQueryBuilder(),
  storage: {
    from: () => ({
      upload: () => Promise.resolve({ data: null, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: '' } })
    })
  }
};