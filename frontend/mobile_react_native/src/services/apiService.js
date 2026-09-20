import * as SecureStore from 'expo-secure-store';

// URL de l'API backend — configurable via .env (EXPO_PUBLIC_API_URL)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.173:8000/api';

export function getBaseUrl() {
  return API_BASE_URL;
}

async function headers(withAuth = true) {
  const h = { 'Content-Type': 'application/json' };
  if (withAuth) {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) h['Authorization'] = `Token ${token}`;
  }
  return h;
}

export class ApiException extends Error {}

// â”€â”€â”€ Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function inscriptionAdo({ pseudo, age, motDePasse, consentementAnalyseIa }) {
  const res = await fetch(`${getBaseUrl()}/accounts/auth/ado/inscription/`, {
    method: 'POST',
    headers: await headers(false),
    body: JSON.stringify({
      pseudo, age, mot_de_passe: motDePasse, consentement_analyse_ia: consentementAnalyseIa,
    }),
  });
  return handleAuthResponse(res);
}

export async function connexionAdo({ pseudo, motDePasse }) {
  const res = await fetch(`${getBaseUrl()}/accounts/auth/ado/connexion/`, {
    method: 'POST',
    headers: await headers(false),
    body: JSON.stringify({ pseudo, mot_de_passe: motDePasse }),
  });
  return handleAuthResponse(res);
}

export async function connexionEcoutant({ email, motDePasse }) {
  const res = await fetch(`${getBaseUrl()}/accounts/auth/ecoutant/connexion/`, {
    method: 'POST',
    headers: await headers(false),
    body: JSON.stringify({ email, mot_de_passe: motDePasse }),
  });
  return handleAuthResponse(res);
}

export async function connexionSuperviseur({ email, motDePasse }) {
  const res = await fetch(`${getBaseUrl()}/accounts/auth/superviseur/connexion/`, {
    method: 'POST',
    headers: await headers(false),
    body: JSON.stringify({ email, mot_de_passe: motDePasse }),
  });
  return handleAuthResponse(res);
}

export async function getStatsSuperviseur() {
  const res = await fetch(`${getBaseUrl()}/accounts/superviseur/stats/`, { headers: await headers() });
  if (!res.ok) throw new ApiException(`Erreur ${res.status}`);
  return res.json();
}

export async function listerEcoutantsEnAttente() {
  const res = await fetch(`${getBaseUrl()}/accounts/superviseur/ecoutants-en-attente/`, { headers: await headers() });
  if (!res.ok) throw new ApiException(`Erreur ${res.status}`);
  return res.json();
}

export async function listerAdosSupervision() {
  const res = await fetch(`${getBaseUrl()}/accounts/superviseur/ados/`, { headers: await headers() });
  if (!res.ok) throw new ApiException(`Erreur ${res.status}`);
  return res.json();
}

export async function validerEcoutant(ecoutantId) {
  const res = await fetch(`${getBaseUrl()}/accounts/superviseur/ecoutants/${ecoutantId}/valider/`, {
    method: 'POST', headers: await headers(),
  });
  if (!res.ok) throw new ApiException(`Erreur ${res.status}`);
  return res.json();
}

export async function refuserEcoutant(ecoutantId) {
  const res = await fetch(`${getBaseUrl()}/accounts/superviseur/ecoutants/${ecoutantId}/refuser/`, {
    method: 'POST', headers: await headers(),
  });
  if (!res.ok) throw new ApiException(`Erreur ${res.status}`);
  return res.json();
}

async function handleAuthResponse(res) {
  const contenu = await res.text();
  let data;
  try {
    data = contenu ? JSON.parse(contenu) : {};
  } catch {
    throw new ApiException(
      'Le serveur a renvoyé une réponse invalide. Vérifie que le backend est redémarré et que l’adresse IP configurée est correcte.'
    );
  }
  if (res.ok) {
    await SecureStore.setItemAsync('auth_token', data.token);
    if (data.pseudo) await SecureStore.setItemAsync('user_pseudo', data.pseudo);
    if (data.nom_complet) await SecureStore.setItemAsync('user_nom', data.nom_complet);
    if (data.id) await SecureStore.setItemAsync('user_id', String(data.id));
    if (data.statut) await SecureStore.setItemAsync('user_statut', data.statut);
    return data;
  }
  throw new ApiException(data.detail || 'Erreur de connexion');
}

export async function getStoredUserNom() {
  return await SecureStore.getItemAsync('user_nom') || '';
}

export async function deconnexion() {
  await SecureStore.deleteItemAsync('auth_token');
  await SecureStore.deleteItemAsync('user_pseudo');
  await SecureStore.deleteItemAsync('user_nom');
  await SecureStore.deleteItemAsync('user_id');
  await SecureStore.deleteItemAsync('user_statut');
}

// --- Alertes ---

export async function listerAlertes() {
  const res = await fetch(`${getBaseUrl()}/alertes/alertes/`, { headers: await headers() });
  if (!res.ok) throw new ApiException(`Erreur ${res.status}`);
  const data = await res.json();
  return data.results ?? data;
}

