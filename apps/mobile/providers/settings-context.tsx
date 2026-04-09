import React, {
  createContext,
  ReactNode,
  useContext,
  useState,
  useEffect,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface ScoringSettings {
  defaultPointIncrement: number;
  penaltyAmounts: number[];
}

interface DataExportSettings {
  exportFormat: "csv" | "json" | "xlsx";
  includeAttendanceHistory: boolean;
  includeTeamHistory: boolean;
}

interface Settings {
  scoring: ScoringSettings;
  dataExport: DataExportSettings;
}

const defaultSettings: Settings = {
  scoring: {
    defaultPointIncrement: 10,
    penaltyAmounts: [5, 10, 25, 50],
  },
  dataExport: {
    exportFormat: "csv",
    includeAttendanceHistory: true,
    includeTeamHistory: true,
  },
};

interface SettingsContextType {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  updateNestedSetting: <K extends keyof Settings, N extends keyof Settings[K]>(
    key: K,
    nestedKey: N,
    value: Settings[K][N],
  ) => void;
  resetSettings: () => void;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

const SETTINGS_STORAGE_KEY = "@camp_app_settings";

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from storage on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: Settings) => {
    try {
      await AsyncStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify(newSettings),
      );
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  };

  const updateSetting = <K extends keyof Settings>(
    key: K,
    value: Settings[K],
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const updateNestedSetting = <
    K extends keyof Settings,
    N extends keyof Settings[K],
  >(
    key: K,
    nestedKey: N,
    value: Settings[K][N],
  ) => {
    const newSettings = {
      ...settings,
      [key]: {
        ...settings[key],
        [nestedKey]: value,
      },
    };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    saveSettings(defaultSettings);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSetting,
        updateNestedSetting,
        resetSettings,
        isLoading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
