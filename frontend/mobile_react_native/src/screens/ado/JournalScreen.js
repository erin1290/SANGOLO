import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Modal, Image, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { colors, fonts } from '../../theme/colors';
import { HeroBand, SectionLabel, PrimaryButton, GhostButton } from '../../components/Shared';
import { listerEntreesJournal, creerEntreeJournalTexte, envoyerFichierJournal, getBaseUrl } from '../../services/apiService';

let Audio = null;
try {
  Audio = require('expo-av').Audio;
} catch (e) {
  console.warn('expo-av non disponible (Expo Go) - audio désactivé');
}

const HUMEURS = [
  { key: 'content', label: 'Content' },
  { key: 'neutre', label: 'Neutre' },
  { key: 'triste', label: 'Triste' },
  { key: 'colere', label: 'En colère' },
];

function PinModal({ visible, onValide, onAnnule }) {
  const [pin, setPin] = useState('');
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={pinS.overlay}>
        <View style={pinS.box}>
          <Text style={pinS.title}>Code PIN Journal</Text>
          <Text style={pinS.sub}>Entre ton code à 4 chiffres</Text>
          <TextInput style={pinS.input} keyboardType="number-pad" maxLength={4} secureTextEntry
            value={pin} onChangeText={setPin} autoFocus />
          <View style={pinS.btnRow}>
            <GhostButton label="Annuler" onPress={onAnnule} />
            <PrimaryButton label="Valider" onPress={() => { if (pin.length === 4) onValide(pin); }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SetupPinModal({ visible, onSet, onAnnule }) {
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={pinS.overlay}>
        <View style={pinS.box}>
          <Text style={pinS.title}>Définir un code PIN</Text>
          <Text style={pinS.sub}>Ce code protégera ton journal</Text>
          <TextInput style={pinS.input} placeholder="Code à 4 chiffres" keyboardType="number-pad" maxLength={4} secureTextEntry
            value={pin} onChangeText={setPin} autoFocus />
          <TextInput style={pinS.input} placeholder="Confirmer le code" keyboardType="number-pad" maxLength={4} secureTextEntry
            value={confirm} onChangeText={setConfirm} />
          {pin && confirm && pin !== confirm && <Text style={{ color: colors.coral, fontSize: 12, marginTop: 4 }}>Les codes ne correspondent pas</Text>}
          <View style={pinS.btnRow}>
            <GhostButton label="Annuler" onPress={onAnnule} />
            <PrimaryButton label="Définir" onPress={() => { if (pin.length === 4 && pin === confirm) onSet(pin); }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function EntreeDetail({ entree, onClose }) {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playAudio = async () => {
    if (!Audio) {
      Alert.alert('Non disponible', 'Lecture audio non supportée dans Expo Go. Utilisez un Development Build (npx expo run:android).');
      return;
    }
    if (sound) {
      if (isPlaying) { await sound.stopAsync(); setIsPlaying(false); }
      else { await sound.playAsync(); setIsPlaying(true); }
    } else if (entree.fichier_audio) {
      try {
        const audioUrl = entree.fichier_audio.startsWith('http')
          ? entree.fichier_audio
          : getBaseUrl().replace('/api', '') + entree.fichier_audio;
        const { sound: newSound } = await Audio.Sound.createAsync({ uri: audioUrl });
        setSound(newSound);
        setIsPlaying(true);
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) setIsPlaying(false);
        });
        await newSound.playAsync();
      } catch (e) {
        Alert.alert('Erreur', "Impossible de lire l'audio.");
      }
    }
  };

  useEffect(() => {
    return () => { if (sound) sound.unloadAsync(); };
  }, [sound]);

  const photoUrl = entree.fichier_photo
    ? (entree.fichier_photo.startsWith('http') ? entree.fichier_photo : getBaseUrl().replace('/api', '') + entree.fichier_photo)
    : null;

  return (
    <Modal visible={true} transparent animationType="slide">
      <View style={detailS.overlay}>
        <ScrollView contentContainerStyle={detailS.box}>
          <View style={detailS.header}>
            <Text style={detailS.title}>{HUMEURS.find(h => h.key === entree.humeur)?.label || entree.humeur}</Text>
            <TouchableOpacity onPress={onClose}><Text style={detailS.close}>X</Text></TouchableOpacity>
          </View>
          {entree.texte ? <Text style={detailS.text}>{entree.texte}</Text> : null}
          {photoUrl && (
            <Image source={{ uri: photoUrl }} style={detailS.photo} resizeMode="cover" />
          )}
          {entree.fichier_audio && Audio && (
            <TouchableOpacity style={detailS.audioBtn} onPress={playAudio}>
              <Text style={detailS.audioBtnText}>{isPlaying ? 'Arrêter' : 'Lire l\'audio'}</Text>
            </TouchableOpacity>
          )}
          <Text style={detailS.date}>{entree.date_creation ? new Date(entree.date_creation).toLocaleString('fr-FR') : ''}</Text>
          <GhostButton label="Fermer" onPress={onClose} />
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function JournalScreen({ navigation }) {
  const [humeurIndex, setHumeurIndex] = useState(1);
  const [texte, setTexte] = useState('');
  const [historique, setHistorique] = useState([]);
  const [enregistrement, setEnregistrement] = useState(null);
  const [enTrainDEnregistrer, setEnTrainDEnregistrer] = useState(false);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [verrouille, setVerrouille] = useState(true);
  const [pinActif, setPinActif] = useState(false);
  const [showSetupPin, setShowSetupPin] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);

  useEffect(() => {
    SecureStore.getItemAsync('journal_pin').then((v) => {
      if (v) { setPinActif(true); setVerrouille(true); }
      else { setVerrouille(false); }
    });
  }, []);

  const validerPin = (pin) => {
    SecureStore.getItemAsync('journal_pin').then((stored) => {
      if (pin === stored) { setVerrouille(false); setShowPinModal(false); }
      else Alert.alert('Erreur', 'Code incorrect.');
    });
  };

  const definirPin = (pin) => {
    SecureStore.setItemAsync('journal_pin', pin).then(() => {
      setPinActif(true);
      setVerrouille(false);
      setShowSetupPin(false);
      Alert.alert('Succès', 'Code PIN défini pour ton journal.');
    });
  };

  useEffect(() => { if (!verrouille) chargerHistorique(); }, [verrouille]);

  const chargerHistorique = async () => {
    try {
      const data = await listerEntreesJournal();
      setHistorique(data);
    } catch (e) { /* historique non bloquant */ }
  };

  const enregistrer = async () => {
    if (!texte.trim() && !enregistrement) return;
    setEnvoiEnCours(true);
    try {
      await creerEntreeJournalTexte({ humeur: HUMEURS[humeurIndex].key, texte: texte.trim() });
      setTexte('');
      Alert.alert('Succès', 'Entrée enregistrée !');
      await chargerHistorique();
    } catch (e) {
      Alert.alert('Erreur', e.message || "Impossible d'enregistrer l'entrée.");
    } finally { setEnvoiEnCours(false); }
  };

  const basculerAudio = async () => {
    if (!Audio) {
      Alert.alert('Non disponible', 'Enregistrement audio non supporté dans Expo Go. Utilisez un Development Build (npx expo run:android).');
      return;
    }
    if (!enregistrement) {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission requise', "Autorise l'accès au microphone."); return; }
      try {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        setEnregistrement(recording);
        setEnTrainDEnregistrer(true);
      } catch (e) { Alert.alert('Erreur', e.message || "Impossible de démarrer l'enregistrement."); }
    } else {
      try {
        setEnTrainDEnregistrer(false);
        await enregistrement.stopAndUnloadAsync();
        const uri = enregistrement.getURI();
        setEnregistrement(null);
        setEnvoiEnCours(true);
        await envoyerFichierJournal({ humeur: HUMEURS[humeurIndex].key, uri, champ: 'fichier_audio', nomFichier: 'journal.m4a' });
        Alert.alert('Succès', 'Audio enregistré !');
        await chargerHistorique();
      } catch (e) { Alert.alert('Erreur', e.message || "Impossible d'envoyer l'audio.");
      } finally { setEnvoiEnCours(false); }
    }
  };

  const choisirPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission requise', "Autorise l'accès à la galerie."); return; }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
      if (result.canceled) return;
      setEnvoiEnCours(true);
      await envoyerFichierJournal({ humeur: HUMEURS[humeurIndex].key, uri: result.assets[0].uri, champ: 'fichier_photo', nomFichier: 'journal.jpg' });
      Alert.alert('Succès', 'Photo enregistrée !');
      await chargerHistorique();
    } catch (e) { Alert.alert('Erreur', e.message || "Impossible d'envoyer la photo.");
    } finally { setEnvoiEnCours(false); }
  };

  if (verrouille) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.paper }}>
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}><Text style={s.backText}>{'< Retour'}</Text></TouchableOpacity>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 }}>
          <Text style={{ fontSize: 40, marginBottom: 16 }}>🔒</Text>
          <Text style={{ fontFamily: fonts.display, fontSize: 18, color: colors.ink, textAlign: 'center' }}>Journal verrouillé</Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, textAlign: 'center', marginTop: 6, marginBottom: 24 }}>
            Entre ton code PIN pour accéder à ton journal
          </Text>
          <PrimaryButton label="Entrer le code PIN" onPress={() => setShowPinModal(true)} />
        </View>
        <PinModal visible={showPinModal} onValide={validerPin} onAnnule={() => { setShowPinModal(false); navigation.goBack(); }} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
        <Text style={s.backText}>{'< Retour'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {
          if (pinActif) {
            Alert.alert('Sécurité journal', 'Désactiver le code PIN ?', [
              { text: 'Non', style: 'cancel' },
              { text: 'Oui', onPress: () => { SecureStore.deleteItemAsync('journal_pin'); setPinActif(false); Alert.alert('OK', 'PIN désactivé.'); }},
            ]);
          } else { setShowSetupPin(true); }
        }}>
          <Text style={s.pinBtn}>{pinActif ? 'PIN actif' : 'Securiser'}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <HeroBand titre="Mon journal" sousTitre="Ce que tu écris ici reste privé" />
        <SectionLabel>Aujourd'hui, je me sens...</SectionLabel>
        <View style={s.moodRow}>
          {HUMEURS.map((h, i) => (
            <TouchableOpacity key={h.key} style={[s.moodPill, i === humeurIndex && s.moodPillActive]} onPress={() => setHumeurIndex(i)}>
              <Text style={[s.moodPillText, i === humeurIndex && s.moodPillTextActive]}>{h.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput style={s.textarea} placeholder="Ce que je ressens aujourd'hui..." multiline numberOfLines={4} value={texte} onChangeText={setTexte} />
        <View style={s.attachRow}>
          {Audio && (
            <TouchableOpacity style={[s.attachChip, enTrainDEnregistrer && s.attachChipActive]} onPress={basculerAudio}>
              <Text style={[s.attachChipText, enTrainDEnregistrer && s.attachChipTextActive]}>{enTrainDEnregistrer ? 'Arrêter' : 'Audio'}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.attachChip} onPress={choisirPhoto}>
            <Text style={s.attachChipText}>Photo</Text>
          </TouchableOpacity>
        </View>
        <PrimaryButton label={envoiEnCours ? 'Envoi...' : 'Enregistrer'} onPress={enregistrer} loading={envoiEnCours} />
        <SectionLabel>Historique ({historique.length})</SectionLabel>
        {historique.length === 0 && <Text style={s.emptyText}>Aucune entrée pour l'instant.</Text>}
        {historique.map((entree) => (
          <TouchableOpacity key={entree.id} style={s.historyItem} onPress={() => setSelectedEntry(entree)}>
            <View style={{ flex: 1 }}>
              <Text style={s.historyMeta}>{HUMEURS.find(h => h.key === entree.humeur)?.label || entree.humeur}</Text>
              {entree.texte ? <Text style={s.historyText} numberOfLines={2}>{entree.texte}</Text> : null}
              {entree.type_contenu === 'audio' && <Text style={s.historyTag}>Audio</Text>}
              {entree.type_contenu === 'photo' && <Text style={s.historyTag}>Photo</Text>}
            </View>
            <Text style={s.historySub}>{entree.date_creation ? new Date(entree.date_creation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <SetupPinModal visible={showSetupPin} onSet={definirPin} onAnnule={() => setShowSetupPin(false)} />
      {selectedEntry && <EntreeDetail entree={selectedEntry} onClose={() => setSelectedEntry(null)} />}
    </View>
  );
}

const s = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 44, paddingBottom: 4 },
  backBtn: { paddingVertical: 6, paddingHorizontal: 4 },
  backText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  pinBtn: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.amberDeep, paddingVertical: 6, paddingHorizontal: 10 },
  moodRow: { flexDirection: 'row', gap: 6 },
  moodPill: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.card, alignItems: 'center' },
  moodPillActive: { backgroundColor: colors.amber },
  moodPillText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.inkSoft },
  moodPillTextActive: { color: '#3A2410' },
  textarea: { backgroundColor: colors.card, borderRadius: 16, padding: 14, marginTop: 14, minHeight: 100, textAlignVertical: 'top', fontFamily: fonts.body, fontSize: 14, color: colors.ink },
  attachRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  attachChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: colors.line },
  attachChipActive: { backgroundColor: colors.coral, borderColor: colors.coral },
  attachChipText: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: colors.ink },
  attachChipTextActive: { color: '#fff' },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: colors.card, borderRadius: 12, padding: 12, marginBottom: 6 },
  historyMeta: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink },
  historyText: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, marginTop: 2 },
  historyTag: { fontFamily: fonts.body, fontSize: 11, color: colors.amberDeep, marginTop: 2 },
  historySub: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft, alignSelf: 'flex-start', marginTop: 2 },
  emptyText: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, textAlign: 'center', marginTop: 16 },
});

const pinS = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  box: { backgroundColor: '#fff', borderRadius: 20, padding: 28, width: '85%', alignItems: 'center' },
  title: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.ink, marginBottom: 6 },
  sub: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, marginBottom: 16 },
  input: { backgroundColor: colors.paper, borderRadius: 12, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 16, paddingVertical: 12, fontSize: 18, fontFamily: fonts.bodyBold, textAlign: 'center', width: '100%', marginBottom: 10, letterSpacing: 8 },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 8, width: '100%' },
});

const detailS = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  box: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: '40%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.ink },
  close: { fontSize: 20, color: colors.inkSoft, padding: 4 },
  text: { fontFamily: fonts.body, fontSize: 15, color: colors.ink, lineHeight: 22, marginBottom: 12 },
  photo: { width: '100%', height: 200, borderRadius: 14, marginBottom: 12 },
  audioBtn: { backgroundColor: colors.amber, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 12 },
  audioBtnText: { fontFamily: fonts.bodyBold, fontSize: 13, color: '#3A2410' },
  date: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, marginBottom: 16 },
});