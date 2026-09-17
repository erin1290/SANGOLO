import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput } from 'react-native';
import { colors, fonts } from '../../theme/colors';

export default function VerrouillageScreen({ onDeverrouille }) {
  const [erreur, setErreur] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [motDePasse, setMotDePasse] = useState('');

  return (
    <View style={s.container}>
      <View style={s.iconCircle}><Text style={{ fontSize: 26 }}>🔒</Text></View>
      <Text style={s.title}>Content de te revoir</Text>
      <Text style={s.sub}>Déverrouille pour retrouver ton espace</Text>
      {erreur ? <Text style={s.erreur}>{erreur}</Text> : null}

      <TouchableOpacity style={s.btnPrimary} onPress={onDeverrouille}>
        <Text style={s.btnPrimaryText}>Déverrouiller</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.btnGhost} onPress={() => setModalVisible(true)}>
        <Text style={s.btnGhostText}>Utiliser le mot de passe</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, marginBottom: 12 }}>Mot de passe</Text>
            <TextInput style={s.modalInput} secureTextEntry placeholder="••••••••"
              value={motDePasse} onChangeText={setMotDePasse} />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 16 }}>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={{ fontSize: 13 }}>Annuler</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => { setModalVisible(false); onDeverrouille(); }}>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13 }}>Valider</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.inkSurface, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  title: { fontFamily: fonts.display, fontSize: 20, color: '#fff' },
  sub: { fontFamily: fonts.body, fontSize: 12.5, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 6 },
  erreur: { color: colors.coral, fontSize: 12, marginTop: 10 },
  btnPrimary: { backgroundColor: colors.amber, borderRadius: 14, paddingVertical: 16, width: '100%', alignItems: 'center', marginTop: 26, marginBottom: 10 },
  btnPrimaryText: { color: '#3A2410', fontFamily: fonts.bodyBold, fontSize: 13 },
  btnGhost: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)', borderRadius: 14, paddingVertical: 14, width: '100%', alignItems: 'center' },
  btnGhostText: { color: 'rgba(255,255,255,0.7)', fontFamily: fonts.bodyBold, fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  modalBox: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '80%' },
  modalInput: { borderWidth: 1, borderColor: colors.line, borderRadius: 10, padding: 12, fontSize: 14 },
});