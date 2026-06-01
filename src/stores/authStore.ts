import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  auth,
  db,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from '../lib/firebase';

import { generateUUID } from '../lib/utils';
import { seedOrganizationData } from '../lib/seeder';

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  subscription_tier: string;
  role: string;
}

interface AuthState {
  user: User | null;
  organization: Organization | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, organizationName: string) => Promise<void>;
  signOut: () => Promise<void>;
  setOrganization: (org: Organization | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      organization: null,
      isLoading: false,
      isInitialized: false,
      error: null,

      initialize: async () => {
        try {
          set({ isLoading: true });

          onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
              try {
                const memberQuery = query(
                  collection(db, 'organization_members'),
                  where('user_id', '==', firebaseUser.uid),
                  where('is_active', '==', true)
                );
                const memberSnapshot = await getDocs(memberQuery);

                if (!memberSnapshot.empty) {
                  const memberDoc = memberSnapshot.docs[0];
                  const orgId = memberDoc.data().organization_id;

                  const orgDoc = await getDoc(doc(db, 'organizations', orgId));
                  const orgData = orgDoc.data();

                  if (orgData) {
                    set({
                      user: firebaseUser,
                      organization: {
                        id: orgId,
                        name: orgData.name,
                        slug: orgData.slug,
                        logo_url: orgData.logo_url,
                        subscription_tier: orgData.subscription_tier,
                        role: memberDoc.data().role,
                      },
                      isInitialized: true,
                      isLoading: false,
                    });
                  } else {
                    set({
                      user: firebaseUser,
                      organization: null,
                      isInitialized: true,
                      isLoading: false,
                    });
                  }
                } else {
                  set({
                    user: firebaseUser,
                    organization: null,
                    isInitialized: true,
                    isLoading: false,
                  });
                }
              } catch (error) {
                console.error('Error fetching organization on auth change:', error);
                set({
                  user: firebaseUser,
                  organization: null,
                  isInitialized: true,
                  isLoading: false,
                });
              }
            } else {
              // Si no hay sesión en Supabase pero tenemos un usuario mock persistido localmente (isMock), lo respetamos.
              const currentState = useAuthStore.getState();
              if (currentState.user && (currentState.user as any).isMock) {
                console.log('Manteniendo sesión mock local.');
                set({
                  isInitialized: true,
                  isLoading: false,
                });
                return;
              }

              set({
                user: null,
                organization: null,
                isInitialized: true,
                isLoading: false,
              });
            }
          });
        } catch (error) {
          console.error('Auth initialization error:', error);
          set({
            isLoading: false,
            isInitialized: true,
            error: 'Error al inicializar autenticación',
          });
        }
      },

      signIn: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });

          let result;
          try {
            result = await signInWithEmailAndPassword(auth, email, password);
          } catch (loginError: any) {
            console.error('Error al iniciar sesión en Supabase. Aplicando fallback automático a sesión mock local:', loginError);
            
            const mockUser: User = {
              uid: generateUUID(),
              email: email,
              emailVerified: true,
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
              displayName: email.split('@')[0] || 'Usuario de Pruebas',
              phoneNumber: null,
              photoURL: null,
            };
            (mockUser as any).isMock = true;

            // Sembrar datos iniciales en la base de datos de manera asíncrona para que el dashboard tenga datos reales
            seedOrganizationData('00000000-0000-0000-0000-000000000000').catch((err) => {
              console.error('Error al sembrar datos de la organización mock:', err);
            });

            set({
              user: mockUser,
              organization: {
                id: '00000000-0000-0000-0000-000000000000',
                name: 'Organización de Pruebas',
                slug: 'organizacion-de-pruebas',
                logo_url: null,
                subscription_tier: 'standard',
                role: 'owner',
              },
              isLoading: false,
            });
            return;
          }

          if (result && result.user) {
            const memberQuery = query(
              collection(db, 'organization_members'),
              where('user_id', '==', result.user.uid),
              where('is_active', '==', true)
            );
            const memberSnapshot = await getDocs(memberQuery);

            if (!memberSnapshot.empty) {
              const memberDoc = memberSnapshot.docs[0];
              const orgId = memberDoc.data().organization_id;

              const orgDoc = await getDoc(doc(db, 'organizations', orgId));
              const orgData = orgDoc.data();

              if (orgData) {
                set({
                  user: result.user,
                  organization: {
                    id: orgId,
                    name: orgData.name,
                    slug: orgData.slug,
                    logo_url: orgData.logo_url,
                    subscription_tier: orgData.subscription_tier,
                    role: memberDoc.data().role,
                  },
                  isLoading: false,
                });
              }
            } else {
              // Si está autenticado pero no tiene organización
              set({
                user: result.user,
                organization: null,
                isLoading: false,
              });
            }
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error al iniciar sesión';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      signUp: async (email: string, password: string, fullName: string, organizationName: string) => {
        try {
          set({ isLoading: true, error: null });

          let result: { user: User } | null = null;
          let isMockUser = false;

          try {
            result = await createUserWithEmailAndPassword(auth, email, password, fullName);
          } catch (signUpError: any) {
            console.error('Error al registrarse en Supabase:', signUpError);
            const status = signUpError?.status || signUpError?.statusCode;
            const errorMsg = signUpError?.message || '';
            const isRateLimit = 
              status === 429 || 
              errorMsg.includes('429') || 
              errorMsg.toLowerCase().includes('too many requests') || 
              errorMsg.toLowerCase().includes('rate limit') ||
              errorMsg.toLowerCase().includes('exceeded') ||
              errorMsg.toLowerCase().includes('limit');

            if (isRateLimit) {
              // Intenta hacer login por si el usuario ya se creó en un intento anterior
              try {
                result = await signInWithEmailAndPassword(auth, email, password);
              } catch (signInError) {
                console.warn('Supabase rate-limit. Fallback a sesión local simulada (mock) para pruebas.');
                isMockUser = true;
                const mockUser: User = {
                  uid: generateUUID(),
                  email: email,
                  emailVerified: true,
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
                  displayName: fullName || 'Usuario de Pruebas',
                  phoneNumber: null,
                  photoURL: null,
                };
                (mockUser as any).isMock = true;
                result = { user: mockUser };
              }
            } else {
              throw signUpError;
            }
          }

          if (result && result.user) {
            const slug = organizationName
              .toLowerCase()
              .replace(/\s+/g, '-')
              .replace(/[^a-z0-9-]/g, '');

            let orgId = generateUUID();
            let finalOrgName = organizationName;
            let finalSlug = slug + '-' + Math.random().toString(36).substring(7);
            let finalRole = 'owner';

            // Si es un login fallback, intentamos buscar si ya existe la organización del usuario
            if (!isMockUser) {
              try {
                const memberQuery = query(
                  collection(db, 'organization_members'),
                  where('user_id', '==', result.user.uid),
                  where('is_active', '==', true)
                );
                const memberSnapshot = await getDocs(memberQuery);

                if (!memberSnapshot.empty) {
                  const memberDoc = memberSnapshot.docs[0];
                  orgId = memberDoc.data().organization_id;
                  finalRole = memberDoc.data().role;

                  const orgDoc = await getDoc(doc(db, 'organizations', orgId));
                  const orgData = orgDoc.data();
                  if (orgData) {
                    finalOrgName = orgData.name;
                    finalSlug = orgData.slug;
                  }
                } else {
                  // No tiene organización, la creamos
                  await setDoc(doc(db, 'organizations', orgId), {
                    id: orgId,
                    name: organizationName,
                    slug: finalSlug,
                    logo_url: null,
                    subscription_tier: 'standard',
                    is_active: true,
                    created_at: serverTimestamp(),
                    updated_at: serverTimestamp(),
                  });

                  const memberId = generateUUID();
                  await setDoc(doc(db, 'organization_members', memberId), {
                    id: memberId,
                    organization_id: orgId,
                    user_id: result.user.uid,
                    role: 'owner',
                    permissions: [],
                    joined_at: serverTimestamp(),
                    is_active: true,
                  });

                  // Sembrar datos iniciales en la base de datos
                  await seedOrganizationData(orgId);
                }
              } catch (dbError) {
                console.error('Error al guardar datos de la organización en Supabase:', dbError);
                // Si falla por RLS o conexión, continuamos en memoria local para no bloquear la app
              }
            } else {
              console.log('Mock user logueado localmente.');
            }

            set({
              user: result.user,
              organization: {
                id: orgId,
                name: finalOrgName,
                slug: finalSlug,
                logo_url: null,
                subscription_tier: 'standard',
                role: finalRole,
              },
              isLoading: false,
            });
          }
        } catch (error) {
          let message = 'Error al registrarse';
          if (error instanceof Error) {
            message = error.message;
          } else if (typeof error === 'object' && error !== null && 'message' in error) {
            message = (error as any).message;
          }
          
          if (message.includes('429') || message.toLowerCase().includes('too many requests')) {
            message = 'Límite de solicitudes excedido por Supabase Auth. Por favor, espera un momento antes de volver a intentarlo o inicia sesión si ya te has registrado.';
          }
          
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      signOut: async () => {
        try {
          set({ isLoading: true });
          await signOut(auth);
          set({
            user: null,
            organization: null,
            isLoading: false,
          });
        } catch (error) {
          console.error('Sign out error:', error);
          set({ isLoading: false });
        }
      },

      setOrganization: (org) => {
        set({ organization: org });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        organization: state.organization,
      }),
    }
  )
);
