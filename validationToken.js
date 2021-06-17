const fetch = require('axios');

class GameLoader {
	constructor() {}
	async client_key(){
		// Make the request
		var client_key_request = await fetch('https://api.sys32.dev/v2/key');
		
		// Read the response as text.
		return client_key_request.data;
	}
	async matchmaker_token(client_key){
		// Attach the header.
		var hash_options = {
			headers: {
				'Client-Key': client_key
			},
		};
		
		// hash_options.headers.set('Client-Key', client_key);
		
		// Make the request
		var token_request = await fetch('https://matchmaker.krunker.io/generate-token', hash_options);
		
		// Read the response as JSON.
		return token_request.data;
	}
	async hash_token(token){
		var hash_request = await fetch.post('https://api.sys32.dev/v2/token', token);

		// console.log('Token hash endpoint return data:', JSON.stringify(hash_request.data))
		
		// Read the response as JSON
		return hash_request.data;
	}
	async token_argument(){
		// Retrieve the Client-Key header.
		var client_key = await this.client_key();
		
		// Retrieve the matchmaker token
		var token = await this.matchmaker_token(client_key);
		
		let hash = await this.hash_token(token);
		
		// Generate a hashed token
		return String.fromCharCode(...hash);
	}
};

module.exports = GameLoader;

// node validationToken.js