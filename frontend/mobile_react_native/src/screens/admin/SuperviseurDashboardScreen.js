import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect } from '@react-navigation/native';
import { colors, fonts } from '../../theme/colors';
import { HeroBand, NavTile, StatusBadge } from '../../components/Shared';
import { getStatsSuperviseur, listerAlertes } from '../../services/apiService';

export default function SuperviseurDashboardScreen({ navigation }) {
  const [nom, setNom] = useState('Superviseur');
  const [stats, setStats] = useState(null);
  const [alertesUrgentes, setAlertesUrgentes] = useState(0);
  const [chargement, setChargement] = useState(true);

  const chargerAlertes = useCallback(async () => {
      try {
        const data = await listerAlertes();
        setAlertesUrgentes(data.filter((a) => a.gravite === 'urgent').length);
      } catch (e) { /* pas critique */ }
  }, []);

  useEffect(() => {
    SecureStore.getItemAsync('user_nom').then((v) => { if (v) setNom(v.split(' ')[0]); });
  }, []);

  const chargerStats = useCallback(async () => {
    try {
      const data = await getStatsSuperviseur();
      setStats(data);
    } catch (e) {
      console.log('Erreur stats superviseur:', e.message);
    } finally {
      setChargement(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    chargerStats();
    chargerAlertes();
    const actualisation = setInterval(chargerAlertes, 10000);
    return () => clearInterval(actualisation);
  }, [chargerStats, chargerAlertes]));

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('user_nom');
    navigation.reset({ index: 0, routes: [{ name: 'ChoixRole' }] });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <View style={s.statusBar} />
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Bonjour {nom} 👋</Text>
          <Text style={s.subGreeting}>Vue de supervision</Text>
        </View>
      </View>
      {chargement ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.ink} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.content}>
          <NavTile icon={<Text style={{ fontSize: 18 }}>🧑‍🤝‍🧑</Text>} label="Écoutants en attente" sub="Candidatures à valider"
            accent={colors.amber} trailing={<StatusBadge text={String(stats?.ecoutants_en_attente ?? 0)} />}
            onPress={() => navigation.navigate('ValidationEcoutants')} />
          <NavTile icon={<Text style={{ fontSize: 18 }}>⚠️</Text>} label="Alertes urgentes" sub="À traiter maintenant"
            accent={colors.coral} trailing={<StatusBadge text={String(alertesUrgentes)} color={colors.coral} />}
            onPress={() => navigation.navigate('AdminAlertes')} />
          <NavTile icon={<Text style={{ fontSize: 18 }}>💬</Text>} label="Conversations en cours" sub="Suivi en temps réel"
            accent={colors.green} trailing={<StatusBadge text={String(stats?.conversations_en_cours ?? 0)} />}
            onPress={() => navigation.navigate('ConversationsActives')} />
          <NavTile icon={<Text style={{ fontSize: 18 }}>⏳</Text>} label="Conversations en attente" sub="Sans écoutant assigné"
            accent={colors.amberDeep} trailing={<StatusBadge text={String(stats?.conversations_en_attente ?? 0)} />}
            onPress={() => navigation.navigate('ConversationsAttente')} />
          <NavTile icon={<Text style={{ fontSize: 18 }}>🔵</Text>} label="Cercles actifs" sub="Groupes d'écoute en cours"
            accent={colors.inkSurface} trailing={<StatusBadge text={String(stats?.cercles_actifs ?? 0)} />}
            onPress={() => navigation.navigate('CerclesActifs')} />
          <NavTile icon={<Text style={{ fontSize: 18 }}>📊</Text>} label="Ados inscrits" sub="Total sur la plateforme"
            accent={colors.ink} trailing={<StatusBadge text={String(stats?.ados_inscrits ?? 0)} />}
            onPress={() => navigation.navigate('AdosInscrits')} />
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
            <Text style={s.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  statusBar: { height: 44, backgroundColor: colors.inkSurface },
  header: { backgroundColor: colors.inkSurface, paddingHorizontal: 20, paddingBottom: 18, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 },
  greeting: { fontFamily: fonts.displayBold, fontSize: 22, color: '#fff' },
  subGreeting: { fontFamily: fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  content: { padding: 16, paddingBottom: 40 },
  logoutBtn: { borderWidth: 1.4, borderColor: colors.coral, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  logoutText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.coral },
});
