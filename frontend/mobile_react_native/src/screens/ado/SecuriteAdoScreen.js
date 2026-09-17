import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Switch, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { colors, fonts } from '../../theme/colors';
import { HeroBand, SectionLabel, NavTile, StatusBadge, GhostButton, PrimaryButton } from '../../components/Shared';
import { deconnexion } from '../../services/apiService';

export default function SecuriteAdoScreen({ navigation }) {
  const [biometriqueActive, setBiometriqueActive] = useState(false);
  const [mdpActuel, setMdpActuel] = useState('');
  const [nouveauMdp, setNouveauMdp] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [voirMdp, setVoirMdp] = useState(false);
  const [chargementMdp, setChargementMdp] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync('securite_biometrique').then((v) => {
      if (v === 'true') setBiometriqueActive(true);
    });
  }, []);

  const toggleBiometrique = async (value) => {
    if (value) {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        Alert.alert('Non disponible', "Face ID n'est pas disponible sur cet appareil.");
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Active la sécurité biométrique',
      });
      if (result.success) {
        await SecureStore.setItemAsync('securite_biometrique', 'true');
        setBiometriqueActive(true);
      }
    } else {
      await SecureStore.setItemAsync('securite_biometrique', 'false');
      setBiometriqueActive(false);
    }
  };

  const changerMdp = async () => {
    if (!mdpActuel.trim() || !nouveauMdp.trim()) {
      Alert.alert('Erreur', 'Remplis tous les champs.');
      return;
    }
    if (nouveauMdp !== confirmation) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }
    if (nouveauMdp.length < 8) {
      Alert.alert('Erreur', 'Le mot de passe doit faire au moins 8 caractères.');
      return;
    }
    setChargementMdp(true);
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const baseUrl = 'http://192.168.100.111:8000/api';
      const res = await fetch(`${baseUrl}/accounts/auth/ado/changer-mot-de-passe/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Token ${token}` },
        body: JSON.stringify({ mot_de_passe_actuel: mdpActuel, nouveau_mot_de_passe: nouveauMdp }),
      });
      if (res.ok) {
        Alert.alert('Succès', 'Mot de passe changé !');
        setMdpActuel('');
        setNouveauMdp('');
        setConfirmation('');
      } else {
        const data = await res.json();
        Alert.alert('Erreur', data.detail || 'Impossible de changer le mot de passe.');
      }
    } catch (e) {
      Alert.alert('Erreur', e.message || 'Erreur de connexion.');
    } finally {
      setChargementMdp(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>‹ Retour</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flex: 1, padding: 20 }}>
        <HeroBand titre="Sécurité" sousTitre="Protège ton espace" />
        <SectionLabel>Authentification</SectionLabel>
        <View style={s.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.switchLabel}>Face ID / Empreinte</Text>
            <Text style={s.switchSub}>Déverrouillage biométrique à l'ouverture</Text>
          </View>
          <Switch
            value={biometriqueActive}
            onValueChange={toggleBiometrique}
            trackColor={{ false: colors.line, true: colors.green }}
            thumbColor="#fff"
          />
        </View>
        <SectionLabel>Changer le mot de passe</SectionLabel>
        <View style={s.mdpField}>
          <TextInput style={s.mdpInput} placeholder="Mot de passe actuel"
            secureTextEntry={!voirMdp} value={mdpActuel} onChangeText={setMdpActuel} />
          <TouchableOpacity onPress={() => setVoirMdp(!voirMdp)} style={s.voirBtn}>
            <Text style={s.voirText}>{voirMdp ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>
        <TextInput style={s.mdpInputFull} placeholder="Nouveau mot de passe"
          secureTextEntry={!voirMdp} value={nouveauMdp} onChangeText={setNouveauMdp} />
        <TextInput style={s.mdpInputFull} placeholder="Confirmer le mot de passe"
          secureTextEntry={!voirMdp} value={confirmation} onChangeText={setConfirmation} />
        <View style={{ marginTop: 12 }}>
          <PrimaryButton label={chargementMdp ? 'Changement...' : 'Changer le mot de passe'}
            onPress={changerMdp} loading={chargementMdp} />
        </View>
        <SectionLabel>Confidentialité</SectionLabel>
        <NavTile icon={<Text style={{ fontSize: 18 }}>🗑️</Text>} label="Supprimer mon compte" sub="Action irréversible"
          accent={colors.coral} onPress={() => Alert.alert('Attention', 'Es-tu sûr(e) ? Cette action est irréversible.', [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Supprimer', style: 'destructive', onPress: () => {} },
          ])} />
        <View style={{ flex: 1 }} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 44, paddingBottom: 4 },
  backBtn: { paddingVertical: 6, paddingHorizontal: 4 },
  backText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  switchRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderRadius: 16, padding: 15, marginBottom: 10,
  },
  switchLabel: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.ink },
  switchSub: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft, marginTop: 2 },
  mdpField: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 14, marginBottom: 8 },
  mdpInput: { flex: 1, backgroundColor: colors.card, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontFamily: fonts.body, fontSize: 14, color: colors.ink },
  mdpInputFull: { backgroundColor: colors.card, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontFamily: fonts.body, fontSize: 14, color: colors.ink, marginBottom: 8 },
  voirBtn: { paddingHorizontal: 14, paddingVertical: 14 },
  voirText: { fontSize: 18 },
});