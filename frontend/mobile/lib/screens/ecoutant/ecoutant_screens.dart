import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shared_widgets.dart';
import '../../services/api_service.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class EcoutantConnexionScreen extends StatelessWidget {
  const EcoutantConnexionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.paper,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const HeroBand(titre: 'Espace ecoutant', sousTitre: 'Acces reserve aux volontaires valides'),
              const SectionLabel('Identifiant'),
              TextField(decoration: const InputDecoration(hintText: 'toi@partenaire.org')),
              const SectionLabel('Mot de passe'),
              TextField(obscureText: true, decoration: const InputDecoration(hintText: '••••••••')),
              const SizedBox(height: 16),
              ElevatedButton(onPressed: () {}, child: const Text('Se connecter')),
              const SizedBox(height: 10),
              Text('Cree apres validation par l\\'association partenaire',
                  textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodySmall),
            ],
          ),
        ),
      ),
    );
  }
}

class EcoutantDashboardScreen extends StatelessWidget {
  const EcoutantDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.paper,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const HeroBand(
                titre: 'Bonsoir Aline', sousTitre: 'Merci d\\'etre la ce soir',
                trailing: StatusBadge('Disponible', color: Color(0x33FFFFFF)),
              ),
              const SectionLabel("Aujourd'hui"),
              NavTile(
                icon: Icons.mark_email_unread_outlined, label: 'Demandes en attente',
                sub: 'Nouvelles conversations', accent: AppColors.amber,
                trailing: const StatusBadge('3', color: AppColors.coral), onTap: () {},
              ),
              NavTile(
                icon: Icons.forum_outlined, label: 'Conversations en cours',
                sub: 'A poursuivre', accent: AppColors.green,
                trailing: const StatusBadge('2'), onTap: () {},
              ),
              NavTile(
                icon: Icons.groups_outlined, label: 'Mes cercles d\\'ecoute',
                sub: '2 groupes actifs', accent: AppColors.inkSurface, onTap: () {},
              ),
              NavTile(
                icon: Icons.calendar_today_outlined, label: 'Mon planning',
                sub: 'Creneaux a venir', accent: AppColors.amber, onTap: () {},
              ),
              const SizedBox(height: 8),
              Center(child: Text('12 ados accompagnes -- 8h d\\'ecoute ce mois-ci',
                  style: Theme.of(context).textTheme.bodySmall)),
            ],
          ),
        ),
      ),
    );
  }
}

class EscaladeScreen extends StatefulWidget {
  const EscaladeScreen({super.key});
  @override
  State<EscaladeScreen> createState() => _EscaladeScreenState();
}

class _EscaladeScreenState extends State<EscaladeScreen> {
  int _gravite = 2;
  final _descriptionController = TextEditingController();
  static const _labels = ['Faible', 'Moyen', 'Urgent'];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.paper,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const HeroBand(titre: 'Signaler une situation', sousTitre: 'mango_23 -- conversation en cours'),
              const SectionLabel('Niveau de gravite'),
              Row(
                children: List.generate(3, (i) {
                  final actif = i == _gravite;
                  return Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _gravite = i),
                      child: Container(
                        margin: const EdgeInsets.only(right: 6),
                        padding: const EdgeInsets.symmetric(vertical: 9),
                        decoration: BoxDecoration(
                          color: actif ? AppColors.coral : AppColors.card,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(_labels[i], textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700,
                                color: actif ? Colors.white : AppColors.inkSoft)),
                      ),
                    ),
                  );
                }),
              ),
              const SectionLabel('Ce qui t\\'inquiete'),
              TextField(
                controller: _descriptionController, maxLines: 4,
                decoration: const InputDecoration(hintText: 'Decrire brievement la situation...'),
              ),
              const SizedBox(height: 14),
              ElevatedButton(
                onPressed: () {
                  Navigator.of(context).pop();
                },
                child: const Text('Envoyer au superviseur'),
              ),
              const SizedBox(height: 8),
              Text('La conversation reste ouverte pendant la prise en charge',
                  textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodySmall),
            ],
          ),
        ),
      ),
    );
  }
}

class EcoutantParametresScreen extends StatefulWidget {
  const EcoutantParametresScreen({super.key});

  @override
  State<EcoutantParametresScreen> createState() => _EcoutantParametresScreenState();
}

