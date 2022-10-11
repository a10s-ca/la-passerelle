# La passerelle

La passerelle est une collection de scripts Airtable permettant d'interagir avec WordPress.

## À propos

Alors qu’Airtable est de plus en plus utilisé par les organisations culturelles, les besoins d’interaction entre ce système de gestion de bases de données et le CMS WordPress sont grandissants. Qu’il s’agisse de publier un répertoire de membres, d’oeuvres ou de spectacles sur le web, le besoin d’allier la simplicité de gestion des données d’Airtable avec les fonctionnalités de publication de contenu de WordPress sont fréquents.

C’est pour répondre à ce genre de besoins que [RAPAIL](https://rapail.ca/) développe La passerelle: un coffre à outils pour l’intégration de WordPress et Airtable. RAPAIL souhaite évidemment répondre à ses propres besoins. Elle souhaite également faire profiter la communauté culturelle québécoise des travaux qu’elle entreprend.

Le présent dépôt de code contient des extraits de scripts Airtable utilisés par RAPAIL pour synchroniser les données de sa base Airtable avec son site web sous WordPress. Ce code, qui s’appuie sur différentes principes pour répondre à une série de besoins tout en répondant à des contraintes, est complété par une documentation offrant des scénarios d’utilisation en réponse à des besoins types.

## Choix d’approche

Au moment de démarrer le projet, la seule option disponible pour intégrer des données depuis Airtable dans WordPress était [l’extension Airpress](https://wordpress.org/plugins/airpress/). Elle a depuis été retirée de l'écosystème WordPress.

Cette extension présentait par ailleurs des limitations fonctionnelles (notamment le fait que les données ne soient pas synchronisées sous la forme de contenus natifs WordPress), en plus de ne pas être supportée par son développeur.

Pour répondre à des objectifs de maintenabilité, notre projet tente de répondre aux différents besoins sans développer d’extension WordPress, ou ajouter dans le projet WordPress des dépendances sur des extensions qui ne sont pas largement utilisée (et donc avec une bonne probabilité d’être maintenue à long terme).

Il s’agit donc essentiellement de développer des scripts dans Airtable qui interragissent avec l’API de WordPress.

## Guide de démarrage et d'installation

L'utilisation de La passerelle demande de compléter plusieurs étapes de configuration dans Airtable et dans WordPress. Ces étapes sont présentées dans le [guide de démarrage et d'installation](doc/installation.md)

## Utilisation

### Généralités

Les outils de synchronisation devront être personnalisés selon vos besoins.

Il s'agit essentiellement de créer des extensions (pour les synchronisation déclenchées manuellement) ou des automatisations (pour les synchronisations déclenchées de façon périodique, ou en réaction à un déclencheur externe à la base de données) qui utiliseront le script principal, en lui envoyant des paramètres qui permettront de faire des choix sur les données à synchroniser (la table, les champs et les enregistrements ciblés, et les correspondances avec les éléments équivalents dans WordPress).

Dans tous les cas, il s'agit de faire un appel au lien HTTP («webhook»), comme à l'étape 2.4, en utilisant des valeurs adaptées dans la variable `params`. Les options de la variable `params` sont documentées dans la section [API](doc/api.md). Le lien HTTP peut être appelé depuis une extension, une automatisation, ou même une application externe.


### Éléments requis dans la table à synchroniser

La Passerelle doit stocker certaines métadonnées relatives aux informations disponibles dans WordPress et dans Airtable et pour garder des traces des identifiants de contenus et de médias dans les deux système. Il est donc essentiel de prévoir un champ de type «Long text» dans les tables à synchroniser. Par défaut, le script cherche les données dans un champ nommé «meta», mais il est possible de spécifier un autre nom de champ. Cette option, et d'autres options liées à la consignation de métadonnées de la synchroniser (date de dernière synchronisation, URL du contenu dans WordPress, etc.), sont documentées dans la section [API](doc/api.md).


### Exemples de scripts

Des exemples pour des cas d'utilisation communs suivent. Dans tous les cas, les scripts contiennent des références à des tables et des champs fictifs: vous devez les modifier pour tenir compte de votre base de données.

#### 3.1. Synchroniser manuellement un enregistrement

Pour ce cas de figure, l'approche suggérée est de créer une extension qui permet de sélectionner un enregistrement (avec `input.recordAsync`). L'extension peut être déclenchée par un champ de type «Button» au besoin. L'extension doit contenir un script inspiré de l'exemple [recordSync.js](scripts/recordSync.js).

#### 3.2. Synchroniser manuellement une table en entier

L'approche est similaire à l'exemple 3.1, sauf pour le champ `Button`, non pertinent dans ce cas-ci. Le script à utiliser est  [tableSync.js](scripts/tableSync.js).

#### 3.3. Synchroniser le contenu d'une vue de façon récurrente à tous les jours, à la même heure.

Dans ce cas, il est suggéré de créer une automatisation avec un déclencheur périodique. L'action de l'automatisation sera l'exécution d'un script, dont le contenu sera inspiré de  [viewSync.js](scripts/viewSync.js).

## Références

La page dédiée à l'[API](doc/api.md) contient les références détaillées sur les options du script, le types de champs, etc.
