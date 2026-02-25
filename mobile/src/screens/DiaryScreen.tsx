import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useEpisodes, useAddEpisode } from '../hooks/useApi';
import { colors, spacing, borderRadius, fontSizes } from '../constants/theme';

const MOODS = [
  { key: 'terrible', label: 'Ужасно', emoji: '😞' },
  { key: 'bad', label: 'Плохо', emoji: '😔' },
  { key: 'neutral', label: 'Нейтрально', emoji: '😐' },
  { key: 'good', label: 'Хорошо', emoji: '🙂' },
  { key: 'great', label: 'Отлично', emoji: '😊' },
];

export default function DiaryScreen() {
  const { data: episodes, isLoading, refetch } = useEpisodes(30);
  const addEpisode = useAddEpisode();
  const [showModal, setShowModal] = useState(false);
  const [mood, setMood] = useState('neutral');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async () => {
    setSubmitting(true);
    try {
      await addEpisode.mutateAsync({
        mood_before: mood,
        amount: amount ? Number(amount) : undefined,
        notes: notes.trim() || undefined,
        date: new Date().toISOString(),
      });
      setShowModal(false);
      setMood('neutral');
      setAmount('');
      setNotes('');
      await refetch();
    } catch (e) {
      Alert.alert('Ошибка', 'Не удалось сохранить запись');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Дневник</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color="#000" />
          <Text style={styles.addBtnText}>Запись</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          {(!episodes || episodes.length === 0) ? (
            <View style={styles.emptyState}>
              <Ionicons name="journal-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Нет записей</Text>
              <Text style={styles.emptySubtitle}>
                Добавьте запись об эпизоде, чтобы отслеживать прогресс
              </Text>
            </View>
          ) : (
            episodes.map((ep) => (
              <View key={ep.id} style={styles.episodeCard}>
                <View style={styles.episodeHeader}>
                  <Text style={styles.episodeDate}>{formatDate(ep.date)}</Text>
                  {ep.mood_before && (
                    <Text style={styles.moodEmoji}>
                      {MOODS.find((m) => m.key === ep.mood_before)?.emoji ?? '😐'}
                    </Text>
                  )}
                </View>
                {ep.amount != null && ep.amount > 0 && (
                  <Text style={styles.episodeAmount}>
                    Сумма: {ep.amount.toLocaleString('ru-RU')} ₸
                  </Text>
                )}
                {ep.notes && (
                  <Text style={styles.episodeNotes}>{ep.notes}</Text>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Add episode modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Новая запись</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.fieldLabel}>Настроение перед эпизодом</Text>
            <View style={styles.moodRow}>
              {MOODS.map((m) => (
                <TouchableOpacity
                  key={m.key}
                  style={[styles.moodBtn, mood === m.key && styles.moodBtnSelected]}
                  onPress={() => setMood(m.key)}
                >
                  <Text style={styles.moodBtnEmoji}>{m.emoji}</Text>
                  <Text style={[styles.moodBtnLabel, mood === m.key && styles.moodBtnLabelSelected]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { marginTop: spacing.lg }]}>
              Потраченная сумма (₸)
            </Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />

            <Text style={[styles.fieldLabel, { marginTop: spacing.lg }]}>
              Заметки (необязательно)
            </Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Что произошло?"
              placeholderTextColor={colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.saveBtn, submitting && styles.saveBtnDisabled]}
              onPress={handleAdd}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.saveBtnText}>Сохранить</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSizes.xl,
    fontFamily: 'Inter_700Bold',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  addBtnText: {
    color: '#000',
    fontSize: fontSizes.sm,
    fontFamily: 'Inter_600SemiBold',
  },
  scroll: { flex: 1 },
  content: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: spacing.md,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.lg,
    fontFamily: 'Inter_600SemiBold',
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  episodeCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  episodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  episodeDate: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    fontFamily: 'Inter_500Medium',
  },
  moodEmoji: { fontSize: 20 },
  episodeAmount: {
    color: colors.warning,
    fontSize: fontSizes.base,
    fontFamily: 'Inter_600SemiBold',
  },
  episodeNotes: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  modal: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.lg,
    fontFamily: 'Inter_600SemiBold',
  },
  modalContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    fontFamily: 'Inter_500Medium',
    marginBottom: spacing.sm,
  },
  moodRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  moodBtn: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 2,
  },
  moodBtnSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(0,212,170,0.1)',
  },
  moodBtnEmoji: { fontSize: 22 },
  moodBtnLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  moodBtnLabelSelected: { color: colors.primary },
  input: {
    backgroundColor: colors.bgInput,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontSize: fontSizes.base,
    fontFamily: 'Inter_400Regular',
    padding: spacing.md,
    height: 48,
  },
  notesInput: {
    height: 100,
    paddingTop: spacing.md,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: {
    color: '#000',
    fontSize: fontSizes.base,
    fontFamily: 'Inter_600SemiBold',
  },
});
