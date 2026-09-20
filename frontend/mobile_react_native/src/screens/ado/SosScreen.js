import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import { colors, fonts } from '../../theme/colors';
import { creerConversation } from '../../services/apiService';
import { useLangue } from '../../context/LanguageContext';

export default function SosScreen({ navigation }) {
  const [enCours, setEnCours] = useState(false);
  const { langue } = useLangue();
  const t = langue === 'en' ? {
    error: 'Error', chatError: 'Unable to create a conversation.', title: "You are not alone.\nWe are here, now.", subtitle: 'Choose what feels right — there is no wrong option.', connecting: 'Connecting...', talk: 'Talk to a listener now', call: 'Call medical emergency (119)', resources: 'Find support near me', callError: 'This device cannot start a phone call.', resourcesError: 'Unable to open the map.',
  } : {
    error: 'Erreur', chatError: 'Impossible de créer une conversation.', title: "Tu n'es pas seul(e).\nOn est là, maintenant.", subtitle: "Choisis ce qui te convient — il n'y a pas de mauvaise option.", connecting: 'Connexion...', talk: 'Parler à un écoutant maintenant', call: "Appeler l'urgence médicale (119)", resources: 'Voir les ressources près de moi', callError: "Cet appareil ne peut pas lancer d'appel.", resourcesError: "Impossible d'ouvrir la carte.",
  };
  const demarrerChat = async () => {
    setEnCours(true);
    try {
      const conversation = await creerConversation();
      navigation.navigate('Chat', { conversationId: conversation.id });
    } catch (e) {
      Alert.alert(t.error, e.message || t.chatError);
    } finally {
      setEnCours(false);
    }
  };
  const appelerSecours = async () => {
    // `tel:` remet l'utilisateur dans l'application Téléphone avec le numéro
    // déjà prérempli. On ouvre directement : certains Expo Go répondent à tort
    // `false` à canOpenURL alors que le composeur est bien disponible.
    try {
      await Linking.openURL('tel:119');
    } catch {
      Alert.alert(t.error, t.callError);
    }
  };
  const ouvrirRessources = async () => {
    const url = 'https://www.google.com/maps/search/?api=1&query=mental+health+support';
    if (await Linking.canOpenURL(url)) await Linking.openURL(url);
    else Alert.alert(t.error, t.resourcesError);
  };
  return (
    <View style={s.container}>
      <TouchableOpacity style={s.close} onPress={() => navigation.goBack()}>
        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 24 }}>✕</Text>
      </TouchableOpacity>

      <Text style={s.title}>{t.title}</Text>
      <Text style={s.sub}>{t.subtitle}</Text>

       <TouchableOpacity style={s.btnPrimary} onPress={demarrerChat} disabled={enCours}>
        <Text style={s.btnPrimaryText}>{enCours ? t.connecting : t.talk}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.btnSecondary} onPress={appelerSecours}>
        <Text style={s.btnSecondaryText}>{t.call}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.btnGhost} onPress={ouvrirRessources}>
        <Text style={s.btnGhostText}>{t.resources}</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.inkSurface, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  close: { position: 'absolute', top: 50, right: 20 },
  title: { fontFamily: fonts.display, fontSize: 22, color: '#fff', textAlign: 'center', marginBottom: 10 },
  sub: { fontFamily: fonts.body, fontSize: 12.5, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: 28 },
  btnPrimary: { backgroundColor: colors.amber, borderRadius: 14, paddingVertical: 16, width: '100%', alignItems: 'center', marginBottom: 12 },
  btnPrimaryText: { color: '#3A2410', fontFamily: fonts.bodyBold, fontSize: 13 },
  btnSecondary: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, paddingVertical: 16, width: '100%', alignItems: 'center', marginBottom: 12 },
  btnSecondaryText: { color: '#fff', fontFamily: fonts.bodyBold, fontSize: 13 },
  btnGhost: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', borderRadius: 14, paddingVertical: 16, width: '100%', alignItems: 'center' },
  btnGhostText: { color: 'rgba(255,255,255,0.6)', fontFamily: fonts.bodyBold, fontSize: 13 },
});
