import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withRepeat, withTiming } from 'react-native-reanimated';

import { useAuth } from '../contexts/AuthContext';
import { useDashboardStats } from '../hooks/useApi';
import {
  isAvailable as vpnAvailable,
  isRunning as vpnRunning,
  getBlockedToday,
  getTotalBlocked,
  getRecentBlockedDomains,
  enableVpn,
  disableVpn,
  getMode,
  canDeactivateStrict,
  getStrictRemainingFormatted,
} from '../services/VpnFilterService';
import { colors, spacing, borderRadius, fontSizes } from '../constants/theme';

export default function HomeScreen() {
  const { user } = useAuth();
  const { data: stats, refetch, isLoading } = useDashboardStats();

  const [vpnOn, setVpnOn] = useState(false);
  const [vpnLoading, setVpnLoading] = useState(false);
  const [blockedToday, setBlockedToday] = useState(0);
  const [totalBlocked, setTotalBlocked] = useState(0);
  const [recentDomains, setRecentDomains] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const pulseScale = useSharedValue(1);

  const refreshVpnState = useCallback(() => {
    setVpnOn(vpnRunning());
    setBlockedToday(getBlockedToday());
    setTotalBlocked(getTotalBlocked());
    setRecentDomains(getRecentBlockedDomains().slice(0, 5));
  }, []);

  useEffect(() => {
    refreshVpnState();
    const interval = setInterval(refreshVpnState, 3000);
    return () => clearInterval(interval);
  }, [refreshVpnState]);

  useEffect(() => {
    if (vpnOn) {
      pulseScale.value = withRepeat(
        withTiming(1.08, { duration: 1200 }),
        -1,
        true,
      );
    } else {
      pulseScale.value = withSpring(1);
    }
  }, [vpnOn]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const handleToggleVpn = async () => {
    if (!vpnAvailable()) return;
    if (vpnOn && getMode() === 'strict' && !canDeactivateStrict()) {
      // Can't stop in strict mode
      return;
    }
    setVpnLoading(true);
    try {
      if (vpnOn) {
        disableVpn();
        setVpnOn(false);
      } else {
        const started = await enableVpn();
        setVpnOn(started);
      }
      refreshVpnState();
    } finally {
      setVpnLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    refreshVpnState();
    setRefreshing(false);
  }, [refetch, refreshVpnState]);

  const riskColor =
    stats?.riskLevel === 'HIGH'
      ? colors.riskHigh
      : stats?.riskLevel === 'MEDIUM'
      ? colors.riskMedium
      : colors.riskLow;

  const strictRemaining = getStrictRemainingFormatted();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Привет,</Text>
            <Text style={styles.userName}>
              {user?.user_metadata?.full_name?.split(' ')[0] ?? 'пользователь'}
            </Text>
          </View>
          <View style={[styles.riskBadge, { borderColor: riskColor }]}>
            <Text style={[styles.riskText, { color: riskColor }]}>
              Риск: {stats?.riskLevel === 'HIGH' ? 'Высокий' : stats?.riskLevel === 'MEDIUM' ? 'Средний' : 'Низкий'}
            </Text>
          </View>
        </View>

        {/* VPN Toggle */}
        <View style={styles.vpnCard}>
          <Animated.View style={animStyle}>
            <TouchableOpacity
              style={[styles.vpnCircle, vpnOn ? styles.vpnCircleOn : styles.vpnCircleOff]}
              onPress={handleToggleVpn}
              disabled={vpnLoading || !vpnAvailable()}
              activeOpacity={0.85}
            >
              {vpnLoading ? (
                <ActivityIndicator size="large" color={vpnOn ? colors.vpnOn : colors.vpnOff} />
              ) : (
                <>
                  <Ionicons
                    name={vpnOn ? 'shield-checkmark' : 'shield-outline'}
                    size={52}
                    color={vpnOn ? colors.vpnOn : colors.vpnOff}
                  />
                  <Text style={[styles.vpnCircleLabel, { color: vpnOn ? colors.vpnOn : colors.vpnOff }]}>
                    {vpnOn ? 'ВКЛЮЧЁН' : 'ВЫКЛЮЧЕН'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          <Text style={styles.vpnTitle}>
            {vpnOn ? 'Блокировка активна' : 'Блокировка отключена'}
          </Text>
          <Text style={styles.vpnSubtitle}>
            {vpnOn
              ? 'Сайты азартных игр заблокированы'
              : 'Нажмите для включения защиты'
            }
          </Text>

          {!vpnAvailable() && (
            <Text style={styles.vpnUnavailable}>
              ⚠ Доступно только на Android
            </Text>
          )}

          {vpnOn && getMode() === 'strict' && strictRemaining && (
            <View style={styles.strictBadge}>
              <Ionicons name="lock-closed" size={14} color={colors.warning} />
              <Text style={styles.strictText}>Строгий режим: ещё {strictRemaining}</Text>
            </View>
          )}
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatCard
            icon="today"
            label="Заблокировано сегодня"
            value={String(blockedToday)}
            color={colors.primary}
          />
          <StatCard
            icon="bar-chart"
            label="Всего заблокировано"
            value={String(totalBlocked)}
            color={colors.info}
          />
        </View>

        {/* Streak + episodes */}
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
        ) : (
          <View style={styles.statsRow}>
            <StatCard
              icon="flame"
              label="Дней без срыва"
              value={String(stats?.streakDays ?? 0)}
              color={colors.success}
            />
            <StatCard
              icon="warning"
              label="Эпизодов за неделю"
              value={String(stats?.episodesWeek ?? 0)}
              color={stats?.episodesWeek ? colors.warning : colors.success}
            />
          </View>
        )}

        {/* Recent blocked domains */}
        {recentDomains.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Последние попытки</Text>
            {recentDomains.map((domain, i) => (
              <View key={i} style={styles.domainRow}>
                <Ionicons name="ban" size={14} color={colors.danger} />
                <Text style={styles.domainText}>{domain}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Risk score bar */}
        {stats && (
          <View style={styles.section}>
            <View style={styles.riskRow}>
              <Text style={styles.sectionTitle}>Уровень риска</Text>
              <Text style={[styles.riskScoreNum, { color: riskColor }]}>
                {stats.riskScore}%
              </Text>
            </View>
            <View style={styles.riskBarBg}>
              <View
                style={[
                  styles.riskBarFill,
                  {
                    width: `${stats.riskScore}%` as `${number}%`,
                    backgroundColor: riskColor,
                  },
                ]}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={[statStyles.card, { borderColor: color + '33' }]}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    gap: spacing.xs,
  },
  value: {
    color: colors.textPrimary,
    fontSize: fontSizes.xl,
    fontFamily: 'Inter_700Bold',
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
  },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    fontFamily: 'Inter_400Regular',
  },
  userName: {
    color: colors.textPrimary,
    fontSize: fontSizes.xl,
    fontFamily: 'Inter_700Bold',
  },
  riskBadge: {
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  riskText: {
    fontSize: fontSizes.xs,
    fontFamily: 'Inter_600SemiBold',
  },
  vpnCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  vpnCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    gap: spacing.xs,
  },
  vpnCircleOn: {
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderColor: colors.vpnOn,
  },
  vpnCircleOff: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: colors.vpnOff,
  },
  vpnCircleLabel: {
    fontSize: fontSizes.xs,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.5,
  },
  vpnTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.md,
    fontFamily: 'Inter_600SemiBold',
  },
  vpnSubtitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  vpnUnavailable: {
    color: colors.warning,
    fontSize: fontSizes.sm,
    fontFamily: 'Inter_400Regular',
  },
  strictBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  strictText: {
    color: colors.warning,
    fontSize: fontSizes.xs,
    fontFamily: 'Inter_500Medium',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  section: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    fontFamily: 'Inter_500Medium',
  },
  domainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  domainText: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    fontFamily: 'Inter_400Regular',
  },
  riskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riskScoreNum: {
    fontSize: fontSizes.lg,
    fontFamily: 'Inter_700Bold',
  },
  riskBarBg: {
    height: 8,
    backgroundColor: colors.bgInput,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  riskBarFill: {
    height: 8,
    borderRadius: borderRadius.full,
  },
});
