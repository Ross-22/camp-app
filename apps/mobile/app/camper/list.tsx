import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '@camp/convex';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, User, ChevronRight } from 'lucide-react-native';
import { useColor } from '@/hooks/useColor';
import { FlatList, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CamperListScreen() {
  const [filteredCampers, setFilteredCampers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const background = useColor('background');
  const foreground = useColor('foreground');
  const mutedColor = useColor('muted');
  const green = useColor('green');

  // Real-time camper list from Convex (automatically updates)
  const campers = useQuery(api.campers.list) ?? [];
  const loading = campers === undefined;

  useEffect(() => {
    if (!campers) return;
    
    // If no search term, show all campers
    if (!search.trim()) {
      setFilteredCampers(campers);
      return;
    }
    
    // Filter campers based on search term
    const filtered = campers.filter((c: any) => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.team.toLowerCase().includes(search.toLowerCase()) ||
      (c.church && c.church.toLowerCase().includes(search.toLowerCase()))
    );
    setFilteredCampers(filtered);
  }, [search, campers]);

  const renderItem = ({ item }: { item: any }) => (
    <Pressable onPress={() => router.push({ pathname: '/camper/[id]', params: { id: item.externalId } })}>
      <Card style={{ marginBottom: 12, padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
          {/* Avatar */}
          <View style={{ backgroundColor: mutedColor, padding: 8, borderRadius: 25 }}>
            <Icon name={User} size={20} color={foreground} />
          </View>
          
          {/* Content area - takes available space */}
          <View style={{ flex: 1, minWidth: 0 }}>
            {/* Camper name and team */}
            <Text style={{ fontWeight: '700', fontSize: 16, color: foreground }} numberOfLines={1}>
              {item.name}
            </Text>
            <Text variant="caption" numberOfLines={1}>{item.team}</Text>
            
            {/* Church name - full width below name/team */}
            <View style={{ marginTop: 4 }}>
              <Text 
                style={{ fontSize: 12, color: foreground, opacity: 0.7 }} 
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.church || 'No church specified'}
              </Text>
            </View>
          </View>
          
          {/* Arrow icon - fixed width and centered */}
          <View style={{ 
            justifyContent: 'center', 
            alignItems: 'center', 
            minWidth: 24,
            alignSelf: 'center'
          }}>
            <Icon name={ChevronRight} size={18} color={mutedColor} />
          </View>
        </View>
      </Card>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: background }}>
      <View style={{ paddingHorizontal: 24, paddingTop: insets.top + 16, paddingBottom: 16, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Button variant="outline" size="sm" onPress={() => router.back()}>
            <Icon name={ArrowLeft} size={20} />
          </Button>
          <Text variant="heading">All Campers</Text>
        </View>

        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          backgroundColor: mutedColor, 
          borderRadius: 12, 
          paddingHorizontal: 12,
          height: 44 
        }}>
          <Icon name={Search} size={18} style={{ opacity: 0.5 }} />
          <Input
            placeholder="Search name, team, or church..."
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <FlatList
        data={filteredCampers}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Text style={{ opacity: 0.5 }}>{loading ? 'Loading campers...' : 'No campers found.'}</Text>
          </View>
        }
      />
    </View>
  );
}
