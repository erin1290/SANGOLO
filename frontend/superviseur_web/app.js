/* Interface web superviseur. Même API Django que l'ancienne interface mobile. */
// Depuis file:// il n'y a pas d'hôte : le backend local reste accessible sur
// localhost. Depuis http://IP:3000, l'adresse IP de l'ordinateur est reprise.
const defaultApi = location.protocol === 'file:'
  ? 'http://localhost:8000/api'
  : `${location.protocol}//${location.hostname}:8000/api`;
const API = window.SANGOLO_API_BASE || defaultApi;
const app = document.querySelector('#app');
let token = sessionStorage.getItem('sangolo_superviseur_token') || '';
let nom = sessionStorage.getItem('sangolo_superviseur_nom') || 'Superviseur';
let page = 'dashboard';

function esc(value = '') { const d = document.createElement('div'); d.textContent = String(value); return d.innerHTML; }
async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, { ...options, headers: { 'Content-Type':'application/json', ...(token ? { Authorization:`Token ${token}` } : {}), ...(options.headers || {}) } });
  const text = await res.text(); let data = {}; try { data = text ? JSON.parse(text) : {}; } catch { throw new Error('Réponse serveur invalide. Vérifiez que le backend est démarré.'); }
  if (!res.ok) throw new Error(data.detail || `Erreur ${res.status}`); return data;
}
function list(data) { return data.results || data || []; }
function shell(title, body) {
  const links = [['dashboard','Tableau de bord'],['alertes','Alertes'],['ecoutants','Écoutants à valider'],['ados','Ados inscrits'],['cercles','Cercles actifs']];
  app.innerHTML = `<div class="shell"><aside class="sidebar"><div class="brand">Sangolo<small>Supervision web</small></div>${links.map(([id,label]) => `<button class="nav ${page===id?'active':''}" data-page="${id}">${label}</button>`).join('')}<button class="nav logout" id="logout">Déconnexion</button></aside><section class="content"><div class="top"><div><h1>${title}</h1><p class="subtitle">Bonjour ${esc(nom)}</p></div></div>${body}</section></div>`;
  document.querySelectorAll('[data-page]').forEach((b) => b.onclick = () => { page = b.dataset.page; render(); });
  document.querySelector('#logout').onclick = () => { sessionStorage.clear(); token=''; render(); };
}
function error(message) { return `<p class="error">${esc(message)}</p>`; }
async function dashboard() {
  try { const [s, alerts] = await Promise.all([api('/accounts/superviseur/stats/'), api('/alertes/alertes/')]); const urgent = list(alerts).filter(a => a.gravite === 'urgent').length;
    shell('Tableau de bord', `<div class="grid"><div class="stat"><strong>${urgent}</strong>Alertes urgentes</div><div class="stat"><strong>${s.ecoutants_en_attente}</strong>Écoutants à valider</div><div class="stat"><strong>${s.conversations_en_cours}</strong>Conversations en cours</div><div class="stat"><strong>${s.cercles_actifs}</strong>Cercles actifs</div><div class="stat"><strong>${s.ados_inscrits}</strong>Ados inscrits</div></div>`);
  } catch (e) { shell('Tableau de bord', error(e.message)); }
}
async function alertes() {
  try { const data = list(await api('/alertes/alertes/')); shell('Alertes', `<div class="list">${data.length ? data.map(a => `<article class="item"><div><h3>${esc(a.pseudo_ado || `Alerte #${a.id}`)} <span class="tag ${a.gravite}">${esc(a.gravite_display)}</span></h3><p class="muted">${esc(a.source_display)} · ${esc(a.statut)}<br>${esc(a.description)}</p></div><div class="actions"><button class="primary" data-alert="${a.id}">Ouvrir</button></div></article>`).join('') : '<p class="empty">Aucune alerte.</p>'}</div>`); document.querySelectorAll('[data-alert]').forEach(b => b.onclick = () => alertDetail(b.dataset.alert));
  } catch (e) { shell('Alertes', error(e.message)); }
}
async function alertDetail(id) {
  try { const a = await api(`/alertes/alertes/${id}/`); const psys = list(await api('/alertes/alertes/psychologues-disponibles/')); shell(`Alerte — ${esc(a.pseudo_ado || '#'+a.id)}`, `<div class="panel"><p class="message">${esc(a.description)}</p><span class="tag ${a.gravite}">${esc(a.gravite_display)}</span></div><div class="actions"><button class="primary" id="contact">Contacter l'ado</button>${a.source==='module_ia' ? '<button class="secondary" id="confirm">Confirmer le signal IA</button><button class="secondary" id="false">Faux positif</button>' : ''}<select id="psy"><option value="">Orienter vers un psychologue…</option>${psys.map(p=>`<option value="${p.id}">${esc(p.nom_complet)} — ${esc(p.structure)} (${esc(p.ville)})</option>`).join('')}</select><button class="danger" id="close">Clôturer l’alerte</button></div><p id="feedback" class="muted"></p>`);
    const feedback = (m) => document.querySelector('#feedback').textContent = m;
    document.querySelector('#contact').onclick = async () => { try { const c=await api(`/alertes/alertes/${id}/contacter-ado/`,{method:'POST'}); chat(c.id,a.pseudo_ado); } catch(e){feedback(e.message);} };
    if (document.querySelector('#confirm')) document.querySelector('#confirm').onclick=async()=>{ await api(`/alertes/alertes/${id}/`,{method:'PATCH',body:JSON.stringify({verdict_ia:'confirmee'})}); alertDetail(id); };
    if (document.querySelector('#false')) document.querySelector('#false').onclick=async()=>{ await api(`/alertes/alertes/${id}/`,{method:'PATCH',body:JSON.stringify({verdict_ia:'faux_positif'})}); alertDetail(id); };
    document.querySelector('#psy').onchange=async(e)=>{ if(!e.target.value)return; try { await api(`/alertes/alertes/${id}/orienter-vers-psychologue/`,{method:'POST',body:JSON.stringify({psychologue_id:e.target.value})}); feedback('Orientation enregistrée.'); } catch(err){feedback(err.message);} };
    document.querySelector('#close').onclick=async()=>{ await api(`/alertes/alertes/${id}/`,{method:'PATCH',body:JSON.stringify({statut:'cloturee',justification_traitement:'Traitée depuis la supervision web.'})}); page='alertes'; render(); };
  } catch (e) { shell('Alerte', error(e.message)); }
}
async function chat(id, pseudo) { try { const messages=list(await api(`/messagerie/messages/?conversation=${id}`)); shell(`Discussion avec ${esc(pseudo || 'ado')}`, `<div class="chat" id="chat">${messages.map(m=>`<div class="bubble ${m.auteur==='superviseur'?'mine':''}">${esc(m.contenu)}<div class="small muted">${esc(m.auteur)}</div></div>`).join('')}</div><div class="row"><input id="message" placeholder="Écrire un message…"><button class="primary" id="send">Envoyer</button></div>`); const box=document.querySelector('#chat'); box.scrollTop=box.scrollHeight; document.querySelector('#send').onclick=async()=>{const input=document.querySelector('#message');if(!input.value.trim())return;await api('/messagerie/messages/',{method:'POST',body:JSON.stringify({conversation:id,auteur:'superviseur',contenu:input.value.trim()})});chat(id,pseudo);}; } catch(e){shell('Discussion',error(e.message));} }
async function ecoutants() { try { const data=list(await api('/accounts/superviseur/ecoutants-en-attente/')); shell('Écoutants à valider', `<div class="list">${data.length?data.map(e=>`<article class="item"><div><h3>${esc(e.nom_complet)}</h3><p class="muted">${esc(e.email)} · ${esc(e.institution_partenaire||'Institution non renseignée')}</p></div><div class="actions"><button class="primary" data-approve="${e.id}">Valider</button><button class="danger" data-reject="${e.id}">Refuser</button></div></article>`).join(''):'<p class="empty">Aucun écoutant en attente.</p>'}</div>`); document.querySelectorAll('[data-approve]').forEach(b=>b.onclick=async()=>{await api(`/accounts/superviseur/ecoutants/${b.dataset.approve}/valider/`,{method:'POST'});ecoutants();});document.querySelectorAll('[data-reject]').forEach(b=>b.onclick=async()=>{await api(`/accounts/superviseur/ecoutants/${b.dataset.reject}/refuser/`,{method:'POST'});ecoutants();}); }catch(e){shell('Écoutants à valider',error(e.message));} }
async function ados() { try { const data=list(await api('/accounts/superviseur/ados/')); shell('Ados inscrits', `<div class="list">${data.map(a=>`<article class="item"><div><h3>${esc(a.pseudo)}</h3><p class="muted">${esc(a.age)} ans · compte anonyme</p></div></article>`).join('')||'<p class="empty">Aucun ado inscrit.</p>'}</div>`); }catch(e){shell('Ados inscrits',error(e.message));} }
async function cercles() { try { const data=list(await api('/messagerie/cercles/')); const actifs=data.filter(c=>c.actif); shell('Cercles actifs', `<div class="list">${actifs.map(c=>`<article class="item"><div><h3>${esc(c.theme)}</h3><p class="muted">${c.nombre_membres||0} membre(s) · ${esc(c.ecoutant_nom||'Animateur non assigné')}</p></div></article>`).join('')||'<p class="empty">Aucun cercle actif.</p>'}</div>`); }catch(e){shell('Cercles actifs',error(e.message));} }
async function render() { if(!token){ app.innerHTML=`<main class="login"><form class="login-card" id="login"><h1>Sangolo</h1><p class="subtitle">Espace de supervision web</p><label class="field">E-mail</label><input type="email" id="email" required><label class="field">Mot de passe</label><input type="password" id="password" required><button class="primary" type="submit" style="width:100%;margin-top:20px">Se connecter</button><p id="login-error" class="error"></p></form></main>`; document.querySelector('#login').onsubmit=async(e)=>{e.preventDefault();try{const d=await api('/accounts/auth/superviseur/connexion/',{method:'POST',body:JSON.stringify({email:email.value,mot_de_passe:password.value})});token=d.token;nom=d.nom_complet;sessionStorage.setItem('sangolo_superviseur_token',token);sessionStorage.setItem('sangolo_superviseur_nom',nom);render();}catch(err){document.querySelector('#login-error').textContent=err.message;}}; return; } ({dashboard,alertes,ecoutants,ados,cercles}[page] || dashboard)(); }
render();
