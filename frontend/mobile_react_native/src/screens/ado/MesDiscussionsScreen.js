import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { colors, fonts } from '../../theme/colors';
import { HeroBand, StatusBadge } from '../../components/Shared';
import { getBaseUrl } from '../../services/apiService';
import * as SecureStore from 'expo-secure-store';

export default function MesDiscussionsScreen({ navigation }) {
  const [conversations, setConversations] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtre, setFiltre] = useState('toutes');

  const charger = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const url = filtre === 'non_lus'
        ? `${getBaseUrl()}/messagerie/conversation-stats/?filter=non_lus`
        : `${getBaseUrl()}/messagerie/conversation-stats/`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(Array.isArray(data) ? data : []);
      }
    } catch (e) { /* silent */ }
    finally { setChargement(false); setRefreshing(false); }
  }, [filtre]);

  useEffect(() => { charger(); }, [charger]);

  const onRefresh = () => { setRefreshing(true); charger(); };

  const entrerConversation = async (item) => {
    // Marquer les messages comme lus quand on entre dans la conversation
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      await fetch(`${getBaseUrl()}/messagerie/messages/marquer-lus/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: item.id }),
      });
    } catch (e) { /* silent */ }
    const nomAffiche = item.ecoutant_nom || 'En attente d\'un écoutant';
    navigation.navigate('Chat', { conversationId: item.id, ecoutantNom: nomAffiche });
  };

  const formatHeure = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffJours = Math.floor((now - d) / (1000 * 60 * 60 * 24));
      if (diffJours === 0) {
        return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      } else if (diffJours === 1) {
        return 'Hier';
      } else if (diffJours < 7) {
        return d.toLocaleDateString('fr-FR', { weekday: 'short' });
      }
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    } catch { return ''; }
  };

  const getStatutLabel = (statut) => {
    switch (statut) {
      case 'en_attente': return 'En attente';
      case 'en_cours': return 'En cours';
      case 'cloturee': return 'Clôturée';
      default: return statut;
    }
  };

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'en_attente': return colors.amber;
      case 'en_cours': return colors.green;
      case 'cloturee': return colors.inkSoft;
      default: return colors.inkSoft;
    }
  };

  const renderItem = ({ item }) => {
    const nomAffiche = item.ecoutant_nom || 'En attente d\'un écoutant';
    const dernierMsg = item.dernier_message;
    const nonLus = item.messages_non_lus || 0;

    return (
      <TouchableOpacity
        style={s.card}
        onPress={() => entrerConversation(item)}
      >
        <View style={s.cardRow}>
          <View style={[s.avatar, { backgroundColor: item.ecoutant ? colors.green : colors.amber }]}>
            <Text style={s.avatarText}>{nomAffiche.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={s.cardContent}>
            <View style={s.cardTop}>
              <Text style={s.name} numberOfLines={1}>{nomAffiche}</Text>
              <Text style={s.time}>{formatHeure(item.date_derniere_activite)}</Text>
            </View>
            <View style={s.cardBottom}>
              <Text style={s.preview} numberOfLines={1}>
                {dernierMsg
                  ? (dernierMsg.auteur === 'utilisateur' ? 'Toi : ' : '') + dernierMsg.contenu
                  : 'Aucun message'}
              </Text>
              {nonLus > 0 && (
                <View style={s.badge}>
                  <Text style={s.badgeText}>{nonLus}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <View style={s.statusRow}>
          <StatusBadge text={getStatutLabel(item.statut)} color={getStatutColor(item.statut)} />
        </View>
      </TouchableOpacity>
    );
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
          <View>
            <HeroBand titre="Mes discussions" sousTitre="Tes conversations avec les écouteurs" />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, marginBottom: 8 }}>
              <TouchableOpacity
                style={[s.filtrePill, filtre === 'toutes' && s.filtrePillActive]}
                onPress={() => setFiltre('toutes')}
              >
                <Text style={[s.filtreText, filtre === 'toutes' && s.filtreTextActive]}>Toutes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.filtrePill, filtre === 'non_lus' && s.filtrePillActive]}
                onPress={() => setFiltre('non_lus')}
              >
                <Text style={[s.filtreText, filtre === 'non_lus' && s.filtreTextActive]}>Non lues</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        data={conversations}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.ink]} />}
        ListEmptyComponent={
          chargement ? (
            <ActivityIndicator style={{ marginTop: 30 }} color={colors.ink} size="large" />
          ) : (
            <View style={s.emptyContainer}>
              <Text style={s.emptyIcon}>💬</Text>
              <Text style={s.emptyTitle}>Aucune discussion</Text>
              <Text style={s.emptySub}>Commence à parler avec un écouteur pour voir tes conversations ici.</Text>
            </View>
          )
        }
        renderItem={renderItem}
      />
    </View>
  );
}

const s = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 44, paddingBottom: 4 },
  backBtn: { paddingVertical: 6, paddingHorizontal: 4 },
  backText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  filtrePill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.card },
  filtrePillActive: { backgroundColor: colors.amber },
  filtreText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.inkSoft },
  filtreTextActive: { color: '#3A2410' },
  card: {
    backgroundColor: colors.card, borderRadius: 16, padding: 14, marginBottom: 10,
    shadowColor: colors.ink, shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.bodyBold, fontSize: 16, color: '#fff' },
  cardContent: { flex: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink, flex: 1 },
  time: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  preview: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, flex: 1, marginRight: 8 },
  badge: {
    backgroundColor: colors.coral, borderRadius: 10, minWidth: 20, height: 20,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  badgeText: { fontFamily: fonts.bodyBold, fontSize: 10, color: '#fff' },
  statusRow: { marginTop: 8, flexDirection: 'row' },
  emptyContainer: { alignItems: 'center', marginTop: 40, paddingHorizontal: 30 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontFamily: fonts.displayBold, fontSize: 16, color: colors.ink, marginBottom: 6, textAlign: 'center' },
  emptySub: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, textAlign: 'center', lineHeight: 18 },
});
