from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0006_psychologuepartenaire_disponible"),
        ("alertes", "0002_alerte_message_verdict_ia"),
    ]

    operations = [
        migrations.CreateModel(
            name="OrientationPsychologue",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("date_creation", models.DateTimeField(auto_now_add=True)),
                ("alerte", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="orientations", to="alertes.alerte")),
                ("psychologue", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="orientations_recues", to="accounts.psychologuepartenaire")),
                ("superviseur", models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="orientations_creees", to="accounts.superviseur")),
            ],
            options={"ordering": ["-date_creation"]},
        ),
        migrations.AddConstraint(
            model_name="orientationpsychologue",
            constraint=models.UniqueConstraint(fields=("alerte", "psychologue"), name="orientation_unique_par_alerte"),
        ),
    ]
