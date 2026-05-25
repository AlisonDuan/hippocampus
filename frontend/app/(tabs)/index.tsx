import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  addCard as addCardToDb,
  createCardDoc,
  getAllCards,
  getAllCategories,
  removeCard,
  syncWithRemote,
  type CardDoc,
} from '../../services/pouch';

const C = {
  primary: '#5B5EA6',
  bg: '#F4F5FB',
  card: '#FFFFFF',
  text: '#1A1A2E',
  sub: '#6B7280',
  danger: '#EF4444',
  dangerBg: '#FEE2E2',
  border: '#E5E7EB',
};

// A small palette to color-code category chips
const CATEGORY_COLORS = [
  '#5B5EA6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#EC4899', '#84CC16', '#F97316', '#6366F1',
];

function categoryColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length];
}

export default function Review() {
  const [cards, setCards] = useState<CardDoc[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [category, setCategory] = useState('');

  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const loadCards = useCallback(async () => {
    setLoading(true);
    try {
      const [list, cats] = await Promise.all([getAllCards(), getAllCategories()]);
      setCards(list);
      setCategories(cats);
    } catch (e) {
      console.error('Load cards failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadCards();
  }, [loadCards]);

  const handleAddCard = async () => {
    if (!front.trim() || !back.trim()) return alert('Please fill out both sides!');
    try {
      const doc = createCardDoc(front.trim(), back.trim(), undefined, category.trim() || undefined);
      const saved = await addCardToDb(doc);
      setCards((prev) => [...prev, saved]);
      const cat = category.trim();
      if (cat && !categories.includes(cat)) {
        setCategories((prev) => [...prev, cat].sort());
      }
      setFront('');
      setBack('');
      setCategory('');
    } catch (e) {
      console.error('Add card failed:', e);
      alert('Failed to add card');
    }
  };

  const handleDeleteCard = async (id: string) => {
    try {
      await removeCard(id);
      setCards((prev) => prev.filter((c) => c._id !== id));
    } catch (e) {
      console.error('Delete failed:', e);
      alert('Failed to delete card');
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncWithRemote();
      await loadCards();
    } catch (e) {
      console.error('Sync failed:', e);
      alert('Sync failed. Is CouchDB running at http://localhost:5984?');
    } finally {
      setSyncing(false);
    }
  };

  const canAdd = front.trim().length > 0 && back.trim().length > 0;

  const filteredCards = activeFilter == null
    ? cards
    : cards.filter((c) => c.category === activeFilter);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>Hippocampus</Text>
            <Text style={styles.appSubtitle}>Spaced repetition flashcards</Text>
          </View>
          <TouchableOpacity
            style={[styles.syncBtn, syncing && styles.syncBtnDisabled]}
            onPress={handleSync}
            disabled={syncing}
            activeOpacity={0.75}>
            {syncing
              ? <ActivityIndicator size="small" color={C.primary} />
              : <Text style={styles.syncBtnText}>Sync</Text>}
          </TouchableOpacity>
        </View>

        {/* Add card form */}
        <View style={styles.formCard}>
          <Text style={styles.sectionLabel}>New Flashcard</Text>
          <TextInput
            style={styles.input}
            placeholder="Front — question or term"
            placeholderTextColor={C.sub}
            value={front}
            onChangeText={setFront}
          />
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Back — answer or definition"
            placeholderTextColor={C.sub}
            value={back}
            onChangeText={setBack}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          <TextInput
            style={styles.input}
            placeholder="Category / deck (optional)"
            placeholderTextColor={C.sub}
            value={category}
            onChangeText={setCategory}
          />
          {/* Category quick-pick chips */}
          {categories.length > 0 && (
            <View style={styles.chipRow}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, { borderColor: categoryColor(cat) }, category === cat && { backgroundColor: categoryColor(cat) }]}
                  onPress={() => setCategory(category === cat ? '' : cat)}
                  activeOpacity={0.75}>
                  <Text style={[styles.chipText, { color: category === cat ? '#fff' : categoryColor(cat) }]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <TouchableOpacity
            style={[styles.addBtn, !canAdd && styles.addBtnDisabled]}
            onPress={handleAddCard}
            disabled={!canAdd}
            activeOpacity={0.85}>
            <Text style={styles.addBtnText}>Add Card</Text>
          </TouchableOpacity>
        </View>

        {/* Card list */}
        <View style={styles.listSection}>
          <View style={styles.listHeader}>
            <Text style={styles.sectionLabel}>Your Cards</Text>
            {cards.length > 0 && (
              <View style={styles.countPill}>
                <Text style={styles.countPillText}>{filteredCards.length}</Text>
              </View>
            )}
          </View>

          {/* Category filter chips */}
          {categories.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              <View style={styles.filterChipRow}>
                <TouchableOpacity
                  style={[styles.filterChip, activeFilter == null && styles.filterChipActive]}
                  onPress={() => setActiveFilter(null)}
                  activeOpacity={0.75}>
                  <Text style={[styles.filterChipText, activeFilter == null && styles.filterChipTextActive]}>All</Text>
                </TouchableOpacity>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.filterChip,
                      activeFilter === cat && { backgroundColor: categoryColor(cat), borderColor: categoryColor(cat) },
                    ]}
                    onPress={() => setActiveFilter(activeFilter === cat ? null : cat)}
                    activeOpacity={0.75}>
                    <Text style={[styles.filterChipText, activeFilter === cat && styles.filterChipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}

          {loading ? (
            <ActivityIndicator style={styles.loader} color={C.primary} />
          ) : filteredCards.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🃏</Text>
              <Text style={styles.emptyText}>
                {activeFilter ? `No cards in "${activeFilter}" yet.` : 'No cards yet.\nAdd your first one above!'}
              </Text>
            </View>
          ) : (
            <View style={styles.cardList}>
              {filteredCards.map((item) => (
                <View key={item._id} style={styles.cardRow}>
                  <View style={styles.cardContent}>
                    <View style={styles.cardTopRow}>
                      <Text style={styles.cardFront}>{item.front}</Text>
                      {item.category ? (
                        <View style={[styles.catBadge, { backgroundColor: categoryColor(item.category) + '22', borderColor: categoryColor(item.category) + '55' }]}>
                          <Text style={[styles.catBadgeText, { color: categoryColor(item.category) }]}>{item.category}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.cardBack}>{item.back}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDeleteCard(item._id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    activeOpacity={0.7}>
                    <Text style={styles.deleteBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingBottom: 20,
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    color: C.text,
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 13,
    color: C.sub,
    marginTop: 2,
  },
  syncBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: C.primary,
    minWidth: 68,
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
  },
  syncBtnDisabled: {
    opacity: 0.6,
  },
  syncBtnText: {
    color: C.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  formCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#3B3D8C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: C.border,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.sub,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  input: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: C.text,
    backgroundColor: C.bg,
  },
  inputMultiline: {
    minHeight: 72,
    paddingTop: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: -4,
  },
  chip: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  addBtn: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 2,
  },
  addBtnDisabled: {
    opacity: 0.4,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  listSection: {
    gap: 12,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  countPill: {
    backgroundColor: C.primary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: -1,
  },
  countPillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  filterScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  filterChipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
    paddingRight: 20,
  },
  filterChip: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: C.card,
  },
  filterChipActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.sub,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  loader: {
    marginTop: 32,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: C.sub,
    textAlign: 'center',
    lineHeight: 22,
  },
  cardList: {
    gap: 8,
  },
  cardRow: {
    backgroundColor: C.card,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  cardFront: {
    fontSize: 15,
    fontWeight: '600',
    color: C.text,
    flexShrink: 1,
  },
  catBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  catBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardBack: {
    fontSize: 14,
    color: C.sub,
  },
  deleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  deleteBtnText: {
    color: C.danger,
    fontSize: 12,
    fontWeight: '700',
  },
});
