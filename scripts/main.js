// Getting parameters from script inputs
let config = input.config();
let defaultParams = {};
if (config.defaultParams) defaultParams = JSON.parse(config.defaultParams);
let hookParams = {};
if (config.params) hookParams = JSON.parse(config.params);
let params = { ...defaultParams[hookParams.airtable.table], ...hookParams }; // first level merge of default and hook params
params.airtable = { ...defaultParams[hookParams.airtable.table].airtable, ...params.airtable } // we do not need deep merging except for airtable params

// Wordpress API details as constants
const WORDPRESSINSTANCEURL = config.wordpressInstanceUrl;
let APIBASE = WORDPRESSINSTANCEURL + "wp-json/wp/v2/";
let WORDPRESSUSERNAME = config.wordpressUserName;
let APPLICATIONPASSWORD = config.applicationPassword;

// Determining values for optional parameters
const metaFieldName = params.airtable.metaFieldName || 'meta';
const wordPressIdFieldName = params.airtable && params.airtable.wpIdField; // will be null if the user does not want to use that field
const wordPressUrlFieldName = params.airtable && params.airtable.wpUrlField; // will be null if the user does not want to use that field
const lastSyncFieldName = params.airtable && params.airtable.lastSyncFieldName; // will be null if the user does not want to use that field
const wordPressMediaIdFieldName = params.airtable && params.airtable.wpMediaIdField; // will be null if the user does not want to use that field
const wordPressStatus = params.wordpress && params.wordpress.status || 'draft';

// we cannot use btoa in automations; this is a replacement taken from http://jsfiddle.net/1okoy0r0
function b2a(a) {
  var c, d, e, f, g, h, i, j, o, b = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", k = 0, l = 0, m = "", n = [];
  if (!a) return a;
  do c = a.charCodeAt(k++), d = a.charCodeAt(k++), e = a.charCodeAt(k++), j = c << 16 | d << 8 | e,
  f = 63 & j >> 18, g = 63 & j >> 12, h = 63 & j >> 6, i = 63 & j, n[l++] = b.charAt(f) + b.charAt(g) + b.charAt(h) + b.charAt(i); while (k < a.length);
  return m = n.join(""), o = a.length % 3, (o ? m.slice(0, o - 3) :m) + "===".slice(o || 3);
}

