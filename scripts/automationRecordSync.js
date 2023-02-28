const webhookUrl = '{{URL}}';

var config = {};

// we stringify the params key, which will be double-stringified in the request body, so that we can
// pass it serialized to the automation script, which will deserialize it. This is because Airtable will not
// allow us to use specific keys in automation script config.
config.params = JSON.stringify({
    syncType: 'record',
    airtable: {
        table: 'Artistes',
        recordId: {{recordId}},
        wpIdField: 'Identifiant WordPress',
        titleField: 'Identification'
    },
    wordpress: {
       postType: 'artiste',
       acf: {
            'nom': 'Nom',
            'prenom': 'Prénom',
            'courriel': 'Courriel',
            'telephone': 'Téléphone'
       }
    }
});

let response = await fetch(webhookUrl, {
    method: 'POST',
    body: JSON.stringify(config),
    headers: {
        'Content-Type': 'application/json'
    }
});
console.log(await response.text());
