import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Alert, Switch } from 'react-native';
import { colors, fonts } from '../../theme/colors';
import { HeroBand, SectionLabel, PrimaryButton, NavTile, StatusBadge, GhostButton, ListItemCard } from '../../components/Shared';
import { listerCreneauxPlanning, getStoredUserNom, deconnexion, getBaseUrl } from '../../services/apiService';
import * as SecureStore from 'expo-secure-store';
import { useLangue } from '../../context/LanguageContext';

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const TRANSLATIONS = {
  fr: {
    planning: 'Mon planning', planningSub: 'Tes creneaux d\'ecoute',
    aucunCreneau: 'Aucun creneau programme pour l\'instant.',
    ajouterCreneau: '+ Ajouter un creneau',
    seancePhysique: 'Seances physiques reservees aux psychologues partenaires certifies',
  },
  en: {
    planning: 'My schedule', planningSub: 'Your listening slots',
    aucunCreneau: 'No scheduled slots yet.',
    ajouterCreneau: '+ Add a time slot',
    seancePhysique: 'Physical sessions reserved for certified partner psychologists',
  },
};

function useEcoutantProfile() {
  const [profile, setProfile] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync('auth_token');
        const id = await SecureStore.getItemAsync('user_id');
        if (!token || !id) return;
      const res = await fetch(`${getBaseUrl()}/accounts/ecoutants/${id}/`, {
  headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
});

        if (res.ok) setProfile(await res.json());
      } catch (e) { /* silent */ }
    })();
  }, []);
  return profile;
}

