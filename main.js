// Getting parameters from script input
let config = input.config();
let params = JSON.parse(config.params);

// Wordpress API details as constants
const WORDPRESSINSTANCEURL = config.wordpressInstanceUrl;
let APIBASE = WORDPRESSINSTANCEURL + "wp-json/wp/v2/";
let WORDPRESSUSERNAME = config.wordpressUserName;
let APPLICATIONPASSWORD = config.applicationPassword;

// we cannot use btoa in automations; this is a replacement taken from http://jsfiddle.net/1okoy0r0
function b2a(a) {
  var c, d, e, f, g, h, i, j, o, b = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", k = 0, l = 0, m = "", n = [];
  if (!a) return a;
  do c = a.charCodeAt(k++), d = a.charCodeAt(k++), e = a.charCodeAt(k++), j = c << 16 | d << 8 | e,
  f = 63 & j >> 18, g = 63 & j >> 12, h = 63 & j >> 6, i = 63 & j, n[l++] = b.charAt(f) + b.charAt(g) + b.charAt(h) + b.charAt(i); while (k < a.length);
  return m = n.join(""), o = a.length % 3, (o ? m.slice(0, o - 3) :m) + "===".slice(o || 3);
}

// wrapper for WordPress API
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

// handling the actual sync operation
if (params.syncType == 'record') {
    // TODO validate other parameters before starting?
    let table = base.getTable(params.airtable.table);
    let record = await table.selectRecordAsync(params.airtable.recordId);
    let wordpressPostId = record.getCellValueAsString(params.airtable.wpIdField);

    let acf = {};
    for (const field of Object.keys(params.wordpress.acf)) {
        acf[field] = record.getCellValueAsString(params.wordpress.acf[field])
    };

    let response = await postToWordPress(params.wordpress.postType, wordpressPostId, record.getCellValueAsString(params.airtable.titleField), acf)
    await table.updateRecordAsync(record, { [params.airtable.wpIdField]: response.id.toString()});

} else {
    console.log("Unknown syncType.");
};
