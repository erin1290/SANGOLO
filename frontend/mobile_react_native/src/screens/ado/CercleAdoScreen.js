import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../theme/colors';
import { HeroBand } from '../../components/Shared';
import { listerMessagesCercle, listerMembresCercle, getBaseUrl } from '../../services/apiService';
import { ChatService } from '../../services/chatService';
import * as SecureStore from 'expo-secure-store';

export default function CercleAdoScreen({ route, navigation }) {
  const { cercleId, cercleTheme } = route.params;
  const [messages, setMessages] = useState([]);
  const [texte, setTexte] = useState('');
  const [chargement, setChargement] = useState(true);
  const [membres, setMembres] = useState([]);
  const [restreint, setRestreint] = useState(false);
  const chatRef = useRef(null);
  const flatListRef = useRef(null);
  const userIdRef = useRef(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      userIdRef.current = await SecureStore.getItemAsync('user_id');
    })();

    const charger = async () => {
      try {
        const data = await listerMessagesCercle(cercleId);
        if (!ignore) setMessages(Array.isArray(data) ? data : []);
      } catch (e) { /* silent */ }
      finally { if (!ignore) setChargement(false); }
    };
    charger();

    // Charger les membres
    chargerMembres();

    const chat = new ChatService(`cercle-${cercleId}`);
    chatRef.current = chat;
    const unsubscribe = chat.onMessage((m) => {
      setMessages((prev) => {
        if (prev.some((p) => p.contenu === m.contenu && p.date_envoi === m.date_envoi)) return prev;
        return [...prev, m];
      });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });

    // Vérifier si le cercle est restreint APRÈS avoir initialisé le chat
    verifierRestreint();

    const poller = setInterval(() => { if (!ignore) charger(); }, 3000);

    return () => {
      ignore = true;
      clearInterval(poller);
      unsubscribe();
      chat.close();
    };
  }, [cercleId]);

  const chargerMembres = async () => {
    try {
      const data = await listerMembresCercle(cercleId);
      setMembres(Array.isArray(data) ? data : []);
    } catch (e) { /* silent */ }
  };

  const verifierRestreint = async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const res = await fetch(`${getBaseUrl()}/messagerie/cercles/${cercleId}/`, {
        headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setRestreint(data.restreint || false);
        // Bloquer/débloquer l'envoi dans le ChatService
        if (chatRef.current) {
          chatRef.current.setBloque(data.restreint || false);
        }
      }
    } catch (e) { /* silent */ }
  };

  const envoyer = () => {
    if (!texte.trim() || !chatRef.current || restreint) return;
    const msg = texte.trim();
    setTexte('');
    chatRef.current.send('ado', msg, { utilisateur_id: userIdRef.current });
  };

  const formatHeure = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  const nomsMembres = membres.map(m => m.pseudo || 'Ado').join(', ');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.paper }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={s.chatHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>Retour</Text></TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.headerName}>{cercleTheme}</Text>
            <Text style={s.headerSub}>{membres.length} membre(s) · {restreint ? 'Verrouillé' : 'Ouvert'}</Text>
          </View>
        </View>
      {chargement ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.ink} size="large" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, i) => item.id ? String(item.id) : String(i)}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => {
            const isMine = String(item.utilisateur) === String(userIdRef.current);
            const auteurLabel = item.pseudo_auteur || (item.utilisateur ? 'Membre' : 'Animateur');
            const isEcoutant = !item.utilisateur; // Si pas d'utilisateur, c'est l'écoutant
            return (
              <View style={[s.bubble, isMine ? s.bubbleMine : s.bubbleTheirs]}>
                {!isMine && (
                  <Text style={s.auteurLabel}>
                    {auteurLabel}{isEcoutant ? ' (écoutant)' : ''}
                  </Text>
                )}
                <Text style={isMine ? s.bubbleTextMine : s.bubbleText}>{item.contenu}</Text>
                <Text style={s.bubbleTime}>{formatHeure(item.date_envoi)}</Text>
              </View>
            );
          }}
        />
      )}
      {restreint ? (
        <View style={s.restrictedRow}>
          <Text style={s.restrictedText}>Groupe verrouillé par l'animateur</Text>
        </View>
      ) : (
        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            placeholder="Ecrire dans le groupe..."
            value={texte}
            onChangeText={setTexte}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity style={[s.sendBtn, !texte.trim() && { opacity: 0.5 }]} onPress={envoyer} disabled={!texte.trim()}>
            <Text style={{ color: '#fff', fontSize: 16 }}>{'>'}</Text>
          </TouchableOpacity>
        </View>
      )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  chatHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 16, padding: 10,
    backgroundColor: colors.inkSurface,
  },
  back: { color: '#fff', fontSize: 10, fontFamily: fonts.bodyBold },
  headerName: { fontFamily: fonts.bodyBold, fontSize: 14, color: '#fff' },
  headerSub: { fontFamily: fonts.body, fontSize: 10, color: 'rgba(255,255,255,0.6)' },
  bubble: { maxWidth: '78%', padding: 12, borderRadius: 18, marginBottom: 8 },
  bubbleTheirs: { backgroundColor: colors.card, alignSelf: 'flex-start' },
  bubbleMine: { backgroundColor: colors.amber, alignSelf: 'flex-end' },
  auteurLabel: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.inkSoft, marginBottom: 2 },
  bubbleText: { fontFamily: fonts.body, fontSize: 13, color: colors.ink },
  bubbleTextMine: { fontFamily: fonts.body, fontSize: 13, color: '#3A2410' },
  bubbleTime: { fontSize: 9, color: 'rgba(0,0,0,0.3)', marginTop: 4, alignSelf: 'flex-end' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 12, paddingBottom: 16, backgroundColor: colors.paper, borderTopWidth: 1, borderTopColor: colors.line },
  input: { flex: 1, backgroundColor: colors.card, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontFamily: fonts.body, fontSize: 14, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  restrictedRow: { padding: 16, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.line, alignItems: 'center' },
  restrictedText: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, fontStyle: 'italic' },
});