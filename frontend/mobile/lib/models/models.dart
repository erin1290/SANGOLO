class EntreeJournal {
  final int? id;
  final String humeur;
  final String texte;
  final DateTime? dateCreation;

  EntreeJournal({this.id, required this.humeur, this.texte = '', this.dateCreation});

  factory EntreeJournal.fromJson(Map<String, dynamic> json) => EntreeJournal(
        id: json['id'],
        humeur: json['humeur'],
        texte: json['texte'] ?? '',
        dateCreation: json['date_creation'] != null
            ? DateTime.tryParse(json['date_creation'])
            : null,
      );
}

class Ressource {
  final String nom;
  final String ville;
  final String typeRessource;

  Ressource({required this.nom, required this.ville, required this.typeRessource});

  factory Ressource.fromJson(Map<String, dynamic> json) => Ressource(
        nom: json['nom'],
        ville: json['ville'],
        typeRessource: json['type_ressource'],
      );
}
