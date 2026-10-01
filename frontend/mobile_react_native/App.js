import React, { useState, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts, Fraunces_600SemiBold, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import { Manrope_500Medium, Manrope_700Bold } from '@expo-google-fonts/manrope';
import { View, ActivityIndicator } from 'react-native';
import { LanguageProvider } from './src/context/LanguageContext';

import ChoixRoleScreen from './src/screens/ChoixRoleScreen';
import WelcomeScreen from './src/screens/ado/WelcomeScreen';
import InscriptionScreen from './src/screens/ado/InscriptionScreen';
import ConnexionAdoScreen from './src/screens/ado/ConnexionAdoScreen';
import AccueilScreen from './src/screens/ado/AccueilScreen';
import JournalScreen from './src/screens/ado/JournalScreen';
import ChatScreen from './src/screens/ado/ChatScreen';
import SosScreen from './src/screens/ado/SosScreen';
import ProfilScreen from './src/screens/ado/ProfilScreen';
import VerrouillageScreen from './src/screens/ado/VerrouillageScreen';
import CerclesEcouteScreen from './src/screens/ado/CerclesEcouteScreen';
import SecuriteAdoScreen from './src/screens/ado/SecuriteAdoScreen';
import NotificationsAdoScreen from './src/screens/ado/NotificationsAdoScreen';
import AideAdoScreen from './src/screens/ado/AideAdoScreen';
import ListeEcoutantsScreen from './src/screens/ado/ListeEcoutantsScreen';
import MesDiscussionsScreen from './src/screens/ado/MesDiscussionsScreen';

import {
  EcoutantWelcomeScreen, EcoutantConnexionScreen, EcoutantDashboardScreen,
} from './src/screens/ecoutant/EcoutantAuthScreens';
import {
  ConversationsAttenteScreen, ChatEcoutantScreen, CercleModerationScreen, ConversationsActivesScreen,
} from './src/screens/ecoutant/EcoutantChatScreens';
import {
  EscaladeScreen, EscaladeConfirmationScreen, PlanningEcoutantScreen,
  ProfilEcoutantScreen, EcoutantParametresScreen,
} from './src/screens/ecoutant/EcoutantMiscScreens';

import CreerCercleScreen from './src/screens/ecoutant/CreerCercleScreen';
import CercleAdoScreen from './src/screens/ado/CercleAdoScreen';
import AdoPeerScreen from './src/screens/ado/AdoPeerScreen';
import ChatAdoAdoScreen from './src/screens/ado/ChatAdoAdoScreen';

import { colors } from './src/theme/colors';

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold, Fraunces_700Bold, Manrope_500Medium, Manrope_700Bold,
  });
  const [verrouille, setVerrouille] = useState(false);
  const deverrouiller = useCallback(() => setVerrouille(false), []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper }}>
        <ActivityIndicator color={colors.ink} />
      </View>
    );
  }

  if (verrouille) return <VerrouillageScreen onDeverrouille={deverrouiller} />;

  return (
    <LanguageProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="ChoixRole" screenOptions={{ headerShown: false, gestureEnabled: true }}>
        <Stack.Screen name="ChoixRole" component={ChoixRoleScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Inscription" component={InscriptionScreen} />
        <Stack.Screen name="ConnexionAdo" component={ConnexionAdoScreen} />
        <Stack.Screen name="Accueil" component={AccueilScreen} />
        <Stack.Screen name="Journal" component={JournalScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="Sos" component={SosScreen} />
        <Stack.Screen name="Profil" component={ProfilScreen} />
        <Stack.Screen name="CerclesEcoute" component={CerclesEcouteScreen} />
        <Stack.Screen name="SecuriteAdo" component={SecuriteAdoScreen} />
        <Stack.Screen name="NotificationsAdo" component={NotificationsAdoScreen} />
        <Stack.Screen name="AideAdo" component={AideAdoScreen} />
        <Stack.Screen name="ListeEcoutants" component={ListeEcoutantsScreen} />
        <Stack.Screen name="MesDiscussions" component={MesDiscussionsScreen} />

        <Stack.Screen name="EcoutantWelcome" component={EcoutantWelcomeScreen} />
        <Stack.Screen name="EcoutantConnexion" component={EcoutantConnexionScreen} />
        <Stack.Screen name="EcoutantDashboard" component={EcoutantDashboardScreen} />
        <Stack.Screen name="ConversationsAttente" component={ConversationsAttenteScreen} />
        <Stack.Screen name="ConversationsActives" component={ConversationsActivesScreen} />
        <Stack.Screen name="ChatEcoutant" component={ChatEcoutantScreen} />
        <Stack.Screen name="CercleModeration" component={CercleModerationScreen} />
        <Stack.Screen name="Escalade" component={EscaladeScreen} />
        <Stack.Screen name="EscaladeConfirmation" component={EscaladeConfirmationScreen} />
        <Stack.Screen name="PlanningEcoutant" component={PlanningEcoutantScreen} />
        <Stack.Screen name="ProfilEcoutant" component={ProfilEcoutantScreen} />
        <Stack.Screen name="EcoutantParametres" component={EcoutantParametresScreen} />
        <Stack.Screen name="CreerCercle" component={CreerCercleScreen} />
        <Stack.Screen name="CercleAdo" component={CercleAdoScreen} />
        <Stack.Screen name="AdoPeer" component={AdoPeerScreen} />
        <Stack.Screen name="ChatAdoAdo" component={ChatAdoAdoScreen} />

      </Stack.Navigator>
      </NavigationContainer>
    </LanguageProvider>
  );
}
