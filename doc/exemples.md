# Exemples de scripts

Des exemples pour des cas d'utilisation communs suivent. Dans tous les cas, les scripts contiennent des références à des tables et des champs fictifs: vous devez les modifier pour tenir compte de votre base de données.

## Synchroniser manuellement un enregistrement

Pour ce cas de figure, l'approche suggérée est de créer une extension qui permet de sélectionner un enregistrement (avec `input.recordAsync`). L'extension peut être déclenchée par un champ de type «Button» au besoin. L'extension doit contenir un script inspiré de l'exemple [recordSync.js](../scripts/recordSync.js).

## Synchroniser manuellement une table en entier

L'approche est similaire à l'exemple 3.1, sauf pour le champ `Button`, non pertinent dans ce cas-ci. Le script à utiliser est  [tableSync.js](../scripts/tableSync.js).

## Synchroniser le contenu d'une vue de façon récurrente à tous les jours, à la même heure.

Dans ce cas, il est suggéré de créer une automatisation avec un déclencheur périodique. L'action de l'automatisation sera l'exécution d'un script, dont le contenu sera inspiré de [viewSync.js](../scripts/viewSync.js).

## Synchroniser une vue en entier, mais enregistrement par enregistrement.

Il peut arriver que la synchronisation d'une vue (ou d'une table) en entier ne fonctionne pas, parce que la taille des données fait en sorte que le script principal aurait besoin de plus de 30 secondes d'exécution, la limite imposée par Airtable.

Dans ce cas, il est recommandé d'appeler le script principal pour chaque enregistrement, comme illustré dans [loopOverRecordsSync.js](../scripts/loopOverRecordsSync.js)
