import React, { useState } from 'react';
import { Button, FlatList, StyleSheet, Text, View } from 'react-native';

// REPLACE THIS with your computer's local IP address!
const BASE_URL = "http://192.168.0.241:3000"; 

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export default function App() {
  const [cards, setCards] = useState<Flashcard[]>([]);

  const fetchCards = async () => {
    try {
      const response = await fetch(`${BASE_URL}/cards`);
      const data = await response.json();
      setCards(data);
    } catch (error) {
      console.error("Fetch failed:", error);
      alert("Make sure your server is running and IP is correct!");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Skeleton Flashcard App</Text>
      <Button title="Sync from Computer" onPress={fetchCards} />
      
      <FlatList
        data={cards}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text>{item.front} → {item.back}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50, paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  card: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#ccc' },
});
