import { Stack } from 'expo-router';
import { useColor } from '@/hooks/useColor';
import { useColorScheme } from 'react-native';
import { isLiquidGlassAvailable } from 'expo-glass-effect';

export default function SettingsLayout() {
  const theme = useColorScheme();
  const text = useColor('text');
  const background = useColor('background');

  return (
    <Stack
      screenOptions={{
        headerTintColor: text,
        headerBlurEffect: isLiquidGlassAvailable()
          ? undefined
          : theme === 'dark'
            ? 'systemMaterialDark'
            : 'systemMaterialLight',
        headerStyle: {
          backgroundColor: isLiquidGlassAvailable()
            ? 'transparent'
            : background,
        },
      }}
    >
      <Stack.Screen
        name='index'
        options={{
          title: 'Settings',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
