// const url = require('url')
// const http = require('http')
// const https = require('https')

// const external_promise = () => {
//     var resolve, reject, prom = new Promise((_resolve, _reject) => (resolve = _resolve, reject = _reject));
    
//     return Object.assign(prom, { resolve, reject });
// }
// agents = {}
// const get = (req_url, options) => {
//     var parsed_url = url.parse(req_url),
//     proto = parsed_url.protocol,
//     reqe = proto == 'https:' ? https : http,
//     promises = {
//         buffer: external_promise(),
//         text: external_promise(),
//         json: external_promise(),
//         err: external_promise(),
//     };
    
//     if(!agents[proto])agents[proto] = new reqe.Agent({ rejectUnauthorized: false, keepAlive: true });
    
//     var request = reqe.get({
//             agent: agents[proto],
//             ...parsed_url,
//             ...options
//         }, res => {
//             var chunks = [];
            
//             res.on('data', chunk => chunks.push(chunk)).on('end', () => {
//                 var buf = Buffer.concat(chunks),
//                 str = buf.toString('utf8')
                
//                 if(promises.buffer.needed)promises.buffer.resolve(buf);
//                 if(promises.text.needed)promises.text.resolve(str);
                
//                 if(promises.json.needed)try{
//                     promises.json.resolve(JSON.parse(str));
//                 }catch(err){
//                     promises.json.reject(err);
//                 }
//             });
//         });
    
//     request.on('error', err => { promises.error.resolve(err) });
    
//     return {
//         text: () => (promises.text.needed = true, promises.text),
//         json: () => (promises.json.needed = true, promises.json),
//         buffer: () => (promises.buffer.needed = true, promises.buffer),
//         error: () => (promises.error.needed = true, promises.error),
//     }
// };


// module.exports = get

const url = require('url')
const http = require('http')
const https = require('https')

const external_promise = () => {
    var resolve, reject, prom = new Promise((_resolve, _reject) => (resolve = _resolve, reject = _reject));
    
    return Object.assign(prom, { resolve, reject });
}

const get = (req_url, options) => {
    var parsed_url = url.parse(req_url),
    proto = parsed_url.protocol,
    reqx = proto == 'https:' ? https : http,
    promises = {
        buffer: external_promise(),
        text: external_promise(),
        json: external_promise(),
        err: external_promise(),
        headers: external_promise()
    };

    agents = {}

    agents[proto] = new reqx.Agent({ rejectUnauthorized: false, keepAlive: true });
    var request = reqx.get({
        agent: agents[proto],
        ...parsed_url,
        ...options
    }, res => {
        if(promises.headers.needed) promises.headers.resolve(res)
        // checking for a redirect
        if(res.headers.location){
            var isAbsolute = new RegExp('^(?:[a-z]+:)?//', 'i');
            // checks if redirect is absolute, if not, use the origin of the request
            if(isAbsolute.test(res.headers.location)){
                if( promises.buffer.needed ) promises.buffer.resolve( get(res.headers.location, options).buffer() )
                if( promises.text.needed ) promises.text.resolve( get(res.headers.location, options).text() )
                if( promises.json.needed ) promises.json.resolve( get(res.headers.location, options).json() )
                if( promises.err.needed ) promises.err.resolve( get(res.headers.location, options).error() )
                if( promises.headers.needed ) promises.headers.resolve( get(res.headers.location, options).headers() )
            } else {
                if( promises.buffer.needed ) promises.buffer.resolve( get(parsed_url.protocol.toString() + '//' + parsed_url.host.toString() + res.headers.location.toString(), options).buffer() )
                if( promises.text.needed ) promises.text.resolve( get(parsed_url.protocol.toString() + '//' + parsed_url.host.toString() + res.headers.location.toString(), options).text() )
                if( promises.json.needed ) promises.json.resolve( get(parsed_url.protocol.toString() + '//' + parsed_url.host.toString() + res.headers.location.toString(), options).json() )
                if( promises.err.needed ) promises.err.resolve( get(parsed_url.protocol.toString() + '//' + parsed_url.host.toString() + res.headers.location.toString(), options).error() )
                if( promises.headers.needed ) promises.headers.resolve( get(parsed_url.protocol.toString() + '//' + parsed_url.host.toString() + res.headers.location.toString(), options).headers() )
            }
        } else {
            // load all chunks into array
            var chunks = [];
                
            res.on('data', chunk => chunks.push(chunk)).on('end', () => {
                var buf = Buffer.concat(chunks)
                var str = buf.toString('utf8');
                
                // returns the result in a promise
                if( promises.buffer.needed ) promises.buffer.resolve(buf);
                if( promises.text.needed ) promises.text.resolve(str);
                if( promises.json.needed ) try{
                    promises.json.resolve(JSON.parse(str));
                } catch( err ){
                    // throws error when the requested resource wasn't json
                    promises.json.resolve(str);
                }
            });
        }       
    });
    
    request.on('error', err => { 
        if( promises.err.needed ) {
            promises.err.reject( err )
        } else {
            console.log(err)
        }
    });
    
    // final array
    return {
        text: () => (promises.text.needed = true, promises.text),
        json: () => (promises.json.needed = true, promises.json),
        buffer: () => (promises.buffer.needed = true, promises.buffer),
        error: () => (promises.err.needed = true, promises.error),
        headers: () => (promises.headers.needed = true, promises.headers)
    }
};


module.exports = get