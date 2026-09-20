import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

const LanguageContext = createContext();

// Les composants partagés reçoivent souvent des libellés directement écrits
// dans les écrans. Cette table leur permet de basculer sans perdre le choix
// global de l'utilisateur.
const EN = {
  'Continuer': 'Continue', 'Retour': 'Back', 'Aide': 'Help', 'Notifications': 'Notifications',
  'Sécurité': 'Security', 'Profil': 'Profile', 'Paramètres': 'Settings', 'Langue': 'Language',
  'Connexion': 'Log in', 'Se connecter': 'Log in', 'Se déconnecter': 'Log out',
  'Créer un compte': 'Create an account', 'Créer mon espace': 'Create my space',
  'Mot de passe': 'Password', 'Confirmation': 'Confirmation', 'Âge': 'Age', 'Pseudo': 'Username',
  'Parler à un écoutant': 'Talk to a listener', 'Choisis quelqu’un pour t’écouter': 'Choose someone to listen to you',
  "Cercles d'ecoute": 'Listening circles', "Groupes de parole confidentiels": 'Confidential discussion groups',
  'Rejoindre': 'Join', 'Quitter': 'Leave', 'Ouvrir le cercle': 'Open circle',
  'Parler à un pair': 'Talk to a peer', 'Mes discussions': 'My conversations',
  'Mon journal': 'My journal', 'J’ai besoin d’aide maintenant': 'I need help now',
  'Espace supervision': 'Supervision space', "Accès réservé à l'équipe": 'Team-only access',
  'Écoutants en attente': 'Pending listeners', 'Candidatures à valider': 'Applications to validate',
  'Alertes urgentes': 'Urgent alerts', 'À traiter maintenant': 'To handle now',
  'Conversations en cours': 'Active conversations', 'Conversations en attente': 'Pending conversations',
  'Cercles actifs': 'Active circles', 'Ados inscrits': 'Registered teens',
  'Alertes': 'Alerts', 'Aucune alerte.': 'No alerts.', 'Valider': 'Approve', 'Refuser': 'Reject',
  "Contacter l'ado": 'Contact the teen', 'Orienter vers un psychologue': 'Refer to a psychologist',
  'Confirmer le signal IA': 'Confirm AI signal', 'Marquer comme faux positif': 'Mark as false positive',
  'Clôturer l’alerte': 'Close alert', 'Candidatures': 'Applications', 'Annuaire': 'Directory',
  'Bonjour': 'Hello', "Vue de supervision": 'Supervision overview', 'Email': 'Email',
};

export function LanguageProvider({ children }) {
  const [langue, setLangue] = useState('fr');

  useEffect(() => {
    (async () => {
      const saved = await SecureStore.getItemAsync('langue_preferee');
      if (saved) setLangue(saved);
    })();
  }, []);

  const changerLangue = async (nouvelleLangue) => {
    setLangue(nouvelleLangue);
    await SecureStore.setItemAsync('langue_preferee', nouvelleLangue);
  };
  const traduire = (texte) => (langue === 'en' && typeof texte === 'string' ? (EN[texte] || texte) : texte);

  return (
    <LanguageContext.Provider value={{ langue, changerLangue, traduire }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLangue() {
  return useContext(LanguageContext);
}
