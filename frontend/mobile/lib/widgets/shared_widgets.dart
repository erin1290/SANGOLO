import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class HeroBand extends StatelessWidget {
  final String titre;
  final String? sousTitre;
  final Widget? trailing;
  final Widget? leading;
  final EdgeInsets padding;

  const HeroBand({
    super.key, required this.titre, this.sousTitre,
    this.trailing, this.leading,
    this.padding = const EdgeInsets.fromLTRB(18, 20, 18, 22),
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: padding,
      decoration: BoxDecoration(
        gradient: AppColors.heroGradient,
        borderRadius: BorderRadius.circular(22),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          if (leading != null) leading!,
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(titre, style: Theme.of(context).textTheme.titleLarge
                    ?.copyWith(color: Colors.white)),
                if (sousTitre != null)
                  Text(sousTitre!, style: Theme.of(context).textTheme.bodySmall
                      ?.copyWith(color: Colors.white60)),
              ],
            ),
          ),
          if (trailing != null) trailing!,
        ],
      ),
    );
  }
}

class SectionLabel extends StatelessWidget {
  final String text;
  const SectionLabel(this.text, {super.key});

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(top: 16, bottom: 8),
        child: Text(text, style: Theme.of(context).textTheme.labelSmall),
      );
}

class NavTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String? sub;
  final Color accent;
  final Widget? trailing;
  final VoidCallback onTap;

  const NavTile({
    super.key, required this.icon, required this.label, this.sub,
    required this.accent, this.trailing, required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 9),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border(left: BorderSide(color: accent, width: 3)),
        boxShadow: [BoxShadow(color: AppColors.ink.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 3))],
      ),
      child: ListTile(
        onTap: onTap,
        leading: CircleAvatar(
          backgroundColor: AppColors.paper,
          child: Icon(icon, color: AppColors.ink, size: 18),
        ),
        title: Text(label, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
        subtitle: sub != null ? Text(sub!, style: Theme.of(context).textTheme.bodySmall) : null,
        trailing: trailing,
      ),
    );
  }
}

class StatusBadge extends StatelessWidget {
  final String text;
  final Color color;
  const StatusBadge(this.text, {super.key, this.color = AppColors.green});

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
        decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(20)),
        child: Text(text, style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w700)),
      );
}

class GhostButton extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  final Color? color;
  const GhostButton({super.key, required this.label, required this.onTap, this.color});

  @override
  Widget build(BuildContext context) => SizedBox(
        width: double.infinity,
        child: OutlinedButton(
          onPressed: onTap,
          style: OutlinedButton.styleFrom(
            foregroundColor: color ?? AppColors.ink,
            side: BorderSide(color: (color ?? AppColors.line)),
            padding: const EdgeInsets.symmetric(vertical: 12),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          ),
          child: Text(label, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 11.5)),
        ),
      );
}

class ListItemCard extends StatelessWidget {
  final String titre;
  final String sousTitre;
  final Widget? tag;
  final VoidCallback? onTap;
  const ListItemCard({super.key, required this.titre, required this.sousTitre, this.tag, this.onTap});

  @override
  Widget build(BuildContext context) => Container(
        margin: const EdgeInsets.only(bottom: 9),
        padding: const EdgeInsets.all(13),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [BoxShadow(color: AppColors.ink.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 3))],
        ),
        child: InkWell(
          onTap: onTap,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(titre, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 11.5)),
                  if (tag != null) tag!,
                ],
              ),
              const SizedBox(height: 4),
              Text(sousTitre, style: Theme.of(context).textTheme.bodySmall),
            ],
          ),
        ),
      );
}
