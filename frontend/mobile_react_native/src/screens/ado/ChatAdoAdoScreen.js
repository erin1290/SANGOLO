import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { colors, fonts } from '../../theme/colors';
import { useLangue } from '../../context/LanguageContext';
import { listerMessagesAdo, envoyerMessageAdo, getBaseUrl } from '../../services/apiService';
import * as SecureStore from 'expo-secure-store';

export default function ChatAdoAdoScreen({ route, navigation }) {
  const { langue } = useLangue();
  const t = langue === 'en' ? { peer: 'Peer', loading: 'Loading...', input: 'Write a message...' } : { peer: 'Pair', loading: 'Chargement...', input: 'Écrire un message...' };
  const { conversationId, destinatairePseudo } = route.params;
  const [messages, setMessages] = useState([]);
  const [texte, setTexte] = useState('');
  const [chargement, setChargement] = useState(true);
  const flatListRef = useRef(null);
  const userIdRef = useRef(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      userIdRef.current = await SecureStore.getItemAsync('user_id');
    })();

    const charger = async () => {
      try {
        const data = await listerMessagesAdo(conversationId);
        if (!ignore) setMessages(Array.isArray(data) ? data : data.results || []);
      } catch (e) { /* silent */ }
      finally { if (!ignore) setChargement(false); }
    };
    charger();

    const poller = setInterval(() => { if (!ignore) charger(); }, 3000);

    // Marquer comme lus
    marquerCommeLu();

    return () => {
      ignore = true;
      clearInterval(poller);
    };
  }, [conversationId]);

  const marquerCommeLu = async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      await fetch(`${getBaseUrl()}/messagerie/messages-ado/marquer-lus/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversationId }),
      });
    } catch (e) { /* silent */ }
  };

  const envoyer = async () => {
    if (!texte.trim()) return;
    const msg = texte.trim();
    setTexte('');
    const tempMsg = {
      id: Date.now(),
      auteur: parseInt(userIdRef.current),
      contenu: msg,
      date_envoi: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    try {
      await envoyerMessageAdo(conversationId, msg);
    } catch (e) {
      // Le message temporaire reste visible
    }
  };

  const formatHeure = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.paper }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>{'<'}</Text>
        </TouchableOpacity>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{destinatairePseudo.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.headerName}>{destinatairePseudo}</Text>
          <Text style={s.headerStatus}>{t.peer}</Text>
        </View>
      </View>
      {chargement ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft }}>{t.loading}</Text>
        </View>
      ) : messages.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 }}>
          <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft, textAlign: 'center' }}>
            Commence la conversation !{'\n'}Tu es dans le même cercle.
          </Text>
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
            const isMine = String(item.auteur) === String(userIdRef.current);
            return (
              <View style={[s.bubble, isMine ? s.bubbleMine : s.bubbleTheirs]}>
                <Text style={isMine ? s.bubbleTextMine : s.bubbleText}>{item.contenu}</Text>
                <Text style={s.bubbleTime}>{formatHeure(item.date_envoi)}</Text>
              </View>
            );
          }}
        />
      )}
      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          placeholder={t.input}
          value={texte}
          onChangeText={setTexte}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity style={[s.sendBtn, !texte.trim() && s.sendBtnDisabled]} onPress={envoyer} disabled={!texte.trim()}>
          <Text style={{ color: '#fff', fontSize: 16 }}>{'>'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderBottomLeftRadius: 22, borderBottomRightRadius: 22, backgroundColor: colors.inkSurface },
  back: { color: '#fff', fontSize: 26, marginRight: 4 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.amber, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.bodyBold, fontSize: 14, color: '#fff' },
  headerName: { fontFamily: fonts.bodyBold, fontSize: 13, color: '#fff' },
  headerStatus: { fontFamily: fonts.body, fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  bubble: { maxWidth: '78%', padding: 12, borderRadius: 18, marginBottom: 8 },
  bubbleTheirs: { backgroundColor: colors.card, alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  bubbleMine: { backgroundColor: colors.amber, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bubbleText: { fontFamily: fonts.body, fontSize: 13, color: colors.ink },
  bubbleTextMine: { fontFamily: fonts.body, fontSize: 13, color: '#3A2410' },
  bubbleTime: { fontSize: 9, color: 'rgba(0,0,0,0.3)', marginTop: 4, alignSelf: 'flex-end' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 12, paddingBottom: 16, backgroundColor: colors.paper, borderTopWidth: 1, borderTopColor: colors.line },
  input: { flex: 1, backgroundColor: colors.card, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontFamily: fonts.body, fontSize: 14, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.5 },
});
