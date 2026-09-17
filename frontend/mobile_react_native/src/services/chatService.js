import { getBaseUrl } from './apiService';
import * as SecureStore from 'expo-secure-store';
export class ChatService {
  constructor(conversationId) {
    this.conversationId = conversationId;
    this.listeners = [];
    this.tentative = 0;
    this.fermeManuel = false;
    this.filesAttente = [];
    this.bloque = false; // Flag pour bloquer l'envoi quand le groupe est verrouillé
    this._connecter();
  }
  async _connecter() {
    const token = await SecureStore.getItemAsync('auth_token');
    if (!token) {
      console.error('[ChatService] Token non trouvé - utilisateur non connecté');
      return;
    }
    const wsBase = getBaseUrl()
      .replace('http://', 'ws://')
      .replace('https://', 'wss://')
      .replace('/api', '');
    let wsUrl;
    if (String(this.conversationId).startsWith('cercle-')) {
      const cercleId = String(this.conversationId).replace('cercle-', '');
      wsUrl = `${wsBase}/ws/cercle/${cercleId}/?token=${token}`;
    } else {
      wsUrl = `${wsBase}/ws/conversation/${this.conversationId}/?token=${token}`;
    }
    console.log('[ChatService] Connexion WebSocket:', wsUrl);
    this.socket = new WebSocket(wsUrl);
    this.socket.onopen = () => {
      console.log('[ChatService] WebSocket connecté');
      this.tentative = 0;
      this._viderFileAttente();
    };
    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.listeners.forEach((cb) => cb(data));
    };
    this.socket.onerror = (error) => {
      console.error('[ChatService] Erreur WebSocket:', error);
      this._planifierReconnexion();
    };
    this.socket.onclose = (event) => {
      console.log('[ChatService] WebSocket fermé:', event.code, event.reason);
      if (!this.fermeManuel) this._planifierReconnexion();
    };
  }
  _planifierReconnexion() {
    if (this.fermeManuel) return;
    clearTimeout(this._timer);
    const delai = Math.min(2 ** this.tentative, 30) * 1000;
    this.tentative += 1;
    this._timer = setTimeout(() => this._connecter(), delai);
  }
  _viderFileAttente() {
    console.log('[ChatService] Vidage de la file d\'attente:', this.filesAttente.length, 'messages');
    while (this.filesAttente.length) {
      const m = this.filesAttente.shift();
      this.socket.send(JSON.stringify(m));
      console.log('[ChatService] Message envoyé depuis la file d\'attente');
    }
  }
  onMessage(callback) {
    this.listeners.push(callback);
    return () => { this.listeners = this.listeners.filter((cb) => cb !== callback); };
  }
  send(auteur, contenu, extra = {}) {
    if (this.bloque) {
      console.log('[ChatService] Envoi bloqué (groupe verrouillé)');
      return;
    }
    const message = { auteur, contenu, ...extra };
    console.log('[ChatService] Envoi message:', message);
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
      console.log('[ChatService] Message envoyé');
    } else {
      console.log('[ChatService] WebSocket non connecté, ajout en file d\'attente');
      this.filesAttente.push(message);
    }
  }
  setBloque(bloque) {
    this.bloque = bloque;
    console.log('[ChatService] Envoi', bloque ? 'bloqué' : 'débloqué');
  }
  close() {
    this.fermeManuel = true;
    clearTimeout(this._timer);
    this.socket?.close();
  }
}