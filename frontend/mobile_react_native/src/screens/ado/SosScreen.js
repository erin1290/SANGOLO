import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { colors, fonts } from '../../theme/colors';
import { creerConversation } from '../../services/apiService';

export default function SosScreen({ navigation }) {
  const [enCours, setEnCours] = useState(false);
  const demarrerChat = async () => {
    setEnCours(true);
    try {
      const conversation = await creerConversation();
      navigation.navigate('Chat', { conversationId: conversation.id });
    } catch (e) {
      Alert.alert('Erreur', e.message || 'Impossible de créer une conversation.');
    } finally {
      setEnCours(false);
    }
  };
  return (
    <View style={s.container}>
      <TouchableOpacity style={s.close} onPress={() => navigation.goBack()}>
        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 24 }}>✕</Text>
      </TouchableOpacity>

      <Text style={s.title}>Tu n'es pas seul(e).{'\n'}On est là, maintenant.</Text>
      <Text style={s.sub}>Choisis ce qui te convient — il n'y a pas de mauvaise option.</Text>

       <TouchableOpacity style={s.btnPrimary} onPress={demarrerChat} disabled={enCours}>
        <Text style={s.btnPrimaryText}>{enCours ? 'Connexion...' : 'Parler à un écoutant maintenant'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.btnSecondary}>
        <Text style={s.btnSecondaryText}>Appeler une ligne d'écoute</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.btnGhost}>
        <Text style={s.btnGhostText}>Voir les ressources près de moi</Text>
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