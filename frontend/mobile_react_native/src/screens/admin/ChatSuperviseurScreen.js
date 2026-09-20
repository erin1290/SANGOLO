import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors, fonts } from '../../theme/colors';
import { envoyerMessage, listerMessages } from '../../services/apiService';

/** Discussion privée créée depuis une alerte, distincte du tchat ado–écoutant. */
export default function ChatSuperviseurScreen({ navigation, route }) {
  const { conversationId, pseudoAdo = 'Ado' } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [texte, setTexte] = useState('');
  const [chargement, setChargement] = useState(true);
  const listeRef = useRef(null);

  useEffect(() => {
    let actif = true;
    const charger = async () => {
      try {
        const data = await listerMessages(conversationId);
        if (actif) setMessages(Array.isArray(data) ? data : []);
      } finally {
        if (actif) setChargement(false);
      }
    };
    charger();
    const intervalle = setInterval(charger, 3000);
    return () => { actif = false; clearInterval(intervalle); };
  }, [conversationId]);

  const envoyer = async () => {
    const contenu = texte.trim();
    if (!contenu) return;
    setTexte('');
    const temporaire = { id: `local-${Date.now()}`, auteur: 'superviseur', contenu, date_envoi: new Date().toISOString() };
    setMessages((precedents) => [...precedents, temporaire]);
    try {
      await envoyerMessage(conversationId, contenu, 'superviseur');
      const data = await listerMessages(conversationId);
      setMessages(Array.isArray(data) ? data : []);
    } catch {
      setMessages((precedents) => precedents.filter((m) => m.id !== temporaire.id));
    }
  };

  const heure = (date) => {
    try { return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); } catch { return ''; }
  };

  return (
    <KeyboardAvoidingView style={s.page} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>{'<'}</Text></TouchableOpacity>
        <View style={s.avatar}><Text style={s.avatarText}>{pseudoAdo.charAt(0).toUpperCase()}</Text></View>
        <View><Text style={s.nom}>{pseudoAdo}</Text><Text style={s.sousTitre}>Discussion de supervision</Text></View>
      </View>
      {chargement ? <View style={s.center}><ActivityIndicator color={colors.ink} /></View> : (
        <FlatList
          ref={listeRef}
          data={messages}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={s.messages}
          onContentSizeChange={() => listeRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => {
            const moi = item.auteur === 'superviseur';
            return <View style={[s.bulle, moi ? s.bulleMoi : s.bulleAdo]}>
              <Text style={moi ? s.texteMoi : s.texteAdo}>{item.contenu}</Text>
              <Text style={s.heure}>{heure(item.date_envoi)}</Text>
            </View>;
          }}
        />
      )}
      <View style={s.saisie}>
        <TextInput style={s.input} value={texte} onChangeText={setTexte} placeholder="Écrire à l'ado..." multiline maxLength={1000} />
        <TouchableOpacity style={[s.envoyer, !texte.trim() && s.envoyerOff]} onPress={envoyer} disabled={!texte.trim()}><Text style={s.envoyerTexte}>{'>'}</Text></TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, backgroundColor: colors.inkSurface, borderBottomLeftRadius: 22, borderBottomRightRadius: 22 },
  back: { color: '#fff', fontSize: 26 }, avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.coral, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontFamily: fonts.bodyBold }, nom: { color: '#fff', fontFamily: fonts.bodyBold, fontSize: 14 }, sousTitre: { color: 'rgba(255,255,255,0.65)', fontFamily: fonts.body, fontSize: 11 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' }, messages: { padding: 16, paddingBottom: 8 },
  bulle: { maxWidth: '78%', padding: 12, borderRadius: 18, marginBottom: 8 }, bulleMoi: { backgroundColor: colors.amber, alignSelf: 'flex-end', borderBottomRightRadius: 4 }, bulleAdo: { backgroundColor: colors.card, alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  texteMoi: { fontFamily: fonts.body, fontSize: 13, color: '#3A2410' }, texteAdo: { fontFamily: fonts.body, fontSize: 13, color: colors.ink }, heure: { fontSize: 9, color: 'rgba(0,0,0,0.35)', alignSelf: 'flex-end', marginTop: 4 },
  saisie: { flexDirection: 'row', gap: 8, alignItems: 'flex-end', padding: 12, paddingBottom: 16, borderTopWidth: 1, borderTopColor: colors.line }, input: { flex: 1, borderRadius: 22, backgroundColor: colors.card, paddingHorizontal: 16, paddingVertical: 10, fontFamily: fonts.body, maxHeight: 100 },
  envoyer: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }, envoyerOff: { opacity: 0.5 }, envoyerTexte: { color: '#fff', fontSize: 16 },
});
