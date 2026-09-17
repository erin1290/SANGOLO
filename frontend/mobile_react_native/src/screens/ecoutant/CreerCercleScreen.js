import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { colors, fonts } from '../../theme/colors';
import { HeroBand, SectionLabel, PrimaryButton, StatusBadge, GhostButton, ListItemCard } from '../../components/Shared';
import { listerCerclesEcoute, creerCercle } from '../../services/apiService';
import * as SecureStore from 'expo-secure-store';
import { getBaseUrl } from '../../services/apiService';
import { useLangue } from '../../context/LanguageContext';

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const TRADUCTIONS = {
  fr: {
    cercles: 'Cercles d\'ecoute',
    creerGerer: 'Creer et gerer tes groupes',
    theme: 'Theme du cercle (ex: Pression scolaire)',
    creer: 'Creer le cercle',
    creation: 'Creation...',
    mesCercles: 'Mes cercles',
    aucunCercle: 'Aucun cercle cree.',
    ajouterCreneau: '+ Ajouter un creneau',
    jour: 'Jour',
    heure: 'Heure (ex: 14:30)',
    annuler: 'Annuler',
    ajouter: 'Ajouter',
    succes: 'Succes',
    cercleCree: 'Cercle cree !',
    creneauAjoute: 'Creneau ajoute au cercle !',
    erreur: 'Erreur',
    donneUnTheme: 'Donne un theme au cercle.',
    entreUneHeure: 'Entre une heure.',
    impossibleCreer: 'Impossible de creer le cercle.',
    impossibleCreneau: 'Impossible de creer le creneau.',
    seancePhysique: 'Seance physique',
  },
  en: {
    cercles: 'Listening circles',
    creerGerer: 'Create and manage your groups',
    theme: 'Circle theme (e.g. School pressure)',
    creer: 'Create circle',
    creation: 'Creating...',
    mesCercles: 'My circles',
    aucunCercle: 'No circles created.',
    ajouterCreneau: '+ Add a time slot',
    jour: 'Day',
    heure: 'Time (e.g. 14:30)',
    annuler: 'Cancel',
    ajouter: 'Add',
    succes: 'Success',
    cercleCree: 'Circle created!',
    creneauAjoute: 'Time slot added to circle!',
    erreur: 'Error',
    donneUnTheme: 'Give a theme to the circle.',
    entreUneHeure: 'Enter a time.',
    impossibleCreer: 'Unable to create circle.',
    impossibleCreneau: 'Unable to create time slot.',
    seancePhysique: 'Physical session',
  },
};

