import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../theme/colors';
import { HeroBand, StatusBadge, ListItemCard, PrimaryButton, GhostButton } from '../../components/Shared';
import { listerConversations, listerMessages, envoyerMessage, listerMembresCercle, quitterCercle, getBaseUrl } from '../../services/apiService';
import { ChatService } from '../../services/chatService';
import * as SecureStore from 'expo-secure-store';
import { useLangue } from '../../context/LanguageContext';

const TRADUCTIONS = {
  fr: {
    demandes: 'Demandes en attente',
    conversations: 'Mes conversations',
    toutes: 'Toutes',
    nonLues: 'Non lues',
    nouveau: 'Nouveau',
    lu: 'Lu',
    _aucune: 'Aucune conversation en attente.',
    _aucuneActive: 'Aucune conversation en cours.',
    ecrire: 'Ecrire un message...',
    groupe: 'Groupe d\'écoute',
    membres: 'Membres',
    ajouter: 'Ajouter un membre',
    retour: 'Retour',
    fermer: 'Fermer',
    enLigne: 'En ligne',
    signalement: 'Signaler',
    verrouille: 'Verrouillé',
    ouvert: 'Ouvert',
    membresDuCercle: 'Membres du cercle',
    aucunMembre: 'Aucun membre dans ce cercle.',
    aucunAdo: 'Aucun ado disponible.',
    succes: 'Succès',
    membreAjoute: 'Membre ajouté au cercle.',
    erreur: 'Erreur',
    impossibleAjouter: 'Impossible d\'ajouter le membre.',
    enCours: 'en cours',
  },
  en: {
    demandes: 'Pending requests',
    conversations: 'My conversations',
    toutes: 'All',
    nonLues: 'Unread',
    nouveau: 'New',
    lu: 'Read',
    _aucune: 'No pending conversations.',
    _aucuneActive: 'No active conversations.',
    ecrire: 'Write a message...',
    groupe: 'Listening group',
    membres: 'Members',
    ajouter: 'Add a member',
    retour: 'Back',
    fermer: 'Close',
    enLigne: 'Online',
    signalement: 'Report',
    verrouille: 'Locked',
    ouvert: 'Open',
    membresDuCercle: 'Circle members',
    aucunMembre: 'No members in this circle.',
    aucunAdo: 'No ados available.',
    succes: 'Success',
    membreAjoute: 'Member added to circle.',
    erreur: 'Error',
    impossibleAjouter: 'Unable to add member.',
    enCours: 'in progress',
  },
};

