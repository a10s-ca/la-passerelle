# API du script principal La passerelle

## Paramètres

Lors de l'appel au script, l'ensemble des paramètres doivent être envoyés dans le corps («body») de la requête, sous la clé `params` d'un objet principal.

Par exemple:

```javascript
var config = {};
config.params = JSON.stringify({
    syncType: 'record',
    airtable: {
        table: 'Artistes',
        ...
    },
    wordpress: {
       postType: 'artiste',
       title: 'titre',
       content: 'contenu',
       featured_media: 83,
       acf: {
            'nom': 'Nom',
            'prenom': 'Prénom',
            ...
       }
    }
});

let response = await remoteFetchAsync(webhookUrl, {
    method: 'POST',
    body: JSON.stringify(config),
    headers: {
        'Content-Type': 'application/json'
    }
});
```

## Métadonnées

La Passerelle doit stocker certaines métadonnées relatives aux informations disponibles dans WordPress et dans Airtable. L'ensemble de ces métadonnées sont sérialisées au format JSON et stockées dans un champs de type «Long text» dans chacun des enregistrements des tables Airtable qui font l'objet d'une synchronisation.

Par défaut, le script cherche les données dans un champ nommé «meta». Il est toutefois possible de d'utiliser un autre champ en le spécifiant dans les paramètres d'appel du script, à la clé `airtable.metaFieldName`. Le champs de métadonnées contiendra plusieurs informations relatives au contenu correspondant à un enregistrement dans WordPress. Ces informations sont sérialisées au format JSON.

Il est par ailleurs possible de faire en sorte que le script note certaines de ces informations dans d'autres champs, en spécifiant leur nom dans les paramètres d'exécution du script, sous la clé `airtable`. Les options possible sont:

|Clé de paramètre|Type de champ|Contenu du champ|
|------------|------------|------------|
|wpIdField|Nombre entier|Identifiant WordPress du contenu|
|wpUrlField|URL|Lien public du contenu dans WordPress|
|lastSyncFieldName|Date et heure|Date et heure de la dernière synchronisation|

Par exemple, les paramètres suivants indiquent au script que le champ pour stocker les métadonnées se nomme «_meta» (plutôt que «meta») et que le lien public du contenu WordPress doit être stocké dans le champs «Lien»

```javascript
config.params = JSON.stringify({
    syncType: 'record',
    airtable: {
        table: 'Artistes',
        metaFieldName: '_meta',   // ⬅
        wpUrlField: 'Lien',       // ⬅
        ...
    },
    wordpress: {
       postType: 'artiste',
       acf: {
            'nom': 'Nom',
            'prenom': 'Prénom',
            ...
       }
    }
});

...suite du script...
```

## Types de champs supportés

Les types de champs supportés par le script, pour les correspondances vers des champs ACF (donc la cl/ `acf` sous `wordpress` dans l'objet de configuration), sont les suivants:

|Type Airtable|Correspondance ACF suggérée|Notes|
|------------|------------|------------|
|singleLineText|Text||
|multilineText|Text Area||
|email|Email||
|url|Url||
|singleSelect|Select|Si une valeur tirée de Airtable n'existe pas dans les options d'ACF, le champ ne sera pas synchronisé.|
|phoneNumber|Text||
|formula|Text ou Text Area|Le résultat de la formule, convertit en texte, sera copié dans ACF|
|rollup|Text ou Text Area|Le résultat du rollup, convertit en texte, sera copié dans ACF|
|date|Date Picker||
|dateTime|Date Time Picker||
|multipleAttachments (une seule image jointe)|Image|Seuls les champs contenant une seule pièce jointe, dans un format d'image connu (jpg, jpeg, png, gif, svg, ico, webp)|
|multipleSelects|Option 1: Text|Le comportement sera identique à un champs _singleSelect_. Aucune configuration supplémentaire n'est nécessaire|
||Option 2: Taxonomy|Cette option permet d'interagir avec les taxonomies de WordPress. Le champ ACF doit être configuré pour permettre la création de termes. Les valeurs incluses dans le champs Airtable deviendront des termes dans la taxonomie ciblée. Voir les notes sur les taxonomies pour plus de détails sur le fonctionnement.|
|multipleRecordLinks (relation)|Relation|Le champs Airtable doit contenir les identifiants WordPress des contenus correspond aux relations. Voir les notes sur les relations pour plus de détails sur le fonctionnement.|

Dans le cas des champs standards de WordPress, le script permet d'indiquer les valeurs suivantes:

* dans `params.wordpress.content`, le nom d'un champ quelconque dont le contenu, converti en texte, sera utilisé comme contenu principal du «post» dans WordPress
* dans `params.wordpress.featured_media`, le choix du média principal du «post», sous la forme de soit:
 * l'identifiant numérique du média WordPress, dans un champ texte ou nombre
 * une image, dans un champs de pièce jointe Airtable



## Statut des contenus dans WordPress

Par défaut, la Passerelle crée des contenus en état brouillon dans WordPress. Il est possible de choisir l'état des contenus créés avec la clé `wordpress.status` des paramètres. Les valeurs acceptées sont `publish`, `future`, `draft`, `pending` et `private`. Par exemple:

```javascript
config.params = JSON.stringify({
    syncType: 'record',
    airtable: {
        table: 'Artistes'
        ...
    },
    wordpress: {
       postType: 'artiste',
       status: 'publish',   // ⬅
       acf: { ... }
    }
});
```

## Taxonomies

Il est possible de faire en sorte qu'un champ de sélection multiple dans Airtable permet de gérer une taxonomie dans WordPress. Pour ce faire, la configuration du champs ACF doit être modifiée. Plutôt que de simplement indiquer la correspondance avec le champs ACF, il faut mentionner la taxonomie concernée. Le format doit être le suivant:

```javascript
config.params = JSON.stringify({
    syncType: 'record',
    airtable: {
        table: 'Artistes'
    },
    wordpress: {
       postType: 'artiste',
       acf: {
            'nom': 'Nom',
            'prenom': 'Prénom',
            'type_de_membre': { // ⬅
              'field': 'Type de membre', // le champ Airtable de type multipleSelects
              'model': 'type_de_membre' // le nom de la taxonomie
            }
       }
    }
});
```

Si une valeur du champ Airtable n'existe pas dans la taxonomie, elle sera créée dans WordPress. Les valeur non utilisées ne sont toutefois pas supprimées de WordPress.

## Relations

Un champ de relation dans Airtable peut être synchronisé avec un champ relation dans WordPress, à condition que la table liée dans Airtable soit également synchronisée vers un type de contenu dans WordPress.

Les étapes à suivre sont les suivantes:

* ajouter un champ de type _lookup_ dans Airtable pour obtenir les identifiants WordPress des enregistrements liés (l'utilisation des options de métadonnées permettant de stocker cet identifiant dans un champ dédié sera essentielle)
* faire la configuration de synchronisation sur le champs _lookup_
* utiliser les options de configurations détaillées pour spécifier le type de contenu lié dans WordPress

L'appel au script prendra la forme suivante:

```javascript
config.params = JSON.stringify({
    syncType: 'record',
    airtable: {
        table: 'Artistes'
    },
    wordpress: {
       postType: 'artiste',
       acf: {
            'nom': 'Nom',
            'prenom': 'Prénom',
            'oeuvres': { // ⬅
              'field': 'ID WordPress des oeuvres', // le champ lookup qui reprend les identifiants WordPress de la table liée
              'model': 'oeuvre' // le nom du type de contenu lié dans WordPress
            }
       }
    }
});
```
