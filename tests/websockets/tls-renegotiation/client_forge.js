var forge = require('../../..');
var fs = require('fs');
var net = require('net');

var socket = new net.Socket();

var already_renegotiating = false;
		  
var client = forge.tls.createConnection({
	  version: forge.tls.Versions.TLS_1_0,
	  server: false,
	  cipherSuites: [
		forge.tls.CipherSuites.TLS_RSA_WITH_AES_128_CBC_SHA,
		forge.tls.CipherSuites.TLS_RSA_WITH_AES_256_CBC_SHA],
	  verify: function(connection, verified, depth, certs) {
		// skip verification for testing
		console.log('Client : [tls] server certificate verified');
		return true;
	  },
	  connected: function(connection) {
			console.log('Client : [tls] connected, prepare data to send');
	    connection.prepare(forge.util.encodeUtf8('GET / HTTP/1.0\r\n\r\n'));
	  },
	  tlsDataReady: function(connection) {
			// encrypted data is ready to be sent to the server
			var data = connection.tlsData.getBytes();
			console.log('Client : [socket] ready to send data = '+data);
			socket.write(data, 'binary');
		
			// renegotiate
			if(connection.handshaking == false && !already_renegotiating) {
				already_renegotiating = true;
				setTimeout(function()
				{
					console.log("renegociate ***************** ");
					client.handshake();
				}, 1000);
			}
	  },
	  dataReady: function(connection) {
		// clear data from the server is ready
		var data = connection.data.getBytes();
		console.log('Client : [tls] data received from the server: ' + data);
		client.process(data.toString('binary'));
	  },
	  closed: function() {
		console.log('Client : [tls] disconnected');
	  },
	  error: function(connection, error) {
		console.log('Client : [tls] error', error);
	  }
	});
	
socket.on('connect', function() {
  console.log('Client : [socket] connected, start tls handshake');
  client.handshake();
});
socket.on('data', function(data) {
  console.log('Client : [socket] data, received data from server, start process');
  client.process(data.toString('binary')); // encoding should be 'binary'
});
socket.on('end', function() {
  console.log('Client : [socket] disconnected');
});

// connect to google.com
socket.connect(443, '192.168.0.10');
