import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, heroGradient } from '../theme/colors';
import { useLangue } from '../context/LanguageContext';

export function HeroBand({ titre, sousTitre, trailing, leading, style }) {
  const { traduire } = useLangue();
  return (
    <LinearGradient
      colors={heroGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[s.hero, style]}
    >
      <View style={s.heroRow}>
        {leading}
        <View style={{ flex: 1 }}>
          <Text style={s.heroTitle}>{traduire(titre)}</Text>
          {sousTitre ? <Text style={s.heroSub}>{traduire(sousTitre)}</Text> : null}
        </View>
        {trailing}
      </View>
    </LinearGradient>
  );
}

export function SectionLabel({ children }) {
  const { traduire } = useLangue();
  return <Text style={s.sectionLabel}>{traduire(children)}</Text>;
}

export function NavTile({ icon, label, sub, accent, trailing, onPress }) {
  const { traduire } = useLangue();
  return (
    <TouchableOpacity style={[s.navTile, { borderLeftColor: accent }]} onPress={onPress}>
      <View style={s.iconChip}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={s.navTileLabel}>{traduire(label)}</Text>
        {sub ? <Text style={s.navTileSub}>{traduire(sub)}</Text> : null}
      </View>
      {trailing}
    </TouchableOpacity>
  );
}

export function StatusBadge({ text, color = colors.green }) {
  const { traduire } = useLangue();
  return (
    <View style={[s.badge, { backgroundColor: color }]}>
      <Text style={s.badgeText}>{traduire(text)}</Text>
    </View>
  );
}

export function GhostButton({ label, onPress, color = colors.ink }) {
  const { traduire } = useLangue();
  return (
    <TouchableOpacity style={[s.ghostBtn, { borderColor: color === colors.ink ? colors.line : color }]} onPress={onPress}>
      <Text style={[s.ghostBtnText, { color }]}>{traduire(label)}</Text>
    </TouchableOpacity>
  );
}

export function PrimaryButton({ label, onPress, loading }) {
  const { traduire } = useLangue();
  return (
    <TouchableOpacity onPress={onPress} disabled={loading}>
      <LinearGradient colors={heroGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.primaryBtn}>
        <Text style={s.primaryBtnText}>{loading ? '...' : traduire(label)}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export function ListItemCard({ titre, sousTitre, tag, onPress }) {
  const { traduire } = useLangue();
  return (
    <TouchableOpacity style={s.listItem} onPress={onPress}>
      <View style={s.listItemTop}>
        <Text style={s.listItemTitre}>{traduire(titre)}</Text>
        {tag}
      </View>
      <Text style={s.listItemSub}>{traduire(sousTitre)}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  hero: { borderRadius: 22, padding: 24 },
  heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroTitle: { fontFamily: fonts.display, fontSize: 21, color: '#fff' },
  heroSub: { fontFamily: fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 3 },
  sectionLabel: {
    fontFamily: fonts.bodyBold, fontSize: 11.5, letterSpacing: 1.2,
    textTransform: 'uppercase', color: colors.inkSoft, marginTop: 18, marginBottom: 8,
  },
  navTile: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.card, borderRadius: 16, padding: 15, marginBottom: 10,
    borderLeftWidth: 3,
    shadowColor: colors.ink, shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  iconChip: {
    width: 38, height: 38, borderRadius: 11, backgroundColor: colors.paper,
    alignItems: 'center', justifyContent: 'center',
  },
  navTileLabel: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.ink },
  navTileSub: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft, marginTop: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: '#fff', fontSize: 10, fontFamily: fonts.bodyBold },
  ghostBtn: {
    borderWidth: 1.4, borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', marginTop: 10,
  },
  ghostBtnText: { fontFamily: fonts.bodyBold, fontSize: 13 },
  primaryBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 12 },
  primaryBtnText: { color: '#fff', fontFamily: fonts.bodyBold, fontSize: 13 },
  listItem: {
    backgroundColor: colors.card, borderRadius: 16, padding: 15, marginBottom: 10,
    shadowColor: colors.ink, shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  listItemTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  listItemTitre: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink },
  listItemSub: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft },
});
