import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { colors, fonts } from '../../theme/colors';
import { HeroBand, SectionLabel, NavTile, StatusBadge, PrimaryButton, GhostButton, ListItemCard } from '../../components/Shared';
import { deconnexion, listerEcoutantsEnAttente, validerEcoutant, refuserEcoutant, listerAlertes, detailAlerte, traiterAlerte } from '../../services/apiService';

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

export function AlertesListeScreen({ navigation, route }) {
  const [filtre, setFiltre] = useState(0);
  const [alertes, setAlertes] = useState([]);
  const [chargement, setChargement] = useState(true);

  const charger = async () => {
    try {
      const data = await listerAlertes();
      setAlertes(data);
    } catch (e) {
      Alert.alert('Erreur', e.message);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => { charger(); }, []);

  const labels = ['Toutes', 'Écoutant', 'Module IA'];
  const filtresSources = [null, 'ecoutant', 'module_ia'];
  const alertesFiltrees = filtresSources[filtre]
    ? alertes.filter((a) => a.source === filtresSources[filtre])
    : alertes;

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
      {chargement ? <ActivityIndicator color={colors.ink} /> : alertesFiltrees.length === 0 ? (
        <Text style={s.note}>Aucune alerte.</Text>
      ) : alertesFiltrees.map((a) => (
        <ListItemCard
          key={a.id}
          titre={a.pseudo_ado || `Alerte ${a.id}`}
          sousTitre={`${a.gravite_display} · ${a.source_display}`}
          tag={<StatusBadge
            text={`${a.gravite}${a.statut === 'en_cours' ? ' · en cours' : ''}`}
            color={a.gravite === 'urgent' ? colors.coral : a.gravite === 'moyen' ? colors.amber : colors.green}
          />}
          onPress={() => navigation.navigate('AlerteDetail', { alerteId: a.id })}
        />
      ))}
      <Text style={s.note}>Triées par gravité, source toujours visible</Text>
    </View>
  );
}

export function AlerteDetailScreen({ navigation, route }) {
  const [alerte, setAlerte] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [action, setAction] = useState('');

  useEffect(() => {
    const charger = async () => {
      try {
        const data = await detailAlerte(route.params?.alerteId);
        setAlerte(data);
      } catch (e) {
        Alert.alert('Erreur', e.message);
      } finally {
        setChargement(false);
      }
    };
    charger();
  }, [route.params?.alerteId]);

  const handleContacter = async () => {
    if (!alerte?.conversation) return;
    navigation.navigate('Chat', { conversationId: alerte.conversation });
  };

  const handleCloturer = async () => {
    if (!alerte?.id) return;
    setAction('traitement');
    try {
      await traiterAlerte(alerte.id, { statut: 'cloturee', justification: 'Traitée par le superviseur.' });
      Alert.alert('Alerte clôturée');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Erreur', e.message);
    } finally {
      setAction('');
    }
  };

  if (chargement || !alerte) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper }}>
        <ActivityIndicator color={colors.ink} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper, padding: 20 }}>
      <HeroBand titre={alerte.pseudo_ado || `Alerte #${alerte.id}`} sousTitre={`${alerte.source_display} · ${alerte.gravite_display}`} />
      <View style={s.quoteBox}>
        <Text style={s.quoteText}>Détection : {alerte.description}</Text>
      </View>
      <PrimaryButton label="Contacter l'ado" onPress={handleContacter} />
      <GhostButton label="Orienter vers un psychologue" onPress={() => {}} />
      <GhostButton
        label={action === 'traitement' ? 'Traitement en cours...' : 'Clôturer l\'alerte'}
        onPress={handleCloturer}
        disabled={action === 'traitement'}
      />
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