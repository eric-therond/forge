var forge = require('../../..');
var fs = require('fs');
var net = require('net');

var data = {
	cert: fs.readFileSync("../../../../fd.crt", "utf8"),
	cert2: fs.readFileSync("../../../../fd3.crt", "utf8"),
	privateKey: fs.readFileSync("../../../../fd2.key", "utf8"),
	privateKey2: fs.readFileSync("../../../../fd3.key", "utf8")
	};
	
var server = new net.createServer();

var createTls = function(socket) {
	  return forge.tls.createConnection({
		version: forge.tls.Versions.TLS_1_0,
    server: true,
    caStore: [],
    sessionCache: {},
    // supported cipher suites in order of preference
	
    cipherSuites: [
      forge.tls.CipherSuites.TLS_RSA_WITH_AES_128_CBC_SHA,
      forge.tls.CipherSuites.TLS_RSA_WITH_AES_256_CBC_SHA],
    connected: function(c) {
      console.log('Server : [tls] connected');
    },
    verifyClient: false,
    verify: function(c, verified, depth, certs) {
      console.log(
        'Server verifying certificate w/CN: \"' +
          certs[0].subject.getField('CN').value +
          '\", verified: ' + verified + '...');
      return true;
    },
    getCertificate: function(c, hint) {
      console.log('Server : [tls] getting certificate for \"' + hint[0] + '\"...');
			if(!c.isConnected) {
				return data.cert;
			} else {
				return data.cert2;
			}
    },
    getPrivateKey: function(c, cert) {
			if(!c.isConnected) {
			return data.privateKey;
			} else {
				return data.privateKey2;
			}
    },
    tlsDataReady: function(c) {
		console.log('Server : [tls] ready to send data');
		socket.write(c.tlsData.getBytes(), 'binary');
    },
    dataReady: function(c) {
		
		var tlsdata = c.tlsData.getBytes();
		var data = c.data.getBytes();
		console.log('Server : [tls] received tlsdata \"' + tlsdata + '\"');
		console.log('Server : [tls] received data \"' + data + '\"');

      // send response
     // c.prepare('Hello Client');
    },
    closed: function(c) {
      console.log('Server : [tls] disconnected.');
    },
    error: function(c, error) {
      console.log('Server : [tls] error: ' + error.message);
    }
  });
};

server.on('connection', function(socket) {
	
	console.log('Server : [socket] a client is connected, start tls with his socket');
	var servertls = createTls(socket);
	
	socket.on('data', function(data) {
		console.log('Server : [socket] received data from client, start process : '+data);
		servertls.process(data.toString('binary')); // encoding should be 'binary'
	});
	socket.on('end', function() {
	  console.log('Server : [socket] disconnected');
	});

});

server.listen(443, '192.168.0.10');

