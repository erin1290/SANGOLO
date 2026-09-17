import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { colors, fonts } from '../../theme/colors';
import { HeroBand, SectionLabel, PrimaryButton } from '../../components/Shared';

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
      const baseUrl = 'http://192.168.100.111:8000/api';
      const res = await fetch(`${baseUrl}/accounts/auth/superviseur/connexion/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), mot_de_passe: motDePasse }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Identifiants incorrects.');
      await SecureStore.setItemAsync('auth_token', data.token);
      if (data.nom_complet) await SecureStore.setItemAsync('user_nom', data.nom_complet);
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