export async function detailAlerte(alerteId) {
  const res = await fetch(`${getBaseUrl()}/alertes/alertes/${alerteId}/`, { headers: await headers() });
  if (!res.ok) throw new ApiException(`Erreur ${res.status}`);
  return res.json();
}

export async function traiterAlerte(alerteId, { superviseurAssigne, statut, justification, verdictIa }) {
  const body = {};
  if (superviseurAssigne !== undefined) body.superviseur_assigne = superviseurAssigne;
  if (statut !== undefined) body.statut = statut;
  if (justification !== undefined) body.justification_traitement = justification;
  if (verdictIa !== undefined) body.verdict_ia = verdictIa;
  const res = await fetch(`${getBaseUrl()}/alertes/alertes/${alerteId}/`, {
    method: 'PATCH',
    headers: { ...(await headers()), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new ApiException(`Erreur ${res.status}`);
  return res.json();
}

export async function creerReponseAlerte(alerteId, contenu) {
  const res = await fetch(`${getBaseUrl()}/alertes/alertes/${alerteId}/reponse/`, {
    method: 'POST',
    headers: { ...(await headers()), 'Content-Type': 'application/json' },
    body: JSON.stringify({ contenu }),
  });
  if (!res.ok) throw new ApiException(`Erreur ${res.status}`);
  return res.json();
}

export async function contacterAdoDepuisAlerte(alerteId) {
  const res = await fetch(`${getBaseUrl()}/alertes/alertes/${alerteId}/contacter-ado/`, {
    method: 'POST', headers: await headers(),
  });
  if (!res.ok) throw new ApiException(`Erreur ${res.status}`);
  return res.json();
}

export async function listerPsychologuesDisponibles() {
  const res = await fetch(`${getBaseUrl()}/alertes/alertes/psychologues-disponibles/`, { headers: await headers() });
  if (!res.ok) throw new ApiException(`Erreur ${res.status}`);
  return res.json();
}

export async function orienterAlerteVersPsychologue(alerteId, psychologueId) {
  const res = await fetch(`${getBaseUrl()}/alertes/alertes/${alerteId}/orienter-vers-psychologue/`, {
    method: 'POST', headers: await headers(), body: JSON.stringify({ psychologue_id: psychologueId }),
  });
  if (!res.ok) throw new ApiException(`Erreur ${res.status}`);
  return res.json();
}

// â”€â”€â”€ Journal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function listerEntreesJournal() {
  const res = await fetch(`${getBaseUrl()}/journal/entrees/`, { headers: await headers() });
  if (!res.ok) throw new ApiException(`Erreur ${res.status}`);
  const data = await res.json();
  return data.results ?? data;
}

export async function creerEntreeJournalTexte({ humeur, texte }) {
  const res = await fetch(`${getBaseUrl()}/journal/entrees/`, {
    method: 'POST', headers: await headers(),
    body: JSON.stringify({ humeur, texte }),
  });
  if (!res.ok) throw new ApiException(`Erreur ${res.status}`);
  return res.json();
}

export async function envoyerFichierJournal({ humeur, uri, champ, nomFichier }) {
  const token = await SecureStore.getItemAsync('auth_token');
  const formData = new FormData();
  formData.append('humeur', humeur);
  formData.append(champ, { uri, name: nomFichier, type: champ === 'fichier_audio' ? 'audio/m4a' : 'image/jpeg' });

  const res = await fetch(`${getBaseUrl()}/journal/entrees/`, {
    method: 'POST',
    headers: { Authorization: token ? `Token ${token}` : '' },
    body: formData,
  });
  if (!res.ok) throw new ApiException(`Erreur ${res.status}`);
  return res.json();
}

// â”€â”€â”€ Messagerie â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function listerConversations() {
  const res = await fetch(`${getBaseUrl()}/messagerie/conversations/`, { headers: await headers() });
  if (!res.ok) throw new ApiException(`Erreur ${res.status}`);
  const data = await res.json();
  return data.results ?? data;
}

export async function creerConversation(ecoutantId) {
  const res = await fetch(`${getBaseUrl()}/messagerie/conversations/`, {
    method: 'POST',
    headers: await headers(),
    body: JSON.stringify(ecoutantId ? { ecoutant: ecoutantId } : {}),
  });
  if (!res.ok) throw new ApiException(`Erreur ${res.status}`);
  return res.json();
}

export async function listerMessages(conversationId) {
  const res = await fetch(`${getBaseUrl()}/messagerie/messages/?conversation=${conversationId}`, { headers: await headers() });
  if (!res.ok) throw new ApiException(`Erreur ${res.status}`);
  const data = await res.json();
  return data.results ?? data;
}
export async function envoyerMessage(conversationId, contenu, auteur = 'utilisateur') {
  const res = await fetch(`${getBaseUrl()}/messagerie/messages/`, {
    method: 'POST',
    headers: await headers(),
    body: JSON.stringify({ conversation: conversationId, contenu, auteur }),
  });
  if (!res.ok) throw new ApiException(`Erreur ${res.status}`);
  return res.json();
}

export async function listerCerclesEcoute() {
  const res = await fetch(`${getBaseUrl()}/messagerie/cercles/`, { headers: await headers() });
  if (!res.ok) throw new ApiException(`Erreur ${res.status}`);
  const data = await res.json();
  return data.results ?? data;
}

// --- Conversations Ado-Ado ---

export async function listerConversationsAdo(cercleId) {
  const url = cercleId
    ? `${getBaseUrl()}/messagerie/conversations-ado/?cercle=${cercleId}`
    : `${getBaseUrl()}/messagerie/conversations-ado/`;
  const res = await fetch(url, { headers: await headers() });
  if (!res.ok) throw new ApiException(`Erreur ${res.status}`);
  return res.json();
}

export async function creerConversationAdo(destinataireId, cercleId) {
  const res = await fetch(`${getBaseUrl()}/messagerie/conversations-ado/`, {
    method: 'POST',
    headers: await headers(),
    body: JSON.stringify({ destinataire: destinataireId, cercle: cercleId }),
  });
  if (!res.ok) throw new ApiException(`Erreur ${res.status}`);
  return res.json();
}

export async function listerMessagesAdo(conversationId) {
  const res = await fetch(`${getBaseUrl()}/messagerie/messages-ado/?conversation=${conversationId}`, { headers: await headers() });
  if (!res.ok) throw new ApiException(`Erreur ${res.status}`);
  return res.json();
}

export async function envoyerMessageAdo(conversationId, contenu) {
  const res = await fetch(`${getBaseUrl()}/messagerie/messages-ado/`, {
    method: 'POST',
    headers: await headers(),
    body: JSON.stringify({ conversation: conversationId, contenu }),
  });
  if (!res.ok) throw new ApiException(`Erreur ${res.status}`);
  return res.json();
}

export async function listerMessagesCercle(cercleId) {
  const res = await fetch(`${getBaseUrl()}/messagerie/messages-cercle/?cercle=${cercleId}`, { headers: await headers() });
  if (!res.ok) throw new ApiException(`Erreur ${res.status}`);
  const data = await res.json();
  return data.results ?? data;
}

// â”€â”€â”€ Planning â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function listerCreneauxPlanning() {
  const res = await fetch(`${getBaseUrl()}/planning/creneaux/`, { headers: await headers() });
  if (!res.ok) throw new ApiException(`Erreur ${res.status}`);
  const data = await res.json();
  return data.results ?? data;
}