// wrapper for WordPress post API
async function postToWordPress(postType, wordpressPostId, title, content, featuredMedia, acf) {
    let request = {
        method: 'POST',
        body: JSON.stringify({
            "title": title,
            "content": content,
            "featured_media": featuredMedia,
            "acf": acf,
            status: wordPressStatus
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

// Generic wrapper for WordPress API for any "model" (post type or taxonomy) that has "terms" (post
// or term) with a name. Returns the ID. Mostly used for relation fields.
async function postOrFindModelTermToWordpress(modelName, term) {
    let request = {
        method: 'POST',
        body: JSON.stringify({
            "name": term
        }),
        headers: {
            'Authorization': "Basic " + b2a(WORDPRESSUSERNAME + ":" + APPLICATIONPASSWORD),
            'Content-Type': 'application/json'
        }
    };

    let url = APIBASE + modelName.replaceAll('-', '_');
        // we need .replaceAll('-', '_') because taxonomy names can contain dashes, but not API routes
    let createdTerm = await fetch(url, request);
    let response = await createdTerm.json();

    if (response.data && response.data.status == 400) {
        response.id = response.additional_data[0];
    };

    return response;
}

// returns an object containing the Passerelle meta data in a record
function getMeta(record) {
    return JSON.parse(record.getCellValueAsString(metaFieldName) || '{}');
}

// converts a media filename so that it is acceptable for WordPress's API
function mediaFileName(media) {
    // first, check encoding and apostrophe type
    filename = media.filename.normalize('NFC').replaceAll('’', '');

    // then, make sure we have an extension
    switch(media.type) {
        case 'image/jpeg':
            if (!filename.toLowerCase().includes('.jpg') && !filename.toLowerCase().includes('.jpeg')) filename = filename + '.jpg';
            break;
        case 'image/png':
            if (!filename.toLowerCase().includes('.png')) filename = filename + '.png';
            break;
        case 'image/gif':
            if (!filename.toLowerCase().includes('.gif')) filename = filename + '.gif';
            break;
        case 'image/svg+xml':
            if (!filename.toLowerCase().includes('.svg')) filename = filename + '.svg';
            break;
        case 'image/webp':
            if (!filename.toLowerCase().includes('.webp')) filename = filename + '.webp';
            break;
        case 'image/tiff':
            if (!filename.toLowerCase().includes('.tiff') && !filename.toLowerCase().includes('.tif')) filename = filename + '.tiff';
            break;
    }

    return filename;
};

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
            'Content-Disposition': 'attachment; filename="' + mediaFileName(media) + '"',
              // we need to use `.normalize('NFC')` because Airtable decomposes the Unicode caractere, which leads to incorrect request headers
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
// returns updated meta for the field
async function findOrCreateWordpressAttachment(table, record, fieldName, meta) {
    let medias = record.getCellValue(fieldName);
    let media = null;
    if (medias && medias.length > 0) media = medias[0]; // we use the first attachment only; support for galleries may be implemented later

    // Figure out if we already have created the media in WordPress, and whether it has
    // changed since then
    if (!meta.attachments) meta.attachments = {};
    let attachment = meta.attachments[fieldName]; // will be undefined if there is no info about the attachment
    let oldAttachementWordPressMediaId = attachment && attachment.wordPressMediaId;
    let action = '';
    if (typeof attachment == 'undefined' && media) {
        action = 'create';
    } else if (media && attachment && attachment.airtableMediaId != media.id) {
        action = 'update';
    } else if (attachment && attachment.airtableMediaId && !media) {
        action = 'delete';
    } else {
        action = 'nothing';
    }

    // For create or update actions, we need to create a new image in the WordPress media library,
    // because the WordPress API does not allow updating the actual file in a media (the REST API
    // doc is not clear about that, but all requests I tried did not change the media, and I saw
    // comments from people with a similar problem on the web)
    if (['create', 'update'].includes(action)) {
        // upload the image to Wordpress
        let response = await postMediaToWordPress(media);

        // update the record with the new meta
        meta.attachments[fieldName] = { airtableMediaId: media.id, wordPressMediaId: response.id };

        // if we are updating a post (ie. changing the image), then we delete the old attachment
        if (action == 'update') await deleteWordPressMedia(oldAttachementWordPressMediaId)
          // TODO : make deletion decision based on an option?

        return meta;

    } else if (action == 'delete') {
        await deleteWordPressMedia(oldAttachementWordPressMediaId);
        delete meta.attachments[fieldName];
        return meta;

    // if the image has not changed, we have nothing to do, but still want to return the media id
    } else if (action == 'nothing') {
        return meta;
    }

    return null; // should not happen; all previous ifs end with a return
}

// This functions will find or create the ID of a "term" in a related "model". The "model"
// can either be a custom post type, or a taxonmy (they are handled in the same way by the
// WordPress REST API).
async function findOrCreateModelTermId(modelName, term, meta) {
    if (!meta['models']) meta['models'] = {};
    if (!meta['models'][modelName]) {
        meta['models'][modelName] = {};
    }

    if (meta['models'][modelName][term] && (typeof(meta['models'][modelName][term]) == 'number')) {
        return meta['models'][modelName][term];
    } else {
        let modelTerm = await postOrFindModelTermToWordpress(modelName, term);
        let modelTermId = modelTerm.id;
        meta['models'][modelName][term] = await modelTermId;
        return modelTermId;
    }
};

// A "related model" can be a custom post type, or it can be a taxonomy. Both are
// managed with the same paths and verbs in the REST API. This function can thus
// be used to manage relations in general, and has been tested with taxonomies.
async function findOrCreateRelatedModels(field, record, wordpressDetails, meta) {
    let modelName = wordpressDetails.model;
    let res = [];
    switch(field.type) {
        case 'multipleSelects':
            for (const term of (record.getCellValue(field) || [])) {
                let id = await findOrCreateModelTermId(modelName, term.name, meta);
                res.push(id);
            };
            break;
        case 'multipleLookupValues':
            for (const term of (record.getCellValue(field) || [])) {
                let id = await findOrCreateModelTermId(modelName, term, meta);
                await res.push(id);
            };
            break;
        case 'singleSelect':
        case 'formula':
        case 'singleLineText':
            let term = record.getCellValueAsString(field);
            if (term && term.length > 0) {
                let id = await findOrCreateModelTermId(modelName, term, meta);
                await res.push(id);
            }
            break;
    };
    return res;
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

async function main()  {
    // do the actual sync on all relevant records
    for (let record of records) {
        let meta = getMeta(record);
        let wordpressPostId = (meta.wordPressResponse && meta.wordPressResponse.id) || '';

        // prepare Wordpress posts content
        let title = record.getCellValueAsString(params.airtable.titleField);
        let content = null;
        let featuredMedia = null;
        if (params.wordpress && params.wordpress.content) {
            content = record.getCellValueAsString(params.wordpress.content);
        };
        if (params.wordpress && params.wordpress.featured_media) {
            let airtableFieldName = params.wordpress.featured_media;
            let field = table.getField(airtableFieldName);
            if (field.type == 'multipleAttachments') {
                let newMeta = await findOrCreateWordpressAttachment(table, record, airtableFieldName, meta);
                if (newMeta) {
                    meta = newMeta;
                    featuredMedia = meta.attachments[airtableFieldName] && meta.attachments[airtableFieldName].wordPressMediaId;
                };
            } else {
                featuredMedia = parseInt(record.getCellValue(params.wordpress.featured_media));
            }
        };

        // prepare ACF content
        let acf = {};
        for (const acfFieldName of Object.keys(params.wordpress.acf || {})) {
            // determine what the configs for that acf are
            var airtableFieldName;
            let wordpressDetails = {};
            if (typeof(params.wordpress.acf[acfFieldName]) == 'string') {
                airtableFieldName = params.wordpress.acf[acfFieldName];
            } else {
                airtableFieldName = params.wordpress.acf[acfFieldName].field;
                wordpressDetails.model = params.wordpress.acf[acfFieldName].model;
            }

            // get the Airtable field and process it
            let field = table.getField(airtableFieldName);
            let value = record.getCellValueAsString(airtableFieldName);
            switch(field.type) {
                case 'multipleAttachments':
                    let newMeta = await findOrCreateWordpressAttachment(table, record, airtableFieldName, meta);
                    if (newMeta) {
                        meta = newMeta;
                        acf[acfFieldName] = meta.attachments[airtableFieldName] && meta.attachments[airtableFieldName].wordPressMediaId;
                    }
                    // TODO: else?
                    // TODO we could make this cleaner by passing the value-as-reference meta var to findOrCreateWordpressAttachment and deal with updating meta within that function
                    break;
                case 'multipleSelects':
                case 'singleSelect':
                case 'multipleLookupValues':
                case 'formula':
                    if (value && value.length > 0) {
                        if (wordpressDetails.model) {
                            let relatedModels = await findOrCreateRelatedModels(field, record, wordpressDetails, meta);
                            if (relatedModels && relatedModels.length > 0) acf[acfFieldName] = relatedModels;
                        } else {
                            acf[acfFieldName] = value;
                        }
                    } else {
                        acf[acfFieldName] = null;
                    }
                    break;
                default: // 'singleLineText', 'multilineText', 'email', 'url', 'singleSelect', 'phoneNumber', 'rollup', 'date, 'dateTime'
                    if (value && value.length > 0) {
                        acf[acfFieldName] = value;
                    } else {
                        acf[acfFieldName] = null;
                    }

                    break;
            };
        };

        // perform the actual update to WordPress
        let response = await postToWordPress(params.wordpress.postType, wordpressPostId, title, content, featuredMedia, acf)
        console.log(response);

        // update meta information in the record, as well as optional fields for details
        meta.wordPressResponse = response;
        let updateParams = {}
        updateParams[metaFieldName] = JSON.stringify(meta);
        if (wordPressIdFieldName) updateParams[wordPressIdFieldName] = response.id.toString();
        if (wordPressUrlFieldName) updateParams[wordPressUrlFieldName] = response.link;
        if (lastSyncFieldName) updateParams[lastSyncFieldName] = response.modified_gmt + 'Z'; // the WordPress response does not include Z!
        if (wordPressMediaIdFieldName) updateParams[wordPressMediaIdFieldName] = meta['attachments'] && Object.keys(meta['attachments']).map((att) => meta['attachments'][att].wordPressMediaId).join(',');
        await table.updateRecordAsync(record, updateParams);
    }

    console.log("Terminé");
}

main();
