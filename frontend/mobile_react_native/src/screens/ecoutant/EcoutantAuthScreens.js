import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Image, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { colors, fonts } from '../../theme/colors';
import { HeroBand, SectionLabel, NavTile, StatusBadge, PrimaryButton } from '../../components/Shared';
import { connexionEcoutant, listerConversations, listerCerclesEcoute, getStoredUserNom, getBaseUrl } from '../../services/apiService';
import * as SecureStore from 'expo-secure-store';
import { useLangue } from '../../context/LanguageContext';
import LanguagePicker from '../../components/LanguagePicker';

const TRADUCTIONS = {
  fr: {
    bonsoir: 'Bonsoir',
    merci: "Merci d'être là ce soir",
    disponible: 'Disponible',
    aujourd: "Aujourd'hui",
    attente: 'Demandes en attente',
    attenteSub: 'Nouveaux ados à accueillir',
    conversations: 'Mes conversations',
    conversationsSub: 'Ados que j\'écoute',
    nouveaux: 'Nouveaux messages',
    cercles: 'Mes cercles d\'écoute',
    cerclesSub: 'groupe(s) actif(s)',
    planning: 'Mon planning',
    planningSub: 'Créneaux à venir',
    profil: 'Mon profil',
    profilSub: 'Statut et disponibilité',
    creerCercle: 'Créer un cercle',
    creerCercleSub: 'Nouveau groupe d\'écoute',
    parametres: 'Paramètres',
    parametresSub: 'Réglages du compte',
  },
  en: {
    bonsoir: 'Good evening',
    merci: 'Thank you for being here tonight',
    disponible: 'Available',
    aujourd: 'Today',
    attente: 'Pending requests',
    attenteSub: 'New ados to welcome',
    conversations: 'My conversations',
    conversationsSub: 'Ados I\'m listening to',
    nouveaux: 'New messages',
    cercles: 'My listening circles',
    cerclesSub: 'active group(s)',
    planning: 'My schedule',
    planningSub: 'Upcoming slots',
    profil: 'My profile',
    profilSub: 'Status and availability',
    creerCercle: 'Create a circle',
    creerCercleSub: 'New listening group',
    parametres: 'Settings',
    parametresSub: 'Account settings',
  },
};

export function EcoutantWelcomeScreen({ navigation }) {
  const { langue } = useLangue();
  const t = langue === 'en'
    ? { title: 'Thank you for helping\npeople feel better', continue: 'Continue' }
    : { title: 'Merci de nous\naider à aller mieux', continue: 'Continuer' };
  return (
    <View style={s.welcomeContainer}>
      <Image source={require('../../../assets/logo_sangolo.png')} style={s.logo} resizeMode="contain" />
      <Text style={s.welcomeTitle}>{t.title}</Text>
      <View style={s.dots}>
        <View style={[s.dot, { backgroundColor: colors.amberDeep }]} />
        <View style={s.dot} /><View style={s.dot} />
      </View>
      <View style={{ height: 40 }} />
      <View style={{ width: '100%' }}>
        <PrimaryButton label={t.continue} onPress={() => navigation.navigate('EcoutantConnexion')} />
      </View>
    </View>
  );
}

export function EcoutantConnexionScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [chargement, setChargement] = useState(false);
  const { langue } = useLangue();
  const t = langue === 'en'
    ? { error: 'Error', missing: 'Please complete all fields.', invalid: 'Incorrect credentials.', title: 'Listener space', subtitle: 'Access reserved for approved volunteers', identifier: 'Email', password: 'Password', loading: 'Logging in...', login: 'Log in', note: 'Account created after approval by the partner organisation' }
    : { error: 'Erreur', missing: 'Remplis tous les champs.', invalid: 'Identifiants incorrects.', title: 'Espace écoutant', subtitle: 'Accès réservé aux volontaires validés', identifier: 'Identifiant', password: 'Mot de passe', loading: 'Connexion...', login: 'Se connecter', note: "Compte créé après validation par l'association partenaire" };

  const seConnecter = async () => {
    if (!email.trim() || !motDePasse.trim()) {
      Alert.alert(t.error, t.missing);
      return;
    }
    setChargement(true);
    try {
      await connexionEcoutant({ email: email.trim(), motDePasse });
      navigation.reset({ index: 0, routes: [{ name: 'EcoutantDashboard' }] });
    } catch (e) {
      Alert.alert(t.error, e.message || t.invalid);
    } finally {
      setChargement(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper, padding: 20 }}>
      <HeroBand titre={t.title} sousTitre={t.subtitle} />
      <SectionLabel>{t.identifier}</SectionLabel>
      <TextInput style={s.input} placeholder="toi@partenaire.org" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <SectionLabel>{t.password}</SectionLabel>
      <TextInput style={s.input} placeholder="••••••••" secureTextEntry value={motDePasse} onChangeText={setMotDePasse} />
      <View style={{ marginTop: 16 }}>
        <PrimaryButton label={chargement ? t.loading : t.login} onPress={seConnecter} loading={chargement} />
      </View>
      <Text style={s.note}>{t.note}</Text>
    </View>
  );
}

