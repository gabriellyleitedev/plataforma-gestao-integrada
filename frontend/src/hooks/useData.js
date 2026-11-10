import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api.js';

export function useData(path) {
  const [state, setState] = useState({ data: null, error: '', loading: true });
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((value) => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    Promise.resolve().then(() => {
      if (!controller.signal.aborted) setState((old) => ({ ...old, loading: true, error: '' }));
    });
    api(path, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setState({ data, error: '', loading: false });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({ data: null, error: error.message || 'Falha de conexão com a API.', loading: false });
      });
    return () => controller.abort();
  }, [path, version]);
  return { ...state, reload };
}