export function ConversationsAttenteScreen({ navigation }) {
  const [conversations, setConversations] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [filtre, setFiltre] = useState('toutes');
  const { langue } = useLangue();
  const t = TRADUCTIONS[langue] || TRADUCTIONS.fr;

  useEffect(() => {
    chargerConversations();
    const poller = setInterval(chargerConversations, 5000);
    return () => clearInterval(poller);
  }, [filtre]);

  const chargerConversations = async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      // Charger les conversations de cet écoutant uniquement
      const url = `${getBaseUrl()}/messagerie/conversation-stats/`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        let filtered = Array.isArray(data) ? data : [];
        // Filtrer pour n'afficher que les conversations en_attente
        filtered = filtered.filter(c => c.statut === 'en_attente');
        if (filtre === 'non_lus') {
          filtered = filtered.filter(c => c.messages_non_lus > 0);
        }
        setConversations(filtered);
      }
    } catch (e) { /* silent */ }
    finally { setChargement(false); }
  };

  const entrerConversation = async (item) => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      await fetch(`${getBaseUrl()}/messagerie/messages/marquer-lus/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: item.id }),
      });
    } catch (e) { /* silent */ }
    navigation.navigate('ChatEcoutant', { conversationId: item.id, pseudoAdo: item.utilisateur_pseudo || 'Ado', fromAttente: true });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <FlatList
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        ListHeaderComponent={
          <>
            <HeroBand titre={t.demandes} sousTitre={`${conversations.length} conversation(s)`} />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, marginBottom: 8 }}>
              <TouchableOpacity
                style={[s.filtrePill, filtre === 'toutes' && s.filtrePillActive]}
                onPress={() => setFiltre('toutes')}
              >
                <Text style={[s.filtreText, filtre === 'toutes' && s.filtreTextActive]}>{t.toutes}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.filtrePill, filtre === 'non_lus' && s.filtrePillActive]}
                onPress={() => setFiltre('non_lus')}
              >
                <Text style={[s.filtreText, filtre === 'non_lus' && s.filtreTextActive]}>{t.nonLues}</Text>
              </TouchableOpacity>
            </View>
          </>
        }
        data={conversations}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={
          chargement ? <ActivityIndicator style={{ marginTop: 20 }} color={colors.ink} /> :
            <Text style={s.empty}>Aucune conversation en attente.</Text>
        }
        renderItem={({ item }) => {
          const pseudo = item.utilisateur_pseudo || 'Ado';
          const dernierMsg = item.dernier_message;
          const preview = dernierMsg ? dernierMsg.contenu : 'Nouvelle demande';
          const nonLus = item.messages_non_lus || 0;
          return (
            <ListItemCard
              titre={pseudo}
              sousTitre={preview}
              tag={nonLus > 0 ? <StatusBadge text="Nouveau" color={colors.coral} /> : <StatusBadge text="Lu" color={colors.green} />}
              onPress={() => entrerConversation(item)}
            />
          );
        }}
      />
    </View>
  );
}

export function ConversationsActivesScreen({ navigation, route }) {
  const [conversations, setConversations] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [filtre, setFiltre] = useState(route?.params?.filter || 'toutes');
  const { langue } = useLangue();
  const t = TRADUCTIONS[langue] || TRADUCTIONS.fr;

  useEffect(() => {
    chargerConversations();
    const poller = setInterval(chargerConversations, 5000);
    return () => clearInterval(poller);
  }, [filtre]);

  const chargerConversations = async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      // Charger les conversations de cet écoutant uniquement
      const url = `${getBaseUrl()}/messagerie/conversation-stats/`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        let filtered = Array.isArray(data) ? data : [];
        // Filtrer pour n'afficher que les conversations en_cours
        filtered = filtered.filter(c => c.statut === 'en_cours');
        if (filtre === 'non_lus') {
          filtered = filtered.filter(c => c.messages_non_lus > 0);
        }
        setConversations(filtered);
      }
    } catch (e) { /* silent */ }
    finally { setChargement(false); }
  };

  const entrerConversation = async (item) => {
    // Marquer les messages comme lus quand on entre dans la conversation
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      await fetch(`${getBaseUrl()}/messagerie/messages/marquer-lus/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: item.id }),
      });
    } catch (e) { /* silent */ }
    navigation.navigate('ChatEcoutant', { conversationId: item.id, pseudoAdo: item.utilisateur_pseudo || 'Ado' });
  };

  const formatHeure = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffJours = Math.floor((now - d) / (1000 * 60 * 60 * 24));
      if (diffJours === 0) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      if (diffJours === 1) return 'Hier';
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    } catch { return ''; }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <FlatList
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        ListHeaderComponent={
          <>
            <HeroBand titre={`${t.conversations} (${conversations.length})`} sousTitre="Ados que j'écoute" />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, marginBottom: 8 }}>
              <TouchableOpacity
                style={[s.filtrePill, filtre === 'toutes' && s.filtrePillActive]}
                onPress={() => setFiltre('toutes')}
              >
                <Text style={[s.filtreText, filtre === 'toutes' && s.filtreTextActive]}>Toutes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.filtrePill, filtre === 'non_lus' && s.filtrePillActive]}
                onPress={() => setFiltre('non_lus')}
              >
                <Text style={[s.filtreText, filtre === 'non_lus' && s.filtreTextActive]}>Non lues</Text>
              </TouchableOpacity>
            </View>
          </>
        }
        data={conversations}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={
          chargement ? <ActivityIndicator style={{ marginTop: 20 }} color={colors.ink} /> :
            <Text style={s.empty}>Aucune conversation en cours.</Text>
        }
        renderItem={({ item }) => {
          const pseudo = item.utilisateur_pseudo || 'Ado';
          const dernierMsg = item.dernier_message;
          const preview = dernierMsg
            ? (dernierMsg.auteur === 'ecoutant' ? 'Toi : ' : '') + dernierMsg.contenu
            : 'Aucun message';
          const nonLus = item.messages_non_lus || 0;
          return (
            <TouchableOpacity style={s.convCard} onPress={() => entrerConversation(item)}>
              <View style={s.convRow}>
                <View style={[s.avatar, { backgroundColor: colors.green }]}>
                  <Text style={s.avatarText}>{pseudo.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.convTop}>
                    <Text style={s.convName} numberOfLines={1}>{pseudo}</Text>
                    <Text style={s.convTime}>{formatHeure(item.date_derniere_activite)}</Text>
                  </View>
                  <View style={s.convBottom}>
                    <Text style={s.convPreview} numberOfLines={1}>{preview}</Text>
                    {nonLus > 0 && (
                      <View style={s.badge}>
                        <Text style={s.badgeText}>{nonLus}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

export function ChatEcoutantScreen({ route, navigation }) {
  const { conversationId, pseudoAdo } = route.params;
  const [messages, setMessages] = useState([]);
  const [texte, setTexte] = useState('');
  const [chargement, setChargement] = useState(true);
  const chatRef = useRef(null);
  const flatListRef = useRef(null);
  const { langue } = useLangue();
  const t = TRADUCTIONS[langue] || TRADUCTIONS.fr;

  useEffect(() => {
    let ignore = false;

    // Auto-assigner la conversation si elle est en attente
    autoAssign();

    const charger = async () => {
      try {
        const historique = await listerMessages(conversationId);
        if (!ignore) setMessages(Array.isArray(historique) ? historique : []);
      } catch (e) { /* silent */ }
      finally { if (!ignore) setChargement(false); }
    };
    charger();
    const poller = setInterval(() => { if (!ignore) charger(); }, 3000);
    const chat = new ChatService(conversationId);
    chatRef.current = chat;
    const unsubscribe = chat.onMessage((m) => {
      setMessages((prev) => {
        if (prev.some((p) => p.contenu === m.contenu && p.date_envoi === m.date_envoi)) return prev;
        return [...prev, m];
      });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });

    // Marquer les messages comme lus
    marquerCommeLu();

    return () => {
      ignore = true;
      clearInterval(poller);
      unsubscribe();
      chat.close();
    };
  }, [conversationId]);

  const autoAssign = async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const userId = await SecureStore.getItemAsync('user_id');
      await fetch(`${getBaseUrl()}/messagerie/conversations/${conversationId}/`, {
        method: 'PATCH',
        headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ecoutant: parseInt(userId) }),
      });
    } catch (e) { /* silent */ }
  };

  const marquerCommeLu = async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      await fetch(`${getBaseUrl()}/messagerie/messages/marquer-lus/`, {
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
    const tempMsg = { id: Date.now(), auteur: 'ecoutant', contenu: msg, date_envoi: new Date().toISOString() };
    setMessages((prev) => [...prev, tempMsg]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    try {
      await envoyerMessage(conversationId, msg, 'ecoutant');
    } catch (e) {
      chatRef.current?.send('ecoutant', msg);
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
      <View style={s.chatHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>{'<'}</Text></TouchableOpacity>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{pseudoAdo.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.headerName}>{pseudoAdo}</Text>
          <Text style={s.headerSub}>{t.enLigne || 'En ligne'}</Text>
        </View>
        <TouchableOpacity style={s.signalerBtn} onPress={() => navigation.navigate('Escalade', { pseudoAdo })}>
          <Text style={s.signalerText}>{t.signalement}</Text>
        </TouchableOpacity>
      </View>
      {chargement ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.ink} size="large" />
        </View>
      ) : messages.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 }}>
          <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft, textAlign: 'center' }}>
            En attente de messages...
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
          renderItem={({ item }) => (
            <View style={[s.bubble, item.auteur === 'ecoutant' ? s.bubbleMine : s.bubbleTheirs]}>
              <Text style={item.auteur === 'ecoutant' ? s.bubbleTextMine : s.bubbleText}>{item.contenu}</Text>
              <Text style={s.bubbleTime}>{formatHeure(item.date_envoi)}</Text>
            </View>
          )}
        />
      )}
      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          placeholder={t.ecrire}
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

