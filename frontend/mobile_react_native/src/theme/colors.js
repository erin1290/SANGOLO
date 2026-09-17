/**
 * Palette et typographie reprises exactement du thème Flutter
 * (lib/theme/app_theme.dart) — aucune valeur changée, juste traduite
 * en objets JS. Ne PAS "améliorer" ou ajuster ces couleurs : elles
 * viennent directement du logo Sangolo validé.
 */
export const colors = {
  ink: '#3B2417',
  inkSoft: '#7A6552',
  inkSurface: '#BA686A',
  amber: '#F2A65A',
  amberDeep: '#B9752C',
  green: '#4C7A5E',
  coral: '#E4574B',
  paper: '#FBF8F3',
  card: '#FFFFFF',
  line: '#EAE3D4',
};

// Dégradé du bandeau d'accueil (hero-band) — identique au
// LinearGradient(colors: [inkSurface, ink]) de Flutter.
export const heroGradient = [colors.inkSurface, colors.ink];

export const fonts = {
  display: 'Fraunces_600SemiBold',
  displayBold: 'Fraunces_700Bold',
  body: 'Manrope_500Medium',
  bodyBold: 'Manrope_700Bold',
};

export const spacing = {
  screenPadding: 18,
  radiusCard: 16,
  radiusHero: 22,
  radiusButton: 14,
};
