# JLG Event Builder

Application PWA autonome pour préparer et piloter :
- mariages ;
- anniversaires ;
- séminaires ;
- événements associatifs ;
- autres événements.

## Fonctionnalités

- tableau de bord multi-événements ;
- assistant de création guidé ;
- rétroplanning généré selon le type d'événement ;
- budget prévisionnel, devis, engagé, payé et reste à payer ;
- prestataires rattachables aux lignes budgétaires ;
- plan de salle tactile avec glisser-déposer ;
- invités / participants, régimes, hébergement et placement ;
- checklist opérationnelle ;
- équipe, responsabilités et tâches ;
- fiches prestataires ;
- conducteur du jour J ;
- documents imprimables / export PDF via le navigateur ;
- export / import JSON ;
- sauvegarde locale par navigateur ;
- manifest PWA + service worker pour installation et fonctionnement hors-ligne après première ouverture.

## Hébergement

Ce dossier est statique : aucun serveur applicatif ni base de données ne sont nécessaires.
Il peut être publié tel quel sur GitHub Pages ou tout hébergeur de fichiers statiques HTTPS.

## Données

Les données sont stockées dans `localStorage` sur l'appareil. Pour changer d'appareil, utiliser la fonction Exporter / Importer depuis l'application.