export function EcoutantDashboardScreen({ navigation }) {
  const [nom, setNom] = useState('Écoutant');
  const [stats, setStats] = useState({ enAttente: 0, enCours: 0, nonLus: 0 });
  const [cercles, setCercles] = useState([]);
  const [chargement, setChargement] = useState(true);
  const { langue } = useLangue();
  const t = TRADUCTIONS[langue] || TRADUCTIONS.fr;

  useEffect(() => {
    charger();
    const poller = setInterval(charger, 5000);
    return () => clearInterval(poller);
  }, []);

  const charger = async () => {
    try {
      const storedNom = await getStoredUserNom();
      if (storedNom) setNom(storedNom.split(' ')[0]);

      const token = await SecureStore.getItemAsync('auth_token');

      // Charger les stats des conversations (seulement celles de cet écoutant)
      const convRes = await fetch(`${getBaseUrl()}/messagerie/conversation-stats/`, {
        headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
      });
      if (convRes.ok) {
        const convData = await convRes.json();
        // Filtrer : seulement les conversations assignées à cet écoutant
        const mesConv = convData.filter(c => c.ecoutant !== null);
        const enAttente = mesConv.filter(c => c.statut === 'en_attente').length;
        const enCours = mesConv.filter(c => c.statut === 'en_cours').length;
        const nonLus = mesConv.reduce((sum, c) => sum + (c.messages_non_lus || 0), 0);
        setStats({ enAttente, enCours, nonLus });
      }

      // Charger les cercles
      const cercleData = await listerCerclesEcoute().catch(() => []);
      setCercles(Array.isArray(cercleData) ? cercleData : []);
    } catch (e) { /* silent */ }
    finally { setChargement(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <View style={{ padding: 20 }}>
        <View style={s.headerRow}>
          <View style={{ flex: 1 }}>
            <HeroBand titre={`${t.bonsoir} ${nom}`} sousTitre={t.merci}
              trailing={<View style={s.pillSolid}><Text style={s.pillSolidText}>🟢 {t.disponible}</Text></View>} />
          </View>
          <LanguagePicker light />
        </View>
        <SectionLabel>{t.aujourd}</SectionLabel>
        <NavTile icon={<Text style={{ fontSize: 18 }}>📥</Text>} label={t.attente} sub={t.attenteSub}
          accent={colors.amber}
          trailing={stats.enAttente > 0 ? <StatusBadge text={String(stats.enAttente)} color={colors.coral} /> : null}
          onPress={() => navigation.navigate('ConversationsAttente')} />
        <NavTile icon={<Text style={{ fontSize: 18 }}>💬</Text>} label={t.conversations} sub={t.conversationsSub}
          accent={colors.green}
          trailing={stats.enCours > 0 ? <StatusBadge text={String(stats.enCours)} /> : null}
          onPress={() => navigation.navigate('ConversationsActives')} />
        {stats.nonLus > 0 && (
          <NavTile icon={<Text style={{ fontSize: 18 }}>🔔</Text>} label={t.nouveaux} sub={`${stats.nonLus} message(s) non lu(s)`}
            accent={colors.coral}
            trailing={<StatusBadge text={String(stats.nonLus)} color={colors.coral} />}
            onPress={() => navigation.navigate('ConversationsActives', { filter: 'non_lus' })} />
        )}
        <NavTile icon={<Text style={{ fontSize: 18 }}>👥</Text>} label={t.cercles} sub={`${cercles.length} ${t.cerclesSub}`}
          accent={colors.inkSurface} onPress={() => navigation.navigate('CreerCercle')} />
        <NavTile icon={<Text style={{ fontSize: 18 }}>📅</Text>} label={t.planning} sub={t.planningSub}
          accent={colors.amber} onPress={() => navigation.navigate('PlanningEcoutant')} />
        <NavTile icon={<Text style={{ fontSize: 18 }}>👤</Text>} label={t.profil} sub={t.profilSub}
          accent={colors.green} onPress={() => navigation.navigate('ProfilEcoutant')} />
        <NavTile icon={<Text style={{ fontSize: 18 }}>➕</Text>} label={t.creerCercle} sub={t.creerCercleSub}
          accent={colors.green} onPress={() => navigation.navigate('CreerCercle')} />
        <NavTile icon={<Text style={{ fontSize: 18 }}>⚙️</Text>} label={t.parametres} sub={t.parametresSub}
          accent={colors.inkSurface} onPress={() => navigation.navigate('EcoutantParametres')} />
        <Text style={s.stats}>{stats.enAttente + stats.enCours} conversation(s) · {stats.nonLus} non lu(s)</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  welcomeContainer: { flex: 1, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  logo: { width: 200, height: 200, marginBottom: 28 },
  welcomeTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.ink, textAlign: 'center' },
  dots: { flexDirection: 'row', gap: 5, marginTop: 32 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.line },
  input: { backgroundColor: colors.card, borderRadius: 14, padding: 14, fontFamily: fonts.body, fontSize: 14 },
  note: { textAlign: 'center', color: colors.inkSoft, fontSize: 12, marginTop: 10, fontFamily: fonts.body },
  pillSolid: { backgroundColor: 'rgba(255,255,255,0.16)', paddingHorizontal: 11, paddingVertical: 5, borderRadius: 20 },
  pillSolidText: { color: '#fff', fontSize: 11, fontFamily: fonts.bodyBold },
  stats: { textAlign: 'center', fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, marginTop: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  langueBtn: { backgroundColor: colors.card, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  langueText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink },
});