export function EscaladeScreen({ route, navigation }) {
  const [gravite, setGravite] = useState(2);
  const [description, setDescription] = useState('');
  const labels = ['Faible', 'Moyen', 'Urgent'];

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper, padding: 20 }}>
      <HeroBand titre="Signaler une situation" sousTitre={route?.params?.pseudoAdo || 'ado'} />
      <SectionLabel>Niveau de gravite</SectionLabel>
      <View style={s.graviteRow}>
        {labels.map((l, i) => (
          <TouchableOpacity key={l} style={[s.gravitePill, i === gravite && s.gravitePillActive]} onPress={() => setGravite(i)}>
            <Text style={[s.graviteText, i === gravite && s.graviteTextActive]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <SectionLabel>Ce qui t'inquiete</SectionLabel>
      <TextInput style={s.textarea} placeholder="Decrire brievement la situation..." multiline numberOfLines={4}
        value={description} onChangeText={setDescription} />
      <PrimaryButton label="Envoyer au superviseur"
        onPress={() => { Alert.alert('Envoye', "Le superviseur a ete notifie."); navigation.goBack(); }} />
      <Text style={s.note}>La conversation reste ouverte pendant la prise en charge</Text>
    </View>
  );
}

export function EscaladeConfirmationScreen({ navigation }) {
  return (
    <View style={s.confirmContainer}>
      <View style={s.checkCircle}><Text style={{ fontSize: 26, color: '#fff' }}>{'>'}OK</Text></View>
      <Text style={s.confirmTitle}>Alerte transmise</Text>
      <Text style={s.confirmSub}>
        Un superviseur humain va prendre le relais. Tu peux continuer la conversation en attendant.
      </Text>
      <TouchableOpacity style={s.confirmBtn} onPress={() => navigation.popToTop()}>
        <Text style={s.confirmBtnText}>Revenir au tableau de bord</Text>
      </TouchableOpacity>
    </View>
  );
}

export function PlanningEcoutantScreen({ navigation }) {
  const [creneaux, setCreneaux] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [jourIndex, setJourIndex] = useState(0);
  const [heure, setHeure] = useState('');
  const [enCours, setEnCours] = useState(false);
  const { langue } = useLangue();
  const t = TRANSLATIONS[langue] || TRANSLATIONS.fr;

  useEffect(() => { chargerCreneaux(); }, []);

  const chargerCreneaux = async () => {
    try {
      const data = await listerCreneauxPlanning();
      setCreneaux(Array.isArray(data) ? data : []);
    } catch (e) { /* silent */ }
    finally { setChargement(false); }
  };

  const ajouterCreneau = async () => {
    if (!heure.trim()) { Alert.alert('Erreur', 'Entre une heure.'); return; }
    setEnCours(true);
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const res = await fetch(`${getBaseUrl()}/planning/creneaux/`, {
  method: 'POST',
  headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jour_semaine: jourIndex,
          heure: heure.trim(),
          type_creneau: 'cercle',
        }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(JSON.stringify(e)); }
      setShowForm(false);
      setHeure('');
      Alert.alert('Succes', 'Creneau ajoute !');
      await chargerCreneaux();
    } catch (e) {
      Alert.alert('Erreur', e.message || 'Impossible de creer le creneau.');
    } finally { setEnCours(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <HeroBand titre={t.planning} sousTitre={t.planningSub} />
        {chargement ? (
          <ActivityIndicator style={{ marginTop: 20 }} color={colors.ink} />
        ) : creneaux.length === 0 ? (
          <Text style={s.note}>{t.aucunCreneau}</Text>
        ) : (
          creneaux.map((c) => (
            <ListItemCard
              key={c.id}
              titre={JOURS[c.jour_semaine] + ' . ' + (c.heure || '')}
              sousTitre={c.type_creneau === 'cercle' ? 'Cercle: ' + (c.cercle_theme || 'Groupe') : 'Seance physique'}
              tag={<StatusBadge text={c.type_creneau} />}
            />
          ))
        )}
        {!showForm ? (
          <PrimaryButton label={t.ajouterCreneau} onPress={() => setShowForm(true)} />
        ) : (
          <View style={s.formCard}>
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
              <View style={{ flex: 1 }}><GhostButton label="Annuler" onPress={() => setShowForm(false)} /></View>
              <View style={{ flex: 1 }}><PrimaryButton label={enCours ? '...' : 'Ajouter'} onPress={ajouterCreneau} loading={enCours} /></View>
            </View>
          </View>
        )}
        <Text style={s.note}>
          Seances physiques reservees aux psychologues partenaires certifies
        </Text>
      </ScrollView>
    </View>
  );
}

export function ProfilEcoutantScreen({ navigation }) {
  const [nom, setNom] = useState('Ecoutant');
  const [statut, setStatut] = useState('');
  const [disponible, setDisponible] = useState(false);
  const [email, setEmail] = useState('');
  const [institution, setInstitution] = useState('');
  const [chargement, setChargement] = useState(true);
  const { langue } = useLangue();
  const t = TRANSLATIONS[langue] || TRANSLATIONS.fr;

  useEffect(() => {
    const charger = async () => {
      try {
        const storedNom = await getStoredUserNom();
        if (storedNom) setNom(storedNom);
        const token = await SecureStore.getItemAsync('auth_token');
        const id = await SecureStore.getItemAsync('user_id');
        if (token && id) {
          const res = await fetch(`${getBaseUrl()}/accounts/ecoutants/${id}/`, {
            headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
          });
          if (res.ok) {
            const data = await res.json();
            setNom(data.nom_complet || nom);
            setStatut(data.statut || '');
            setDisponible(data.disponible || false);
            setEmail(data.email || '');
            setInstitution(data.institution_partenaire || '');
            await SecureStore.setItemAsync('user_nom', data.nom_complet || nom);
            await SecureStore.setItemAsync('user_statut', data.statut || '');
          }
        }
      } catch (e) { /* silent */ }
      finally { setChargement(false); }
    };
    charger();
  }, []);

  const toggleDispo = async (val) => {
    setDisponible(val);
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const id = await SecureStore.getItemAsync('user_id');
      if (token && id) {
       await fetch(`${getBaseUrl()}/accounts/ecoutants/${id}/`, {
  method: 'PATCH',
  headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ disponible: val }),
        });
      }
    } catch (e) { setDisponible(!val); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper, padding: 20 }}>
      {chargement ? <ActivityIndicator color={colors.ink} style={{ marginTop: 40 }} /> : (
        <>
         <HeroBand titre={nom} sousTitre={`${langue === 'en' ? 'Status' : 'Statut'} : ${statut}`} />
          <SectionLabel>{langue === 'en' ? 'Information' : 'Informations'}</SectionLabel>
          <View style={s.infoCard}>
            <Text style={s.infoLine}>Email : {email || '-'}</Text>
            <Text style={s.infoLine}>{langue === 'en' ? 'Institution' : 'Institution'} : {institution || '-'}</Text>
            <Text style={s.infoLine}>{langue === 'en' ? 'Status' : 'Statut'} : {statut || '-'}</Text>
          </View>
          <SectionLabel>{langue === 'en' ? 'Availability' : 'Disponibilite'}</SectionLabel>
          <NavTile
            icon={<Text style={{ fontSize: 18 }}>D</Text>}
            label="Disponible pour les ados"
            sub={disponible ? 'Visible des ados' : 'Masque des ados'}
            accent={disponible ? colors.green : colors.inkSoft}
            trailing={<Switch value={disponible} onValueChange={toggleDispo} trackColor={{ true: colors.green }} />}
            onPress={() => toggleDispo(!disponible)}
          />
          <NavTile icon={<Text style={{ fontSize: 18 }}>N</Text>} label="Notifications" sub="Nouvelles demandes" accent={colors.inkSurface}
            trailing={<StatusBadge text="ON" />} onPress={() => {}} />
        </>
      )}
    </View>
  );
}

