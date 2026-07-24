import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PriorityListScreen } from './src/screens/PriorityListScreen';
import { ClientScreen } from './src/screens/ClientScreen';
import { VisitScreen } from './src/screens/VisitScreen';
import { PlanScreen } from './src/screens/PlanScreen';
import { ReferralScreen } from './src/screens/ReferralScreen';

export type RootStackParamList = {
  PriorityList: undefined;
  Client: { clientId: string };
  Visit: { clientId: string };
  Plan: { clientId: string; visitId: string };
  Referral: { clientId: string; visitId: string; triggeringFlags: string[] };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="PriorityList"
          screenOptions={{
            headerStyle: { backgroundColor: '#1a7c4e' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        >
          <Stack.Screen
            name="PriorityList"
            component={PriorityListScreen}
            options={{ title: 'NurtureLink' }}
          />
          <Stack.Screen
            name="Client"
            component={ClientScreen}
            options={{ title: 'Client Record' }}
          />
          <Stack.Screen name="Visit" component={VisitScreen} options={{ title: 'Record Visit' }} />
          <Stack.Screen
            name="Plan"
            component={PlanScreen}
            options={{ title: 'Nutrition Plan' }}
          />
          <Stack.Screen name="Referral" component={ReferralScreen} options={{ title: 'Referral' }} />
        </Stack.Navigator>
        <StatusBar style="light" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
