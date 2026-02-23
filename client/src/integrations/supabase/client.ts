// Compatibility layer for Supabase migration
// This file provides mock implementations to maintain compatibility during migration

const emptyPromise = Promise.resolve({ data: null, error: null });
const emptyArrayPromise = Promise.resolve({ data: [], error: null });

// Create a chainable object that can handle any method call
const createChainable = () => {
  const handler = (target: any, prop: string): any => {
    if (prop === 'then' || prop === 'catch' || prop === 'finally') {
      return emptyPromise[prop as keyof Promise<any>];
    }
    return (...args: any[]) => createChainable();
  };
  return new Proxy({
    then: (resolve: any) => resolve({ data: null, error: null }),
    catch: (reject: any) => emptyPromise,
    finally: () => emptyPromise,
  }, handler);
};

const createQueryBuilder = () => createChainable();

export const supabase = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signUp: () => Promise.resolve({ data: null, error: null }),
    signInWithPassword: () => Promise.resolve({ data: null, error: null }),
    signOut: () => Promise.resolve({ error: null })
  },
  from: (table: string) => createChainable(),
  storage: {
    from: () => ({
      upload: () => Promise.resolve({ data: null, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: '' } })
    })
  }
};