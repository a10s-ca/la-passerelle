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

Les types de champs supportés par le script sont les suivants:

|Type Airtable|Correspondace ACF suggérée|Notes|
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
