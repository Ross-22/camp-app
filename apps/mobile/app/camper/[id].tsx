import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api, Id } from '@camp/convex';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { User, ArrowLeft, QrCode, Coffee, Sun, Moon, Minus, Plus } from 'lucide-react-native';
import { useColor } from '@/hooks/useColor';
import { useSettings } from '@/providers/settings-context';
import { KeyboardAvoidingView, Platform, ScrollView, Alert, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as Haptics from 'expo-haptics';

export default function CamperProfileScreen() {
  const { id } = useLocalSearchParams();
  const { settings } = useSettings();
  const [processing, setProcessing] = useState(false);
  const [pendingDeductions, setPendingDeductions] = useState(0);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const background = useColor('background');
  const foreground = useColor('foreground');
  const mutedColor = useColor('muted');
  const mutedForeground = useColor('mutedForeground');
  const green = useColor('green');
  const red = useColor('red');
  const card = useColor('card');

  const externalId = typeof id === 'string' ? id : id?.[0] ?? '';

  // Real-time camper data from Convex
  const camper = useQuery(api.campers.getByExternalId, { externalId });
  const loading = camper === undefined;

  // Get today's attendance status
  const todayAttendance = useQuery(
    api.campers.getTodayAttendance,
    camper ? { camperId: camper._id as Id<"campers"> } : "skip"
  );

  // Convex mutations
  const markMeal = useMutation(api.mutations.markMeal);
  const unmarkMeal = useMutation(api.mutations.unmarkMeal);
  const updateDeductions = useMutation(api.mutations.updateDeductions);

  const handleMeal = async (mealType: 'breakfast' | 'lunch' | 'dinner') => {
    if (!camper) return;
    
    setProcessing(true);
    try {
      await markMeal({
        camperId: camper._id as Id<'campers'>,
        mealType
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to mark meal');
    } finally {
      setProcessing(false);
    }
  };

  const handleUnmarkMeal = async (mealType: 'breakfast' | 'lunch' | 'dinner') => {
    if (!camper) return;
    
    setProcessing(true);
    try {
      await unmarkMeal({
        camperId: camper._id as Id<'campers'>,
        mealType
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to unmark meal');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeduction = (amount: number) => {
    setPendingDeductions(prev => Math.max(0, prev + amount));
  };

  const handleSubmitDeductions = async () => {
    if (!camper || pendingDeductions === 0) return;

    setProcessing(true);
    try {
      await updateDeductions({
        camperId: camper._id as Id<"campers">,
        amount: pendingDeductions,
      });
      setPendingDeductions(0);
      Alert.alert('Success', `Added ${pendingDeductions} deductions to ${camper.name}`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add deductions');
    } finally {
      setProcessing(false);
    }
  };


  if (loading) return <View style={{ flex: 1, padding: 24, backgroundColor: background }}><Text>Loading...</Text></View>;
  
  if (!camper) {
    Alert.alert('Error', 'Camper not found');
    router.back();
    return null;
  }

  const savedDeductions = camper.deductions ?? 0;

  const MealButton = ({ 
    mealType, 
    icon: IconComponent, 
    label 
  }: { 
    mealType: 'breakfast' | 'lunch' | 'dinner'; 
    icon: any; 
    label: string;
  }) => {
    const isMarked = todayAttendance?.meals?.[mealType] ?? false;
    
    return (
      <View style={{ gap: 8 }}>
        <Button 
          variant={isMarked ? "secondary" : "outline"}
          style={{ 
            height: 56,
            opacity: processing ? 0.6 : 1,
          }} 
          onPress={() => handleMeal(mealType)}
          disabled={processing || isMarked}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <Icon 
              name={IconComponent} 
              size={22} 
              color={isMarked ? green : foreground} 
            />
            <Text style={{ 
              fontWeight: '600', 
              fontSize: 16,
              color: isMarked ? green : foreground 
            }}>
              {label}
            </Text>
            {isMarked && <Text style={{ color: green, fontWeight: '600' }}>Done</Text>}
          </View>
        </Button>
        
        {/* Undo button - only show when meal is marked */}
        {isMarked && (
          <Button 
            variant="outline"
            size="sm"
            style={{ 
              height: 36,
              borderColor: red,
              opacity: processing ? 0.6 : 1,
            }} 
            onPress={() => handleUnmarkMeal(mealType)}
            disabled={processing}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name={Minus} size={16} color={red} />
              <Text style={{ color: red, fontSize: 14 }}>Undo {label}</Text>
            </View>
          </Button>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{ flex: 1, backgroundColor: background }}
    >
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 24, paddingBottom: 40, gap: 16 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <Button variant="outline" size="sm" onPress={() => router.replace('/')}>
            <Icon name={ArrowLeft} size={20} />
          </Button>
          <Text variant="heading">Camper Profile</Text>
        </View>

        {/* Camper Info Card */}
        <Card style={{ padding: 24, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ backgroundColor: mutedColor, padding: 12, borderRadius: 50 }}>
              <Icon name={User} size={32} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="heading">{camper.name}</Text>
              <Text variant="caption">{camper.team}</Text>
              {camper.church && <Text variant="caption" style={{ opacity: 0.7 }}>{camper.church}</Text>}
            </View>
          </View>
        </Card>

        {/* Meals Section */}
        <Card style={{ padding: 20, gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text variant="body" style={{ fontWeight: '600' }}>Mark Meal</Text>
            <Text variant="caption" style={{ color: mutedForeground }}>
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          
          <MealButton mealType="breakfast" icon={Coffee} label="Breakfast" />
          <MealButton mealType="lunch" icon={Sun} label="Lunch" />
          <MealButton mealType="dinner" icon={Moon} label="Dinner" />
        </Card>

        {/* Deductions Section */}
        <Card style={{ padding: 20, gap: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="body" style={{ fontWeight: '600' }}>Add Deductions</Text>
            {savedDeductions > 0 && (
              <Text variant="caption" style={{ color: red }}>Total: {savedDeductions}</Text>
            )}
          </View>
          
          <Text variant="caption" style={{ color: mutedForeground, textAlign: 'center' }}>
            Tap + or - to adjust by {settings.scoring.defaultPointIncrement} points
          </Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
            <Pressable 
              onPress={() => handleDeduction(-settings.scoring.defaultPointIncrement)}
              disabled={pendingDeductions <= 0}
              style={{ 
                backgroundColor: pendingDeductions > 0 ? card : mutedColor, 
                padding: 16, 
                borderRadius: 12,
                borderWidth: 1,
                borderColor: pendingDeductions > 0 ? mutedForeground : mutedColor,
                opacity: pendingDeductions > 0 ? 1 : 0.5,
              }}
            >
              <Icon name={Minus} size={24} color={foreground} />
            </Pressable>
            
            <View style={{ alignItems: 'center', minWidth: 80 }}>
              <Text style={{ fontSize: 48, fontWeight: 'bold', color: pendingDeductions > 0 ? red : foreground }}>
                {pendingDeductions}
              </Text>
            </View>
            
            <Pressable 
              onPress={() => handleDeduction(settings.scoring.defaultPointIncrement)}
              style={{ 
                backgroundColor: card, 
                padding: 16, 
                borderRadius: 12,
                borderWidth: 1,
                borderColor: red,
              }}
            >
              <Icon name={Plus} size={24} color={red} />
            </Pressable>
          </View>

          <Button 
            variant="outline"
            style={{ borderColor: red, opacity: pendingDeductions > 0 ? 1 : 0.5 }}
            onPress={handleSubmitDeductions}
            disabled={processing || pendingDeductions === 0}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name={Plus} size={18} color={red} />
              <Text style={{ color: red, fontWeight: '600' }}>Add {pendingDeductions} Deductions</Text>
            </View>
          </Button>
        </Card>

        {/* Scan Next Button */}
        <Button 
          variant="secondary" 
          onPress={() => router.replace('/scanner')} 
          style={{ height: 60, marginTop: 8 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name={QrCode} />
            <Text style={{ fontWeight: '700' }}>SCAN NEXT CAMPER</Text>
          </View>
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
