import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth, db } from '../lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';

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

          return new Promise<void>((resolve) => {
            const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
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
                  console.error('Error fetching organization:', error);
                  set({
                    user: firebaseUser,
                    organization: null,
                    isInitialized: true,
                    isLoading: false,
                  });
                }
              } else {
                set({
                  user: null,
                  organization: null,
                  isInitialized: true,
                  isLoading: false,
                });
              }
              unsubscribe();
              resolve();
            });
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

          const result = await signInWithEmailAndPassword(auth, email, password);

          if (result.user) {
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

          const result = await createUserWithEmailAndPassword(auth, email, password);

          if (result.user) {
            const slug = organizationName
              .toLowerCase()
              .replace(/\s+/g, '-')
              .replace(/[^a-z0-9-]/g, '');

            const orgId = Math.random().toString(36).substring(7);

            await setDoc(doc(db, 'organizations', orgId), {
              id: orgId,
              name: organizationName,
              slug: slug + '-' + Math.random().toString(36).substring(7),
              logo_url: null,
              subscription_tier: 'standard',
              is_active: true,
              created_at: serverTimestamp(),
              updated_at: serverTimestamp(),
            });

            await setDoc(doc(db, 'organization_members', `${orgId}_${result.user.uid}`), {
              id: `${orgId}_${result.user.uid}`,
              organization_id: orgId,
              user_id: result.user.uid,
              role: 'owner',
              permissions: [],
              joined_at: serverTimestamp(),
              is_active: true,
            });

            set({
              user: result.user,
              organization: {
                id: orgId,
                name: organizationName,
                slug: slug + '-' + Math.random().toString(36).substring(7),
                logo_url: null,
                subscription_tier: 'standard',
                role: 'owner',
              },
              isLoading: false,
            });
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error al registrarse';
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
        organization: state.organization,
      }),
    }
  )
);
