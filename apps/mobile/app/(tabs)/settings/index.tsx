import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useColor } from '@/hooks/useColor';
import { useSettings } from '@/providers/settings-context';
import { useQuery } from 'convex/react';
import { api } from '@camp/convex';
import type { Doc } from '@camp/convex';
import { 
  RotateCcw,
  Clock,
  Trophy,
  Download,
  Edit2,
  Check,
  X,
} from 'lucide-react-native';
import { 
  Alert, 
  Platform,
  Switch,
  Modal, 
  Pressable, 
  ScrollView as RNScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { File, Paths } from 'expo-file-system';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import XLSX from 'xlsx';

export default function SettingsScreen() {
  const { settings, updateSetting, updateNestedSetting, resetSettings, isLoading } = useSettings();
  const [editingScoring, setEditingScoring] = useState<string | null>(null);
  const [scoringValue, setScoringValue] = useState('');
  const [exporting, setExporting] = useState(false);
  
  // Data queries for export
  const campers = useQuery(api.campers.list) ?? [];
  const teamStats = useQuery(api.campers.getTeamStats) ?? [];
  const mealHistory = useQuery((api as any).campers.getMealHistory) ?? [];
  const primary = useColor('primary');
  const mutedForeground = useColor('mutedForeground');
  const background = useColor('background');
  const green = useColor('green');
  const red = useColor('red');
  const insets = useSafeAreaInsets();

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: resetSettings },
      ]
    );
  };

  const handleScoringEdit = (key: string, currentValue: number) => {
    setEditingScoring(key);
    setScoringValue(currentValue.toString());
  };

  const handleScoringSave = () => {
    if (editingScoring && scoringValue) {
      const value = parseInt(scoringValue);
      if (!isNaN(value) && value > 0) {
        updateNestedSetting('scoring', editingScoring as any, value);
        setEditingScoring(null);
        setScoringValue('');
      } else {
        Alert.alert('Invalid Value', 'Please enter a valid positive number');
      }
    }
  };

  const handleScoringCancel = () => {
    setEditingScoring(null);
    setScoringValue('');
  };

  const getMealSummaryRows = () => {
    const mealSummaryByCamper = new Map<
      string,
      {
        camperName: string;
        team: string;
        breakfastCount: number;
        lunchCount: number;
        dinnerCount: number;
        totalMeals: number;
        lastMealTimestamp: number;
      }
    >();

    mealHistory.forEach((meal: any) => {
      const camperId = String(meal.camperId);
      const current = mealSummaryByCamper.get(camperId) ?? {
        camperName: meal.camperName,
        team: meal.team || '',
        breakfastCount: 0,
        lunchCount: 0,
        dinnerCount: 0,
        totalMeals: 0,
        lastMealTimestamp: 0,
      };

      if (meal.mealType === 'breakfast') current.breakfastCount += 1;
      if (meal.mealType === 'lunch') current.lunchCount += 1;
      if (meal.mealType === 'dinner') current.dinnerCount += 1;
      current.totalMeals += 1;
      current.lastMealTimestamp = Math.max(
        current.lastMealTimestamp,
        meal.timestamp || 0,
      );

      mealSummaryByCamper.set(camperId, current);
    });

    return Array.from(mealSummaryByCamper.values()).sort((a, b) =>
      a.camperName.localeCompare(b.camperName),
    );
  };

  const handleExportData = async () => {
    if (
      campers.length === 0 &&
      teamStats.length === 0 &&
      mealHistory.length === 0
    ) {
      Alert.alert('No Data', 'There is no data to export yet.');
      return;
    }

    setExporting(true);
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const selectedFormat = settings.dataExport.exportFormat;
      const formatExt =
        selectedFormat === 'csv'
          ? 'csv'
          : selectedFormat === 'xlsx'
            ? 'xlsx'
            : 'json';
      const mimeType =
        formatExt === 'csv'
          ? 'text/csv'
          : formatExt === 'xlsx'
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'application/json';

      if (selectedFormat === 'xlsx') {
        const workbook = XLSX.utils.book_new();

        if (campers.length > 0) {
          const camperRows = campers.map((camper: Doc<"campers">) => ({
            Name: camper.name,
            Team: camper.team,
            Church: camper.church || '',
            Gender: camper.gender || '',
            Age: camper.age ?? '',
            'Food Allergies': camper.foodAllergies || '',
            Deductions: camper.deductions || 0,
            'External ID': camper.externalId,
          }));
          const campersSheet = XLSX.utils.json_to_sheet(camperRows);
          XLSX.utils.book_append_sheet(workbook, campersSheet, 'Campers');
        }

        if (teamStats.length > 0 && settings.dataExport.includeTeamHistory) {
          const teamRows = teamStats.map((team: any) => ({
            'Team Name': team.name,
            Members: team.members,
            'Total Score': team.totalScore,
            'Total Deductions': team.totalDeductions,
            'Net Score': team.netScore,
          }));
          const teamSheet = XLSX.utils.json_to_sheet(teamRows);
          XLSX.utils.book_append_sheet(workbook, teamSheet, 'Team Stats');
        }

        if (mealHistory.length > 0 && settings.dataExport.includeAttendanceHistory) {
          const mealRows = getMealSummaryRows().map((row) => ({
            'Camper Name': row.camperName,
            Team: row.team,
            'Breakfast Count': row.breakfastCount,
            'Lunch Count': row.lunchCount,
            'Dinner Count': row.dinnerCount,
            'Total Meals': row.totalMeals,
            'Last Meal Timestamp': row.lastMealTimestamp
              ? new Date(row.lastMealTimestamp).toISOString()
              : '',
          }));
          const mealSheet = XLSX.utils.json_to_sheet(mealRows);
          XLSX.utils.book_append_sheet(workbook, mealSheet, 'Meal History');
        }

        const workbookBase64 = XLSX.write(workbook, {
          type: 'base64',
          bookType: 'xlsx',
        });
        const fileName = `camp-data-${timestamp}.${formatExt}`;

        if (Platform.OS === 'android') {
          const permissions = await FileSystemLegacy.StorageAccessFramework.requestDirectoryPermissionsAsync();

          if (!permissions.granted || !permissions.directoryUri) {
            Alert.alert('Export Cancelled', 'No folder selected.');
            return;
          }

          const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
          const fileUri = await FileSystemLegacy.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            fileNameWithoutExt,
            mimeType,
          );

          await FileSystemLegacy.StorageAccessFramework.writeAsStringAsync(
            fileUri,
            workbookBase64,
            { encoding: FileSystemLegacy.EncodingType.Base64 },
          );

          Alert.alert('Export Complete', `Saved ${fileName} to your selected folder.`);
          return;
        }

        const file = new File(Paths.document, fileName);
        await FileSystemLegacy.writeAsStringAsync(file.uri, workbookBase64, {
          encoding: FileSystemLegacy.EncodingType.Base64,
        });

        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(file.uri, {
            mimeType,
            dialogTitle: 'Export Camp Data',
          });
          Alert.alert('Export Complete', `Successfully exported data as ${fileName}`);
        } else {
          Alert.alert('Export Complete', `Data saved as ${fileName} in documents folder`);
        }
        return;
      }
      
      let fileContent = '';
      if (selectedFormat === 'csv') {
        fileContent = generateCSV();
      } else {
        fileContent = generateJSON();
      }

      const fileName = `camp-data-${timestamp}.${formatExt}`;
      
      if (Platform.OS === 'android') {
        const permissions = await FileSystemLegacy.StorageAccessFramework.requestDirectoryPermissionsAsync();

        if (!permissions.granted || !permissions.directoryUri) {
          Alert.alert('Export Cancelled', 'No folder selected.');
          return;
        }

        const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
        const fileUri = await FileSystemLegacy.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          fileNameWithoutExt,
          mimeType,
        );

        await FileSystemLegacy.StorageAccessFramework.writeAsStringAsync(
          fileUri,
          fileContent,
        );

        Alert.alert('Export Complete', `Saved ${fileName} to your selected folder.`);
        return;
      }

      const file = new File(Paths.document, fileName);
      await file.write(fileContent);

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(file.uri, {
          mimeType,
          dialogTitle: 'Export Camp Data',
        });
        Alert.alert('Export Complete', `Successfully exported data as ${fileName}`);
      } else {
        Alert.alert('Export Complete', `Data saved as ${fileName} in documents folder`);
      }
    } catch (error: any) {
      Alert.alert('Export Failed', error.message || 'Could not export data');
    } finally {
      setExporting(false);
    }
  };

  const generateCSV = (): string => {
    let csv = '';

    // Campers data
    if (campers.length > 0) {
      csv += 'CAMPERS\n';
      csv += 'Name,Team,Church,Gender,Age,Food Allergies,Deductions,External ID\n';
      campers.forEach((camper: Doc<"campers">) => {
        csv += `"${camper.name}","${camper.team}","${camper.church || ''}","${camper.gender || ''}",${camper.age ?? ''},"${camper.foodAllergies || ''}",${camper.deductions || 0},"${camper.externalId}"\n`;
      });
      csv += '\n';
    }

    // Team stats data
    if (teamStats.length > 0 && settings.dataExport.includeTeamHistory) {
      csv += 'TEAM STATISTICS\n';
      csv += 'Team Name,Members,Total Score,Total Deductions,Net Score\n';
      teamStats.forEach((team: any) => {
        csv += `"${team.name}",${team.members},${team.totalScore},${team.totalDeductions},${team.netScore}\n`;
      });
      csv += '\n';
    }

    if (mealHistory.length > 0 && settings.dataExport.includeAttendanceHistory) {
      const mealSummaryRows = getMealSummaryRows();

      csv += 'MEAL HISTORY SUMMARY\n';
      csv +=
        'Camper Name,Team,Breakfast Count,Lunch Count,Dinner Count,Total Meals,Last Meal Timestamp\n';
      mealSummaryRows.forEach((row) => {
        const lastMealIso = row.lastMealTimestamp
          ? new Date(row.lastMealTimestamp).toISOString()
          : '';
        csv += `"${row.camperName}","${row.team}",${row.breakfastCount},${row.lunchCount},${row.dinnerCount},${row.totalMeals},"${lastMealIso}"\n`;
      });
    }

    return csv;
  };

  const generateJSON = (): string => {
    const exportData: any = {
      exportDate: new Date().toISOString(),
      settings: {
        scoring: settings.scoring,
      },
    };

    if (campers.length > 0) {
      exportData.campers = campers.map((camper: Doc<"campers">) => ({
        name: camper.name,
        team: camper.team,
        church: camper.church,
        deductions: camper.deductions || 0,
        externalId: camper.externalId,
        creationTime: camper._creationTime,
      }));
    }

    if (teamStats.length > 0 && settings.dataExport.includeTeamHistory) {
      exportData.teamStats = teamStats;
    }

    if (mealHistory.length > 0 && settings.dataExport.includeAttendanceHistory) {
      exportData.mealHistory = mealHistory;
    }

    return JSON.stringify(exportData, null, 2);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: background }}>
        <Text>Loading settings...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: background }}>
      {/* Header */}
      <View style={{ 
        paddingHorizontal: 20, 
        paddingTop: insets.top + 16,
        paddingBottom: 12,
      }}>
        <Text variant="heading" style={{ fontSize: 28 }}>Settings</Text>
        <Text variant="caption">App preferences and configuration</Text>
      </View>

      <RNScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 100,
        }}
      >
      
      {/* Appearance Section */}
      <View style={{ marginBottom: 24 }}>
        <Text variant="caption" style={{ marginLeft: 4, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
          Appearance
        </Text>
        <Card style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontWeight: '500' }}>Theme</Text>
            <ModeToggle />
          </View>
        </Card>
      </View>

      {/* Deductions Section */}
      <View style={{ gap: 12 }}>
        <Text variant="caption" style={{ marginLeft: 4, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
          Deductions Settings
        </Text>
        
        <Card style={{ padding: 16, gap: 12 }}>
          <TouchableOpacity 
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 4 }}
            onPress={() => handleScoringEdit('defaultPointIncrement', settings.scoring.defaultPointIncrement)}
          >
            <Icon name={Trophy} size={20} color={primary} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '500' }}>Deduction Per Action</Text>
              <Text variant="caption">{settings.scoring.defaultPointIncrement} points per deduction</Text>
            </View>
            <Icon name={Edit2} size={16} color={mutedForeground} />
          </TouchableOpacity>
        </Card>
      </View>

      {/* Data Export Section */}
      <View style={{ gap: 12 }}>
        <Text variant="caption" style={{ marginLeft: 4, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
          Data Management
        </Text>
        
        <Card style={{ padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 4 }}>
            <Icon name={Download} size={20} color={primary} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '500' }}>Export Format</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                <Pressable 
                  style={{ 
                    backgroundColor: settings.dataExport.exportFormat === 'csv' ? primary + '20' : 'transparent',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: settings.dataExport.exportFormat === 'csv' ? primary : mutedForeground,
                  }}
                  onPress={() => updateNestedSetting('dataExport', 'exportFormat', 'csv')}
                >
                  <Text style={{ 
                    fontSize: 12, 
                    color: settings.dataExport.exportFormat === 'csv' ? primary : mutedForeground 
                  }}>CSV</Text>
                </Pressable>
                <Pressable 
                  style={{ 
                    backgroundColor: settings.dataExport.exportFormat === 'json' ? primary + '20' : 'transparent',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: settings.dataExport.exportFormat === 'json' ? primary : mutedForeground,
                  }}
                  onPress={() => updateNestedSetting('dataExport', 'exportFormat', 'json')}
                >
                  <Text style={{ 
                    fontSize: 12, 
                    color: settings.dataExport.exportFormat === 'json' ? primary : mutedForeground 
                  }}>JSON</Text>
                </Pressable>
                <Pressable 
                  style={{ 
                    backgroundColor: settings.dataExport.exportFormat === 'xlsx' ? primary + '20' : 'transparent',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: settings.dataExport.exportFormat === 'xlsx' ? primary : mutedForeground,
                  }}
                  onPress={() => updateNestedSetting('dataExport', 'exportFormat', 'xlsx')}
                >
                  <Text style={{ 
                    fontSize: 12, 
                    color: settings.dataExport.exportFormat === 'xlsx' ? primary : mutedForeground 
                  }}>XLSX</Text>
                </Pressable>
              </View>
            </View>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 4 }}>
            <Icon name={Download} size={20} color={primary} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '500' }}>Include Meal History</Text>
              <Text variant="caption">Export all meal records</Text>
            </View>
            <Switch
              value={settings.dataExport.includeAttendanceHistory}
              onValueChange={(value) => updateNestedSetting('dataExport', 'includeAttendanceHistory', value)}
              trackColor={{ false: mutedForeground, true: green }}
            />
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 4 }}>
            <Icon name={Download} size={20} color={primary} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '500' }}>Include Team History</Text>
              <Text variant="caption">Export scoring and ranking data</Text>
            </View>
            <Switch
              value={settings.dataExport.includeTeamHistory}
              onValueChange={(value) => updateNestedSetting('dataExport', 'includeTeamHistory', value)}
              trackColor={{ false: mutedForeground, true: green }}
            />
          </View>
          
          <Button 
            variant="outline" 
            style={{ borderColor: primary }}
            onPress={handleExportData}
            disabled={exporting}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name={Download} size={18} color={primary} />
              <Text style={{ color: primary, fontWeight: '600' }}>
                {exporting ? 'Exporting...' : 'Export Camp Data'}
              </Text>
            </View>
          </Button>
        </Card>
      </View>

      {/* Reset Section */}
      <View style={{ gap: 12, marginTop: 8 }}>
        <Button 
          variant="outline" 
          onPress={handleResetSettings}
          style={{ borderColor: red }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name={RotateCcw} size={18} color={red} />
            <Text style={{ color: red, fontWeight: '600' }}>Reset to Defaults</Text>
          </View>
        </Button>
      </View>

      {/* App Info */}
      <View style={{ alignItems: 'center', marginTop: 16 }}>
        <Text variant="caption" style={{ opacity: 0.5 }}>Camp Manager v1.0.0</Text>
        <Text variant="caption" style={{ opacity: 0.5 }}>Developed by Kadmiel Ross B. Baino</Text>
        <Text variant="caption" style={{ opacity: 0.5 }}>For GBC - Legazpi ❤️ © 2026</Text>
      </View>
    </RNScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editingScoring !== null}
        transparent
        animationType="slide"
      >
        <View style={{ 
          flex: 1, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          justifyContent: 'center', 
          alignItems: 'center',
          paddingHorizontal: 20,
        }}>
          <Card style={{ width: '100%', maxWidth: 400, padding: 24 }}>
            <Text style={{ fontWeight: '600', fontSize: 18, marginBottom: 16 }}>
              Edit Deduction Value
            </Text>
            
            <Input
              placeholder="Enter number"
              value={scoringValue}
              onChangeText={setScoringValue}
              keyboardType="number-pad"
            />
            
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <Button 
                variant="outline" 
                style={{ flex: 1 }}
                onPress={handleScoringCancel}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Icon name={X} size={16} color={mutedForeground} />
                  <Text>Cancel</Text>
                </View>
              </Button>
              
              <Button 
                style={{ flex: 1, backgroundColor: green }}
                onPress={handleScoringSave}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Icon name={Check} size={16} color="white" />
                  <Text style={{ color: 'white', fontWeight: '600' }}>Save</Text>
                </View>
              </Button>
            </View>
          </Card>
        </View>
      </Modal>
    </View>
  );
}
