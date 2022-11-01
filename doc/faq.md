# Foire aux questions

## Performances

### Le script ne complète pas les tâches prévues et le journal d'exécution contient «Script exceeded execution time limit of 30 seconds»

Plusieurs raisons peuvent expliquer ce message d'erreur, mais dans tous les cas, la solution consiste à limiter le nombre d'opérations, ou leur complexité.

Voici des pistes de solutions:

* réduire la taille des pièces jointes ;
* synchroniser seulement le contenu des champs essentiels ;
* limiter le nombre d'enregistrements synchronisés en utilisant une vue Airtable qui se limite aux enregistrements qui doivent être synchronisés.

## Configurations

### Un nom de champs dans Airtable contient un apostrophe, comment faire pour l'identifier dans les configurations?

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

L'API d'Airtable ne permet pas d'obtenir la mise en forme native des champs texte long avec du «rich formatting». Nous suggérons donc de _ne pas_ utiliser l'option «rich formatting» et d'inclure des balises HTML simples dans le champ long texte, par exemple `<b></b>`, `<i></i>`, etc. Notez qu'il n'est pas nécessaire d'utiliser de balises pour les changements de lignes (~~`<br/>`~~).
