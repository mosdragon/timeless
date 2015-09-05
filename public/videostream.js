
var channel = "first";
var createdRoom = false;
var isStarted = false;
var canSend = false;
var isFirefox = false;
var peer_connection;

var createConnection = function() {
    var socket = io.connect("localhost:8080/" + channel);

    var data = {'username': 'mosdragon'};
    socket.emit('Join Chat', data['username']);

    socket.on('Connected', function() {
        canSend = true;
        console.log('Connected')
    });

    socket.on('full', function() {
        console.log('Channel Full')
        alert("Channel Full!");
    });

    socket.on('created', function(room) {
      console.log('Created room ' + room);
      createdRoom = true;
    });
}

// Put event listeners into place
window.addEventListener("DOMContentLoaded", function() {
    // Grab elements, create settings, etc.
    var canvas = document.getElementById("canvas"),
        context = canvas.getContext("2d"),
        video = document.getElementById("self"),
        videoObj = { "video": true, "audio": true};

    var errBack = function(error) {
        console.log("Video capture error: ", error.code);
    };


    var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    if (getUserMedia == navigator.mozGetUserMedia) {
        isFirefox = true;
    }

    var useStream = function(stream) {
        video.src = window.URL.createObjectURL(stream);
        video.play();
        send_stream = stream;
        console.log(stream);
    }

    // Put video listeners into place
    if(navigator.getUserMedia) {
        // Standard
        navigator.getUserMedia(videoObj, function(stream) {
            video.src = stream;
            video.play();
        }, errBack);
        console.log('getUserMedia');

    } else if(navigator.webkitGetUserMedia) {
        // WebKit-prefixed
        navigator.webkitGetUserMedia(videoObj, useStream, errBack);
        console.log('webkitGetUserMedia');
    }

    else if(navigator.mozGetUserMedia) {
        // Firefox-prefixed
        navigator.mozGetUserMedia(videoObj, useStream, errBack);
        console.log('mozGetUserMedia');
    }

    // Trigger photo take
    document.getElementById("snap").addEventListener("click", function() {
        context.drawImage(video, 0, 0, 640, 480);
        if (canSend) {
            console.log('Can Send');
        }
        console.log(video);
        console.log(video.src);
        // socket.emit('upload', send_stream);
    });

}, false);


function getRTCPeerConnection(params) {
    if (isFirefox) {
        return new mozRTCPeerConnection(params);

    } else {
        return new webkitRTCPeerConnection(params);
    }
};

function getSessionDescription(message) {
  if (isFirefox) {
    return new mozRTCSessionDescription(message);

  } else {
    return new RTCSessionDescription(message);
  }
};

function getIceCandidate(params) {
  if (isFirefox) {
    return new mozRTCIceCandidate(params);

  } else {
    return new RTCIceCandidate(params);
  }
};

function handleIceCandidate(event) {
  if (event.candidate) {
    sendMessage({
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate
    });
  } else {
    console.log('End of candidates.');
    $('#remoteimg').hide();
    $('#remoteVideo').show();
  }
};

function handleRemoteStreamAdded(event) {
  console.log('Remote stream added.');
  remoteVideo.src = window.URL.createObjectURL(event.stream);
  remoteVideoStream = event.stream;
};

function handleCreateOfferError(event) {
  console.log('createOffer() error: ', e);
};

function createPeerConnection() {
    try {
        var servers = null;
        peer_connection = new getRTCPeerConnection(servers, {
            optional: [{
                RtpDataChannels: true
            }]
        });

        peer_connection.onicecandidate = handleIceCandidate;
        peer_connection.onaddstream = handleRemoteStreamAdded;
        peer_connection.onremovestream = handleRemoteStreamRemoved;

    } catch (e) {
        console.log('Failed to create PeerConnection, exception: ' + e.message);
        alert('Cannot create RTCPeerConnection object.');
        return false;
    }
}

function sendMessage(message) {
  socket.emit('message', message);
}

function sendChat(chat) {
  socket.emit('chat', chat);
}

function beginInteraction() {
    createPeerConnection()
    peer_connection.addStream(localVideoStream);

    if (createdRoom) {
        var doCall = function() {
          console.log('Sending offer to peer');
          peer_connection.createOffer(setLocalAndSendMessage, handleCreateOfferError);
        };
    }
}
