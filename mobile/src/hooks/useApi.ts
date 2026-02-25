import { QueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '../contexts/AuthContext';
import { useAuth } from '../contexts/AuthContext';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5 minutes
      retry: 2,
    },
  },
});

// ── Diary / Episodes ──

export interface DiaryEntry {
  id: string;
  user_id: string;
  date: string;
  type: string;
  amount?: number;
  duration?: number;
  mood_before?: string;
  mood_after?: string;
  triggers?: string[];
  notes?: string;
  created_at: string;
}

export function useEpisodes(days = 30) {
  const { user } = useAuth();
  const since = new Date(Date.now() - days * 86400000).toISOString();

  return useQuery({
    queryKey: ['episodes', user?.id, days],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('diary_entries')
        .select('*')
        .eq('user_id', user!.id)
        .eq('type', 'episode')
        .gte('date', since)
        .order('date', { ascending: false });
      if (error) throw error;
      return data as DiaryEntry[];
    },
  });
}

export function useAddEpisode() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (entry: Partial<DiaryEntry>) => {
      const { data, error } = await supabase.from('diary_entries').insert({
        ...entry,
        user_id: user!.id,
        type: 'episode',
        date: entry.date ?? new Date().toISOString(),
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['episodes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// ── Dashboard stats ──

export interface DashboardStats {
  streakDays: number;
  episodesToday: number;
  episodesWeek: number;
  blockedToday: number;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export function useDashboardStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<DashboardStats> => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();

      const [episodesRes, blockRes, userRes] = await Promise.all([
        supabase
          .from('diary_entries')
          .select('date, amount')
          .eq('user_id', user!.id)
          .eq('type', 'episode')
          .gte('date', thirtyDaysAgo)
          .order('date', { ascending: false }),
        supabase
          .from('block_events')
          .select('created_at')
          .eq('user_id', user!.id)
          .gte('created_at', todayStr),
        supabase
          .from('users')
          .select('created_at')
          .eq('id', user!.id)
          .single(),
      ]);

      const episodes = episodesRes.data ?? [];
      const blockedToday = blockRes.data?.length ?? 0;

      // Streak
      const episodeDates = new Set(episodes.map((e) => e.date.split('T')[0]));
      let streakDays = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        if (episodeDates.has(d.toISOString().split('T')[0])) break;
        streakDays++;
      }
      if (episodes.length === 0 && userRes.data) {
        streakDays = Math.floor((now.getTime() - new Date(userRes.data.created_at).getTime()) / 86400000);
      }

      const episodesToday = episodes.filter((e) => e.date.startsWith(todayStr)).length;
      const episodesWeek = episodes.filter((e) => e.date >= sevenDaysAgo).length;

      // Simple risk score
      let riskScore = 0;
      if (episodesWeek > 5) riskScore += 50;
      else if (episodesWeek > 2) riskScore += 30;
      else if (episodesWeek > 0) riskScore += 15;
      if (streakDays < 3) riskScore += 30;
      else if (streakDays < 7) riskScore += 10;
      riskScore = Math.min(100, riskScore);

      const riskLevel: DashboardStats['riskLevel'] =
        riskScore >= 60 ? 'HIGH' : riskScore >= 30 ? 'MEDIUM' : 'LOW';

      return { streakDays, episodesToday, episodesWeek, blockedToday, riskScore, riskLevel };
    },
  });
}

// ── Block events (write from VPN) ──

export async function logBlockEvent(userId: string, domain: string) {
  await supabase.from('block_events').insert({
    user_id: userId,
    domain,
    created_at: new Date().toISOString(),
  });
}
