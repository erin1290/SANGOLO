import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { colors, fonts } from '../../theme/colors';
import { HeroBand, SectionLabel, PrimaryButton, GhostButton } from '../../components/Shared';
import { inscriptionAdo } from '../../services/apiService';

export default function InscriptionScreen({ navigation }) {
  const [pseudo, setPseudo] = useState('');
  const [age, setAge] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [voirMdp, setVoirMdp] = useState(false);

  const creerCompte = async () => {
    if (!pseudo.trim()) { setErreur('Choisis un pseudo.'); return; }
    if (pseudo.trim().length < 3) { setErreur('Le pseudo doit faire au moins 3 caractères.'); return; }
    if (motDePasse !== confirmation) { setErreur('Les mots de passe ne correspondent pas.'); return; }
    const ageInt = parseInt(age, 10);
    if (!ageInt || ageInt < 10 || ageInt > 99) { setErreur('Âge invalide (10-99).'); return; }
    setChargement(true);
    setErreur(null);
    try {
      await inscriptionAdo({ pseudo: pseudo.trim(), age: ageInt, motDePasse, consentementAnalyseIa: true });
      navigation.reset({ index: 0, routes: [{ name: 'Accueil' }] });
    } catch (e) {
      const msg = e.message || 'Erreur de connexion.';
      if (msg.toLowerCase().includes('déjà pris') || msg.toLowerCase().includes('already')) {
        setErreur('Ce pseudo est déjà pris. Choisis-en un autre.');
      } else {
        setErreur(msg);
      }
    } finally {
      setChargement(false);
    }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 20 }}>
      <HeroBand
        titre="Crée ton espace"
        sousTitre="Anonyme, juste pour toi"
        leading={<View style={s.logoChip}><Image source={require('../../../assets/logo_sangolo.png')} style={s.logoSmall} resizeMode="contain" /></View>}
      />
      <SectionLabel>Pseudo</SectionLabel>
      <TextInput style={s.input} placeholder="Choisis un pseudo (unique)" value={pseudo} onChangeText={setPseudo} autoCapitalize="none" />
      <SectionLabel>Âge</SectionLabel>
      <TextInput style={s.input} placeholder="16" keyboardType="number-pad" value={age} onChangeText={setAge} />
      <SectionLabel>Mot de passe</SectionLabel>
      <View style={s.passwordRow}>
        <TextInput style={[s.input, { flex: 1 }]} placeholder="8 caractères minimum" secureTextEntry={!voirMdp} value={motDePasse} onChangeText={setMotDePasse} />
        <TouchableOpacity style={s.eyeBtn} onPress={() => setVoirMdp(!voirMdp)}>
          <Text style={s.eyeText}>{voirMdp ? '🙈' : '👁️'}</Text>
        </TouchableOpacity>
      </View>
      <SectionLabel>Confirmation</SectionLabel>
      <View style={s.passwordRow}>
        <TextInput style={[s.input, { flex: 1 }]} placeholder="Confirme ton mot de passe" secureTextEntry={!voirMdp} value={confirmation} onChangeText={setConfirmation} />
        <TouchableOpacity style={s.eyeBtn} onPress={() => setVoirMdp(!voirMdp)}>
          <Text style={s.eyeText}>{voirMdp ? '🙈' : '👁️'}</Text>
        </TouchableOpacity>
      </View>
      {erreur ? <Text style={s.erreur}>{erreur}</Text> : null}
      <View style={{ marginTop: 18 }}>
        {chargement ? <ActivityIndicator color={colors.ink} size="large" /> : (
          <PrimaryButton label="Créer mon espace" onPress={creerCompte} />
        )}
      </View>
      <Text style={s.note}>Aucune donnée identifiante requise</Text>
      <View style={{ marginTop: 12 }}>
        <GhostButton label="J'ai déjà un compte — Se connecter" onPress={() => navigation.navigate('ConnexionAdo')} />
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  logoChip: { width: 60, height: 44, backgroundColor: colors.paper, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  logoSmall: { width: 44, height: 30 },
  input: { backgroundColor: colors.card, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontFamily: fonts.body, fontSize: 14, color: colors.ink },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  eyeText: { fontSize: 18 },
  erreur: { color: colors.coral, fontSize: 13, marginTop: 10, fontFamily: fonts.body },
  note: { textAlign: 'center', color: colors.inkSoft, fontSize: 12, marginTop: 10, fontFamily: fonts.body },
});