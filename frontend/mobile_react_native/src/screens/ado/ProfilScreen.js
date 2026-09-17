import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { colors, fonts } from '../../theme/colors';
import { HeroBand, SectionLabel, NavTile, StatusBadge, GhostButton } from '../../components/Shared';
import { deconnexion } from '../../services/apiService';
import { useLangue } from '../../context/LanguageContext';

export default function ProfilScreen({ navigation }) {
  const [pseudo, setPseudo] = useState('Ado');
  const { langue, changerLangue } = useLangue();

  useEffect(() => {
    SecureStore.getItemAsync('user_pseudo').then((v) => {
      if (v) setPseudo(v);
    });
  }, []);

  const handleDeconnexion = async () => {
    await deconnexion();
    navigation.reset({ index: 0, routes: [{ name: 'ChoixRole' }] });
  };

  const t = langue === 'en' ? {
    profil: 'Profile', anonyme: 'Always anonymous',
    securite: 'Security', securiteSub: 'Face ID + password',
    notifications: 'Notifications', notificationsSub: 'Discreet, no preview',
    langueLabel: 'Language', langueSub: 'French / English',
    aide: 'Help', aideSub: 'Frequently asked questions',
    deconnexion: 'Log out',
  } : {
    profil: 'Profil', anonyme: 'Toujours anonyme',
    securite: 'Sécurité', securiteSub: 'Face ID + mot de passe',
    notifications: 'Notifications', notificationsSub: 'Discrètes, sans aperçu',
    langueLabel: 'Langue', langueSub: 'Français / Anglais',
    aide: 'Aide', aideSub: 'Questions fréquentes',
    deconnexion: 'Se déconnecter',
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>‹ Retour</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flex: 1, padding: 20 }}>
        <HeroBand
          titre={pseudo}
          sousTitre={t.anonyme}
          leading={<View style={s.avatar} />}
        />
        <SectionLabel>Confidentialité &amp; sécurité</SectionLabel>
        <NavTile icon={<Text style={{ fontSize: 18 }}>🔒</Text>} label={t.securite} sub={t.securiteSub}
          accent={colors.ink} trailing={<StatusBadge text="ON" color={colors.green} />}
          onPress={() => navigation.navigate('SecuriteAdo')} />
        <NavTile icon={<Text style={{ fontSize: 18 }}>🔔</Text>} label={t.notifications} sub={t.notificationsSub}
          accent={colors.amber} onPress={() => navigation.navigate('NotificationsAdo')} />
        <SectionLabel>Préférences</SectionLabel>
        <NavTile icon={<Text style={{ fontSize: 18 }}>🌐</Text>} label={t.langueLabel} sub={langue === 'en' ? 'English' : 'Français'}
          accent={colors.green}
          trailing={
            <View style={s.langueRow}>
              <TouchableOpacity style={[s.languePill, langue === 'fr' && s.languePillActive]} onPress={() => changerLangue('fr')}>
                <Text style={[s.langueText, langue === 'fr' && s.langueTextActive]}>FR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.languePill, langue === 'en' && s.languePillActive]} onPress={() => changerLangue('en')}>
                <Text style={[s.langueText, langue === 'en' && s.langueTextActive]}>EN</Text>
              </TouchableOpacity>
            </View>
          }
          onPress={() => changerLangue(langue === 'fr' ? 'en' : 'fr')} />
        <NavTile icon={<Text style={{ fontSize: 18 }}>❓</Text>} label={t.aide} sub={t.aideSub}
          accent={colors.green} onPress={() => navigation.navigate('AideAdo')} />
        <View style={{ flex: 1 }} />
        <GhostButton label={t.deconnexion} color={colors.inkSoft} onPress={handleDeconnexion} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.25)' },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 44, paddingBottom: 4 },
  backBtn: { paddingVertical: 6, paddingHorizontal: 4 },
  backText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  langueRow: { flexDirection: 'row', gap: 4 },
  languePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: colors.paper },
  languePillActive: { backgroundColor: colors.amber },
  langueText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.inkSoft },
  langueTextActive: { color: '#3A2410' },
});