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
       acf: { // remplacez ici acf par meta si vous utilises JetEngine de Crocoblocks
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

Les paramètres passés de cette façon seront fusionnés avec les paramètres par défaut, s'ils existent.

## Correspondance des champs

La clé `params.wordpress` contient les configurations pour faire correspondre les entrées dans WordPress avec les champs de la table Airtable choisie.

Pour tous les types de contenus (articles, pages ou types de contenus personnalisés), le script permet d'indiquer les valeurs suivantes:

* `params.wordpress.title`: le titre du contenu (voir la note plus bas au sujet du titre)
* `params.wordpress.content`: le nom d'un champ quelconque dont le contenu, converti en texte, sera utilisé comme contenu principal du «post» dans WordPress
* `params.wordpress.featured_media`: le choix du média principal du «post», sous la forme de soit:
     * l'identifiant numérique du média WordPress, dans un champ texte ou nombre
     * une image, dans un champs de pièce jointe Airtable

Dans le cas des types de contenus personnalisés («custom post types» (CPT)) qui utilisent des champs avancés («advanced custom fields» (ACF)), la clé `params.wordpress.acf` permet de spécifier les correspondances. 

*Si vous utilisez plutôt JetEngine de Crocoblock avec les champs meta personnalisés («custom meta fields» (CMF)), la clé params.wordpress.meta permet de spécifier les correspondances.*

Dans les deux cas (CPT ou JetEngine), les correspondances peuvent prendre deux formes:

* `'nom du champ ACF/CMF': 'nom du champ Airtable'` dans la plupart des cas
* `'nom du champ ACF/CMF': {objet de configuration avancée}` pour les correspondances de champs impliquant des modèles liés (relations et taxonomies).

Les objets de configuration avancés sont décrits dans les sections dédiées plus bas.

Note au sujet du titre: la valeur dans `params.wordpress.title` est une chaîne de caractères qui sera utilisée telle quelle comme titre de contenu dans WordPress. Il est possible de ne pas utiliser ce paramètre, et de plutôt indiquer le nom d'un _champ Airtable_ contenant la valeur souhaitée pour le titre dans la clé `params.airtable.titleField`.


## Métadonnées

La Passerelle doit stocker certaines métadonnées relatives aux informations disponibles dans WordPress et dans Airtable. L'ensemble de ces métadonnées sont sérialisées au format JSON et stockées dans un champs de type "Texte long" dans chacune des entrées Airtable qui font l'objet d'une synchronisation.

Par défaut, le script cherche les données dans un champ nommé «meta». Il est toutefois possible d'utiliser un autre champ en le spécifiant dans les paramètres d'appel du script, à la clé `airtable.metaFieldName`. Le champ de métadonnées contiendra plusieurs informations relatives au contenu correspondant à un enregistrement dans WordPress. Ces informations sont sérialisées au format JSON.

Il est par ailleurs possible de faire en sorte que le script note certaines de ces informations dans d'autres champs, en spécifiant leur nom dans les paramètres d'exécution du script, sous la clé `airtable`. Les options possibles sont:

|Clé de paramètre|Type de champ|Contenu du champ|
|------------|------------|------------|
|wpIdField|Nombre entier|Identifiant WordPress du contenu|
|wpMediaIdField|Nombre entier ou texte|Identifiant(s) WordPress des médias correspondant aux pièces jointes du présent enregistrement|
|wpUrlField|URL|Lien public du contenu dans WordPress|
|lastSyncFieldName|Date et heure|Date et heure de la dernière synchronisation|

Par exemple, les paramètres suivants indiquent au script que le champ pour stocker les métadonnées se nomme «Meta» (plutôt que «meta») et que le lien public du contenu WordPress doit être stocké dans le champs «Lien Wordpress»

```javascript
config.params = JSON.stringify({
    syncType: 'record',
    airtable: {
        table: 'Artistes',
        metaFieldName: 'Meta',   // ⬅
        wpUrlField: 'Lien Wordpress',       // ⬅
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

Les types de champs supportés par le script, pour les correspondances vers des champs ACF (donc la clé `acf` sous `wordpress` dans l'objet de configuration), sont les suivants:

|Type Airtable|Correspondance ACF suggérée|Notes|
|------------|------------|------------|
|Texte sur une seule ligne|Text||
|Texte long|Text Area|Airtable ne permet pas de récupérer les enrichissements de textes (gras, italique...) par le script. Nous suggérons d'utiliser du texte sans mise en forme, ou bien de baliser les textes avec du HTML (\<b>, \<i>, ...).|
|Adresse e-mail|Email||
|URL|Url||
|Sélection unique|Option 1. Select|Si une valeur tirée de Airtable n'existe pas dans les options d'ACF, le champ ne sera pas synchronisé.|
||Option 2. Taxonomy|Cette option permet d'interagir avec les taxonomies de WordPress. Le champ ACF doit être configuré pour permettre la création de termes. Les valeurs incluses dans le champ Airtable deviendront des termes dans la taxonomie ciblée. Voir les notes sur les taxonomies pour plus de détails sur le fonctionnement.|
|Numéro de téléphone|Text||
|Formule|Text ou Text Area|Le résultat de la formule, convertit en texte, sera copié dans ACF|
|Cumul (rollup)|Text ou Text Area|Le résultat du cumul, convertit en texte, sera copié dans ACF|
|Date|Date Picker||
|Date inluant l'heure|Date Time Picker||
|Pièce jointe (avec une ou plusieurs pièces jointes)|Image ou File|Fonctionne seulement pour les champs contenant une seule pièce jointe, dans un format d'image connu (jpg, jpeg, png, gif, svg, ico, webp) ou dans un autre format accepté par WordPress. S'il y a plus d'une pièce jointe dans le champ, seule la première pièce jointe sera synchronisée.|
|Sélection multiple|Option 1: Text|Le comportement sera identique à l'option 1 d'un champ Sélection unique. Aucune configuration supplémentaire n'est nécessaire|
||Option 2: Taxonomy|Cette option permet d'interagir avec les taxonomies de WordPress. Le champ ACF doit être configuré pour permettre la création de termes. Les valeurs incluses dans le champs Airtable deviendront des termes dans la taxonomie ciblée. Voir les notes sur les taxonomies pour plus de détails sur le fonctionnement.|
|Lien vers une autre entrée (vers une ou plusieurs entrées) (relation)|Relation|Il faut créer un champ Airtable de type Recherche qui contient les identifiants WordPress des entrées liées. Voir les notes sur les relations pour plus de détails sur le fonctionnement.|
|Recherche avec plusieurs résultats (multiple lookup values)|Selon le type de champ référencé par le «lookup»|Supporte les «lookup» dont le résultat est envoyé vers un champs régulier (texte, date...), une taxonomie ou un champ média (dans ce cas, le «lookup» doit impérativement contenir une valeur, les champs vides ne sont pas supportés, et contenir un seul média).|

## Types de contenus dans WordPress

Le type de contenu («post type») dans WordPress est déterminé par la clé `params.wordpress.postType` de l'objet de configuration. Pour le cas spécial des articles et des pages, les types de contenus sont respectivement `posts` et `pages`.

## Statut des contenus dans WordPress

Par défaut, La Passerelle crée des contenus en état brouillon dans WordPress. Il est possible de choisir l'état des contenus créés avec la clé `wordpress.status` des paramètres. Les valeurs acceptées sont `publish`, `future`, `draft`, `pending` et `private`. Par exemple:

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

## Cases à cocher

La Passerelle ne supporte pas les champs de type case à cocher avec CPT pour le moment.

L'équivalent JetEngine du champ Airtable de type "Case à cocher" est le champ de type "Sélection - Switcher". Si toutefois vous souhaitez plutôt utiliser un champ JetEngine de type "Sélection - Checkbox" avec une seule option de sélection, vous pouvez le faire en utilisant la configuration suivante :

```
'nom du champ CMF' : {
    'field': "nom du champ Airtable",
    'jetengine-type': 'checkbox',
    'jetengine-option': 'nom de l'option de sélection dans le champ CMF'
}
```

Exemple :
```
'concert-enligne' : {
    'field': "Concert en ligne",
    'jetengine-type': 'checkbox',
    'jetengine-option': 'oui'
}
```

## Taxonomies

Il est possible d'utiliser un champ Airtable pour gérer une taxonomie dans Wordpress. Les types de champs Airtable supportés sont :
* Sélection unique
* Sélection multiple
* Recherche (_lookup_) faisant référence à un champ Sélection unique ou Sélection multiple
* Lien vers une autre entrée (_linked record_) (vers une ou plusieurs entrées)

Il est possible de le faire pour les taxonomies "régulières" et pour les taxonomies ACF. L'implémentation sera légèrement différente, selon le cas.

Si une valeur du champ Airtable n'existe pas dans la taxonomie, elle sera créée dans WordPress. Les valeurs non utilisées ne sont toutefois pas supprimées de WordPress.

Exemple avec une taxonomie "régulière"
````javascript
let defaultParams = {
    'tblb00KvosFf8Hmdx': { // Dossiers
        airtable: {
            table: 'tblb00KvosFf8Hmdx', // Dossiers
            titleField: "fldFJ5wSQC59MSJnx", // Nom du dossier

            metaFieldName: 'fldGmie09tmm6HTex', // Meta
            lastSyncFieldName: 'fldG0r0AY1bZ4PdOx', // Date de synchronisation

        },
        wordpress: {
            postType: 'cpt_members',
            featured_media: 'fldjxnQtsSB4ZvHHx', // Image répertoire
            content: 'fldPIMUrW1c4JmDqx', // Description répertoire
            status: 'publish',

            // Taxonomies
            cpt_members_style: {
                'field': 'fldBRkOYenTJaaqox', // Styles musicaux
                'model': 'cpt_members_style'
            },
            cpt_members_region: {
                'field': 'fldiEuEHmkwFR0AEx', // Région administrative
                'model': 'cpt_members_region'
            },

            acf: {
                    // Champs ACF
                    'credit_photo': 'fldfyi0XgeFy6mCQx', // Crédit photo de l'image répertoire
                    'website_link': 'fldQPcLFqKcvLSIZx', // Site internet

            },
        }
    },
}

output.set('defaultParams', JSON.stringify(defaultParams));
````


Exemple avec une taxonomie ACF
```javascript
let defaultParams = {
    'tbl2psd9D3dNuGWm': { // Oeuvres
        airtable: {
            table: 'tbl2psd9D3dNuGWmx',
            wpIdField: 'fldPBiM2ymRjDFElx', // Identifiant wordpress
            titleField: "fldXmuxv5P0exIKzx", // Nom de l'oeuvre
            wpUrlField: 'fldBBfqDCXS0dOlrx', // Lien de la page sur le site
            metaFieldName: 'fldZbSCH3muNgyWPx', // Meta
            lastSyncFieldName: 'fldnG6FczChxxVh7x', // Date de synchronisations
            wpMediaIdField: 'fldtlBez86Ma3pW8x', // Identifiant photo
        },
        wordpress: {
           postType: 'base-oeuvre',
           status: 'publish',
           content: 'fldCQy1GfABiQTeyx', // Description (FR)
           featured_media: 'fldCvFZ0V8mjK6xsx', // Photo principale'

           acf: {

               'description': "fldCQy1GfABiQTeyx",
               'choregraphes': "fld8gc07ofT6XbVux",
               'annee-de-creation': 'fldHc9oZyH1n1pCzx',

               'public-taxonomie': {
                  'field': 'fldTp7SZnhvMYthZx',
                  'model': 'public_cible'
                },

               'etiquettes-taxonomie': {
                  'field': 'fldVfc73Rp1VDlCPx',
                  'model': 'etiquette_oeuvre'
                },
            }
        }
    }
}

output.set('defaultParams', JSON.stringify(defaultParams));
```

## Relations

Un champ de relation dans Airtable peut être synchronisé avec un champ de relation dans WordPress, à condition que la table liée dans Airtable soit également synchronisée vers un type de contenu dans WordPress.

Les étapes à suivre sont les suivantes:

* ajouter un champ de type Recherche (_lookup_) dans Airtable pour obtenir les identifiants WordPress des entrées liés (l'utilisation des options de métadonnées permettant de stocker cet identifiant dans un champ dédié sera essentielle)
* faire la configuration de synchronisation sur le champ Recherche
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

## Particularités des extensions WordPress pour les types de contenus personnalisés

La Passerelle vise à être compatible avec plusieurs extensions WordPress de types de contenus personnalisés. Ces extensions n'offrent toutefois pas des API identifiques. Dans certains cas, il est donc nécessaire de préciser à La Passerelle quelle système est utilisé.

La clé `wordpress.cpt_system` est utilisée pour préciser le système utilisé. Les valeurs autorisées sont `jetengine` (pour JetEngine de Crocobloc) et `acf` (qui est la valeur par défaut si la clé `cpt_system` n'est pas précisée).
