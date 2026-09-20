from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("accounts", "0005_ecoutant_date_entretien_and_more")]

    operations = [
        migrations.AddField(
            model_name="psychologuepartenaire",
            name="disponible",
            field=models.BooleanField(default=True, help_text="Visible dans la liste d'orientation des superviseurs."),
        ),
    ]
