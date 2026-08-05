import PocketBase from 'pocketbase';

// PocketBase instance with Localtunnel bypass header
export const pb = new PocketBase('https://metal-bananas-tease.loca.lt');

// Add bypass header to all requests
pb.beforeSend = function (url, options) {
    options.headers = Object.assign({}, options.headers, {
        'bypass-tunnel-reminder': 'true',
    });
    return { url, options };
};

export default pb;
