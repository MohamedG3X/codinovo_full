// web/src/hooks/useDataRefresh.js
import { useEffect } from 'react';
import { onDataChanged } from '../lib/api';

// Pass a refetch function; it will run on any successful mutation anywhere
export default function useDataRefresh(refetchFn){
  useEffect(() => onDataChanged(() => {
    try { refetchFn(); } catch {}
  }), [refetchFn]);
}