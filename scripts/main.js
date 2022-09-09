// Getting parameters from script input
let config = input.config();
let params = JSON.parse(config.params);

// Wordpress API details as constants
const WORDPRESSINSTANCEURL = config.wordpressInstanceUrl;
let APIBASE = WORDPRESSINSTANCEURL + "wp-json/wp/v2/";
let WORDPRESSUSERNAME = config.wordpressUserName;
let APPLICATIONPASSWORD = config.applicationPassword;

// Default values for optional parameters
const DEFAULT_META_FIELD_NAME = 'meta'

// we cannot use btoa in automations; this is a replacement taken from http://jsfiddle.net/1okoy0r0
function b2a(a) {
  var c, d, e, f, g, h, i, j, o, b = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", k = 0, l = 0, m = "", n = [];
  if (!a) return a;
  do c = a.charCodeAt(k++), d = a.charCodeAt(k++), e = a.charCodeAt(k++), j = c << 16 | d << 8 | e,
  f = 63 & j >> 18, g = 63 & j >> 12, h = 63 & j >> 6, i = 63 & j, n[l++] = b.charAt(f) + b.charAt(g) + b.charAt(h) + b.charAt(i); while (k < a.length);
  return m = n.join(""), o = a.length % 3, (o ? m.slice(0, o - 3) :m) + "===".slice(o || 3);
}

// wrapper for WordPress post API
async function postToWordPress(postType, wordpressPostId, title, acf) {
    let request = {
        method: 'POST',
        body: JSON.stringify({
            "title": title,
            "acf": acf
        }),
        headers: {
            'Authorization': "Basic " + b2a(WORDPRESSUSERNAME + ":" + APPLICATIONPASSWORD),
            'Content-Type': 'application/json'
        }
    };

    let createdPost = await fetch(APIBASE + postType + "/" + wordpressPostId, request);
    let response = await createdPost.json();

    return response;
}

// returns an object containing the Passerelle meta data in a record
function getMeta(record) {
    let metaFieldName = params.airtable.metaFieldName || DEFAULT_META_FIELD_NAME;
    return JSON.parse(record.getCellValueAsString(metaFieldName) || '{}');
}

// serializes a Passerelle meta object and saves it to the record
async function setMeta(record, meta) {
    let metaFieldName = params.airtable.metaFieldName || DEFAULT_META_FIELD_NAME;
    let updateParams = {};
    updateParams[metaFieldName] = JSON.stringify(meta);
    await table.updateRecordAsync(record, updateParams);
}

// wrapper for WordPress Media API upload only
async function postMediaToWordPress(media) {
    // download the image
    let imageResponse = await fetch(media.url);
    let content = await imageResponse.blob();

    // then post it to WordPress
    let request = {
        method: 'POST',
        body: content,
        headers: {
            'Authorization': "Basic " + b2a(WORDPRESSUSERNAME + ":" + APPLICATIONPASSWORD),
            'Content-Disposition': 'attachment; filename="' + media.filename + '"',
            'Content-Type': media.type
        }
    };
    let createdMedia = await fetch(APIBASE + "media", request);
    let response = await createdMedia.json();

    return response;
}

// wrapper for WordPress media API deletion
async function deleteWordPressMedia(mediaId) {
    let request = {
        method: 'DELETE',
        headers: {
            'Authorization': "Basic " + b2a(WORDPRESSUSERNAME + ":" + APPLICATIONPASSWORD),
        }
    };
    let deletion = await fetch(APIBASE + "media/" + mediaId + "?force=true", request);
    let response = await deletion.json();

    return response;
}

// wrapper for WordPress media API, including business logic for updates
async function findOrCreateWordpressAttachment(table, record, fieldName) {
    let media = record.getCellValue(fieldName)[0]; // we use the first attachment only; support for galleries may be implemented later

    // Figure out if we already have created the media in WordPress, and whether it has
    // changed since then
    let meta = getMeta(record);
    if (!meta.attachments) meta.attachments = {};
    let attachment = meta.attachments[fieldName]; // will be undefined if there is no info about the attachment
    let oldAttachementWordPressMediaId = attachment.wordPressMediaId;
    let action = '';
    if (typeof attachment == 'undefined') {
        action = 'create';
    } else if (attachment.airtableMediaId != media.id) {
        action = 'update';
    } else {
        action = 'nothing';
    }

    // For create or update actions, we need to create a new image in the WordPress media library,
    // because the WordPress does not allow updating the actual file in a media (the REST API
    // doc is not clear about that, but all requests I tried did not change the media, and I saw
    // comments from people with a similar problem on the web)
    if (['create', 'update'].includes(action)) {
        // upload the image to Wordpress
        let response = await postMediaToWordPress(media);

        // update the record with the new meta
        meta.attachments[fieldName] = { airtableMediaId: media.id, wordPressMediaId: response.id };
        await setMeta(record, meta);

        // if we are updating a post (ie. changing the image), then we delete the old attachment
        if (action == 'update') await deleteWordPressMedia(oldAttachementWordPressMediaId)
          // TODO : make deletion decision based on an option?

        return response.id;

    // if the image has not changed, we have nothing to do, but still want to return the media id
    } else if (action == 'nothing') {
        return attachment.wordPressMediaId;
    }

    return null; // should not happen; all previous ifs end with a return
}

// determing which records should be synced
// TODO validate other parameters before starting?
let table = base.getTable(params.airtable.table);
let records = [];
if (params.syncType == 'record') {
    console.log("Type de synchronisation: record (un seul enregistrement)");
    let record = await table.selectRecordAsync(params.airtable.recordId);
    records = [record];
} else if (params.syncType == 'table') {
    console.log("Type de synchronisation: table (la table en entier)");
    let query = await table.selectRecordsAsync();
    records = query.records;
} else if (params.syncType == 'view') {
    console.log("Type de synchronisation: view (une vue)");
    let view = await table.getView(params.airtable.view);
    let query = await view.selectRecordsAsync();
    records = query.records;
} else {
    console.log("Type de synchronisation inconnue (rien ne sera synchronisé.");
};

// do the actual sync on all relevant records
for (let record of records) {
    let wordpressPostId = record.getCellValueAsString(params.airtable.wpIdField);

    let acf = {};
    for (const acfFieldName of Object.keys(params.wordpress.acf)) {
        let field = table.getField(params.wordpress.acf[acfFieldName]);
        switch(field.type) {
            case 'multipleAttachments':
                let attachmentId = await findOrCreateWordpressAttachment(table, record, params.wordpress.acf[acfFieldName]);
                if (attachmentId) acf[acfFieldName] = attachmentId;
                // TODO: else?
                break;
            default: // 'singleLineText', 'multilineText', 'email', 'url', 'singleSelect', 'phoneNumber', 'formula', 'rollup', 'date, 'dateTime'
                acf[acfFieldName] = record.getCellValueAsString(params.wordpress.acf[acfFieldName]);
                break;
        };
    };

    let response = await postToWordPress(params.wordpress.postType, wordpressPostId, record.getCellValueAsString(params.airtable.titleField), acf)
    await table.updateRecordAsync(record, { [params.airtable.wpIdField]: response.id.toString()});
}

console.log("Terminé");
