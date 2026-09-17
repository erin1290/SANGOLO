import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { colors, fonts } from '../../theme/colors';
import { HeroBand, StatusBadge } from '../../components/Shared';
import { listerEcoutants, creerConversation, getBaseUrl } from '../../services/apiService';
import * as SecureStore from 'expo-secure-store';

export default function ListeEcoutantsScreen({ navigation }) {
  const [ecoutants, setEcoutants] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [creerEnCours, setCreerEnCours] = useState(null);

  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    try {
      const [ecoutantsData, conversationsData] = await Promise.all([
        listerEcoutants().catch(() => []),
        chargerConversations().catch(() => []),
      ]);
      setEcoutants(Array.isArray(ecoutantsData) ? ecoutantsData : []);
      setConversations(Array.isArray(conversationsData) ? conversationsData : []);
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de charger les données.');
    } finally {
      setChargement(false);
    }
  };

  const chargerConversations = async () => {
    const token = await SecureStore.getItemAsync('auth_token');
    const res = await fetch(`${getBaseUrl()}/messagerie/conversation-stats/`, {
      headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
    return [];
  };

  const demarrerChat = async (ecoutant) => {
    setCreerEnCours(ecoutant.id);
    try {
      const conversation = await creerConversation(ecoutant.id);
      navigation.navigate('Chat', { conversationId: conversation.id, ecoutantNom: ecoutant.nom_complet });
    } catch (e) {
      Alert.alert('Erreur', e.message || 'Impossible de créer une conversation.');
    } finally {
      setCreerEnCours(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>‹ Retour</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <View>
            <HeroBand titre="Parler à un écoutant" sousTitre="Choisis quelqu'un pour t'écouter" />
            <View style={{ height: 8 }} />
          </View>
        }
        data={ecoutants}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={
          chargement ? <ActivityIndicator style={{ marginTop: 30 }} color={colors.ink} size="large" /> :
            <Text style={s.empty}>Aucun écoutant disponible pour l'instant.</Text>
        }
        renderItem={({ item }) => {
          return (
            <TouchableOpacity
              style={s.card}
              onPress={() => demarrerChat(item)}
              disabled={creerEnCours === item.id}
            >
              <View style={s.cardRow}>
                <View style={[s.avatarDot, { backgroundColor: item.disponible ? colors.green : colors.inkSoft }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{item.nom_complet}</Text>
                  <Text style={s.sub}>{item.formation_validee ? 'Formation validée' : 'En formation'}</Text>
                </View>
                {creerEnCours === item.id ? (
                  <ActivityIndicator color={colors.amber} />
                ) : (
                  <View style={s.chatBadge}>
                    <Text style={s.chatBadgeText}>💬</Text>
                  </View>
                )}
              </View>
              <View style={s.statusRow}>
                <StatusBadge
                  text={item.disponible ? 'En ligne' : 'Hors ligne'}
                  color={item.disponible ? colors.green : colors.inkSoft}
                />
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 44, paddingBottom: 4 },
  backBtn: { paddingVertical: 6, paddingHorizontal: 4 },
  backText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  empty: { textAlign: 'center', color: colors.inkSoft, fontFamily: fonts.body, fontSize: 13, marginTop: 30 },
  card: {
    backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 10,
    shadowColor: colors.ink, shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarDot: { width: 14, height: 14, borderRadius: 7 },
  name: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  sub: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, marginTop: 2 },
  chatBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.amber, alignItems: 'center', justifyContent: 'center' },
  chatBadgeText: { fontSize: 18 },
  statusRow: { marginTop: 8, flexDirection: 'row', gap: 8 },
});