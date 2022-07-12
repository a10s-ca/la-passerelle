const webhookUrl = 'https://hooks.airtable.com/workflows/v1/genericWebhook/appsED4vVIGejT2uw/wflHitpDRkP0HP2OF/wtr2Px6U0jIWN0ANQ';

let table = base.getTable('Artistes');
let artiste = await input.recordAsync('Pour quel artiste?', table);

var config = {};

// we stringify the params key, which will be double-stringified in the request body, so that we can
// pass it serialized to the automation script, which will deserialize it. This is because Airtable will not
// allow us to use specific keys in automation script config.
config.params = JSON.stringify({
    syncType: 'record',
    airtable: {
        table: 'Artistes',
        recordId: artiste.id,
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

let response = await remoteFetchAsync(webhookUrl, {
    method: 'POST',
    body: JSON.stringify(config),
    headers: {
        'Content-Type': 'application/json'
    }
});
console.log(await response.text());