export default function CreerCercleScreen({ navigation }) {
  const [theme, setTheme] = useState('');
  const [cercles, setCercles] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [creerEnCours, setCreerEnCours] = useState(false);
  const [cercleSelectionne, setCercleSelectionne] = useState(null);
  const [showFormPlanning, setShowFormPlanning] = useState(false);
  const [jourIndex, setJourIndex] = useState(0);
  const [heure, setHeure] = useState('');
  const [enCoursPlanning, setEnCoursPlanning] = useState(false);
  const { langue } = useLangue();
  const t = TRADUCTIONS[langue] || TRADUCTIONS.fr;

  useEffect(() => { chargerCercles(); }, []);

  const chargerCercles = async () => {
    try {
      const data = await listerCerclesEcoute();
      setCercles(Array.isArray(data) ? data : []);
    } catch (e) { /* silent */ }
    finally { setChargement(false); }
  };

  const handleCreer = async () => {
    if (!theme.trim()) { Alert.alert(t.erreur, t.donneUnTheme); return; }
    setCreerEnCours(true);
    try {
      await creerCercle({ theme: theme.trim() });
      setTheme('');
      Alert.alert(t.succes, t.cercleCree);
      await chargerCercles();
    } catch (e) {
      Alert.alert(t.erreur, e.message || t.impossibleCreer);
    } finally {
      setCreerEnCours(false);
    }
  };

  const ajouterCreneau = async () => {
    if (!heure.trim()) { Alert.alert(t.erreur, t.entreUneHeure); return; }
    if (!cercleSelectionne) { Alert.alert(t.erreur, 'Selectionne un cercle.'); return; }
    setEnCoursPlanning(true);
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const res = await fetch(`${getBaseUrl()}/planning/creneaux/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cercle: cercleSelectionne.id,
          jour_semaine: jourIndex,
          heure: heure.trim(),
          type_creneau: 'cercle',
        }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(JSON.stringify(e)); }
      setShowFormPlanning(false);
      setHeure('');
      setCercleSelectionne(null);
      Alert.alert('Succes', 'Creneau ajoute au cercle !');
      await chargerCercles();
    } catch (e) {
      Alert.alert('Erreur', e.message || 'Impossible de creer le creneau.');
    } finally { setEnCoursPlanning(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>{'<' } Retour</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flex: 1, padding: 16 }}>
        <HeroBand titre={t.cercles} sousTitre={t.creerGerer} />
        <SectionLabel>{langue === 'en' ? 'Create a new circle' : 'Creer un nouveau cercle'}</SectionLabel>
        <TextInput style={s.input} placeholder={t.theme} value={theme} onChangeText={setTheme} />
        <PrimaryButton label={creerEnCours ? t.creation : t.creer} onPress={handleCreer} loading={creerEnCours} />
        <SectionLabel>{t.mesCercles} ({cercles.length})</SectionLabel>
        {chargement ? <ActivityIndicator style={{ marginTop: 16 }} color={colors.ink} /> : (
          cercles.length === 0 ? <Text style={s.empty}>{t.aucunCercle}</Text> : (
            <FlatList
              data={cercles}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <View style={[s.card, cercleSelectionne?.id === item.id && s.cardSelected]}>
                  <TouchableOpacity
                    onPress={() => {
                      setCercleSelectionne(item);
                      setShowFormPlanning(true);
                    }}
                  >
                    <View style={s.cardRow}>
                      <Text style={s.cardTheme}>{item.theme}</Text>
                      <StatusBadge text={item.actif ? 'actif' : 'inactif'} color={item.actif ? colors.green : colors.inkSoft} />
                    </View>
                    <Text style={s.cardSub}>{item.nombre_membres || 0} membre(s) · {item.restreint ? 'Verrouille' : 'Ouvert'}</Text>
                    {item.creneaux && item.creneaux.length > 0 && (
                      <View style={s.creneauxList}>
                        {item.creneaux.map((c) => (
                          <View key={c.id} style={s.creneauItem}>
                            <Text style={s.creneauText}>{JOURS[c.jour_semaine]} {c.heure}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>
                  <View style={s.actionsRow}>
                    <TouchableOpacity style={s.actionBtn} onPress={() => navigation.navigate('CercleModeration', { cercleId: item.id, cercleTheme: item.theme })}>
                      <Text style={s.actionBtnText}>Ouvrir le chat</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.actionBtn, s.actionBtnSecondary]} onPress={() => {
                      setCercleSelectionne(item);
                      setShowFormPlanning(true);
                    }}>
                      <Text style={s.actionBtnText}>Planning</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )
        )}

        {/* Formulaire planning pour le cercle selectionne */}
        {showFormPlanning && cercleSelectionne && (
          <View style={s.formCard}>
            <SectionLabel>Ajouter un creneau a "{cercleSelectionne.theme}"</SectionLabel>
            <SectionLabel>Jour</SectionLabel>
            <View style={s.jourRow}>
              {JOURS.map((j, i) => (
                <TouchableOpacity key={j} style={[s.jourPill, i === jourIndex && s.jourPillActive]} onPress={() => setJourIndex(i)}>
                  <Text style={[s.jourText, i === jourIndex && s.jourTextActive]}>{j}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <SectionLabel>Heure (ex: 14:30)</SectionLabel>
            <TextInput style={s.formInput} placeholder="14:30" value={heure} onChangeText={setHeure} keyboardType="default" />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}><GhostButton label="Annuler" onPress={() => { setShowFormPlanning(false); setCercleSelectionne(null); }} /></View>
              <View style={{ flex: 1 }}><PrimaryButton label={enCoursPlanning ? '...' : 'Ajouter'} onPress={ajouterCreneau} loading={enCoursPlanning} /></View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 44, paddingBottom: 4 },
  backBtn: { paddingVertical: 6, paddingHorizontal: 4 },
  backText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  input: { backgroundColor: colors.card, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontFamily: fonts.body, fontSize: 14, color: colors.ink, marginBottom: 12 },
  empty: { textAlign: 'center', color: colors.inkSoft, fontFamily: fonts.body, fontSize: 13, marginTop: 16 },
  card: { backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 8 },
  cardSelected: { borderWidth: 2, borderColor: colors.amber },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTheme: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
  cardSub: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, marginTop: 4 },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionBtn: { flex: 1, backgroundColor: colors.green, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  actionBtnSecondary: { backgroundColor: colors.amber },
  actionBtnText: { fontFamily: fonts.bodyBold, fontSize: 12, color: '#fff' },
  creneauxList: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 },
  creneauItem: { backgroundColor: colors.paper, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  creneauText: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft },
  formCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginTop: 12 },
  jourRow: { flexDirection: 'row', gap: 4, marginBottom: 12 },
  jourPill: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.paper, alignItems: 'center' },
  jourPillActive: { backgroundColor: colors.amber },
  jourText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.inkSoft },
  jourTextActive: { color: '#3A2410' },
  formInput: { backgroundColor: colors.paper, borderRadius: 12, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14, paddingVertical: 10, fontFamily: fonts.body, fontSize: 14, marginBottom: 12 },
});