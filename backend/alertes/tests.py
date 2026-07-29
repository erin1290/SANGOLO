"""
alertes/tests.py — le module IA ne fait jamais que créer une alerte,
jamais répondre ; le superviseur reste seul décisionnaire.
"""
from django.test import TestCase
from accounts.models import Utilisateur, Ecoutant, StatutEcoutant
from django.contrib.auth.models import User
from messagerie.models import Conversation, Message
from .models import Alerte, SourceAlerte, GraviteAlerte
from .supervision import analyser_message_en_tache_de_fond


class ModuleSupervisionTests(TestCase):
    def setUp(self):
        user_ado = User.objects.create_user(username="ado_x", password="x")
        self.ado = Utilisateur.objects.create(
            user=user_ado, pseudo="ado_x", age=15, mot_de_passe_hash=user_ado.password,
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
        analyser_message_en_tache_de_fond(message)
        self.assertEqual(Alerte.objects.filter(conversation=self.conversation).count(), 0)

    def test_message_a_risque_declenche_une_alerte_urgente_automatique(self):
        message = Message.objects.create(
            conversation=self.conversation, auteur="utilisateur",
            contenu="j'ai vraiment envie de mourir en ce moment",
        )
        analyser_message_en_tache_de_fond(message)
        alerte = Alerte.objects.get(conversation=self.conversation)
        self.assertEqual(alerte.source, SourceAlerte.MODULE_IA)
        self.assertEqual(alerte.gravite, GraviteAlerte.URGENT)

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
        analyser_message_en_tache_de_fond(message)
        nb_messages_apres = Message.objects.count()
        # +1 attendu : uniquement le message qu'on vient de créer nous-mêmes.
        self.assertEqual(nb_messages_apres, nb_messages_avant + 1)


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
