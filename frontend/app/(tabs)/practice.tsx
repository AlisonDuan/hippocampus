import ParallaxScrollView from '@/components/parallax-scroll-view';
import { Image } from 'expo-image';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  getDueCards,
  updateCard,
  type CardDoc,
} from '../../services/pouch';
import { scheduleCard, type Quality } from '../../services/srs';

export default function PracticeScreen() {
  const [due, setDue] = useState<CardDoc[]>([]);
  const [index, setIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadDue = useCallback(async () => {
    setLoading(true);
    try {
      const cards = await getDueCards();
      setDue(cards);
      setIndex(0);
      setShowBack(false);
    } catch (e) {
      console.error('Load due cards failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadDue();
  }, [loadDue]);

  const current = due[index];
  const total = due.length;

  const rate = async (quality: Quality) => {
    if (!current) return;
    try {
      const updated = scheduleCard(current, quality);
      await updateCard(updated);
      if (index + 1 >= total) {
        await loadDue();
        return;
      }
      setIndex((i) => i + 1);
      setShowBack(false);
    } catch (e) {
      console.error('Update card failed:', e);
    }
  };

  if (loading) {
    return (
      <ParallaxScrollView
        headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
        headerImage={
          <Image
            source={require('@/assets/images/partial-react-logo.png')}
            style={styles.reactLogo}
          />
        }>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.hint}>Loading due cards…</Text>
        </View>
      </ParallaxScrollView>
    );
  }

  if (total === 0) {
    return (
      <ParallaxScrollView
        headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
        headerImage={
          <Image
            source={require('@/assets/images/partial-react-logo.png')}
            style={styles.reactLogo}
          />
        }>
        <View style={styles.center}>
          <Text style={styles.title}>Practice</Text>
          <Text style={styles.noCards}>No cards due right now.</Text>
          <Text style={styles.hint}>Add cards on the Review tab and come back.</Text>
        </View>
      </ParallaxScrollView>
    );
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <View style={styles.container}>
        <Text style={styles.progress}>
          Card {index + 1} of {total}
        </Text>

        <TouchableOpacity
          style={styles.card}
          onPress={() => setShowBack((s) => !s)}
          activeOpacity={0.9}>
          <Text style={styles.sideLabel}>
            {showBack ? 'Answer' : 'Question'}
          </Text>
          <Text style={styles.cardText}>
            {showBack ? current.back : current.front}
          </Text>
          {!showBack && (
            <Text style={styles.tapHint}>Tap to reveal answer</Text>
          )}
        </TouchableOpacity>

        {showBack && (
          <View style={styles.buttons}>
            <Button
              title="Again"
              onPress={() => rate(0)}
              color="#e74c3c"
            />
            <Button
              title="Good"
              onPress={() => rate(2)}
              color="#2ecc71"
            />
            <Button
              title="Easy"
              onPress={() => rate(3)}
              color="#3498db"
            />
          </View>
        )}
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  progress: { fontSize: 14, color: '#666', marginBottom: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    minHeight: 160,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sideLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  cardText: { fontSize: 20 },
  tapHint: { fontSize: 14, color: '#888', marginTop: 12 },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
    gap: 12,
  },
  noCards: { fontSize: 18, marginBottom: 8 },
  hint: { fontSize: 14, color: '#666' },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
