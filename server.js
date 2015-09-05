var express = require('express');
var app = express();

var PORT = parseInt(process.env.PORT) || 8080;
var server = app.listen(PORT);
console.log("Listening on localhost/: " + PORT);

var io = require('socket.io').listen(server);

var jade = require('jade');
var fs = require('fs');
var util = require('util');
var path = require("path");

var config = require('./config');
// These will be the names of the various chatrooms. We can verify which
// possible chatrooms a client can join later
var channelNames = config.channels;

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set("view options", { layout: false });
app.use(express.static(__dirname + '/public'));

// app.get('/', function(req, res){
//   res.render('index.jade');
// });

app.get('/', function(req, res){
  res.render('chat.jade');
});

channelNames.forEach(function(name) {
    var chat = io.of('/' + name);

    chat.on('connection', function(socket){
        console.log('Someone connected to ' + name + ' channel.');

        socket.on('Join Chat' , function() {
            console.log("Someone just joined chat. Emitting verified message");
            socket.emit("Verified");
        });

        socket.on('audio-broadcast', function(data) {
            var sender = data['sender'];
            var file = data['file'];
            console.log("RECEIVED FILE");
            console.log(file)
            console.log(typeof file);

            var backData = {
                'file': file,
            };

            // This sends the audio to everyone but the sender
            socket.broadcast.emit('audio-message', backData);
        });
    });
});
