import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { HeroBand, ListItemCard, StatusBadge } from '../../components/Shared';
import { listerAdosSupervision, listerCerclesEcoute } from '../../services/apiService';

function ListeEtat({ titre, sousTitre, charger, vide, renderItem }) {
  const [items, setItems] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  const actualiser = useCallback(async () => {
    setChargement(true);
    try {
      setItems(await charger());
      setErreur('');
    } catch (e) {
      setErreur(e.message || 'Chargement impossible.');
    } finally {
      setChargement(false);
    }
  }, [charger]);

  useEffect(() => { actualiser(); }, [actualiser]);
  useFocusEffect(useCallback(() => { actualiser(); }, [actualiser]));

  if (chargement) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper }}><ActivityIndicator color={colors.ink} /></View>;
  }
  return <ScrollView style={{ flex: 1, backgroundColor: colors.paper }} contentContainerStyle={{ padding: 20 }}>
    <HeroBand titre={titre} sousTitre={sousTitre} style={{ marginBottom: 14 }} />
    {items.length ? items.map(renderItem) : <Text style={{ color: colors.inkSoft, textAlign: 'center', marginTop: 20 }}>{vide}</Text>}
    {erreur ? <Text style={{ color: colors.coral, textAlign: 'center', marginTop: 12 }}>{erreur}</Text> : null}
  </ScrollView>;
}

export function AdosInscritsScreen() {
  return <ListeEtat
    titre="Ados inscrits"
    sousTitre="Comptes anonymes de la plateforme"
    charger={listerAdosSupervision}
    vide="Aucun ado inscrit pour le moment."
    renderItem={(ado) => <ListItemCard key={ado.id} titre={ado.pseudo} sousTitre={`${ado.age} ans · compte anonyme`} tag={<StatusBadge text="actif" />} />}
  />;
}

export function CerclesActifsScreen() {
  return <ListeEtat
    titre="Cercles actifs"
    sousTitre="Groupes d'écoute en cours"
    charger={async () => (await listerCerclesEcoute()).filter((cercle) => cercle.actif)}
    vide="Aucun cercle actif pour le moment."
    renderItem={(cercle) => <ListItemCard key={cercle.id} titre={cercle.theme} sousTitre={`${cercle.nombre_membres || 0} membre(s) · ${cercle.ecoutant_nom || 'Animateur non assigné'}`} tag={<StatusBadge text="actif" />} />}
  />;
}
