import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import 'journal_screen.dart';
import 'chat_screen.dart';
import 'sos_screen.dart';

class AccueilScreen extends StatefulWidget {
  const AccueilScreen({super.key});

  @override
  State<AccueilScreen> createState() => _AccueilScreenState();
}

class _AccueilScreenState extends State<AccueilScreen> {
  int _humeurSelectionnee = 0;

  static const _humeurs = ['content', 'neutre', 'triste', 'colere', 'fatigue'];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.paper,
      body: SafeArea(
        child: Stack(
          children: [
            SingleChildScrollView(
              padding: const EdgeInsets.only(bottom: 90),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(
                    padding: const EdgeInsets.fromLTRB(18, 20, 18, 34),
                    decoration: BoxDecoration(
                      gradient: AppColors.heroGradient,
                      borderRadius: const BorderRadius.only(
                        bottomLeft: Radius.circular(26),
                        bottomRight: Radius.circular(26),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Bonsoir', style: Theme.of(context).textTheme.headlineMedium
                                ?.copyWith(color: Colors.white)),
                            Text('On est content de te voir',
                                style: Theme.of(context).textTheme.bodySmall
                                    ?.copyWith(color: Colors.white60)),
                          ],
                        ),
                        const CircleAvatar(
                          radius: 17,
                          backgroundColor: Colors.white24,
                          child: Icon(Icons.person_outline, color: Colors.white, size: 18),
                        ),
                      ],
                    ),
                  ),
                  Transform.translate(
                    offset: const Offset(0, -30),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 18),
                      child: Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Comment tu te sens là, maintenant ?',
                                  style: Theme.of(context).textTheme.bodyMedium
                                      ?.copyWith(fontWeight: FontWeight.w700)),
                              const SizedBox(height: 10),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: List.generate(_humeurs.length, (i) {
                                  final actif = i == _humeurSelectionnee;
                                  return GestureDetector(
                                    onTap: () => setState(() => _humeurSelectionnee = i),
                                    child: CircleAvatar(
                                      radius: 15,
                                      backgroundColor:
                                          actif ? AppColors.amber : AppColors.paper,
                                      child: Icon(_iconePourHumeur(i), size: 15,
                                          color: actif ? const Color(0xFF3A2410) : AppColors.inkSoft),
                                    ),
                                  );
                                }),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 18),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        _NavTile(
                          icon: Icons.menu_book_outlined,
                          label: 'Mon journal',
                          sub: 'Texte, audio ou photo',
                          accent: AppColors.amber,
                          onTap: () => Navigator.of(context).push(
                              MaterialPageRoute(builder: (_) => const JournalScreen())),
                        ),
                        _NavTile(
                          icon: Icons.chat_bubble_outline,
                          label: 'Parler à un écoutant',
                          sub: 'Quelqu\'un t\'écoute, en vrai',
                          accent: AppColors.green,
                          onTap: () => Navigator.of(context).push(
                              MaterialPageRoute(builder: (_) => const ChatScreen(conversationId: 1))),
                        ),
                        _NavTile(
                          icon: Icons.groups_outlined,
                          label: 'Mes cercles d\'écoute',
                          sub: 'Tu n\'es pas seul(e)',
                          accent: AppColors.inkSurface,
                          onTap: () {},
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            Positioned(
              left: 18, right: 18, bottom: 14,
              child: SizedBox(
                height: 48,
                child: ElevatedButton.icon(
                  onPressed: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const SosScreen())),
                  icon: const Icon(Icons.favorite_border, size: 16),
                  label: const Text('J\'ai besoin d\'aide maintenant'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  IconData _iconePourHumeur(int i) {
    switch (i) {
      case 0: return Icons.sentiment_satisfied_alt;
      case 1: return Icons.sentiment_neutral;
      case 2: return Icons.sentiment_dissatisfied;
      case 3: return Icons.sentiment_very_dissatisfied;
      default: return Icons.bedtime_outlined;
    }
  }
}

class _NavTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String sub;
  final Color accent;
  final VoidCallback onTap;

  const _NavTile({
    required this.icon, required this.label, required this.sub,
    required this.accent, required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 9),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: accent, width: 3).copyWith(
          // effet "bordure gauche uniquement" via un Container plus bas serait plus fidèle ;
          // simplifié ici pour rester lisible en Flutter pur.
        ),
      ),
      child: ListTile(
        onTap: onTap,
        leading: CircleAvatar(
          backgroundColor: AppColors.paper,
          child: Icon(icon, color: AppColors.ink, size: 18),
        ),
        title: Text(label, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
        subtitle: Text(sub, style: Theme.of(context).textTheme.bodySmall),
      ),
    );
  }
}
