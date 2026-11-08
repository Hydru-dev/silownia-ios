import React, { useEffect } from 'react';
import { PermissionsAndroid, Platform, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppBottomBar } from './src/ui/components/CommonUi';
import { DietScreen } from './src/ui/screens/DietScreen';
import { HealthScreen } from './src/ui/screens/HealthScreen';
import { ProfileScreen } from './src/ui/screens/ProfileScreen';
import { ProgressScreen } from './src/ui/screens/ProgressScreen';
import { RecipesScreen } from './src/ui/screens/RecipesScreen';
import { TrainingScreen } from './src/ui/screens/TrainingScreen';
import { AppTheme, SilowniaTheme, useAppTheme } from './src/ui/theme/Theme';
import {
  AppTab,
  JournalViewModelProvider,
  useJournalViewModel,
} from './src/viewmodel/JournalViewModel';

const MainContent: React.FC = () => {
  const viewModel = useJournalViewModel();
  const colors = AppTheme.useColors();
  const { isDark } = useAppTheme();
  const { selectedTab } = viewModel;

  useEffect(() => {
    const checkActivityRecognitionPermission = async () => {
      if (Platform.OS === 'android' && Platform.Version >= 29) {
        try {
          const perm = PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION;
          if (perm) {
            const hasPerm = await PermissionsAndroid.check(perm);
            if (!hasPerm) {
              const status = await PermissionsAndroid.request(perm);
              if (status === PermissionsAndroid.RESULTS.GRANTED) {
                viewModel.startStepSensor();
              }
            }
          }
        } catch {
          // Ignore permission request errors
        }
      }
    };
    checkActivityRecognitionPermission();
  }, [viewModel]);

  const renderScreen = () => {
    switch (selectedTab) {
      case AppTab.DIET:
        return <DietScreen viewModel={viewModel} />;
      case AppTab.RECIPES:
        return <RecipesScreen viewModel={viewModel} />;
      case AppTab.TRAINING:
        return <TrainingScreen viewModel={viewModel} />;
      case AppTab.HEALTH:
        return <HealthScreen viewModel={viewModel} />;
      case AppTab.PROGRESS:
        return <ProgressScreen viewModel={viewModel} />;
      case AppTab.PROFILE:
        return <ProfileScreen viewModel={viewModel} />;
    }
  };

  return (
    <View style={[styles.scaffold, { backgroundColor: colors.bg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.content}>{renderScreen()}</View>
      <AppBottomBar
        currentTab={selectedTab}
        onTabSelected={(tab) => viewModel.selectTab(tab)}
      />
    </View>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <SilowniaTheme>
        <JournalViewModelProvider>
          <MainContent />
        </JournalViewModelProvider>
      </SilowniaTheme>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  scaffold: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