export function EcoutantParametresScreen({ navigation }) {
  const [notifOn, setNotifOn] = useState(true);
  const { langue, changerLangue: changerLangueGlobale } = useLangue();
  const [chargementLangue, setChargementLangue] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [ancienMdp, setAncienMdp] = useState('');
  const [nouveauMdp, setNouveauMdp] = useState('');
  const [confirmMdp, setConfirmMdp] = useState('');
  const [chargementMdp, setChargementMdp] = useState(false);

  useEffect(() => {
    setChargementLangue(false);
  }, []);

  const changerLangue = async (nouvelleLangue) => {
    changerLangueGlobale(nouvelleLangue);
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const id = await SecureStore.getItemAsync('user_id');
      if (token && id) {
        await fetch(`${getBaseUrl()}/accounts/ecoutants/${id}/`, {
          method: 'PATCH',
          headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ langue_preferee: nouvelleLangue }),
        });
      }
    } catch (e) { /* silent */ }
  };

  const changerMotDePasse = async () => {
    if (!ancienMdp || !nouveauMdp || !confirmMdp) {
      Alert.alert('Erreur', 'Remplis tous les champs.');
      return;
    }
    if (nouveauMdp !== confirmMdp) {
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
      const res = await fetch(`${getBaseUrl()}/accounts/auth/ado/changer-mot-de-passe/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ mot_de_passe_actuel: ancienMdp, nouveau_mot_de_passe: nouveauMdp }),
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('Succès', 'Mot de passe changé avec succès.');
        setShowPasswordForm(false);
        setAncienMdp('');
        setNouveauMdp('');
        setConfirmMdp('');
      } else {
        Alert.alert('Erreur', data.detail || 'Impossible de changer le mot de passe.');
      }
    } catch (e) {
      Alert.alert('Erreur', 'Erreur de connexion.');
    } finally {
      setChargementMdp(false);
    }
  };

  const t = TRANSLATIONS[langue] || TRANSLATIONS.fr;

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper, padding: 20 }}>
      <HeroBand titre={langue === 'en' ? 'Settings' : 'Parametres'} sousTitre={langue === 'en' ? 'Account settings' : 'Reglages de ton compte'} />
      <SectionLabel>{langue === 'en' ? 'Account' : 'Compte'}</SectionLabel>
      <NavTile icon={<Text style={{ fontSize: 18 }}>S</Text>} label={langue === 'en' ? 'Security' : 'Securite'} sub={langue === 'en' ? 'Change password' : 'Changer le mot de passe'} accent={colors.ink}
        onPress={() => setShowPasswordForm(!showPasswordForm)} />

      {showPasswordForm && (
        <View style={s.formCard}>
          <SectionLabel>Ancien mot de passe</SectionLabel>
          <TextInput style={s.formInput} placeholder="••••••••" secureTextEntry value={ancienMdp} onChangeText={setAncienMdp} />
          <SectionLabel>Nouveau mot de passe</SectionLabel>
          <TextInput style={s.formInput} placeholder="8 caractères minimum" secureTextEntry value={nouveauMdp} onChangeText={setNouveauMdp} />
          <SectionLabel>Confirmer</SectionLabel>
          <TextInput style={s.formInput} placeholder="Confirme le mot de passe" secureTextEntry value={confirmMdp} onChangeText={setConfirmMdp} />
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <View style={{ flex: 1 }}><GhostButton label="Annuler" onPress={() => setShowPasswordForm(false)} /></View>
            <View style={{ flex: 1 }}><PrimaryButton label={chargementMdp ? '...' : 'Changer'} onPress={changerMotDePasse} loading={chargementMdp} /></View>
          </View>
        </View>
      )}

      <NavTile icon={<Text style={{ fontSize: 18 }}>N</Text>} label="Notifications" sub={langue === 'en' ? 'New requests, alerts' : 'Nouvelles demandes, alertes'} accent={colors.amber}
        trailing={<Switch value={notifOn} onValueChange={setNotifOn} trackColor={{ true: colors.green }} />}
        onPress={() => setNotifOn(!notifOn)} />
      <SectionLabel>{langue === 'en' ? 'Preferences' : 'Preferences'}</SectionLabel>
      <NavTile icon={<Text style={{ fontSize: 18 }}>L</Text>} label={langue === 'en' ? 'Language' : 'Langue'}
        sub={langue === 'en' ? 'English' : 'Francais'} accent={colors.green}
        trailing={
          <View style={s.langueRow}>
            <TouchableOpacity
              style={[s.languePill, langue === 'fr' && s.languePillActive]}
              onPress={() => changerLangue('fr')}
            >
              <Text style={[s.langueText, langue === 'fr' && s.langueTextActive]}>FR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.languePill, langue === 'en' && s.languePillActive]}
              onPress={() => changerLangue('en')}
            >
              <Text style={[s.langueText, langue === 'en' && s.langueTextActive]}>EN</Text>
            </TouchableOpacity>
          </View>
        }
        onPress={() => changerLangue(langue === 'fr' ? 'en' : 'fr')} />
      <NavTile icon={<Text style={{ fontSize: 18 }}>F</Text>} label={langue === 'en' ? 'Help & training' : 'Aide & formation'} sub={langue === 'en' ? 'Review listening module' : "Revoir le module d'ecoute"} accent={colors.inkSurface}
        onPress={() => Alert.alert(langue === 'en' ? 'Training' : 'Formation', langue === 'en' ? 'Module in development.' : 'Module en cours de developpement.')} />
      <View style={{ flex: 1 }} />
      <GhostButton label={langue === 'en' ? 'Log out' : 'Se deconnecter'} color={colors.coral} onPress={async () => {
        await deconnexion();
        navigation.reset({ index: 0, routes: [{ name: 'ChoixRole' }] });
      }} />
    </View>
  );
}

const s = StyleSheet.create({
  graviteRow: { flexDirection: 'row', gap: 6 },
  gravitePill: { flex: 1, paddingVertical: 11, borderRadius: 12, backgroundColor: colors.card, alignItems: 'center' },
  gravitePillActive: { backgroundColor: colors.coral },
  graviteText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.inkSoft },
  graviteTextActive: { color: '#fff' },
  textarea: { backgroundColor: colors.card, borderRadius: 16, padding: 14, marginTop: 8, minHeight: 100, textAlignVertical: 'top', fontFamily: fonts.body, fontSize: 14 },
  note: { textAlign: 'center', fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, marginTop: 12 },
  confirmContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, backgroundColor: colors.inkSurface },
  checkCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  confirmTitle: { fontFamily: fonts.display, fontSize: 21, color: '#fff' },
  confirmSub: { fontFamily: fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 10, marginBottom: 28 },
  confirmBtn: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)', borderRadius: 14, paddingVertical: 14, width: '100%', alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontFamily: fonts.bodyBold, fontSize: 13 },
  formCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginTop: 12 },
  jourRow: { flexDirection: 'row', gap: 4, marginBottom: 12 },
  jourPill: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.paper, alignItems: 'center' },
  jourPillActive: { backgroundColor: colors.amber },
  jourText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.inkSoft },
  jourTextActive: { color: '#3A2410' },
  formInput: { backgroundColor: colors.paper, borderRadius: 12, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14, paddingVertical: 10, fontFamily: fonts.body, fontSize: 14, marginBottom: 12 },
  infoCard: { backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 12 },
  infoLine: { fontFamily: fonts.body, fontSize: 13, color: colors.ink, marginBottom: 4 },
  langueRow: { flexDirection: 'row', gap: 4 },
  languePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: colors.paper },
  languePillActive: { backgroundColor: colors.amber },
  langueText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.inkSoft },
  langueTextActive: { color: '#3A2410' },
});