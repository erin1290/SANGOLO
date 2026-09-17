import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { colors, fonts } from '../../theme/colors';
import { HeroBand, SectionLabel, NavTile, StatusBadge, PrimaryButton, GhostButton, ListItemCard } from '../../components/Shared';
import { deconnexion, listerEcoutantsEnAttente, validerEcoutant, refuserEcoutant } from '../../services/apiService';

export function AdminConnexionScreen({ navigation }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.paper, padding: 20 }}>
      <HeroBand titre="Espace supervision" sousTitre="Accès réservé à l'équipe" />
      <SectionLabel>Identifiant</SectionLabel>
      <TextInput style={s.input} placeholder="superviseur@sangolo.org" />
      <SectionLabel>Mot de passe</SectionLabel>
      <TextInput style={s.input} placeholder="••••••••" secureTextEntry />
      <View style={{ marginTop: 16 }}>
        <PrimaryButton label="Se connecter" onPress={() => navigation.replace('AdminDashboard')} />
      </View>
    </View>
  );
}

export function AdminDashboardScreen({ navigation }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.paper, padding: 20 }}>
      <HeroBand titre="Bonjour" sousTitre="Vue d'ensemble" />
      <View style={{ height: 8 }} />
      <NavTile icon={<Text style={{ fontSize: 18 }}>⚠️</Text>} label="Alertes urgentes" sub="À traiter maintenant" accent={colors.coral}
        trailing={<StatusBadge text="2" color={colors.coral} />} onPress={() => navigation.navigate('AdminAlertes')} />
      <NavTile icon={<Text style={{ fontSize: 18 }}>🧑‍🤝‍🧑</Text>} label="Écoutants en attente" sub="Candidatures à valider" accent={colors.amber}
        trailing={<StatusBadge text="5" />} onPress={() => navigation.navigate('ValidationEcoutants')} />
      <NavTile icon={<Text style={{ fontSize: 18 }}>❤️</Text>} label="Annuaire de ressources" sub="Gérer les partenaires" accent={colors.green}
        onPress={() => navigation.navigate('AnnuaireAdmin')} />
      <NavTile icon={<Text style={{ fontSize: 18 }}>📊</Text>} label="Statistiques" sub="Données anonymisées" accent={colors.inkSurface} onPress={() => {}} />
      <NavTile icon={<Text style={{ fontSize: 18 }}>⚙️</Text>} label="Paramètres" sub="Réglages supervision" accent={colors.ink} onPress={() => navigation.navigate('AdminParametres')} />
    </View>
  );
}

export function AlertesListeScreen({ navigation }) {
  const [filtre, setFiltre] = useState(0);
  const labels = ['Toutes', 'Écoutant', 'Module IA'];
  return (
    <View style={{ flex: 1, backgroundColor: colors.paper, padding: 20 }}>
      <HeroBand titre="Alertes" sousTitre="Écoutant + module IA" />
      <View style={s.filterRow}>
        {labels.map((l, i) => (
          <TouchableOpacity key={l} style={[s.filterPill, i === filtre && s.filterPillActive]} onPress={() => setFiltre(i)}>
            <Text style={[s.filterText, i === filtre && s.filterTextActive]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ height: 12 }} />
      <ListItemCard titre="mango_23" sousTitre="Signalé par Aline il y a 4 min"
        tag={<StatusBadge text="urgent · écoutant" color={colors.coral} />}
        onPress={() => navigation.navigate('AlerteDetail')} />
      <ListItemCard titre="calme_02" sousTitre="Mot-clé de détresse détecté"
        tag={<StatusBadge text="module IA" color={colors.amberDeep} />}
        onPress={() => navigation.navigate('AlerteDetail')} />
      <ListItemCard titre="etoile_v" sousTitre="Conseil écoutant à revoir"
        tag={<StatusBadge text="à traiter" />} onPress={() => navigation.navigate('AlerteDetail')} />
      <Text style={s.note}>Triées par gravité, source toujours visible</Text>
    </View>
  );
}

export function AlerteDetailScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.paper, padding: 20 }}>
      <HeroBand titre="mango_23" sousTitre="Signalée par Aline · urgent" />
      <View style={s.quoteBox}>
        <Text style={s.quoteText}>"...je sais pas si je peux tenir encore..."</Text>
      </View>
      <PrimaryButton label="Contacter l'ado" onPress={() => {}} />
      <GhostButton label="Orienter vers un psychologue" onPress={() => {}} />
      <GhostButton label="Clôturer l'alerte" onPress={() => {}} />
      <Text style={s.note}>Décision toujours humaine — jamais automatique</Text>
    </View>
  );
}

