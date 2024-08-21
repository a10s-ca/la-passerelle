# Foire aux questions

## Performances

### Le script principal ne complète pas les tâches prévues et le journal d'exécution contient «Script exceeded execution time limit of 30 seconds»

Plusieurs raisons peuvent expliquer ce message d'erreur, mais dans tous les cas, deux approches sont disponibles pour régler le problème.

La première approche consiste à limiter le nombre d'opérations, ou leur complexité. Voici des exemples de solutions associées à cette approche:

* réduire la taille des pièces jointes ;
* synchroniser seulement le contenu des champs essentiels ;
* limiter le nombre d'enregistrements synchronisés en utilisant une vue Airtable qui se limite aux enregistrements qui doivent être synchronisés.

La deuxième approche consiste à segmenter l'appel au script principal en plusieurs appels. Par exemple, au lieu de synchroniser une table ou une vue en entier d'un seul appel au script principal, le script appelant (typiquement une extension) peut itérer sur les enregistrements et appeler le script principal pour chacun d'eux. Cette approche est illustrée dans les [exemples de code](../scripts/loopOverRecordsSync.js)

## Configurations

### Un nom de champs dans Airtable contient une apostrophe, comment faire pour l'identifier dans les configurations?

Nos exemples JavaScript utilisent l'apostrophe comme délimiteur de chaîne de caractères, mais vous pouvez utiliser les guillemets.

Ainsi, ceci:

```
'acf': {
  'champ_acf': 'Nom d'un champ Airtable' // 🚫 non fonctionnel
}
```

deviendra plutôt ceci:

```
"acf": {
  "champ_acf": "Nom d'un champ Airtable" // ✅ ça fonctionne!
}
```

### Comment faire pour importer du texte mis en forme (gras, italique) dans WordPress?

L'API d'Airtable ne permet pas d'obtenir la mise en forme native des champs texte long avec du «rich formatting». Nous suggérons donc de _ne pas_ utiliser l'option «rich formatting» et d'inclure des balises HTML simples dans le champ long texte, par exemple `<b></b>`, `<i></i>`, etc. Notez qu'il n'est pas nécessaire d'utiliser de balises pour les changements de lignes (`<br/>`).

### Comment faire pour synchroniser vers Airtable une pièce jointe tirée d'une table liée, à travers un champ de type «lookup»?

Il n'est pas possible de synchroniser le «lookup» d'une pièce jointe, par exemple une image. Par contre, si la table d'où provient la pièce jointe est synchronisée vers Airtable, il est possible de synchroniser vers WordPress les identifiants des pièces jointes, obtenus par un «lookup». De façon plus précise, il faut:

* dans la table qui contient les pièces jointes, ajouter un champ pour stocker les identifiants WordPress des médias correspondant
* configurer la synchronisation de la table en question pour que les identifiants de médias soient notés, en utilisant le paramètre de configuration `wpMediaIdField` (voir [l'API](api.md) pour plus d'information)
* créer dans la table de destination un «lookup» du champ contenant les identifiants WordPress de médias
* synchroniser ce champ vers le champ ACF de média correspondant.

À noter:
* la synchronisation de médias par des identifiants en «lookup» ne fonctionne seulement que si l'image est présente. Autrement, le script se termine sur une erreur
* cette stratégie est limitée à un seul média en «lookup»

### Quel est l'impact sur la base de données Wordpress?

Il est possible que le volume de synchronisations avec Wordpress ait un impact sur la taille des tables wp_postmeta et wp_posts à long terme. Il est recommandé d'optimiser les bases de données à interval régulier, par exemple avec l'extension WP Optimize.

## Expérience utilisateur

### Comment simplifier l'expérience des utilisateurs lorsque plusieurs options de synchronisation sont disponibles?

La présence de plusieurs modes de synchronisation, pour plusieurs tables dans une même base, peut rendre l'opération de la Passerelle complexe pour certains utilisateurs. Il est possible de créer une table de menu pour les différentes opérations, pour simplifier la vie des utilisateurs. Cette stratégie est décrite dans [un exemple avancé](../doc/exemples.md#avancé-un-seul-script-pour-plusieurs-types-dopérations-et-pour-maintenir-une-seule-table-de-correspondances).

## Expérience développeur

### Comment faire pour éviter de dupliquer les confirmations des correspondance de champs dans plusieurs extensions?

Il est possible de créer une extension polyvalente qui répond à la plupart des besoins, et qui contient toutes les tables de correspondances, pour toutes les tables, à un seul endroit. Cette stratégie est décrite dans [un exemple avancé](../doc/exemples.md#avancé-un-seul-script-pour-plusieurs-types-dopérations-et-pour-maintenir-une-seule-table-de-correspondances).

Par contre, cette stratégie ne peut pas être utilisée dans les automatisations.

Une approche alternative qui peut également être utilisée dans les automatisations consiste à définir des paramètres par défaut directement dans l'automatisation qui héberge le script principal. Cette stratégie est décrite dans [un autre exemple avancé](../doc/exemples.md#avancé-paramètres-par-défaut-pour-le-script-principal).

#### Comment retrouver le nom d'un champ à partir de son ID ?

Si vous avez utilisé l'ID d'un champ dans votre script, mais vous n'arrivez plus à retrouver de quel champ il s'agit, vous pouvez utilise le script suivant au sein d'une extension :

````
let key = await input.textAsync("Entrez l'id du champ :");

let allFields = {}

for (const table of base.tables) {

    for (const field of table.fields) {
        allFields[`${field.id}`] = "**Table** : " + table.name + " | **Champ** : " + field.name
    }

}

output.markdown(allFields[key]);
````
