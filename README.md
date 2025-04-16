# La passerelle

La passerelle est une collection de scripts Airtable permettant d'interagir avec WordPress.

## À propos

Alors qu’Airtable est de plus en plus utilisé par les organisations culturelles, les besoins d’interaction entre ce système de gestion de bases de données et le CMS WordPress sont grandissants. Qu’il s’agisse de publier un répertoire de membres, d’oeuvres ou de spectacles sur le web, le besoin d’allier la simplicité de gestion des données d’Airtable avec les fonctionnalités de publication de contenu de WordPress sont fréquents.

C’est pour répondre à ce genre de besoins que [RAPAIL](https://rapail.ca/) développe La passerelle: un coffre à outils pour l’intégration de WordPress et Airtable. RAPAIL souhaite évidemment répondre à ses propres besoins. Elle souhaite également faire profiter la communauté culturelle québécoise des travaux qu’elle entreprend.

Le présent dépôt de code contient des extraits de scripts Airtable utilisés par RAPAIL pour synchroniser les données de sa base Airtable avec son site web sous WordPress. Ce code, qui s’appuie sur différentes principes pour répondre à une série de besoins tout en répondant à des contraintes, est complété par une documentation offrant des scénarios d’utilisation en réponse à des besoins types.

Ce projet a été rendu possible grâce à l'appui du programme [Exploration et déploiement numérique](https://www.calq.gouv.qc.ca/aides/exploration-et-deploiement-numerique-organismes) du [Conseil des arts et des lettres du Québec](https://www.calq.gouv.qc.ca/), et du programme [Innovation et développement du secteur](https://conseildesarts.ca/financement/subventions/appuyer-la-pratique-artistique/innovation-et-developpement-du-secteur) du [Conseil des arts du Canada](https://conseildesarts.ca/).

## Guide de démarrage et d'installation

L'utilisation de La passerelle demande de compléter plusieurs étapes de configuration dans Airtable et dans WordPress. Ces étapes sont présentées dans le [guide de démarrage et d'installation](doc/installation.md)

## Utilisation

### Généralités

Les outils de synchronisation devront être personnalisés selon vos besoins.

Il s'agit essentiellement de créer des automatisations qui utiliseront le script principal, en lui envoyant des paramètres qui permettront de faire des choix sur les données à synchroniser (la table, les champs et les enregistrements ciblés, et les correspondances avec les éléments équivalents dans WordPress).

Dans tous les cas, il s'agit de faire un appel au lien HTTP («webhook») du script principal, en utilisant des valeurs adaptées dans la variable `params`. Les options de la variable `params` sont documentées dans la section [API](doc/api.md). Le lien HTTP peut être appelé depuis une automatisation, une extension, ou même une application externe.

### Éléments requis dans la table à synchroniser

La Passerelle doit stocker certaines métadonnées relatives aux informations disponibles dans WordPress et dans Airtable pour garder des traces des identifiants de contenus et de médias dans les deux système. Il est donc essentiel de prévoir un champ de type «Long text» dans les tables à synchroniser. Par défaut, le script cherche les données dans un champ nommé «meta», mais il est possible de spécifier un autre nom de champ. Cette option, et d'autres options liées à la consignation de métadonnées de la synchroniser (date de dernière synchronisation, URL du contenu dans WordPress, etc.), sont documentées dans la section [API](doc/api.md).

### Références

La page dédiée à l'[API](doc/api.md) contient les références détaillées sur les options du script, les types de champs, etc.

La [foire aux questions](doc/faq.md) offre des solutions à des problèmes connus du script, ou des suggestion d'approches pour répondre à des besoins spécifiques de synchronisation de données.

Des [exemples de script](doc/exemples.md) sont disponibles.

## Comment soumettre des suggestions? Comment rapporter un problème?

Si vous rencontrez un problème («bogue») en utilisant La Passerelle, ou si vous avez une idée d'une nouvelle fonctionnalité utile, nous vous invitons à documenter le besoin dans la section [Issues](https://github.com/a10s-ca/la-passerelle/issues). Soyez le plus précis possible. Dans le cas d'un bogue, il sera utile de décrire précisément les données, la configuration de La Passerelle, le message d'erreur ou le comportement détaillé, et ce qui était attendu.

## Comment contribuer?

Les contributions au code ou à la documentation de La Passerelle sont bienvenues! Pour contribuer:

1. Faites un «fork» du projet.
2. Apportez les modifications (et testez les, dans le cas de changements au code).
3. Faites une «pull request» sur vos modifications.

## Notes sur l'origine du projet

Au moment de démarrer le projet, la seule option disponible pour intégrer des données depuis Airtable dans WordPress était [l’extension Airpress](https://wordpress.org/plugins/airpress/). Elle a depuis été retirée de l'écosystème WordPress.

Cette extension présentait par ailleurs des limitations fonctionnelles (notamment le fait que les données ne soient pas synchronisées sous la forme de contenus natifs WordPress), en plus de ne pas être supportée par son développeur.

Pour répondre à des objectifs de maintenabilité, notre projet tente de répondre aux différents besoins sans développer d’extension WordPress, ni ajouter dans le projet WordPress des dépendances à des extensions qui ne sont pas largement utilisées (et donc avec une bonne probabilité d’être maintenue à long terme).

## Licence

_En cas de litige, seule la [version originale](LICENSE.md) de cette page a valeur juridique._

Copyright 2022 A10s inc. et RAPAIL

La présente autorise, de façon libre et gratuite, à toute personne obtenant une copie de ce programme et des fichiers de documentation associés (le Programme), de distribuer le Programme sans restriction, y compris sans limitation des droits d'utiliser, copier, modifier, fusionner, publier, distribuer, sous-autoriser ou vendre des copies du Programme, et de permettre aux personnes à qui le Programme est fourni d'en faire autant, aux conditions suivantes.

Le copyright précédent et cette autorisation doivent être distribués dans toute copie entière ou substantielle de ce Programme.

Le Programme est fourni en l'état, sans garantie d'aucune sorte, explicite ou implicite, y compris les garanties de commercialisation ou d'adaptation dans un but particulier et l'absence de contrefaçon. En aucun cas les auteurs ou ayants droit ne seront tenus responsables de réclamations, dommages ou autres, que ce soit dans une action de nature contractuelle, préjudiciable ou autres façons, découlant de, hors ou en connexion avec le Programme ou l'utilisation ou autres modifications du Programme.
