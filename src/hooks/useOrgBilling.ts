import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PlanQuota {
  plan: string;
  max_instances: number;
  max_conversations_per_month: number;
  max_members: number;
  price_brl: number;
}

export interface Subscription {
  id: string;
  plan: string;
  status: 'trial' | 'active' | 'overdue' | 'suspended' | 'cancelled';
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  next_due_date: string | null;
  amount: number | null;
}

export interface UsageMetric {
  messages_count: number;
  conversations_count: number;
  ai_calls_count: number;
  period_year: number;
  period_month: number;
}

export function useOrgBilling() {
  const { organization, isAdmin, isOwner } = useAuth();
  const supabaseAny = supabase as any;

  const { data: subscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ['org-subscription', organization?.id],
    enabled: !!organization?.id && (isAdmin || isOwner),
    queryFn: async () => {
      const { data, error } = await supabaseAny
        .from('subscriptions')
        .select('id, plan, status, trial_ends_at, current_period_start, current_period_end, next_due_date, amount')
        .eq('organization_id', organization!.id)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as Subscription | null;
    },
  });

  const { data: planQuota, isLoading: isLoadingQuota } = useQuery({
    queryKey: ['plan-quota', subscription?.plan ?? organization?.plan],
    enabled: !!(subscription?.plan ?? organization?.plan),
    queryFn: async () => {
      const plan = subscription?.plan ?? organization?.plan ?? 'conexao';
      const { data, error } = await supabaseAny
        .from('plan_quotas')
        .select('*')
        .eq('plan', plan)
        .single();

      if (error) throw error;
      return data as unknown as PlanQuota;
    },
  });

  const now = new Date();
  const { data: currentUsage, isLoading: isLoadingUsage } = useQuery({
    queryKey: ['usage-metrics', organization?.id, now.getFullYear(), now.getMonth() + 1],
    enabled: !!organization?.id && (isAdmin || isOwner),
    queryFn: async () => {
      const { data, error } = await supabaseAny
        .from('usage_metrics')
        .select('messages_count, conversations_count, ai_calls_count, period_year, period_month')
        .eq('organization_id', organization!.id)
        .eq('period_year', now.getFullYear())
        .eq('period_month', now.getMonth() + 1)
        .maybeSingle();

      if (error) throw error;
      return (data ?? {
        messages_count: 0,
        conversations_count: 0,
        ai_calls_count: 0,
        period_year: now.getFullYear(),
        period_month: now.getMonth() + 1,
      }) as UsageMetric;
    },
  });

  const { data: historicalUsage } = useQuery({
    queryKey: ['usage-metrics-history', organization?.id],
    enabled: !!organization?.id && (isAdmin || isOwner),
    queryFn: async () => {
      const { data, error } = await supabaseAny
        .from('usage_metrics')
        .select('messages_count, ai_calls_count, period_year, period_month')
        .eq('organization_id', organization!.id)
        .order('period_year', { ascending: false })
        .order('period_month', { ascending: false })
        .limit(6);

      if (error) throw error;
      return (data ?? []) as unknown as UsageMetric[];
    },
  });

  const messagesUsedPct = planQuota && currentUsage
    ? Math.min(100, Math.round((currentUsage.messages_count / planQuota.max_conversations_per_month) * 100))
    : 0;

  return {
    subscription,
    planQuota,
    currentUsage,
    historicalUsage: historicalUsage ?? [],
    messagesUsedPct,
    isLoading: isLoadingSubscription || isLoadingQuota || isLoadingUsage,
  };
}
