from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("alertes", "0001_initial"),
        ("messagerie", "0005_message_analyse_ia_effectuee"),
    ]

    operations = [
        migrations.AddField(
            model_name="alerte",
            name="message",
            field=models.ForeignKey(blank=True, help_text="Message source, réservé à l'apprentissage local et aux superviseurs.", null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="alertes_ia", to="messagerie.message"),
        ),
        migrations.AddField(
            model_name="alerte",
            name="verdict_ia",
            field=models.CharField(choices=[("a_confirmer", "À confirmer"), ("confirmee", "Signal confirmé"), ("faux_positif", "Faux positif")], default="a_confirmer", help_text="Validation humaine utilisée pour améliorer le classifieur local.", max_length=20),
        ),
    ]