// â”€â”€â”€ Ressources â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function listerRessources(ville) {
  const url = new URL(`${getBaseUrl()}/ressources/ressources/`);
  if (ville) url.searchParams.set('ville', ville);
  const res = await fetch(url.toString(), { headers: await headers() });
  if (!res.ok) throw new ApiException(`Erreur ${res.status}`);
  const data = await res.json();
  return data.results ?? data;
}
// â”€â”€â”€ Ecoutants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function listerEcoutants() {
  const res = await fetch(`${getBaseUrl()}/messagerie/ecoutants/`, { headers: await headers() });
  if (!res.ok) throw new ApiException(`Erreur ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : (data.results ?? []);
}

// â”€â”€â”€ CrÃ©ation cercle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function creerCercle({ theme }) {
  const res = await fetch(`${getBaseUrl()}/messagerie/cercles/`, {
    method: 'POST', headers: await headers(),
    body: JSON.stringify({ theme, actif: true }),
  });
  if (!res.ok) throw new ApiException(`Erreur ${res.status}`);
  return res.json();
}
// ─── Membres Cercle ─────────────────────────────────────

export async function rejoindreCercle(cercleId) {
  const res = await fetch(`${getBaseUrl()}/messagerie/membres-cercle/`, {
    method: 'POST', headers: await headers(),
    body: JSON.stringify({ cercle: cercleId }),
  });
  if (!res.ok) throw new ApiException(`Erreur ${res.status}`);
  return res.json();
}

export async function quitterCercle(membreId) {
  const res = await fetch(`${getBaseUrl()}/messagerie/membres-cercle/${membreId}/`, {
    method: 'DELETE', headers: await headers(),
  });
  if (!res.ok) throw new ApiException(`Erreur ${res.status}`);
  return true;
}

export async function listerMembresCercle(cercleId) {
  const res = await fetch(`${getBaseUrl()}/messagerie/membres-cercle/?cercle=${cercleId}`, { headers: await headers() });
  if (!res.ok) throw new ApiException(`Erreur ${res.status}`);
  const data = await res.json();
  return data.results ?? data;
}

export async function ajouterMembreCercle(cercleId, utilisateurId) {
  const res = await fetch(`${getBaseUrl()}/messagerie/membres-cercle/`, {
    method: 'POST', headers: await headers(),
    body: JSON.stringify({ cercle: cercleId, utilisateur: utilisateurId }),
  });
  if (!res.ok) throw new ApiException(`Erreur ${res.status}`);
  return res.json();
}
