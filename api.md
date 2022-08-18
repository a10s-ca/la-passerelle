# API du script principal La passerelle

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
