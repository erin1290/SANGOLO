"""
alertes/tests.py — le module IA ne fait jamais que créer une alerte,
jamais répondre ; le superviseur reste seul décisionnaire.
"""
from tempfile import TemporaryDirectory
from unittest.mock import patch

from django.test import TestCase, override_settings
from accounts.models import (
    Utilisateur, Ecoutant, StatutEcoutant, Superviseur,
    PsychologuePartenaire, StatutPsychologue,
)
from django.contrib.auth.models import User
from messagerie.models import Conversation, Message
from .models import Alerte, SourceAlerte, GraviteAlerte, OrientationPsychologue, StatutAlerte
from .supervision import analyser_message_en_tache_de_fond
from .apprentissage import entrainer, predire_signal_local, sauvegarder_modele


class ModuleSupervisionTests(TestCase):
    def setUp(self):
        user_ado = User.objects.create_user(username="ado_x", password="x")
        self.ado = Utilisateur.objects.create(
            user=user_ado, pseudo="ado_x", age=15, mot_de_passe_hash=user_ado.password,
            consentement_analyse_ia=True,
        )
        user_ecoutant = User.objects.create_user(username="ecoutant_x", password="x")
        self.ecoutant = Ecoutant.objects.create(
            user=user_ecoutant, nom_complet="Ecoutant X", email="x@partenaire.org",
            mot_de_passe_hash=user_ecoutant.password, statut=StatutEcoutant.VALIDE,
        )
        self.conversation = Conversation.objects.create(utilisateur=self.ado, ecoutant=self.ecoutant)

    def test_message_neutre_ne_declenche_aucune_alerte(self):
        message = Message.objects.create(
            conversation=self.conversation, auteur="utilisateur",
            contenu="j'ai passé une bonne journée aujourd'hui",
        )
        analyser_message_en_tache_de_fond(message.id)
        self.assertEqual(Alerte.objects.filter(conversation=self.conversation).count(), 0)

    def test_message_a_risque_declenche_une_alerte_urgente_automatique(self):
        message = Message.objects.create(
            conversation=self.conversation, auteur="utilisateur",
            contenu="j'ai vraiment envie de mourir en ce moment",
        )
        analyser_message_en_tache_de_fond(message.id)
        alerte = Alerte.objects.get(conversation=self.conversation)
        self.assertEqual(alerte.source, SourceAlerte.MODULE_IA)
        self.assertEqual(alerte.gravite, GraviteAlerte.URGENT)
        self.assertEqual(alerte.message_id, message.id)

    def test_message_ecoutant_incitant_au_suicide_declenche_une_alerte_urgente(self):
        message = Message.objects.create(
            conversation=self.conversation, auteur="ecoutant",
            contenu="Tu devrais te suicider.",
        )
        analyser_message_en_tache_de_fond(message.id)
        alerte = Alerte.objects.get(message=message)
        self.assertEqual(alerte.source, SourceAlerte.MODULE_IA)
        self.assertEqual(alerte.gravite, GraviteAlerte.URGENT)
        self.assertIn("écoutant", alerte.description)

    def test_un_message_nest_analyse_quune_fois(self):
        message = Message.objects.create(
            conversation=self.conversation, auteur="utilisateur", contenu="j'ai envie de mourir",
        )
        analyser_message_en_tache_de_fond(message.id)
        analyser_message_en_tache_de_fond(message.id)
        self.assertEqual(Alerte.objects.filter(message=message).count(), 1)

    def test_le_module_ia_ne_cree_jamais_de_message_de_reponse(self):
        """
        Garde-fou le plus important du projet : quel que soit le signal
        détecté, aucun Message n'est jamais créé par le module IA — 
        seulement une Alerte à destination d'un humain.
        """
        nb_messages_avant = Message.objects.count()
        message = Message.objects.create(
            conversation=self.conversation, auteur="utilisateur",
            contenu="je sais plus quoi faire, j'en peux plus",
        )
        analyser_message_en_tache_de_fond(message.id)
        nb_messages_apres = Message.objects.count()
        # +1 attendu : uniquement le message qu'on vient de créer nous-mêmes.
        self.assertEqual(nb_messages_apres, nb_messages_avant + 1)

    def test_sans_consentement_lanalyse_ne_cree_pas_dalerte(self):
        self.ado.consentement_analyse_ia = False
        self.ado.save(update_fields=["consentement_analyse_ia"])
        message = Message.objects.create(
            conversation=self.conversation, auteur="utilisateur", contenu="j'ai envie de mourir",
        )
        analyser_message_en_tache_de_fond(message.id)
        message.refresh_from_db()
        self.assertFalse(message.signale_par_module_ia)
        self.assertTrue(message.analyse_ia_effectuee)
        self.assertFalse(Alerte.objects.exists())

    @patch("alertes.apprentissage.predire_signal_local")
    def test_modele_local_cree_une_alerte_sans_message(self, prediction_mock):
        prediction_mock.return_value = {
            "signal": True,
            "gravite": "urgent",
            "motif": "Risque d auto-agression à examiner.",
        }
        message = Message.objects.create(
            conversation=self.conversation, auteur="utilisateur", contenu="texte ambigu",
        )
        analyser_message_en_tache_de_fond(message.id)
        alerte = Alerte.objects.get(conversation=self.conversation)
        self.assertEqual(alerte.gravite, GraviteAlerte.URGENT)
        self.assertEqual(alerte.description, "Risque d auto-agression à examiner.")
        self.assertEqual(Message.objects.count(), 1)
        self.assertTrue(prediction_mock.called)


