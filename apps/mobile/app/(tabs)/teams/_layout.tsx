import { Stack } from 'expo-router';

export default function TeamsLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Team Stats',
          headerShown: false,
        }} 
      />
    </Stack>
  );
}