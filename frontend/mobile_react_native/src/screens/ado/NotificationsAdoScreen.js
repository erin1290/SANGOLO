import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, fonts } from '../../theme/colors';
import { HeroBand, SectionLabel } from '../../components/Shared';

export default function NotificationsAdoScreen({ navigation }) {
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifAlertes, setNotifAlertes] = useState(true);
  const [notifJournal, setNotifJournal] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>‹ Retour</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flex: 1, padding: 20 }}>
        <HeroBand titre="Notifications" sousTitre="Choisis ce que tu veux voir" />
        <SectionLabel>Messages</SectionLabel>
        <View style={s.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.switchLabel}>Nouveaux messages</Text>
            <Text style={s.switchSub}>Quand un écoutant te répond</Text>
          </View>
          <Switch value={notifMessages} onValueChange={setNotifMessages}
            trackColor={{ false: colors.line, true: colors.green }} thumbColor="#fff" />
        </View>
        <SectionLabel>Alertes</SectionLabel>
        <View style={s.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.switchLabel}>Alertes importantes</Text>
            <Text style={s.switchSub}>Notifications prioritaires</Text>
          </View>
          <Switch value={notifAlertes} onValueChange={setNotifAlertes}
            trackColor={{ false: colors.line, true: colors.coral }} thumbColor="#fff" />
        </View>
        <SectionLabel>Journal</SectionLabel>
        <View style={s.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.switchLabel}>Rappel journal</Text>
            <Text style={s.switchSub}>Te rappeler d'écrire dans ton journal</Text>
          </View>
          <Switch value={notifJournal} onValueChange={setNotifJournal}
            trackColor={{ false: colors.line, true: colors.amber }} thumbColor="#fff" />
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 44, paddingBottom: 4 },
  backBtn: { paddingVertical: 6, paddingHorizontal: 4 },
  backText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  switchRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderRadius: 16, padding: 15, marginBottom: 10,
  },
  switchLabel: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.ink },
  switchSub: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft, marginTop: 2 },
});