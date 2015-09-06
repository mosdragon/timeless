var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var PORT = parseInt(process.env.PORT) || 8080;
var server = app.listen(PORT);
console.log("Listening on localhost/: " + PORT);

var io = require('socket.io').listen(server);

var jade = require('jade');
var fs = require('fs');
var util = require('util');
var path = require("path");

var Set = require("collections/set");

var config = require('./config');
// These will be the names of the various chatrooms. We can verify which
// possible chatrooms a client can join later
var channelNames = config.channels;

var clients = {};

// var channels = new Set();
var prepare = function() {
    // var chat = io.of('/');

    io.on('connection', function(socket) {

        console.log("Someone just joined chat.");

        socket.on('message', function(message) {
            console.log("Received Message:");
            console.log(message);
            socket.broadcast.emit('message', message);
        });

        socket.on('chat', function(message) {
            console.log("Received Chat: " + message)
           socket.broadcast.emit('chat', message);
        });

        socket.on('join', function(data) {
            var room = data['room'];
            var user = data['user'];

            console.log("Someone joined chat: " + JSON.stringify(data));
            // console.log(JSON.stringify(io));
            // var numClients = io.sockets.clients(room).length;
            var client = clients[room];
            var numClients = 0;
            if (client) {
                numClients = client.length;
            }
            // var numClients = io.adapter;
            // [room];
            console.log(numClients)
            // numClient = Object.keys(room).length;

            if (numClients === 0) {
                socket.join(room);
                socket.emit('created', room);
                clients[room] = [user];
            } else if (numClients === 1) {
                io.sockets.in(room).emit('join', data);
                socket.join(room);
                socket.emit('joined', room);
                client.push(user)
            } else {
                socket.emit('full', room);
            }

            console.log(clients);

        });
    });

    // chat.on('connection', function(socket) {
    //     console.log("Someone just joined chat.")
    //
    //     // var username = data['username'];
    //
    //
    //     socket.on('Join Chat', function(username) {
    //         if (channels[name].length >= 2) {
    //             console.log('Channel is full.')
    //             socket.emit('Channel Full');
    //         } else {
    //             console.log('Channel has space.')
    //             socket.emit('Connected');
    //         }
    //     });
    //
    //     socket.on('upload', function(data) {
    //         console.log(data);
    //         socket.broadcast.emit('download', data);
    //     })
    //
    // });
};

prepare();

var channels = {
    "first": [],
};

// configureChannel('first');


app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set("view options", { layout: false });
app.use(express.static(__dirname + '/public'));

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// app.get('/', function(req, res){
//   res.render('index.jade');
// });

app.get('/', function(req, res){
  res.render('chat.jade');
});

//
// app.post('/new_channel', function(req, res) {
//     console.log(req);
//     console.log(req.body);
//     console.log(typeof req.body)
//     var body = req.body;
//     console.log(body)
//
//     var channel_name = body['channel'];
//     var exists = channels[channel_name];
//
//     if (channel_name && !exists) {
//         channels[channel_name] = [];
//         res.send('Creating New Channel');
//         configureChannel(channel_name);
//
//     } else {
//         res.send('Already exists!')
//     }
// });
