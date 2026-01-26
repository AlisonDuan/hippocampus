import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Review' }} />
      <Stack.Screen name="practice" options={{ title: 'Practice' }} />
    </Stack>
  );
}
