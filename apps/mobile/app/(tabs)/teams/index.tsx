import React, { useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  Alert,
} from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@camp/convex';
import type { Doc } from '@camp/convex';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AvoidKeyboard } from '@/components/ui/avoid-keyboard';
import { useColor } from '@/hooks/useColor';
import { Trophy, Users, TrendingDown, Plus, Minus, Award } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TeamStatsScreen() {
  const [scoreToAdd, setScoreToAdd] = useState('10');
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<any>>(null);

  const background = useColor('background');
  const foreground = useColor('foreground');
  const mutedColor = useColor('muted');
  const mutedForeground = useColor('mutedForeground');
  const green = useColor('green');
  const red = useColor('red');
  const yellow = '#f59e0b';
  const blue = '#3b82f6';

  // Get team stats from Convex (real-time)
  const teamStats = useQuery(api.campers.getTeamStats) ?? [];

  // Mutation to add score to team
  const updateTeamScore = useMutation(api.mutations.updateTeamScore);

  const handleAddScore = async (teamName: string, amount: number) => {
    setProcessing(true);
    try {
      await updateTeamScore({
        teamName,
        amount,
      });
      Alert.alert('Success', `Added ${amount} points to ${teamName}!`);
      setSelectedTeam(null);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add score');
    } finally {
      setProcessing(false);
    }
  };

  const getRankColor = (index: number) => {
    switch (index) {
      case 0: return '#ffd700'; // Gold
      case 1: return '#c0c0c0'; // Silver
      case 2: return '#cd7f32'; // Bronze
      default: return mutedForeground;
    }
  };

  const getRankIcon = (index: number) => {
    if (index < 3) return Trophy;
    return Award;
  };

  const maxScore = Math.max(...teamStats.map((team: any) => team.netScore), 1);

  const scrollTeamIntoView = (teamName: string) => {
    const index = teamStats.findIndex((team: any) => team.name === teamName);
    if (index < 0) return;

    listRef.current?.scrollToIndex({
      index,
      animated: true,
      viewPosition: 0,
      viewOffset: 24,
    });
  };

  const renderTeamItem = ({ item, index }: { item: any; index: number }) => (
    <Card style={{ marginBottom: 12, padding: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12 }}>
        {/* Rank */}
        <View style={{ 
          backgroundColor: `${getRankColor(index)}20`, 
          padding: 12, 
          borderRadius: 25,
          minWidth: 50,
          alignItems: 'center',
        }}>
          <Icon name={getRankIcon(index)} size={24} color={getRankColor(index)} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: getRankColor(index), marginTop: 2 }}>
            #{index + 1}
          </Text>
        </View>

        {/* Team Info */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '700', fontSize: 18, color: foreground }}>{item.name}</Text>
          <View style={{ flexDirection: 'row', gap: 16, marginTop: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Icon name={Users} size={14} color={mutedForeground} />
              <Text variant="caption">{item.members} members</Text>
            </View>
          </View>
        </View>

        {/* Net Score */}
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: green }}>{item.netScore}</Text>
          <Text variant="caption">points</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={{ backgroundColor: mutedColor, height: 8, borderRadius: 4, marginBottom: 12 }}>
        <View 
          style={{ 
            backgroundColor: getRankColor(index), 
            height: '100%', 
            width: `${(item.netScore / maxScore) * 100}%`,
            borderRadius: 4,
            minWidth: item.netScore > 0 ? 8 : 0,
          }} 
        />
      </View>

      {/* Score Details */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: green, fontWeight: '600' }}>{item.totalScore}</Text>
          <Text variant="caption">Earned</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: red, fontWeight: '600' }}>{item.totalDeductions}</Text>
          <Text variant="caption">Deductions</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: foreground, fontWeight: '600' }}>{item.netScore}</Text>
          <Text variant="caption">Net Score</Text>
        </View>
      </View>

      {/* Add Score Section */}
      {selectedTeam === item.name ? (
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Input
                placeholder="Points to add..."
                keyboardType="number-pad"
                value={scoreToAdd}
                onChangeText={setScoreToAdd}
                onFocus={() => {
                  scrollTeamIntoView(item.name);
                  setTimeout(() => scrollTeamIntoView(item.name), 260);
                }}
              />
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button 
              variant="outline"
              style={{ flex: 1 }}
              onPress={() => setSelectedTeam(null)}
            >
              <Text>Cancel</Text>
            </Button>
            <Button 
              style={{ flex: 1, backgroundColor: green }}
              onPress={() => handleAddScore(item.name, parseInt(scoreToAdd) || 10)}
              disabled={processing}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon name={Plus} size={16} color="white" />
                <Text style={{ color: 'white', fontWeight: '600' }}>Add</Text>
              </View>
            </Button>
          </View>
        </View>
      ) : (
        <Pressable 
          style={{ 
            backgroundColor: blue + '15', 
            padding: 12, 
            borderRadius: 8, 
            alignItems: 'center',
            borderWidth: 1,
            borderColor: blue + '40',
          }}
          onPress={() => {
            setSelectedTeam(item.name);
            setTimeout(() => scrollTeamIntoView(item.name), 180);
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name={Plus} size={16} color={blue} />
            <Text style={{ color: blue, fontWeight: '600' }}>Add Points</Text>
          </View>
        </Pressable>
      )}
    </Card>
  );

  return (
    <View style={{ flex: 1, backgroundColor: background }}>
      {/* Header */}
      <View style={{ 
        paddingHorizontal: 20, 
        paddingTop: insets.top + 16,
        paddingBottom: 12,
      }}>
        <Text variant="heading" style={{ fontSize: 28 }}>Team Rankings</Text>
        <Text variant="caption">Real-time team performance</Text>
      </View>

      {teamStats.length > 0 ? (
        <FlatList
          ref={listRef}
          data={teamStats}
          keyExtractor={(item) => item.name}
          renderItem={renderTeamItem}
          keyboardShouldPersistTaps='handled'
          keyboardDismissMode='on-drag'
          onScrollToIndexFailed={(info) => {
            const fallbackOffset = Math.max(0, info.averageItemLength * info.index);
            listRef.current?.scrollToOffset({ offset: fallbackOffset, animated: true });
            setTimeout(() => {
              listRef.current?.scrollToIndex({
                index: info.index,
                animated: true,
                viewPosition: 0,
                viewOffset: 24,
              });
            }, 120);
          }}
          contentContainerStyle={{ 
            paddingHorizontal: 20, 
            paddingBottom: insets.bottom + 110,
          }}
          ListFooterComponent={<AvoidKeyboard offset={insets.bottom + 84} duration={120} />}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ 
            backgroundColor: mutedColor, 
            padding: 24, 
            borderRadius: 50, 
            marginBottom: 16 
          }}>
            <Icon name={Trophy} size={40} color={mutedForeground} />
          </View>
          <Text variant="heading" style={{ marginBottom: 8 }}>No Teams Yet</Text>
          <Text variant="caption" style={{ textAlign: 'center', paddingHorizontal: 40 }}>
            Team stats will appear here once campers are registered
          </Text>
        </View>
      )}
    </View>
  );
}
