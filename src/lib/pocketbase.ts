import PocketBase from 'pocketbase';

// PocketBase instance with ngrok bypass header
export const pb = new PocketBase('https://oren-unsuspectful-beulah.ngrok-free.dev');

// Add bypass header to all requests
pb.beforeSend = function (url, options) {
    options.headers = Object.assign({}, options.headers, {
        'ngrok-skip-browser-warning': 'true',
    });
    return { url, options };
};

export default pb;
