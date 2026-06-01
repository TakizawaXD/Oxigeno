import { supabase } from './supabase';

// Mock types to satisfy the TypeScript compiler
export interface User {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
  metadata: any;
  providerData: any[];
  refreshToken: string;
  tenantId: string | null;
  delete: () => Promise<void>;
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
  getIdTokenResult: (forceRefresh?: boolean) => Promise<any>;
  reload: () => Promise<void>;
  toJSON: () => object;
  displayName: string | null;
  phoneNumber: string | null;
  photoURL: string | null;
}

export type DocumentData = Record<string, any>;
export type QueryConstraint = any;

export const auth = {
  currentUser: null as User | null
};

export const db = {};

// Auth functions
export async function signInWithEmailAndPassword(_authInstance: any, email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error('User not found');
  
  const mappedUser: User = {
    uid: data.user.id,
    email: data.user.email || null,
    emailVerified: !!data.user.email_confirmed_at,
    isAnonymous: false,
    metadata: {},
    providerData: [],
    refreshToken: '',
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => '',
    getIdTokenResult: async () => ({}),
    reload: async () => {},
    toJSON: () => ({}),
    displayName: data.user.user_metadata?.full_name || null,
    phoneNumber: data.user.phone || null,
    photoURL: data.user.user_metadata?.avatar_url || null,
  };
  auth.currentUser = mappedUser;
  return { user: mappedUser };
}

export async function createUserWithEmailAndPassword(_authInstance: any, email: string, password: string, fullName?: string) {
  const options = fullName ? { data: { full_name: fullName } } : undefined;
  const { data, error } = await supabase.auth.signUp({ email, password, options });
  if (error) throw error;
  if (!data.user) throw new Error('Could not create user');
  
  const mappedUser: User = {
    uid: data.user.id,
    email: data.user.email || null,
    emailVerified: !!data.user.email_confirmed_at,
    isAnonymous: false,
    metadata: {},
    providerData: [],
    refreshToken: '',
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => '',
    getIdTokenResult: async () => ({}),
    reload: async () => {},
    toJSON: () => ({}),
    displayName: data.user.user_metadata?.full_name || null,
    phoneNumber: data.user.phone || null,
    photoURL: data.user.user_metadata?.avatar_url || null,
  };
  auth.currentUser = mappedUser;
  return { user: mappedUser };
}

export async function signOut(_authInstance: any) {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  auth.currentUser = null;
}

export function onAuthStateChanged(_authInstance: any, callback: (user: User | null) => void) {
  let initialCheckDone = false;

  // Get initial session
  supabase.auth.getSession().then(({ data: { session } }) => {
    initialCheckDone = true;
    if (session?.user) {
      const u = session.user;
      const mappedUser: User = {
        uid: u.id,
        email: u.email || null,
        emailVerified: !!u.email_confirmed_at,
        isAnonymous: false,
        metadata: {},
        providerData: [],
        refreshToken: '',
        tenantId: null,
        delete: async () => {},
        getIdToken: async () => '',
        getIdTokenResult: async () => ({}),
        reload: async () => {},
        toJSON: () => ({}),
        displayName: u.user_metadata?.full_name || null,
        phoneNumber: u.phone || null,
        photoURL: u.user_metadata?.avatar_url || null,
      };
      auth.currentUser = mappedUser;
      callback(mappedUser);
    } else {
      auth.currentUser = null;
      callback(null);
    }
  }).catch((err) => {
    console.error('Error checking initial session:', err);
    initialCheckDone = true;
    auth.currentUser = null;
    callback(null);
  });

  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'INITIAL_SESSION') {
      return; // Ignorar evento de inicialización duplicado
    }

    if (session?.user) {
      const u = session.user;
      const mappedUser: User = {
        uid: u.id,
        email: u.email || null,
        emailVerified: !!u.email_confirmed_at,
        isAnonymous: false,
        metadata: {},
        providerData: [],
        refreshToken: '',
        tenantId: null,
        delete: async () => {},
        getIdToken: async () => '',
        getIdTokenResult: async () => ({}),
        reload: async () => {},
        toJSON: () => ({}),
        displayName: u.user_metadata?.full_name || null,
        phoneNumber: u.phone || null,
        photoURL: u.user_metadata?.avatar_url || null,
      };
      auth.currentUser = mappedUser;
      callback(mappedUser);
    } else {
      if (initialCheckDone) {
        auth.currentUser = null;
        callback(null);
      }
    }
  });

  return () => {
    subscription.unsubscribe();
  };
}

