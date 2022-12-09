// Pour accéder au script principal de La Passerelle
const webhookUrl = 'https://hooks.airtable.com/workflows/v1/genericWebhook/appsED4vVIGejT2uw/wflHitpDRkP0HP2OF/wtr2Px6U0jIWN0ANQ';

// Configurations générales des synchronisations pour chaque table
let baseParams = {
    'Artistes': {
        syncType: 'record',
        airtable: {
            table: 'Artistes',
            // for record syncType, we should have recordId here; instead we will set it in the for loop below
            wpIdField: 'Identifiant WordPress',
            titleField: 'Identification',
            wpUrlField: 'URL WordPress',
            lastSyncFieldName: 'Derniere synchro'
        },
        wordpress: {
            postType: 'artiste',
            acf: {
                    'nom': 'Nom',
                    'prenom': 'Prénom',
                    'courriel': 'Courriel',
                    'telephone': 'Téléphone',
                    'description': 'Description',
                    'description_riche': 'Description riche',
                    'region': 'Région',
                    'date': 'Date',
                    'date_et_heure': 'Date et heure',
                    'photo': 'Photo',
                    'fichier_pdf': 'Fichier PDF',
                    'lookup': {
                        'field': 'lookup',
                        'model': 'taxo_information_liee'
                    },
                    'type-de-membre': {
                        field: 'Type de membre',
                        model: 'type-de-membre'
                        },
                    'oeuvres': {
                        field: 'ID WP des oeuvres',
                        model: 'oeuvre'
                    },
                    'cas_du_single_select': {
                        field: 'Cas du single select',
                        model: 'cas_du_single_select'
                    }
            },
            'content': 'Contenu',
            'featured_media': 'Photo'
        }
    },
    'Oeuvres': {
        syncType: 'record',
        airtable: {
            table: 'Oeuvres',
            wpIdField: 'Identifiant WordPress',
            titleField: 'Nom'
        },
        wordpress: {
            postType: 'oeuvre',
            acf: {
                    'annee_de_creation': 'Année de création'
            }
        }
    }
}

// Identifier la table du menu
const menuTableName = 'Menu La Passerelle';
let menuTable = base.getTable(menuTableName);

// Déterminer la commande à exécuter en fonction du contexte de l'usager.
let commande, syncTable, syncTableName, syncType, status, record;
let cursorTableId = cursor.activeTableId;
let cursorTable = base.getTable(cursorTableId);

// Si l'usager est dans la table du menu, on lui présente toutes les commandes.
if (cursorTable == menuTable) {
    commande = await input.recordAsync('Quelle commande?', menuTable);
    syncTableName = commande.getCellValueAsString('Table');
    syncTable = base.getTable(syncTableName);
    syncType = commande.getCellValueAsString('Type de synchro');
    status = commande.getCellValueAsString('Statut')

// Si l'usager est dans une autre table, on sait qu'il veut synchroniser un enregistrement
} else {
    syncType = "Enregistrement d'une autre table";
    syncTable = cursorTable;
    syncTableName = syncTable.name;
    status = 'publish';
    if (syncTable.getView(cursor.activeViewId).name.toLowerCase().includes("brouillon")) status = 'draft';
    record = await input.recordAsync('Quel enregistrement', syncTable);
}

output.markdown("# Synchronisation de données...");
output.markdown("Table: " + syncTableName);
output.markdown("Statut: `" + status + "`");
output.markdown("Type: " + syncType);

// Identifier quels enregistrements seront synchronisés, selon les configurations du menu
var query, records;
switch(syncType) {
    case "Toute la table":
        query = await syncTable.selectRecordsAsync({});
        records = query.records;
        break;
    case "Une vue":
        let vue = commande.getCellValueAsString('Vue');
        query = await syncTable.getView(vue).selectRecordsAsync({});
        records = query.records;
        break;
    case "Un enregistrement":
        record = await input.recordAsync("Pour quel enregistrement?", syncTable);
        records = [record];
        break;
    case "Enregistrement d'une autre table":
        records = [record];
        break;
}

// Obtenir les paramètres de la table ciblée, et les personnaliser avec le statut choisi
let params = baseParams[syncTableName];
params.wordpress.status = status;

// Itérer sur tous les enregistrements et les synchroniser
for (let record of records) {
    output.text(record.name + " " + record.id);
    params.airtable.recordId = record.id;
    let config = {};
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