export function ValidationEcoutantsScreen() {
  const [candidats, setCandidats] = useState([]);
  const [chargement, setChargement] = useState(true);

  const charger = async () => {
    try {
      const data = await listerEcoutantsEnAttente();
      setCandidats(data);
    } catch (e) {
      Alert.alert('Erreur', e.message);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => { charger(); }, []);

  const handleValider = async (id) => {
    try {
      const res = await validerEcoutant(id);
      Alert.alert('Validé', `Mot de passe temporaire : ${res.mot_de_passe_temporaire}\n(à transmettre à ${res.email})`);
      charger();
    } catch (e) {
      Alert.alert('Erreur', e.message);
    }
  };

  const handleRefuser = async (id) => {
    try {
      await refuserEcoutant(id);
      charger();
    } catch (e) {
      Alert.alert('Erreur', e.message);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper, padding: 20 }}>
      <HeroBand titre="Candidatures" sousTitre={`${candidats.length} en attente`} />
      {chargement ? <ActivityIndicator color={colors.ink} /> : candidats.length === 0 ? (
        <Text style={s.note}>Aucune candidature en attente.</Text>
      ) : candidats.map((c) => (
        <View key={c.id} style={s.candidateCard}>
          <View style={s.candidateTop}>
            <Text style={s.candidateName}>{c.nom_complet}</Text>
            {c.formation_validee && <StatusBadge text="formation OK" />}
          </View>
          <Text style={s.candidateSub}>{c.institution_partenaire || 'Institution non renseignée'}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <View style={{ flex: 1 }}><GhostButton label="Valider" color={colors.green} onPress={() => handleValider(c.id)} /></View>
            <View style={{ flex: 1 }}><GhostButton label="Refuser" color={colors.coral} onPress={() => handleRefuser(c.id)} /></View>
          </View>
        </View>
      ))}
      <Text style={s.note}>Formation, entretien, institution partenaire</Text>
    </View>
  );
}

export function AnnuaireAdminScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.paper, padding: 20 }}>
      <HeroBand titre="Annuaire" sousTitre="Psychologues · ONG · centres" />
      <ListItemCard titre="Cabinet Nkolo" sousTitre="Yaoundé · partenaire certifié" />
      <ListItemCard titre="Centre Espoir" sousTitre="Douala · ONG" />
      <GhostButton label="+ Ajouter une ressource" onPress={() => {}} />
    </View>
  );
}

export function AdminParametresScreen({ navigation }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.paper, padding: 20 }}>
      <HeroBand titre="Paramètres" sousTitre="Réglages du compte superviseur" />
      <SectionLabel>Compte</SectionLabel>
      <NavTile icon={<Text style={{ fontSize: 18 }}>🔒</Text>} label="Sécurité" sub="Mot de passe" accent={colors.ink}
        trailing={<StatusBadge text="ON" />} onPress={() => {}} />
      <NavTile icon={<Text style={{ fontSize: 18 }}>⚠️</Text>} label="Alertes prioritaires" sub="Notification immédiate" accent={colors.coral}
        trailing={<StatusBadge text="ON" color={colors.coral} />} onPress={() => {}} />
      <SectionLabel>Équipe</SectionLabel>
      <NavTile icon={<Text style={{ fontSize: 18 }}>👥</Text>} label="Membres de l'équipe" sub="Gérer les accès superviseur" accent={colors.amber} onPress={() => {}} />
      <NavTile icon={<Text style={{ fontSize: 18 }}>🌐</Text>} label="Langue" sub="Français" accent={colors.green} onPress={() => {}} />
      <View style={{ flex: 1 }} />
      <GhostButton label="Se déconnecter" color={colors.coral} onPress={async () => {
        await deconnexion();
        navigation.reset({ index: 0, routes: [{ name: 'ChoixRole' }] });
      }} />
    </View>
  );
}

const s = StyleSheet.create({
  input: { backgroundColor: colors.card, borderRadius: 14, padding: 14, fontFamily: fonts.body, fontSize: 14 },
  filterRow: { flexDirection: 'row', gap: 6 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.card },
  filterPillActive: { backgroundColor: colors.ink },
  filterText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.inkSoft },
  filterTextActive: { color: '#fff' },
  note: { textAlign: 'center', fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, marginTop: 12 },
  quoteBox: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginVertical: 14 },
  quoteText: { fontStyle: 'italic', fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft },
  candidateCard: { backgroundColor: colors.card, borderRadius: 16, padding: 15, marginTop: 14 },
  candidateTop: { flexDirection: 'row', justifyContent: 'space-between' },
  candidateName: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink },
  candidateSub: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, marginTop: 4 },
});