// Firestore structures
export function collection(_dbInstance: any, path: string) {
  return { type: 'collection', path };
}

export function doc(_dbInstance: any, path: string, id?: string) {
  return { type: 'doc', path, id };
}

export function where(field: string, operator: string, value: any) {
  return { type: 'where', field, operator, value };
}

export function orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
  return { type: 'orderBy', field, direction };
}

export function limit(n: number) {
  return { type: 'limit', value: n };
}

export function query(coll: any, ...constraints: any[]) {
  return {
    type: 'query',
    path: coll.path,
    constraints: constraints.filter(c => c != null)
  };
}

export function serverTimestamp() {
  return new Date().toISOString();
}

// Helper to transform doc data
function transformFromSupabase(item: any) {
  if (!item) return item;
  return item;
}

function transformToSupabase(data: any) {
  const copy = { ...data };
  for (const key of Object.keys(copy)) {
    if (copy[key] && typeof copy[key] === 'object' && copy[key].constructor && copy[key].constructor.name === 'FieldValue') {
      delete copy[key];
    }
  }
  return copy;
}

// Automatic localStorage mock db clearer to ensure clean slate
if (typeof window !== 'undefined') {
  const mockCleanedKey = 'mock_db_cleaned_v2';
  if (!localStorage.getItem(mockCleanedKey)) {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('mock_db_')) {
        localStorage.removeItem(key);
      }
    });
    localStorage.setItem(mockCleanedKey, 'true');
  }
}

// Helper to get/set mock data in localStorage
function getMockData(key: string, defaultData: any[]): any[] {
  const stored = localStorage.getItem(`mock_db_${key}`);
  if (!stored) {
    localStorage.setItem(`mock_db_${key}`, JSON.stringify(defaultData));
    return defaultData;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return defaultData;
  }
}

function saveMockData(key: string, data: any[]) {
  localStorage.setItem(`mock_db_${key}`, JSON.stringify(data));
}

const MOCK_DATA_DEFAULTS: Record<string, any[]> = {
  asset_categories: [],
  facilities: [],
  customers: [],
  drivers: [],
  vehicles: [],
  assets: [],
  inventory: [],
  orders: [],
  routes: [],
  incidents: [],
  ai_recommendations: [],
  workflows: [],
  documents: []
};

export async function getDocs(q: any) {
  const path = q.path;
  
  // Interceptar consultas para la organización mock para evitar lag de peticiones
  const constraints = q.constraints || [];
  const isMockOrg = constraints.some((c: any) => c.type === 'where' && c.field === 'organization_id' && c.value === '00000000-0000-0000-0000-000000000000');
  if (isMockOrg) {
    let mockList = getMockData(path, MOCK_DATA_DEFAULTS[path] || []);
    return {
      empty: mockList.length === 0,
      size: mockList.length,
      docs: mockList.map((item: any) => ({
        id: item.id,
        data: () => transformFromSupabase(item),
        exists: () => true
      }))
    };
  }

  let builder: any = supabase.from(path).select('*');

  const constraintsList = q.constraints || [];
  for (const c of constraintsList) {
    if (c.type === 'where') {
      const { field, operator, value } = c;
      if (operator === '==' || operator === '===') {
        builder = builder.eq(field, value);
      } else if (operator === '>=') {
        builder = builder.gte(field, value);
      } else if (operator === '<=') {
        builder = builder.lte(field, value);
      } else if (operator === '>') {
        builder = builder.gt(field, value);
      } else if (operator === '<') {
        builder = builder.lt(field, value);
      } else if (operator === 'in') {
        builder = builder.in(field, value);
      } else if (operator === 'array-contains') {
        builder = builder.contains(field, [value]);
      }
    } else if (c.type === 'orderBy') {
      const { field, direction } = c;
      builder = builder.order(field, { ascending: direction === 'asc' });
    } else if (c.type === 'limit') {
      builder = builder.limit(c.value);
    }
  }

  const { data, error } = await builder;
  if (error) {
    console.error(`Error in getDocs on table ${path}:`, error);
    throw error;
  }

  return {
    empty: !data || data.length === 0,
    size: data ? data.length : 0,
    docs: (data || []).map((item: any) => ({
      id: item.id,
      data: () => transformFromSupabase(item),
      exists: () => true
    }))
  };
}

