import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { colors, fonts } from '../../theme/colors';
import { HeroBand, SectionLabel, PrimaryButton } from '../../components/Shared';
import { connexionSuperviseur } from '../../services/apiService';

export default function SuperviseurConnexionScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);

  const seConnecter = async () => {
    if (!email.trim() || !motDePasse.trim()) { setErreur('Remplis tous les champs.'); return; }
    setChargement(true);
    setErreur(null);
    try {
      await connexionSuperviseur({ email: email.trim(), motDePasse });
      navigation.reset({ index: 0, routes: [{ name: 'SuperviseurDashboard' }] });
    } catch (e) {
      setErreur(e.message || 'Erreur de connexion.');
    } finally {
      setChargement(false);
    }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 20 }}>
      <HeroBand titre="Espace supervision" sousTitre="Accès réservé à l'équipe" />
      <SectionLabel>Email</SectionLabel>
      <TextInput style={s.input} placeholder="superviseur@sangolo.org" value={email} onChangeText={setEmail}
        autoCapitalize="none" keyboardType="email-address" />
      <SectionLabel>Mot de passe</SectionLabel>
      <TextInput style={s.input} placeholder="••••••••" secureTextEntry value={motDePasse} onChangeText={setMotDePasse} />
      {erreur ? <Text style={s.erreur}>{erreur}</Text> : null}
      <View style={{ marginTop: 18 }}>
        {chargement ? <ActivityIndicator color={colors.ink} size="large" /> : (
          <PrimaryButton label="Se connecter" onPress={seConnecter} />
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  input: { backgroundColor: colors.card, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontFamily: fonts.body, fontSize: 14, color: colors.ink },
  erreur: { color: colors.coral, fontSize: 13, marginTop: 10, fontFamily: fonts.body },
});
