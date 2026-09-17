import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { colors, fonts } from '../../theme/colors';
import { HeroBand, SectionLabel, PrimaryButton, GhostButton } from '../../components/Shared';
import { connexionAdo } from '../../services/apiService';

export default function ConnexionAdoScreen({ navigation }) {
  const [pseudo, setPseudo] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);

  const seConnecter = async () => {
    if (!pseudo.trim() || !motDePasse.trim()) {
      setErreur('Remplis tous les champs.');
      return;
    }
    setChargement(true);
    setErreur(null);
    try {
      await connexionAdo({ pseudo: pseudo.trim(), motDePasse });
      navigation.reset({ index: 0, routes: [{ name: 'Accueil' }] });
    } catch (e) {
      setErreur(e.message || 'Pseudo ou mot de passe incorrect.');
    } finally {
      setChargement(false);
    }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 20 }}>
      <HeroBand titre="Connexion" sousTitre="Retrouve ton espace anonyme" />

      <SectionLabel>Pseudo</SectionLabel>
      <TextInput style={s.input} placeholder="Ton pseudo" value={pseudo} onChangeText={setPseudo} autoCapitalize="none" />

      <SectionLabel>Mot de passe</SectionLabel>
      <TextInput style={s.input} placeholder="••••••••" secureTextEntry value={motDePasse} onChangeText={setMotDePasse} />

      {erreur ? <Text style={s.erreur}>{erreur}</Text> : null}

      <View style={{ marginTop: 18 }}>
        {chargement ? <ActivityIndicator color={colors.ink} size="large" /> : (
          <PrimaryButton label="Se connecter" onPress={seConnecter} />
        )}
      </View>

      <View style={{ marginTop: 16 }}>
        <GhostButton label="Créer un compte" onPress={() => navigation.replace('Inscription')} />
      </View>

      <Text style={s.note}>Aucune donnée identifiante requise</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  input: {
    backgroundColor: colors.card, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    fontFamily: fonts.body, fontSize: 14, color: colors.ink,
  },
  erreur: { color: colors.coral, fontSize: 13, marginTop: 10, fontFamily: fonts.body },
  note: { textAlign: 'center', color: colors.inkSoft, fontSize: 12, marginTop: 14, fontFamily: fonts.body },
});