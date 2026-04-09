import React from 'react';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '@camp/convex';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { QrCode, Users, Coffee, Sun, Moon } from 'lucide-react-native';
import { useColor } from '@/hooks/useColor';
import { Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const background = useColor('background');
  const cardColor = useColor('card');
  const green = useColor('green');
  const insets = useSafeAreaInsets();

  // Real-time stats from Convex (automatically updates)
  const rawStats = useQuery(api.campers.getStats);
  const stats = {
    totalCampers: rawStats?.totalCampers ?? 0,
    meals: {
      breakfast: rawStats?.meals?.breakfast ?? 0,
      lunch: rawStats?.meals?.lunch ?? 0,
      dinner: rawStats?.meals?.dinner ?? 0,
    }
  };

  const getMealStatus = (served: number, total: number) => {
    if (total === 0) return 'neutral';
    if (served === total) return 'complete';
    if (served > 0) return 'partial';
    return 'none';
  };

  const getMealColor = (status: string) => {
    switch (status) {
      case 'complete': return green;
      case 'partial': return '#f59e0b';
      case 'none': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: background }}>
      <ScrollView 
        contentContainerStyle={{ 
          paddingHorizontal: 24, 
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 100, // Extra space for bottom nav
          gap: 16 
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ marginBottom: 12 }}>
          <Text variant="heading" style={{ fontSize: 28 }}>Camp Manager</Text>
          <Text variant="caption">Camper & Meal Tracking</Text>
        </View>

        {/* Total Campers */}
        <Pressable onPress={() => router.push('/camper/list')}>
          <Card style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View style={{ backgroundColor: '#3b82f620', padding: 12, borderRadius: 12 }}>
              <Icon name={Users} color="#3b82f6" size={28} />
            </View>
            <View>
              <Text variant="heading" style={{ fontSize: 24 }}>{stats.totalCampers}</Text>
              <Text variant="caption">Registered Campers</Text>
            </View>
          </Card>
        </Pressable>

        {/* Meals Section */}
        <View style={{ gap: 8 }}>
          <Text variant="caption" style={{ marginLeft: 4, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
            Today's Meals
          </Text>
          
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {/* Breakfast */}
            <Pressable style={{ flex: 1 }} onPress={() => router.push('/camper/list')}>
              <Card style={{ padding: 16, alignItems: 'center', gap: 8 }}>
                <View style={{ 
                  backgroundColor: `${getMealColor(getMealStatus(stats.meals.breakfast, stats.totalCampers))}20`, 
                  padding: 10, 
                  borderRadius: 25 
                }}>
                  <Icon name={Coffee} color={getMealColor(getMealStatus(stats.meals.breakfast, stats.totalCampers))} size={24} />
                </View>
                <Text variant="heading" style={{ fontSize: 18, color: getMealColor(getMealStatus(stats.meals.breakfast, stats.totalCampers)) }}>
                  {stats.meals.breakfast}/{stats.totalCampers}
                </Text>
                <Text variant="caption" style={{ fontSize: 11 }}>Breakfast</Text>
              </Card>
            </Pressable>

            {/* Lunch */}
            <Pressable style={{ flex: 1 }} onPress={() => router.push('/camper/list')}>
              <Card style={{ padding: 16, alignItems: 'center', gap: 8 }}>
                <View style={{ 
                  backgroundColor: `${getMealColor(getMealStatus(stats.meals.lunch, stats.totalCampers))}20`, 
                  padding: 10, 
                  borderRadius: 25 
                }}>
                  <Icon name={Sun} color={getMealColor(getMealStatus(stats.meals.lunch, stats.totalCampers))} size={24} />
                </View>
                <Text variant="heading" style={{ fontSize: 18, color: getMealColor(getMealStatus(stats.meals.lunch, stats.totalCampers)) }}>
                  {stats.meals.lunch}/{stats.totalCampers}
                </Text>
                <Text variant="caption" style={{ fontSize: 11 }}>Lunch</Text>
              </Card>
            </Pressable>

            {/* Dinner */}
            <Pressable style={{ flex: 1 }} onPress={() => router.push('/camper/list')}>
              <Card style={{ padding: 16, alignItems: 'center', gap: 8 }}>
                <View style={{ 
                  backgroundColor: `${getMealColor(getMealStatus(stats.meals.dinner, stats.totalCampers))}20`, 
                  padding: 10, 
                  borderRadius: 25 
                }}>
                  <Icon name={Moon} color={getMealColor(getMealStatus(stats.meals.dinner, stats.totalCampers))} size={24} />
                </View>
                <Text variant="heading" style={{ fontSize: 18, color: getMealColor(getMealStatus(stats.meals.dinner, stats.totalCampers)) }}>
                  {stats.meals.dinner}/{stats.totalCampers}
                </Text>
                <Text variant="caption" style={{ fontSize: 11 }}>Dinner</Text>
              </Card>
            </Pressable>
          </View>
        </View>

        {/* Scan Card */}
        <Card style={{ padding: 24, alignItems: 'center', gap: 16, backgroundColor: cardColor, marginTop: 12 }}>
          <View style={{ alignItems: 'center' }}>
            <Text variant="heading" style={{ fontSize: 24 }}>Ready to Scan?</Text>
            <Text variant="caption" style={{ textAlign: 'center', marginTop: 4 }}>
              Scan a camper's ID card to check them in or mark their meals.
            </Text>
          </View>
          
          <Button
            style={{ width: '100%', height: 64, marginTop: 8 }}
            onPress={() => router.push('/scanner')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Icon name={QrCode} color="white" size={28} />
              <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>SCAN CAMPER ID</Text>
            </View>
          </Button>
        </Card>
      </ScrollView>
    </View>
  );
}
