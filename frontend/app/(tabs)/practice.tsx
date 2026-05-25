import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  getAllCategories,
  getDueCards,
  updateCard,
  type CardDoc,
} from '../../services/pouch';
import { scheduleCard, type Quality } from '../../services/srs';

const C = {
  primary: '#5B5EA6',
  bg: '#F4F5FB',
  card: '#FFFFFF',
  text: '#1A1A2E',
  sub: '#6B7280',
  again: '#EF4444',
  good: '#10B981',
  easy: '#3B82F6',
  border: '#E5E7EB',
  progressBg: '#DDE0F5',
};

const CATEGORY_COLORS = [
  '#5B5EA6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#EC4899', '#84CC16', '#F97316', '#6366F1',
];

function categoryColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length];
}

export default function PracticeScreen() {
  const [due, setDue] = useState<CardDoc[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadDue = useCallback(async (category?: string | null) => {
    setLoading(true);
    try {
      const [cards, cats] = await Promise.all([
        getDueCards(category ?? undefined),
        getAllCategories(),
      ]);
      setDue(cards);
      setCategories(cats);
      setIndex(0);
      setShowBack(false);
    } catch (e) {
      console.error('Load due cards failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDue(selectedCategory);
    }, [loadDue, selectedCategory])
  );

  const handleSelectCategory = (cat: string | null) => {
    setSelectedCategory(cat);
    loadDue(cat);
  };

  const current = due[index];
  const total = due.length;

  const rate = async (quality: Quality) => {
    if (!current) return;
    try {
      const updated = scheduleCard(current, quality);
      await updateCard(updated);
      if (index + 1 >= total) {
        await loadDue(selectedCategory);
        return;
      }
      setIndex((i) => i + 1);
      setShowBack(false);
    } catch (e) {
      console.error('Update card failed:', e);
    }
  };

  const DeckSelector = () => {
    if (categories.length === 0) return null;
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.deckScroll}
        contentContainerStyle={styles.deckScrollContent}>
        <TouchableOpacity
          style={[styles.deckChip, selectedCategory == null && styles.deckChipActive]}
          onPress={() => handleSelectCategory(null)}
          activeOpacity={0.75}>
          <Text style={[styles.deckChipText, selectedCategory == null && styles.deckChipTextActive]}>
            All decks
          </Text>
        </TouchableOpacity>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.deckChip,
              selectedCategory === cat && { backgroundColor: categoryColor(cat), borderColor: categoryColor(cat) },
            ]}
            onPress={() => handleSelectCategory(cat)}
            activeOpacity={0.75}>
            <Text style={[styles.deckChipText, selectedCategory === cat && styles.deckChipTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Practice</Text>
        </View>
        <DeckSelector />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.hint}>Loading cards…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (total === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Practice</Text>
        </View>
        <DeckSelector />
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>🎉</Text>
          <Text style={styles.emptyTitle}>All caught up!</Text>
          <Text style={styles.hint}>
            {selectedCategory
              ? `No cards due in "${selectedCategory}".`
              : 'No cards due right now.'}{'\n'}Add more on the Review tab.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const progress = (index + 1) / total;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Practice</Text>
          {selectedCategory && (
            <Text style={[styles.deckLabel, { color: categoryColor(selectedCategory) }]}>
              {selectedCategory}
            </Text>
          )}
        </View>
        <Text style={styles.progressText}>{index + 1} / {total}</Text>
      </View>

      {/* Deck selector */}
      <DeckSelector />

      {/* Progress bar */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progress * 100}%` as any }]} />
      </View>

      {/* Card area */}
      <View style={styles.cardArea}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => setShowBack((s) => !s)}
          activeOpacity={0.97}>
          {current.category ? (
            <View style={[styles.cardCatBadge, { backgroundColor: categoryColor(current.category) + '22', borderColor: categoryColor(current.category) + '55' }]}>
              <Text style={[styles.cardCatText, { color: categoryColor(current.category) }]}>{current.category}</Text>
            </View>
          ) : null}
          <Text style={styles.sideLabel}>{showBack ? 'Answer' : 'Question'}</Text>
          <Text style={styles.cardText}>{showBack ? current.back : current.front}</Text>
          {!showBack && (
            <Text style={styles.tapHint}>Tap to reveal answer →</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Rating buttons */}
      {showBack ? (
        <View style={styles.ratingRow}>
          <TouchableOpacity
            style={[styles.ratingBtn, { backgroundColor: C.again }]}
            onPress={() => rate(0)}
            activeOpacity={0.85}>
            <Text style={styles.ratingLabel}>Again</Text>
            <Text style={styles.ratingSubLabel}>Forgot</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.ratingBtn, { backgroundColor: C.good }]}
            onPress={() => rate(2)}
            activeOpacity={0.85}>
            <Text style={styles.ratingLabel}>Good</Text>
            <Text style={styles.ratingSubLabel}>Got it</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.ratingBtn, { backgroundColor: C.easy }]}
            onPress={() => rate(3)}
            activeOpacity={0.85}>
            <Text style={styles.ratingLabel}>Easy</Text>
            <Text style={styles.ratingSubLabel}>Too easy</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.promptRow}>
          <Text style={styles.promptText}>How well did you remember this?</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.3,
  },
  deckLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  progressText: {
    fontSize: 15,
    color: C.sub,
    fontWeight: '500',
  },
  deckScroll: {
    paddingHorizontal: 24,
    marginBottom: 8,
    maxHeight: 44,
  },
  deckScrollContent: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    paddingRight: 24,
  },
  deckChip: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: C.card,
  },
  deckChipActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  deckChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.sub,
  },
  deckChipTextActive: {
    color: '#fff',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: C.progressBg,
    marginHorizontal: 24,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: 4,
    backgroundColor: C.primary,
    borderRadius: 2,
  },
  cardArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: 24,
    padding: 32,
    minHeight: 230,
    justifyContent: 'center',
    shadowColor: '#3B3D8C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardCatBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 14,
  },
  cardCatText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sideLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 18,
  },
  cardText: {
    fontSize: 22,
    color: C.text,
    fontWeight: '500',
    lineHeight: 32,
  },
  tapHint: {
    fontSize: 13,
    color: C.sub,
    marginTop: 24,
    fontStyle: 'italic',
  },
  ratingRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 28,
    gap: 10,
  },
  ratingBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  ratingLabel: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  ratingSubLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    marginTop: 3,
  },
  promptRow: {
    paddingBottom: 36,
    alignItems: 'center',
  },
  promptText: {
    fontSize: 14,
    color: C.sub,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: C.text,
    marginBottom: 10,
  },
  hint: {
    fontSize: 15,
    color: C.sub,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 6,
  },
});