class _EcoutantParametresScreenState extends State<EcoutantParametresScreen> {
  String _langue = 'fr';
  bool _notifOn = true;
  bool _chargementLangue = true;
  final _api = ApiService();
  final _storage = const FlutterSecureStorage();

  static const _t = {
    'fr': {'settings': 'Parametres', 'account': 'Reglages de ton compte', 'security': 'Securite', 'securitySub': 'Changer le mot de passe', 'notifications': 'Notifications', 'notifSub': 'Nouvelles demandes, alertes', 'language': 'Langue', 'help': 'Aide & formation', 'helpSub': 'Revoir le module d\\'ecoute', 'logout': 'Se deconnecter'},
    'en': {'settings': 'Settings', 'account': 'Account settings', 'security': 'Security', 'securitySub': 'Change password', 'notifications': 'Notifications', 'notifSub': 'New requests, alerts', 'language': 'Language', 'help': 'Help & training', 'helpSub': 'Review listening module', 'logout': 'Log out'},
  };

  @override
  void initState() {
    super.initState();
    _chargerLangue();
  }

  Future<void> _chargerLangue() async {
    try {
      final token = await _storage.read(key: 'auth_token');
      final id = await _storage.read(key: 'user_id');
      if (token != null && id != null) {
        final profil = await _api.getProfilEcoutant(int.parse(id));
        if (profil['langue_preferee'] != null) {
          setState(() => _langue = profil['langue_preferee']);
        }
      }
    } catch (e) { /* silent */ }
    finally { if (mounted) setState(() => _chargementLangue = false); }
  }

  Future<void> _changerLangue(String nouvelleLangue) async {
    setState(() => _langue = nouvelleLangue);
    try {
      final id = await _storage.read(key: 'user_id');
      if (id != null) {
        await _api.updateLangueEcoutant(int.parse(id), nouvelleLangue);
      }
    } catch (e) { /* silent */ }
  }

  @override
  Widget build(BuildContext context) {
    final t = _t[_langue] ?? _t['fr']!;
    return Scaffold(
      backgroundColor: AppColors.paper,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              HeroBand(titre: t['settings']!, sousTitre: t['account']!),
              SectionLabel('Compte'),
              NavTile(icon: Icons.security_outlined, label: t['security']!, sub: t['securitySub']!,
                  accent: AppColors.ink, trailing: const StatusBadge('ON'), onTap: () {}),
              NavTile(icon: Icons.notifications_none, label: t['notifications']!, sub: t['notifSub']!,
                  accent: AppColors.amber,
                  trailing: Switch(
                    value: _notifOn,
                    onChanged: (v) => setState(() => _notifOn = v),
                    activeColor: AppColors.green,
                  ),
                  onTap: () {}),
              SectionLabel('Preferences'),
              NavTile(
                icon: Icons.language_outlined,
                label: t['language']!,
                sub: _langue == 'fr' ? 'Francais' : 'English',
                accent: AppColors.green,
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    GestureDetector(
                      onTap: () => _changerLangue('fr'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: _langue == 'fr' ? AppColors.amber : AppColors.paper,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text('FR', style: TextStyle(
                          fontWeight: FontWeight.w700, fontSize: 11,
                          color: _langue == 'fr' ? const Color(0xFF3A2410) : AppColors.inkSoft,
                        )),
                      ),
                    ),
                    const SizedBox(width: 4),
                    GestureDetector(
                      onTap: () => _changerLangue('en'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: _langue == 'en' ? AppColors.amber : AppColors.paper,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text('EN', style: TextStyle(
                          fontWeight: FontWeight.w700, fontSize: 11,
                          color: _langue == 'en' ? const Color(0xFF3A2410) : AppColors.inkSoft,
                        )),
                      ),
                    ),
                  ],
                ),
                onTap: () => _changerLangue(_langue == 'fr' ? 'en' : 'fr'),
              ),
              NavTile(icon: Icons.school_outlined, label: t['help']!, sub: t['helpSub']!,
                  accent: AppColors.inkSurface, onTap: () {}),
              const Spacer(),
              GhostButton(label: t['logout']!, color: AppColors.coral, onTap: () {}),
            ],
          ),
        ),
      ),
    );
  }
}