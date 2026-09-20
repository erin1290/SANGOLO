from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0006_psychologuepartenaire_disponible"),
        ("messagerie", "0005_message_analyse_ia_effectuee"),
    ]

    operations = [
        migrations.AddField(
            model_name="conversation",
            name="superviseur",
            field=models.ForeignKey(blank=True, help_text="Renseigné uniquement pour une discussion privée issue d'une alerte.", null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="conversations_supervision", to="accounts.superviseur"),
        ),
        migrations.AlterField(
            model_name="message",
            name="auteur",
            field=models.CharField(choices=[("utilisateur", "Ado"), ("ecoutant", "Écoutant"), ("superviseur", "Superviseur")], max_length=20),
        ),
    ]
