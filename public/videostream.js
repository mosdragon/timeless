
var channel = "first";
var createdRoom = false;
var isStarted = false;
var canSend = false;
var isFirefox = false;
var peer_connection;
var socket;
var localVideoStream;
var remoteVideo = $('#other');

// Set up audio and video regardless of what devices are present.
var sdpConstraints = {
    'mandatory': {
        'OfferToReceiveAudio': true,
        'OfferToReceiveVideo': true
    }
};


// window.turnserversDotComAPI.iceServers(function(data) {
//     pc_config = {
//         'iceServers': data
//     };
//     console.log(data);
// });

var createConnection = function() {
    socket = io.connect("localhost:8080/");

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

    socket.on('message', function(message) {
        if (message === 'Got user media') {
            maybeStart();
        } else if (message.type === 'offer') {
            // if (createdRoom && !isStarted) {
            //     maybeStart();
            // }
            pc.setRemoteDescription(new getSessionDescription(message));
            doAnswer();
        } else if (message.type === 'answer' && isStarted) {
            pc.setRemoteDescription(new getSessionDescription(message));
        } else if (message.type === 'candidate' && isStarted) {
            var candidate = getIceCandidate({
                sdpMLineIndex: message.label,
                candidate: message.candidate
            });
            pc.addIceCandidate(candidate);
        } else if (message === 'bye' && isStarted) {
            //handleRemoteHangup();
        }
    });
}

function handleUserMedia(stream) {

  console.log('Adding local stream.');
  localVideo = $("#self");
  localVideo.src = window.URL.createObjectURL(stream);
  localVideoStream = stream;
  sendMessage('Got user media');
  $('#localimg').hide();
  localVideo.show();
  // if (isInitiator) {
  //   maybeStart();
  // }
}

function handleUserMediaError(error) {
  console.log('navigator.getUserMedia error: ', error);
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
        localVideoStream = stream;
        console.log(stream);
        createConnection();
        handleUserMedia(stream);
    }

    // Put video listeners into place
    if(navigator.getUserMedia) {
        // Standard
        navigator.getUserMedia(videoObj, function(stream) {
            video.src = stream;
            video.play();
            createConnection();
            handleUserMedia(stream);
        }, handleUserMediaError);
        console.log('getUserMedia');

    } else if(navigator.webkitGetUserMedia) {
        // WebKit-prefixed
        navigator.webkitGetUserMedia(videoObj, useStream, handleUserMediaError);
        console.log('webkitGetUserMedia');
    }

    else if(navigator.mozGetUserMedia) {
        // Firefox-prefixed
        navigator.mozGetUserMedia(videoObj, useStream, handleUserMediaError);
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
        beginInteraction();
        // createConnection();
        // socket.emit('join', '210')
        // socket.emit('upload', localVideoStream);
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
    remoteVideo.show();
  }
};

function handleRemoteStreamAdded(event) {
  console.log('Remote stream added.');
  remoteVideo.src = window.URL.createObjectURL(event.stream);
  remoteVideoStream = event.stream;
};

function handleRemoteStreamRemoved(event) {
  console.log('Remote stream removed. Event: ', event);
}

function handleCreateOfferError(event) {
  console.log('createOffer() error: ', e);
};

function createPeerConnection(callback) {
    try {
        var servers = null;
        peer_connection = new getRTCPeerConnection(servers, {
            optional: [{
                RtpDataChannels: true
            }]
        });
        console.log("Create peer_connection");

        peer_connection.onicecandidate = handleIceCandidate;
        peer_connection.onaddstream = handleRemoteStreamAdded;
        peer_connection.onremovestream = handleRemoteStreamRemoved;

    } catch (e) {
        console.log('Failed to create PeerConnection, exception: ' + e.message);
        alert('Cannot create RTCPeerConnection object.');
        return false;
    }
    callback();
}

function sendMessage(message) {
  socket.emit('message', message);
}

function sendChat(chat) {
  socket.emit('chat', chat);
}

function beginInteraction() {
    var data = {'user': 'mosdragon', 'room': '500'};
    console.log(data);
    socket.emit('join', data);

    createPeerConnection(function() {
        peer_connection.addStream(localVideoStream);
        if (createdRoom && !isStarted) {
            doCall();
        }
    });
}

function doCall() {
    console.log('Sending offer to peer');
    peer_connection.createOffer(setLocalAndSendMessage, handleCreateOfferError);
}

function doAnswer() {
  console.log('Sending answer to peer.');
  if(isFirefox) {
    pc.createAnswer(setLocalAndSendMessage, handleCreateAnswerError, sdpConstraints);
  }
  else {
    pc.createAnswer(setLocalAndSendMessage, null, sdpConstraints);
  }
}

function setLocalAndSendMessage(sessionDescription) {
  // Set Opus as the preferred codec in SDP if Opus is present.
  sessionDescription.sdp = preferOpus(sessionDescription.sdp);
  peer_connection.setLocalDescription(sessionDescription);
  sendMessage(sessionDescription);
}

function handleCreateAnswerError(error) {
  console.log('createAnswer() error: ', e);
}

// Helpers for CODEC stuff
// Set Opus as the default audio codec if it's present.
function preferOpus(sdp) {
  var sdpLines = sdp.split('\r\n');
  var mLineIndex;
  // Search for m line.
  for (var i = 0; i < sdpLines.length; i++) {
    if (sdpLines[i].search('m=audio') !== -1) {
      mLineIndex = i;
      break;
    }
  }
  if (mLineIndex === null) {
    return sdp;
  }

  // If Opus is available, set it as the default in m line.
  for (i = 0; i < sdpLines.length; i++) {
    if (sdpLines[i].search('opus/48000') !== -1) {
      var opusPayload = extractSdp(sdpLines[i], /:(\d+) opus\/48000/i);
      if (opusPayload) {
        sdpLines[mLineIndex] = setDefaultCodec(sdpLines[mLineIndex], opusPayload);
      }
      break;
    }
  }

  // Remove CN in m line and sdp.
  sdpLines = removeCN(sdpLines, mLineIndex);

  sdp = sdpLines.join('\r\n');
  return sdp;
}

function extractSdp(sdpLine, pattern) {
  var result = sdpLine.match(pattern);
  return result && result.length === 2 ? result[1] : null;
}

// Set the selected codec to the first in m line.
function setDefaultCodec(mLine, payload) {
  var elements = mLine.split(' ');
  var newLine = [];
  var index = 0;
  for (var i = 0; i < elements.length; i++) {
    if (index === 3) { // Format of media starts from the fourth.
      newLine[index++] = payload; // Put target payload to the first.
    }
    if (elements[i] !== payload) {
      newLine[index++] = elements[i];
    }
  }
  return newLine.join(' ');
}

// Strip CN from sdp before CN constraints is ready.
function removeCN(sdpLines, mLineIndex) {
  var mLineElements = sdpLines[mLineIndex].split(' ');
  // Scan from end for the convenience of removing an item.
  for (var i = sdpLines.length - 1; i >= 0; i--) {
    var payload = extractSdp(sdpLines[i], /a=rtpmap:(\d+) CN\/\d+/i);
    if (payload) {
      var cnPos = mLineElements.indexOf(payload);
      if (cnPos !== -1) {
        // Remove CN payload from m line.
        mLineElements.splice(cnPos, 1);
      }
      // Remove CN line in sdp
      sdpLines.splice(i, 1);
    }
  }

  sdpLines[mLineIndex] = mLineElements.join(' ');
  return sdpLines;
}
