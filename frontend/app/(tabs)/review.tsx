import ParallaxScrollView from '@/components/parallax-scroll-view';
import { Image } from 'expo-image';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getAllCards, type CardDoc } from '../../services/pouch';

function CardItem({ card }: { card: CardDoc }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => setFlipped((f) => !f)}
      activeOpacity={0.85}>
      <Text style={styles.sideLabel}>{flipped ? 'Back' : 'Front'}</Text>
      <Text style={styles.cardText}>{flipped ? card.back : card.front}</Text>
      {!flipped && <Text style={styles.tapHint}>Tap to flip</Text>}
    </TouchableOpacity>
  );
}

export default function ReviewScreen() {
  const [cards, setCards] = useState<CardDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCards = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getAllCards();
      setCards(list);
    } catch (e) {
      console.error('Load cards failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadCards();
  }, [loadCards]);

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
        <Text style={styles.title}>Review</Text>

        {loading ? (
          <ActivityIndicator style={styles.loader} size="large" />
        ) : cards.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No cards yet.</Text>
            <Text style={styles.emptyHint}>Add some on the Add Cards tab.</Text>
          </View>
        ) : (
          <>
            <Text style={styles.count}>{cards.length} card{cards.length !== 1 ? 's' : ''}</Text>
            {cards.map((card) => (
              <CardItem key={card._id} card={card} />
            ))}
          </>
        )}
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 10, paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  count: { fontSize: 14, color: '#888', marginBottom: 16 },
  loader: { marginTop: 40 },
  empty: { marginTop: 40, alignItems: 'center' },
  emptyText: { fontSize: 18, marginBottom: 8 },
  emptyHint: { fontSize: 14, color: '#666' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    minHeight: 100,
    justifyContent: 'center',
  },
  sideLabel: {
    fontSize: 11,
    color: '#aaa',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  cardText: { fontSize: 18 },
  tapHint: { fontSize: 13, color: '#bbb', marginTop: 10 },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
