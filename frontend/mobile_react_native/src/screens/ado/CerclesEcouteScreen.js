import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { colors, fonts } from '../../theme/colors';
import { HeroBand, ListItemCard, StatusBadge, PrimaryButton } from '../../components/Shared';
import { listerCerclesEcoute, rejoindreCercle, quitterCercle, listerMembresCercle } from '../../services/apiService';
import * as SecureStore from 'expo-secure-store';

export default function CerclesEcouteScreen({ navigation }) {
  const [cercles, setCercles] = useState([]);
  const [membreCercleIds, setMembreCercleIds] = useState(new Set());
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  useEffect(() => { charger(); }, []);

  const charger = async () => {
    try {
      const data = await listerCerclesEcoute();
      const liste = Array.isArray(data) ? data : [];
      setCercles(liste);
      // Charger les cercles dont l'ado est membre
      const userId = await SecureStore.getItemAsync('user_id');
      if (userId) {
        const membreIds = new Set();
        for (const cercle of liste) {
          try {
            const membres = await listerMembresCercle(cercle.id);
            const estMembre = membres.some(m => String(m.utilisateur) === String(userId));
            if (estMembre) membreIds.add(cercle.id);
          } catch (e) { /* silent */ }
        }
        setMembreCercleIds(membreIds);
      }
    } catch (e) { setErreur(e.message || 'Impossible de charger les cercles.'); }
    finally { setChargement(false); }
  };

  const handleRejoindre = async (cercleId) => {
    try {
      await rejoindreCercle(cercleId);
      setMembreCercleIds(prev => new Set([...prev, cercleId]));
      Alert.alert('Bienvenue !', 'Tu as rejoint le cercle.');
    } catch (e) {
      Alert.alert('Erreur', e.message || 'Impossible de rejoindre le cercle.');
    }
  };

  const handleQuitter = async (cercleId) => {
    try {
      const membres = await listerMembresCercle(cercleId);
      const userId = await SecureStore.getItemAsync('user_id');
      const membre = membres.find(m => String(m.utilisateur) === String(userId));
      if (membre) {
        await quitterCercle(membre.id);
        setMembreCercleIds(prev => { const s = new Set(prev); s.delete(cercleId); return s; });
        Alert.alert('Retiré', 'Tu as quitté le cercle.');
      }
    } catch (e) {
      Alert.alert('Erreur', e.message || 'Impossible de quitter le cercle.');
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
        contentContainerStyle={{ padding: 20 }}
        ListHeaderComponent={
          <HeroBand titre="Cercles d'ecoute" sousTitre="Groupes de parole confidentiels" />
        }
        data={cercles}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={
          chargement ? <ActivityIndicator style={{ marginTop: 20 }} color={colors.ink} /> :
            erreur ? <Text style={s.error}>{erreur}</Text> :
              <Text style={s.empty}>Aucun cercle disponible pour l'instant.{'\n'}Reviens plus tard !</Text>
        }
        renderItem={({ item }) => {
          const estMembre = membreCercleIds.has(item.id);
          return (
            <View style={s.cercleCard}>
              <ListItemCard
                titre={item.theme}
                sousTitre={`${item.nombre_membres || 0} membre(s) — Animateur: ${item.animateur_pseudo || ''}`}
                tag={<StatusBadge text={estMembre ? 'Membre' : (item.actif ? 'actif' : 'inactif')} color={estMembre ? colors.green : colors.inkSoft} />}
                onPress={() => {
                  if (estMembre) {
                    navigation.navigate('CercleAdo', { cercleId: item.id, cercleTheme: item.theme });
                  }
                }}
              />
              {item.actif && (
                <View style={s.actionRow}>
                  {!estMembre ? (
                    <PrimaryButton label="Rejoindre" onPress={() => handleRejoindre(item.id)} />
                  ) : (
                    <View style={s.actionRowInner}>
                      <TouchableOpacity style={s.ouvrirBtn} onPress={() => navigation.navigate('CercleAdo', { cercleId: item.id, cercleTheme: item.theme })}>
                        <Text style={s.ouvrirText}>Ouvrir le cercle</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.quitterBtn} onPress={() => {
                        Alert.alert('Quitter le cercle', 'Es-tu sur de vouloir quitter ce cercle ?', [
                          { text: 'Annuler', style: 'cancel' },
                          { text: 'Quitter', style: 'destructive', onPress: () => handleQuitter(item.id) },
                        ]);
                      }}>
                        <Text style={s.quitterText}>Quitter le cercle</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>
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
  empty: { textAlign: 'center', color: colors.inkSoft, fontFamily: fonts.body, fontSize: 13, marginTop: 20, lineHeight: 20 },
  error: { textAlign: 'center', color: colors.coral, fontFamily: fonts.body, fontSize: 13, marginTop: 20 },
  cercleCard: { marginBottom: 4 },
  actionRow: { paddingHorizontal: 4, marginBottom: 10 },
  actionRowInner: { flexDirection: 'row', gap: 8 },
  ouvrirBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: colors.green, borderRadius: 12 },
  ouvrirText: { fontFamily: fonts.bodyBold, fontSize: 12, color: '#fff' },
  quitterBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.coral },
  quitterText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.coral },
});