import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import {
  isAvailable as vpnAvailable,
  isRunning as vpnRunning,
  getMode,
  setMode,
  canDeactivateStrict,
  enableVpn,
  disableVpn,
} from '../services/VpnFilterService';
import {
  isAvailable as usageAvailable,
  hasPermission as usageHasPermission,
  openUsageAccessSettings,
} from 'usage-stats';
import { colors, spacing, borderRadius, fontSizes } from '../constants/theme';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [vpnOn, setVpnOn] = useState(false);
  const [strictMode, setStrictMode] = useState(false);
  const [usagePermission, setUsagePermission] = useState(false);

  useEffect(() => {
    setVpnOn(vpnRunning());
    setStrictMode(getMode() === 'strict');
    setUsagePermission(usageHasPermission());
  }, []);

  const handleVpnToggle = async (value: boolean) => {
    if (value) {
      const started = await enableVpn();
      setVpnOn(started);
    } else {
      if (getMode() === 'strict' && !canDeactivateStrict()) {
        Alert.alert(
          'Строгий режим',
          'В строгом режиме нельзя отключить VPN до истечения таймера.',
        );
        return;
      }
      disableVpn();
      setVpnOn(false);
    }
  };

  const handleStrictToggle = (value: boolean) => {
    if (value) {
      Alert.alert(
        'Включить строгий режим?',
        'В строгом режиме VPN нельзя будет отключить 24 часа. Вы уверены?',
        [
          { text: 'Отмена', style: 'cancel' },
          {
            text: 'Включить',
            style: 'destructive',
            onPress: () => {
              setMode('strict');
              setStrictMode(true);
            },
          },
        ],
      );
    } else {
      if (!canDeactivateStrict()) {
        Alert.alert('Строгий режим', 'Таймер строгого режима ещё не истёк.');
        return;
      }
      setMode('soft');
      setStrictMode(false);
    }
  };

  const handleUsagePermission = () => {
    openUsageAccessSettings();
    setTimeout(() => {
      setUsagePermission(usageHasPermission());
    }, 2000);
  };

  const handleSignOut = () => {
    Alert.alert('Выйти из аккаунта?', 'Вы уверены?', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Выйти', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Настройки</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* User info */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={28} color={colors.primary} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {user?.user_metadata?.full_name ?? 'Пользователь'}
            </Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </View>
        </View>

        {/* VPN section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Защита</Text>

          {!vpnAvailable() && (
            <View style={styles.warningBox}>
              <Ionicons name="warning" size={16} color={colors.warning} />
              <Text style={styles.warningText}>VPN-блокировка доступна только на Android</Text>
            </View>
          )}

          <SettingRow
            icon="shield"
            title="VPN-блокировка"
            subtitle="Блокировать сайты азартных игр"
            right={
              <Switch
                value={vpnOn}
                onValueChange={handleVpnToggle}
                trackColor={{ false: colors.bgInput, true: colors.primary + '80' }}
                thumbColor={vpnOn ? colors.primary : colors.textMuted}
                disabled={!vpnAvailable()}
              />
            }
          />

          <SettingRow
            icon="lock-closed"
            title="Строгий режим"
            subtitle="Запретить отключение VPN на 24 часа"
            right={
              <Switch
                value={strictMode}
                onValueChange={handleStrictToggle}
                trackColor={{ false: colors.bgInput, true: colors.warning + '80' }}
                thumbColor={strictMode ? colors.warning : colors.textMuted}
                disabled={!vpnAvailable()}
              />
            }
          />
        </View>

        {/* Usage monitoring */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Мониторинг</Text>

          <SettingRow
            icon="eye"
            title="Мониторинг приложений"
            subtitle={
              usagePermission
                ? 'Разрешение выдано'
                : 'Нажмите чтобы выдать разрешение'
            }
            right={
              usagePermission ? (
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              ) : (
                <TouchableOpacity
                  style={styles.grantBtn}
                  onPress={handleUsagePermission}
                  disabled={!usageAvailable()}
                >
                  <Text style={styles.grantBtnText}>Разрешить</Text>
                </TouchableOpacity>
              )
            }
          />
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Аккаунт</Text>
          <TouchableOpacity style={styles.dangerRow} onPress={handleSignOut} activeOpacity={0.8}>
            <Ionicons name="log-out" size={20} color={colors.danger} />
            <Text style={styles.dangerText}>Выйти из аккаунта</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>SafeBet v1.0.0 • Android</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({
  icon,
  title,
  subtitle,
  right,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={rowStyles.row}>
      <View style={rowStyles.iconWrap}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={rowStyles.textWrap}>
        <Text style={rowStyles.title}>{title}</Text>
        {subtitle && <Text style={rowStyles.subtitle}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(0,212,170,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWrap: { flex: 1 },
  title: {
    color: colors.textPrimary,
    fontSize: fontSizes.base,
    fontFamily: 'Inter_500Medium',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  header: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSizes.xl,
    fontFamily: 'Inter_700Bold',
  },
  scroll: { flex: 1 },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  profileCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,212,170,0.1)',
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: { flex: 1 },
  profileName: {
    color: colors.textPrimary,
    fontSize: fontSizes.md,
    fontFamily: 'Inter_600SemiBold',
  },
  profileEmail: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  section: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    paddingBottom: 0,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  warningText: {
    color: colors.warning,
    fontSize: fontSizes.xs,
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
  grantBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  grantBtnText: {
    color: '#000',
    fontSize: fontSizes.xs,
    fontFamily: 'Inter_600SemiBold',
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  dangerText: {
    color: colors.danger,
    fontSize: fontSizes.base,
    fontFamily: 'Inter_500Medium',
  },
  versionText: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
