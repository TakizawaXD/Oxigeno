import { useState, useEffect, useCallback } from 'react';
import {
  db,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  DocumentData,
  QueryConstraint,
} from '../lib/firebase';
import { useAuthStore } from '../stores/authStore';

interface UseFirestoreOptions {
  collectionName: string;
  constraints?: QueryConstraint[];
  dependencies?: any[];
}

export function useFirestore<T extends DocumentData>({
  collectionName,
  constraints = [],
  dependencies = [],
}: UseFirestoreOptions) {
  const { organization } = useAuthStore();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!organization) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const q = query(
        collection(db, collectionName),
        where('organization_id', '==', organization.id),
        ...constraints
      );

      const snapshot = await getDocs(q);
      const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as T[];

      setData(results);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      console.error(`Error fetching ${collectionName}:`, err);
    } finally {
      setLoading(false);
    }
  }, [organization, collectionName, constraints]);

  useEffect(() => {
    fetchData();
  }, [fetchData, ...dependencies]);

  return { data, loading, error, refetch: fetchData };
}

export function useParallelFetch<T extends Record<string, any>>(
  fetchers: { [K in keyof T]: () => Promise<T[K]> }
) {
  const [data, setData] = useState<{ [K in keyof T]?: T[K] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const keys = Object.keys(fetchers) as (keyof T)[];
      const promises = keys.map(key => fetchers[key]());
      const results = await Promise.all(promises);

      const newData = keys.reduce((acc, key, index) => {
        acc[key] = results[index];
        return acc;
      }, {} as { [K in keyof T]: T[K] });

      setData(newData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      console.error('Error in parallel fetch:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchers]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { data, loading, error, refetch: fetchAll };
}