export async function getDoc(docRef: any) {
  const { path, id } = docRef;
  if (!id) throw new Error('Document ID is required for getDoc');

  // Interceptar la consulta de la organización mock
  if (id === '00000000-0000-0000-0000-000000000000') {
    return {
      id,
      data: () => ({
        name: 'Organización de Pruebas',
        slug: 'organizacion-de-pruebas',
        logo_url: null,
        subscription_tier: 'standard',
      }),
      exists: () => true
    };
  }

  const { data, error } = await supabase.from(path).select('*').eq('id', id).maybeSingle();
  if (error) {
    console.error(`Error in getDoc on table ${path} with id ${id}:`, error);
    throw error;
  }

  return {
    id,
    data: () => transformFromSupabase(data),
    exists: () => !!data
  };
}

export async function setDoc(docRef: any, data: any) {
  const { path, id } = docRef;
  
  // Interceptar escrituras de la organización mock
  if (id === '00000000-0000-0000-0000-000000000000' || data?.organization_id === '00000000-0000-0000-0000-000000000000') {
    const list = getMockData(path, MOCK_DATA_DEFAULTS[path] || []);
    const cleanData = transformToSupabase(data);
    if (id) {
      cleanData.id = id;
    }
    const index = list.findIndex((item: any) => item.id === id);
    if (index >= 0) {
      list[index] = { ...list[index], ...cleanData };
    } else {
      list.push(cleanData);
    }
    saveMockData(path, list);
    return;
  }

  const cleanData = transformToSupabase(data);
  if (id) {
    cleanData.id = id;
  }
  
  const { error } = await supabase.from(path).upsert(cleanData);
  if (error) {
    console.error(`Error in setDoc on table ${path}:`, error);
    throw error;
  }
}

export async function addDoc(collectionRef: any, data: any) {
  const { path } = collectionRef;
  
  // Interceptar inserciones de la organización mock
  if (data?.organization_id === '00000000-0000-0000-0000-000000000000') {
    const list = getMockData(path, MOCK_DATA_DEFAULTS[path] || []);
    const cleanData = transformToSupabase(data);
    const newId = cleanData.id || 'mock-' + Math.random().toString(36).substring(7);
    cleanData.id = newId;
    list.push(cleanData);
    saveMockData(path, list);
    return { id: newId };
  }

  const cleanData = transformToSupabase(data);
  
  const { data: inserted, error } = await supabase.from(path).insert(cleanData).select().single();
  if (error) {
    console.error(`Error in addDoc on table ${path}:`, error);
    throw error;
  }

  return { id: inserted.id };
}

export async function updateDoc(docRef: any, data: any) {
  const { path, id } = docRef;
  if (!id) throw new Error('Document ID is required for updateDoc');

  // Interceptar actualizaciones de la organización mock
  if (id.startsWith('mock-') || id.startsWith('cust-') || id.startsWith('fac-') || id.startsWith('inv-') || id.startsWith('rt-') || id.startsWith('inc-') || id.startsWith('rec-') || id.startsWith('wf-') || id.startsWith('doc-') || data?.organization_id === '00000000-0000-0000-0000-000000000000') {
    const list = getMockData(path, MOCK_DATA_DEFAULTS[path] || []);
    const cleanData = transformToSupabase(data);
    const index = list.findIndex((item: any) => item.id === id);
    if (index >= 0) {
      list[index] = { ...list[index], ...cleanData };
      saveMockData(path, list);
    }
    return;
  }

  const cleanData = transformToSupabase(data);
  const { error } = await supabase.from(path).update(cleanData).eq('id', id);
  if (error) {
    console.error(`Error in updateDoc on table ${path} with id ${id}:`, error);
    throw error;
  }
}

export async function deleteDoc(docRef: any) {
  const { path, id } = docRef;
  if (!id) throw new Error('Document ID is required for deleteDoc');

  // Interceptar eliminaciones de la organización mock
  if (id.startsWith('mock-') || id.startsWith('cust-') || id.startsWith('fac-') || id.startsWith('inv-') || id.startsWith('rt-') || id.startsWith('inc-') || id.startsWith('rec-') || id.startsWith('wf-') || id.startsWith('doc-')) {
    const list = getMockData(path, MOCK_DATA_DEFAULTS[path] || []);
    const newList = list.filter((item: any) => item.id !== id);
    saveMockData(path, newList);
    return;
  }

  const { error } = await supabase.from(path).delete().eq('id', id);
  if (error) {
    console.error(`Error in deleteDoc on table ${path} with id ${id}:`, error);
    throw error;
  }
}
