import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type EquityCampaign = {
  id: string;
  title: string;
  description: string;
  target_birds: number;
  target_amount: number;
  price_per_share: number;
  total_shares: number;
  min_shares: number;
  net_profit: number | null;
  status: 'raising' | 'active' | 'completed';
  batch_started_at: string | null;
  created_at: string;
};

export type CampaignProgress = {
  sharesSold: number;
  investorCount: number;
  sharesRemaining: number;
  percentFunded: number;
};

export function useEquityCampaigns() {
  const [campaigns, setCampaigns] = useState<EquityCampaign[]>([]);
  const [progressById, setProgressById] = useState<Record<string, CampaignProgress>>({});
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data: campaignRows } = await supabase.from('equity_campaigns').select('*').order('created_at', { ascending: false });

    const progress: Record<string, CampaignProgress> = {};
    await Promise.all(
      (campaignRows ?? []).map(async (c) => {
        const { data } = await supabase.rpc('get_campaign_progress', { p_campaign_id: c.id });
        const sharesSold = data?.[0] ? Number(data[0].shares_sold) : 0;
        const investorCount = data?.[0] ? Number(data[0].investor_count) : 0;
        progress[c.id] = {
          sharesSold,
          investorCount,
          sharesRemaining: Math.max(0, c.total_shares - sharesSold),
          percentFunded: c.total_shares > 0 ? Math.min(1, sharesSold / c.total_shares) : 0,
        };
      })
    );

    setCampaigns((campaignRows ?? []) as EquityCampaign[]);
    setProgressById(progress);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { campaigns, progressById, loading, refetch: fetch };
}