const webhookUrl = '{{URL}}';

let table = base.getTable('Artistes');
let view = table.getView('Artistes sélectionnés')

var config = {};

var params = {
    syncType: 'record',
    airtable: {
        table: 'Artistes',
        // for record syncType, we should have recordId here; instead we will set it in the for loop below
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
};

// this will loop over all records in the view, and call the main script individually for each one
let query = await view.selectRecordsAsync({fields: ['Identification']});
for (let record of query.records) {
    output.text(record.getCellValueAsString('Identification') + " " + record.id);
    params.airtable.recordId = record.id;
    config.params = JSON.stringify(params);
      // we stringify the params key, which will be double-stringified in the request body, so that we can
      // pass it serialized to the automation script, which will deserialize it. This is because Airtable will not
      // allow us to use specific keys in automation script config.
    let response = await remoteFetchAsync(webhookUrl, {
        method: 'POST',
        body: JSON.stringify(config),
        headers: {
            'Content-Type': 'application/json'
        }
    });
    console.log(await response.text());
}
