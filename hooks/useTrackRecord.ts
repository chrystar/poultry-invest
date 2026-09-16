import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type ExpenseItem = { label: string; amount: number };


export type BatchPerformance = {
    id: string;
    package_id: string | null;
    batch_label: string;
    birds_started: number;
    birds_sold: number;
    mortality_rate: number;
    roi_percent: number;
    audit_report_url: string | null;
    cycle_completed_at: string;
    total_revenue: number | null;
    total_expenses: number | null;
    net_profit: number | null;
    expense_breakdown: ExpenseItem[] | null;
    sort_order: number;
  };

export function useTrackRecord() {
  const [batches, setBatches] = useState<BatchPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('batch_performance')
      .select('*')
      .order('cycle_completed_at', { ascending: false });
    if (error) setError(error.message);
    else setBatches(data as BatchPerformance[]);
    setLoading(false);
  }, []);


  useEffect(() => { fetch(); }, [fetch]);

  return { batches, loading, error, refetch: fetch };
}

export async function fetchBatchById(id: string) {
    const { data, error } = await supabase.from('batch_performance').select('*').eq('id', id).single();
    if (error) throw error;
    return data as BatchPerformance;
  }