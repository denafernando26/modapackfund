import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

/** Memuat data setiap kali layar mendapat fokus, dengan dukungan pull-to-refresh. */
export function useLoader<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const loadRef = useRef(load);
  loadRef.current = load;

  const run = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) setRefreshing(true);
    try {
      setData(await loadRef.current());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      run(false);
    }, [run]),
  );

  return { data, error, loading, refreshing, refresh: () => run(true) };
}
