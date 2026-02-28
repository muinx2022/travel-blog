import { useState, useEffect } from "react";

type Getter<T> = (id: string) => Promise<T>;

export function useResource<T>(getter: Getter<T>, documentId: string) {
  const [item, setItem] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!documentId) {
        setLoading(false);
        setError("Document ID is missing");
        return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getter(documentId);
        setItem(result);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load resource details");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [documentId, getter]);

  return { item, loading, error };
}
