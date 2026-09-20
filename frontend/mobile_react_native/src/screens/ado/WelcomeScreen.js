import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { PrimaryButton } from '../../components/Shared';
import { useLangue } from '../../context/LanguageContext';

export default function WelcomeScreen({ navigation }) {
  const { langue } = useLangue();
  return (
    <View style={s.container}>
      <Image source={require('../../../assets/logo_sangolo.png')} style={s.logo} resizeMode="contain" />
      <View style={s.dots}>
        <View style={[s.dot, { backgroundColor: colors.amberDeep }]} />
        <View style={s.dot} />
        <View style={s.dot} />
      </View>
      <View style={{ height: 40 }} />
      <View style={{ width: '100%' }}>
        <PrimaryButton label={langue === 'en' ? 'Continue' : 'Continuer'} onPress={() => navigation.navigate('Inscription')} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  logo: { width: 260, height: 260, marginBottom: 28 },
  dots: { flexDirection: 'row', gap: 5, marginTop: 32 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.line },
});
