import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '@camp/convex';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { useColor } from '@/hooks/useColor';
import { User, ChevronRight, Users, Search as SearchIcon, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SearchScreen() {
  const [searchText, setSearchText] = useState('');
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const background = useColor('background');
  const foreground = useColor('foreground');
  const mutedColor = useColor('muted');
  const mutedForeground = useColor('mutedForeground');
  const card = useColor('card');

  // Get all campers from Convex (real-time)
  const campers = useQuery(api.campers.list) ?? [];

  // Filter campers based on search text
  const filteredCampers = useMemo(() => {
    if (!searchText.trim()) return [];
    
    const query = searchText.toLowerCase();
    return campers.filter((camper: any) =>
      camper.name.toLowerCase().includes(query) ||
      camper.team.toLowerCase().includes(query) ||
      camper.externalId?.toLowerCase().includes(query)
    );
  }, [searchText, campers]);

  const renderCamperItem = ({ item }: { item: any }) => (
    <Pressable onPress={() => router.push({ pathname: '/camper/[id]', params: { id: item.externalId } })}>
      <Card style={{ marginBottom: 12, padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ backgroundColor: mutedColor, padding: 10, borderRadius: 25 }}>
              <Icon name={User} size={20} color={foreground} />
            </View>
            <View>
              <Text style={{ fontWeight: '700', fontSize: 16, color: foreground }}>{item.name}</Text>
              <Text variant="caption">{item.team}</Text>
            </View>
          </View>
          
          <Icon name={ChevronRight} size={18} color={mutedForeground} />
        </View>
      </Card>
    </Pressable>
  );

  const EmptyState = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 0 }}>
      {!searchText.trim() ? (
        <>
          <View style={{ 
            backgroundColor: mutedColor, 
            padding: 24, 
            borderRadius: 50, 
            marginBottom: 16 
          }}>
            <Icon name={SearchIcon} size={40} color={mutedForeground} />
          </View>
          <Text variant="heading" style={{ marginBottom: 8 }}>Search Campers</Text>
          <Text variant="caption" style={{ textAlign: 'center', paddingHorizontal: 40 }}>
            Type a name, team, or ID in the search bar above to find campers
          </Text>
        </>
      ) : (
        <>
          <View style={{ 
            backgroundColor: mutedColor, 
            padding: 24, 
            borderRadius: 50, 
            marginBottom: 16 
          }}>
            <Icon name={Users} size={40} color={mutedForeground} />
          </View>
          <Text variant="heading" style={{ marginBottom: 8 }}>No Results</Text>
          <Text variant="caption" style={{ textAlign: 'center', paddingHorizontal: 40 }}>
            No campers found matching "{searchText}"
          </Text>
        </>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: background }}>
      {/* Search Bar */}
      <View style={{ 
        paddingHorizontal: 20, 
        paddingTop: insets.top + 16,
        paddingBottom: 12,
      }}>
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          backgroundColor: card,
          borderRadius: 12, 
          paddingHorizontal: 14,
          height: 50,
          borderWidth: 1,
          borderColor: mutedColor,
        }}>
          <Icon name={SearchIcon} size={20} color={mutedForeground} />
          <TextInput
            placeholder="Search by name, team, or ID..."
            placeholderTextColor={mutedForeground}
            value={searchText}
            onChangeText={setSearchText}
            style={{ 
              flex: 1, 
              marginLeft: 10, 
              fontSize: 16,
              color: foreground,
              height: '100%',
            }}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
          {searchText.length > 0 && (
            <Pressable onPress={() => setSearchText('')} style={{ padding: 4 }}>
              <Icon name={X} size={18} color={mutedForeground} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Results count */}
      {searchText.trim() && filteredCampers.length > 0 && (
        <View style={{ paddingHorizontal: 24, paddingBottom: 8 }}>
          <Text variant="caption" style={{ color: mutedForeground }}>
            {filteredCampers.length} result{filteredCampers.length !== 1 ? 's' : ''} for "{searchText}"
          </Text>
        </View>
      )}

      <FlatList
        data={filteredCampers}
        keyExtractor={(item) => item._id}
        renderItem={renderCamperItem}
        contentContainerStyle={{ 
          paddingHorizontal: 20, 
          paddingTop: 8,
          paddingBottom: 40,
          flexGrow: 1,
        }}
        ListEmptyComponent={EmptyState}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}