export function CercleModerationScreen({ route, navigation }) {
  const cercleId = route?.params?.cercleId;
  const cercleTheme = route?.params?.cercleTheme || 'Cercle';
  const [messages, setMessages] = useState([]);
  const [texte, setTexte] = useState('');
  const chatRef = useRef(null);
  const flatListRef = useRef(null);
  const [showMembres, setShowMembres] = useState(false);
  const [membres, setMembres] = useState([]);
  const [chargementMembres, setChargementMembres] = useState(false);
  const [restreint, setRestreint] = useState(false);
  const [showAjouterMembre, setShowAjouterMembre] = useState(false);
  const [adoPseudos, setAdoPseudos] = useState([]);
  const { langue } = useLangue();
  const t = TRADUCTIONS[langue] || TRADUCTIONS.fr;

  useEffect(() => {
    if (!cercleId) return;
    // Charger les messages existants depuis la base de données
    chargerMessages();
    // Charger les membres du cercle
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
    chargerInfosCercle();
    return () => { unsubscribe(); chat.close(); };
  }, [cercleId]);

  const chargerMessages = async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const res = await fetch(`${getBaseUrl()}/messagerie/messages-cercle/?cercle=${cercleId}`, {
        headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : data.results || []);
      }
    } catch (e) { /* silent */ }
  };

  const chargerInfosCercle = async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const res = await fetch(`${getBaseUrl()}/messagerie/cercles/${cercleId}/`, {
        headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setRestreint(data.restreint || false);
        // L'écoutant n'est jamais bloqué même si le groupe est verrouillé
        if (chatRef.current) {
          chatRef.current.setBloque(false);
        }
      }
    } catch (e) { /* silent */ }
  };

  const envoyer = async () => {
    if (!texte.trim() || !chatRef.current) return;
    const userId = await SecureStore.getItemAsync('user_id');
    chatRef.current.send('ecoutant', texte.trim(), { ecoutant_id: parseInt(userId) });
    setTexte('');
  };

  const toggleRestreint = async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const res = await fetch(`${getBaseUrl()}/messagerie/cercles/${cercleId}/`, {
        method: 'PATCH',
        headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ restreint: !restreint }),
      });
      if (res.ok) {
        setRestreint(!restreint);
        // L'écoutant n'est jamais bloqué
        if (chatRef.current) {
          chatRef.current.setBloque(false);
        }
        Alert.alert(restreint ? 'Groupe déverrouillé' : 'Groupe verrouillé', restreint ? 'Les ados peuvent maintenant parler.' : 'Seuls les écoutants peuvent parler.');
      }
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de modifier le groupe.');
    }
  };

  const chargerMembres = async () => {
    setChargementMembres(true);
    try {
      const data = await listerMembresCercle(cercleId);
      setMembres(Array.isArray(data) ? data : []);
    } catch (e) { /* silent */ }
    finally { setChargementMembres(false); }
  };

  const handleRetirerMembre = async (membreId) => {
    Alert.alert('Retirer le membre', 'Es-tu sur de vouloir retirer ce membre du cercle ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Retirer', style: 'destructive', onPress: async () => {
          try {
            await quitterCercle(membreId);
            setMembres(prev => prev.filter(m => m.id !== membreId));
          } catch (e) {
            Alert.alert('Erreur', 'Impossible de retirer le membre.');
          }
        }
      },
    ]);
  };

  const ouvrirMembres = () => {
    setShowMembres(true);
    chargerMembres();
  };

  const chargerAdos = async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const res = await fetch(`${getBaseUrl()}/messagerie/ados/`, {
        headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setAdoPseudos(Array.isArray(data) ? data : data.results || []);
      }
    } catch (e) { /* silent */ }
  };

  const ajouterMembre = async (userId) => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const res = await fetch(`${getBaseUrl()}/messagerie/membres-cercle/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ cercle: parseInt(cercleId), utilisateur: userId }),
      });
      if (res.ok) {
        Alert.alert('Succès', 'Membre ajouté au cercle.');
        setShowAjouterMembre(false);
        chargerMembres();
      } else {
        const data = await res.json();
        Alert.alert('Erreur', data.detail || 'Impossible d\'ajouter le membre.');
      }
    } catch (e) {
      Alert.alert('Erreur', 'Impossible d\'ajouter le membre.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.paper }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={s.cercleHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>{t.retour}</Text></TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.headerName}>{cercleTheme}</Text>
            <Text style={s.headerSub}>{membres.length} {t.membres.toLowerCase()} · {restreint ? t.verrouille : t.ouvert}</Text>
          </View>
          <TouchableOpacity style={s.restrictBtn} onPress={toggleRestreint}>
            <Text style={s.restrictBtnText}>{restreint ? '🔓' : '🔒'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.membresBtn} onPress={ouvrirMembres}>
            <Text style={s.membresBtnText}>👥</Text>
          </TouchableOpacity>
        </View>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => (
          <View style={[s.bubble, item.auteur === 'ecoutant' ? s.bubbleMine : s.bubbleTheirs]}>
            {item.auteur === 'ecoutant' ? (
              <Text style={s.auteurLabel}>{item.auteur_label || 'Animateur'} (écoutant)</Text>
            ) : item.auteur_label ? (
              <Text style={s.auteurLabel}>{item.auteur_label}</Text>
            ) : null}
            <Text style={item.auteur === 'ecoutant' ? s.bubbleTextMine : s.bubbleText}>{item.contenu}</Text>
          </View>
        )}
      />
      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          placeholder={t.ecrire}
          value={texte}
          onChangeText={setTexte}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity style={[s.sendBtn, !texte.trim() && s.sendBtnDisabled]} onPress={envoyer} disabled={!texte.trim()}>
          <Text style={{ color: '#fff', fontSize: 16 }}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      {/* Modal Membres */}
      <Modal visible={showMembres} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{t.membresDuCercle}</Text>
              <TouchableOpacity onPress={() => setShowMembres(false)}>
                <Text style={s.modalClose}>{t.fermer}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={s.ajouterMembreBtn} onPress={() => { setShowMembres(false); setShowAjouterMembre(true); chargerAdos(); }}>
              <Text style={s.ajouterMembreText}>+ {t.ajouter}</Text>
            </TouchableOpacity>
            {chargementMembres ? (
              <ActivityIndicator style={{ marginTop: 20 }} color={colors.ink} />
            ) : (
              <FlatList
                data={membres}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <View style={s.membreRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.membreNom}>{item.pseudo || 'Ado'}</Text>
                      <Text style={s.membreDate}>Membre depuis le {new Date(item.date_adhesion).toLocaleDateString('fr-FR')}</Text>
                    </View>
                    <TouchableOpacity style={s.retirerBtn} onPress={() => handleRetirerMembre(item.id)}>
                      <Text style={s.retirerText}>Retirer</Text>
                    </TouchableOpacity>
                  </View>
                )}
                ListEmptyComponent={<Text style={s.empty}>Aucun membre dans ce cercle.</Text>}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Modal Ajouter Membre */}
      <Modal visible={showAjouterMembre} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <TouchableOpacity onPress={() => { setShowAjouterMembre(false); setShowMembres(true); }}>
                <Text style={s.modalBack}>← {t.retour}</Text>
              </TouchableOpacity>
              <Text style={s.modalTitle}>{t.ajouter}</Text>
              <TouchableOpacity onPress={() => { setShowAjouterMembre(false); setShowMembres(false); }}>
                <Text style={s.modalClose}>{t.fermer}</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={adoPseudos.filter(a => !membres.some(m => m.utilisateur === a.id))}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity style={s.adoRow} onPress={() => ajouterMembre(item.id)}>
                  <Text style={s.adoNom}>{item.pseudo}</Text>
                  <Text style={s.adoAjouter}>{t.ajouter}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={s.empty}>{t.aucunAdo}</Text>}
            />
          </View>
        </View>
      </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  empty: { textAlign: 'center', color: colors.inkSoft, fontFamily: fonts.body, marginTop: 20, fontSize: 13 },
  filtrePill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.card },
  filtrePillActive: { backgroundColor: colors.amber },
  filtreText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.inkSoft },
  filtreTextActive: { color: '#3A2410' },
  convCard: { backgroundColor: colors.card, borderRadius: 16, padding: 14, marginBottom: 10, shadowColor: colors.ink, shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  convRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.bodyBold, fontSize: 16, color: '#fff' },
  convTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convName: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink, flex: 1 },
  convTime: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft },
  convBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  convPreview: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, flex: 1, marginRight: 8 },
  badge: { backgroundColor: colors.coral, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { fontFamily: fonts.bodyBold, fontSize: 10, color: '#fff' },
  chatHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderBottomLeftRadius: 22, borderBottomRightRadius: 22, backgroundColor: colors.inkSurface },
  cercleHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 10, backgroundColor: colors.inkSurface },
  back: { color: '#fff', fontSize: 10, fontFamily: fonts.bodyBold },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.amber, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.bodyBold, fontSize: 14, color: '#fff' },
  circleIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  headerName: { fontFamily: fonts.bodyBold, fontSize: 14, color: '#fff' },
  headerSub: { fontFamily: fonts.body, fontSize: 10, color: 'rgba(255,255,255,0.6)' },
  signalerBtn: { backgroundColor: 'rgba(228,87,75,0.35)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  signalerText: { color: '#fff', fontFamily: fonts.bodyBold, fontSize: 11 },
  membresBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 12 },
  membresBtnText: { color: '#fff', fontSize: 14 },
  restrictBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 12, marginRight: 4 },
  restrictBtnText: { fontSize: 14 },
  ajouterMembreBtn: { backgroundColor: colors.green, paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  ajouterMembreText: { fontFamily: fonts.bodyBold, fontSize: 13, color: '#fff' },
  adoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: colors.card, borderRadius: 12, marginBottom: 8 },
  adoNom: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink },
  adoAjouter: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.green },
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
  sendBtnDisabled: { opacity: 0.5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.paper, borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: '70%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontFamily: fonts.display, fontSize: 17, color: colors.ink },
  modalClose: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.inkSoft },
  modalBack: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.green },
  membreRow: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: colors.card, borderRadius: 12, marginBottom: 8 },
  membreNom: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink },
  membreDate: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft },
  retirerBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(228,87,75,0.1)' },
  retirerText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.coral },
});
