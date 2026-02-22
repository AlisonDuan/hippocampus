import ParallaxScrollView from '@/components/parallax-scroll-view';
import { Image } from 'expo-image';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  addCard as addCardToDb,
  createCardDoc,
  getAllCards,
  removeCard,
  syncWithRemote,
  type CardDoc,
} from '../../services/pouch';

export default function Review() {
  const [cards, setCards] = useState<CardDoc[]>([]);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

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

  const handleAddCard = async () => {
    if (!front.trim() || !back.trim()) return alert('Please fill out both sides!');
    try {
      const doc = createCardDoc(front.trim(), back.trim());
      const saved = await addCardToDb(doc);
      setCards((prev) => [...prev, saved]);
      setFront('');
      setBack('');
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
        <Text style={styles.title}>Hippocampus</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Front (Question)"
            value={front}
            onChangeText={setFront}
          />
          <TextInput
            style={styles.input}
            placeholder="Back (Answer)"
            value={back}
            onChangeText={setBack}
          />
          <Button title="Add Flashcard" onPress={handleAddCard} color="#2ecc71" />
        </View>

        <View style={styles.divider} />

        <Button
          title={syncing ? 'Syncing…' : 'Sync with CouchDB'}
          onPress={handleSync}
          disabled={syncing}
        />
        {syncing && <ActivityIndicator style={styles.syncSpinner} />}

        {loading ? (
          <ActivityIndicator style={styles.loader} />
        ) : (
          cards.map((item) => (
            <View key={item._id} style={styles.card}>
              <View style={styles.cardContent}>
                <Text style={styles.cardText}>
                  <Text style={styles.bold}>Q:</Text> {item.front}
                </Text>
                <Text style={styles.cardText}>
                  <Text style={styles.bold}>A:</Text> {item.back}
                </Text>
              </View>
              <Button
                title="Delete"
                onPress={() => handleDeleteCard(item._id)}
                color="#e74c3c"
              />
            </View>
          ))
        )}
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 10, paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  inputContainer: { marginBottom: 20, gap: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 20 },
  loader: { marginTop: 20 },
  syncSpinner: { marginTop: 8 },
  card: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardContent: { flex: 1 },
  cardText: { fontSize: 16, marginVertical: 2 },
  bold: { fontWeight: 'bold' },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
