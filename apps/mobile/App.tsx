import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SplashScreen } from './src/screens/SplashScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { ClientScreen } from './src/screens/ClientScreen';
import { VisitScreen } from './src/screens/VisitScreen';
import { PlanScreen } from './src/screens/PlanScreen';
import { VoiceScreen } from './src/screens/VoiceScreen';
import { ReferralGuardrailScreen } from './src/screens/ReferralGuardrailScreen';
import { ReferralsListScreen } from './src/screens/ReferralsListScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { TallyScreen } from './src/screens/TallyScreen';
import { SupervisorScreen } from './src/screens/SupervisorScreen';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Home: undefined;
  Register: undefined;
  Client: { clientId: string };
  Visit: { clientId: string };
  Plan: { clientId: string };
  Voice: { clientId: string };
  ReferralGuardrail: { clientId: string };
  ReferralsList: undefined;
  Notifications: undefined;
  Settings: undefined;
  Tally: undefined;
  Supervisor: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Client" component={ClientScreen} />
          <Stack.Screen name="Visit" component={VisitScreen} />
          <Stack.Screen name="Plan" component={PlanScreen} />
          <Stack.Screen name="Voice" component={VoiceScreen} />
          <Stack.Screen name="ReferralGuardrail" component={ReferralGuardrailScreen} />
          <Stack.Screen name="ReferralsList" component={ReferralsListScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Tally" component={TallyScreen} />
          <Stack.Screen name="Supervisor" component={SupervisorScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
