import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { colors, fonts } from '../../theme/colors';
import { HeroBand, StatusBadge } from '../../components/Shared';
import { listerCerclesEcoute, listerMembresCercle, creerConversationAdo, listerConversationsAdo, getBaseUrl } from '../../services/apiService';
import * as SecureStore from 'expo-secure-store';

export default function AdoPeerScreen({ navigation }) {
  const [cercles, setCercles] = useState([]);
  const [cercleSelectionne, setCercleSelectionne] = useState(null);
  const [membres, setMembres] = useState([]);
  const [userId, setUserId] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [chargementMembres, setChargementMembres] = useState(false);
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    chargerCercles();
    chargerConversations();
  }, []);

  const chargerCercles = async () => {
    try {
      const uid = await SecureStore.getItemAsync('user_id');
      setUserId(uid);
      const data = await listerCerclesEcoute();
      const liste = Array.isArray(data) ? data : [];
      const mesCercles = [];
      for (const cercle of liste) {
        try {
          const membres = await listerMembresCercle(cercle.id);
          const estMembre = membres.some(m => String(m.utilisateur) === String(uid));
          if (estMembre) mesCercles.push(cercle);
        } catch (e) { /* silent */ }
      }
      setCercles(mesCercles);
    } catch (e) { /* silent */ }
    finally { setChargement(false); }
  };

  const chargerConversations = async () => {
    try {
      const data = await listerConversationsAdo();
      setConversations(Array.isArray(data) ? data : []);
    } catch (e) { /* silent */ }
  };

  const chargerMembres = async (cercleId) => {
    setChargementMembres(true);
    setCercleSelectionne(cercleId);
    try {
      const data = await listerMembresCercle(cercleId);
      setMembres(Array.isArray(data) ? data.filter(m => String(m.utilisateur) !== String(userId)) : []);
    } catch (e) { /* silent */ }
    finally { setChargementMembres(false); }
  };

  const getNonLus = (membreId) => {
    const conv = conversations.find(c =>
      (String(c.expediteur) === String(userId) && String(c.destinataire) === String(membreId)) ||
      (String(c.destinataire) === String(userId) && String(c.expediteur) === String(membreId))
    );
    return conv ? (conv.messages_non_lus || 0) : 0;
  };

  const demarrerChat = async (membre) => {
    try {
      const conv = await creerConversationAdo(membre.utilisateur, cercleSelectionne);
      // Marquer comme lu
      try {
        const token = await SecureStore.getItemAsync('auth_token');
        await fetch(`${getBaseUrl()}/messagerie/messages-ado/marquer-lus/`, {
          method: 'POST',
          headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversation_id: conv.id }),
        });
      } catch (e) { /* silent */ }
      navigation.navigate('ChatAdoAdo', {
        conversationId: conv.id,
        destinatairePseudo: membre.pseudo || 'Ado',
      });
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de créer la conversation.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>{'<'} Retour</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListHeaderComponent={
          <>
            <HeroBand titre="Parler à un pair" sousTitre="Discute avec les membres de ton cercle" />
            {cercleSelectionne && (
              <TouchableOpacity style={s.retourBtn} onPress={() => { setCercleSelectionne(null); setMembres([]); }}>
                <Text style={s.retourText}>← Retour à mes cercles</Text>
              </TouchableOpacity>
            )}
          </>
        }
        data={cercleSelectionne ? membres : cercles}
        keyExtractor={(item) => String(item.id || item.utilisateur)}
        ListEmptyComponent={
          chargement || chargementMembres ? (
            <ActivityIndicator style={{ marginTop: 30 }} color={colors.ink} size="large" />
          ) : cercleSelectionne ? (
            <Text style={s.empty}>Aucun autre membre dans ce cercle.</Text>
          ) : (
            <Text style={s.empty}>Tu n'es dans aucun cercle pour l'instant.{'\n'}Rejoins un cercle pour discuter avec d'autres ados.</Text>
          )
        }
        renderItem={({ item }) => {
          if (cercleSelectionne) {
            const nonLus = getNonLus(item.utilisateur);
            return (
              <TouchableOpacity style={s.card} onPress={() => demarrerChat(item)}>
                <View style={s.cardRow}>
                  <View style={[s.avatarDot, { backgroundColor: colors.green }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.name}>{item.pseudo || 'Ado'}</Text>
                    <Text style={s.sub}>Membre du cercle</Text>
                  </View>
                  {nonLus > 0 ? (
                    <View style={s.unreadBadge}>
                      <Text style={s.unreadBadgeText}>{nonLus}</Text>
                    </View>
                  ) : (
                    <View style={s.chatBadge}>
                      <Text style={s.chatBadgeText}>💬</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          }
          return (
            <TouchableOpacity style={s.card} onPress={() => chargerMembres(item.id)}>
              <View style={s.cardRow}>
                <View style={[s.avatarDot, { backgroundColor: colors.amber }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{item.theme}</Text>
                  <Text style={s.sub}>{item.nombre_membres || 0} membre(s)</Text>
                </View>
                <StatusBadge text="Voir" color={colors.green} />
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
  retourBtn: { paddingVertical: 10, paddingHorizontal: 16, backgroundColor: colors.card, borderRadius: 12, marginBottom: 12 },
  retourText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink },
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
  unreadBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.coral, alignItems: 'center', justifyContent: 'center' },
  unreadBadgeText: { fontFamily: fonts.bodyBold, fontSize: 12, color: '#fff' },
});
