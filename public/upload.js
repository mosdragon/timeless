var socket = io.connect("localhost:8080/Pro2");
var SelectedFile;

window.addEventListener("load", Ready)

var encodedAudio = "";

function Ready() {
    // These are the relevant HTML5 objects that we are going to use
    if(window.File && window.FileReader){
        // Add an event listener for FileBox
        $("#FileBox").change(function(evnt) {
            var file = evnt.target.files[0];

            var data = {
                'file': file,
                'sender': 'somesender',
            };

            socket.emit('audio-broadcast', data);

        });
    }
    else {
        document.getElementById('audio').innerHTML = "Your Browser Doesn't Support The File API Please Update Your Browser";
    }
}

socket.on("audio-message", function(audioData) {
    console.log("CLIENT - audio received.");
    console.log(typeof audioData);

    encodedAudio = audioData;
    console.log("Audio received in Base64 format:");
    console.log(encodedAudio);
    console.log("Will re-broadcast same audio message back");

    var data = {
        'file': encodedAudio,
        'sender': 'somesender',
    };

    var hitServer = function() {
        // Upload an encoded MP4 audio file to the server.
        socket.emit('audio-broadcast', data);
        console.log("Hit Server at: " + new Date())
    };

    hitServer();
});
