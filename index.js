const fetch = require('axios');

class GameLoader {
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
		console.log(token_request.data)
		
		// Read the response as JSON.
		return token_request.data;
	}
	async hash_token(token){
		// This endpoint requires the token as input so we will make a POST request.
		var hash_options = {
			headers: {
				'Content-Type': 'application/json'
			},
		};

		// Set the Content-Type to application/json otherwise the server will not accept JSON input
		// hash_options.headers.set('Content-Type', 'application/json');
		
		// Turn the object into a string appropiate for the fetch body
		hash_options.body = JSON.stringify(token);
		
		// Make the request
		var hash_request = await fetch.post('https://api.sys32.dev/v2/token', hash_options);

		console.log('Token hash endpoint return data:', JSON.stringify(hash_request.data))
		
		// Read the response as JSON
		return hash_request.data;
	}
	async token_argument(){
		// Retrieve the Client-Key header.
		var client_key = await this.client_key();
		
		console.info('Retrieved Client-Key:', client_key);
		
		// Retrieve the matchmaker token
		var token = await this.matchmaker_token(client_key);
		
		console.info('Retrieved token:', token);
		
		// Generate a hashed token
		return await this.hash_token(token);
	}
};

var loader = new GameLoader();
loader.token_argument().then(r => console.log('Final return data: ', JSON.stringify(r))) // => ""
