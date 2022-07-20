const webhookUrl = '{{URL}}';

var config = {};
config.params = JSON.stringify({
    syncType: 'test'
});

let response = await remoteFetchAsync(webhookUrl, {
    method: 'POST',
    body: JSON.stringify(config),
    headers: {
        'Content-Type': 'application/json'
    }
});

console.log(await response.text());