class ApprentissageLocalTests(TestCase):
    def test_modele_local_apprend_et_detecte_un_signal(self):
        exemples = [(f"je vais bien aujourd hui {i}", "aucun") for i in range(6)]
        exemples += [(f"je veux disparaitre mourir {i}", "urgent") for i in range(6)]
        with TemporaryDirectory() as dossier:
            chemin = f"{dossier}/supervision.json"
            with override_settings(SUPERVISION_LOCAL_MODEL_PATH=chemin):
                sauvegarder_modele(entrainer(exemples))
                prediction = predire_signal_local("je veux disparaitre")
                self.assertTrue(prediction["signal"])
                self.assertEqual(prediction["gravite"], "urgent")

    def test_modele_ne_peut_pas_etre_entraine_avec_trop_peu_dexemples(self):
        with self.assertRaises(ValueError):
            entrainer([("je vais bien", "aucun"), ("je veux mourir", "urgent")])


class ActionsSuperviseurTests(TestCase):
    def setUp(self):
        self.user_superviseur = User.objects.create_user(username="superviseur_x", password="x")
        self.superviseur = Superviseur.objects.create(
            user=self.user_superviseur, nom_complet="Superviseur X",
            email="superviseur@example.org", mot_de_passe_hash=self.user_superviseur.password,
        )
        user_ado = User.objects.create_user(username="ado_orientation", password="x")
        ado = Utilisateur.objects.create(user=user_ado, pseudo="ado_orientation", age=15, mot_de_passe_hash=user_ado.password)
        conversation = Conversation.objects.create(utilisateur=ado)
        self.alerte = Alerte.objects.create(
            conversation=conversation, source=SourceAlerte.ECOUTANT,
            gravite=GraviteAlerte.URGENT, description="Signal à traiter",
        )
        self.psychologue = PsychologuePartenaire.objects.create(
            nom_complet="Dr Disponible", structure="Centre Test", ville="Douala",
            email="psy@example.org", certifie=True, disponible=True,
            statut=StatutPsychologue.VALIDE,
        )
        self.client.force_login(self.user_superviseur)

    def test_contacter_ado_cree_une_conversation_superviseur_separee(self):
        response = self.client.post(f"/api/alertes/alertes/{self.alerte.id}/contacter-ado/")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["superviseur"], self.superviseur.id)
        self.assertNotEqual(response.data["id"], self.alerte.conversation_id)
        self.alerte.refresh_from_db()
        self.assertEqual(self.alerte.statut, StatutAlerte.EN_COURS)

    def test_orientation_utilise_seulement_un_psychologue_disponible(self):
        response = self.client.post(
            f"/api/alertes/alertes/{self.alerte.id}/orienter-vers-psychologue/",
            {"psychologue_id": self.psychologue.id}, content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(OrientationPsychologue.objects.filter(alerte=self.alerte, psychologue=self.psychologue).exists())


"""
planning/tests.py — une séance physique ne peut jamais être assignée
à un écoutant, seulement à un psychologue partenaire certifié.
"""
from django.core.exceptions import ValidationError
from accounts.models import PsychologuePartenaire
from planning.models import CreneauPlanning, TypeCreneau


class PlanningSeancePhysiqueTests(TestCase):
    def setUp(self):
        user_ecoutant = User.objects.create_user(username="ecoutant_y", password="x")
        self.ecoutant = Ecoutant.objects.create(
            user=user_ecoutant, nom_complet="Ecoutant Y", email="y@partenaire.org",
            mot_de_passe_hash=user_ecoutant.password, statut=StatutEcoutant.VALIDE,
        )
        self.psychologue = PsychologuePartenaire.objects.create(
            nom_complet="Dr. Test", structure="Cabinet Test", ville="Yaoundé",
            email="dr@test.org", certifie=True,
        )

    def test_seance_physique_assignee_a_un_ecoutant_est_rejetee(self):
        creneau = CreneauPlanning(
            ecoutant=self.ecoutant, type_creneau=TypeCreneau.SEANCE_PHYSIQUE,
            jour_semaine=2, heure="16:00", lieu_institutionnel="Cabinet Test",
        )
        with self.assertRaises(ValidationError):
            creneau.clean()

    def test_seance_physique_sans_lieu_institutionnel_est_rejetee(self):
        creneau = CreneauPlanning(
            psychologue=self.psychologue, type_creneau=TypeCreneau.SEANCE_PHYSIQUE,
            jour_semaine=2, heure="16:00", lieu_institutionnel="",
        )
        with self.assertRaises(ValidationError):
            creneau.clean()

    def test_seance_physique_valide_pour_un_psychologue_certifie(self):
        creneau = CreneauPlanning(
            psychologue=self.psychologue, type_creneau=TypeCreneau.SEANCE_PHYSIQUE,
            jour_semaine=2, heure="16:00", lieu_institutionnel="Cabinet Test",
        )
        creneau.clean()  # ne doit lever aucune exception
