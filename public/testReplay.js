var socket = io.connect("http://52.25.32.156/Pro3");
var SelectedFile;

window.addEventListener("load", Ready)


var encodedAudio = "";

function Ready() {
    // These are the relevant HTML5 objects that we are going to use
    if(window.File && window.FileReader){
        // Add an event listener for FileBox
        $("#FileBox").change(function(evnt) {
            var file = evnt.target.files[0];
            SelectedFile = file;
        });
    }
    else {
        document.getElementById('audio').innerHTML = "Your Browser Doesn't Support The File API Please Update Your Browser";
    }
}

socket.on("audio-message", function(audioData){
    console.log("CLIENT - audio received.");
    console.log(typeof audioData);

    encodedAudio = audioData;
    console.log(encodedAudio);
    console.log("HERE WE GO");

    var data = {
        'file': encodedAudio,
        'sender': 'somesender',
    };

    var count = 1;
    var maxCount = 5;

    maxCount = Math.ceil((60 / 16) * 2 + 1);  // This will run for 2 hours from start

    var id = "";

    var hitServer = function() {
        // Upload a file to the server.
        socket.emit('audio-broadcast', data);
        console.log("Hit Server at: " + new Date())
        console.log(count);
        count += 1;
        if (count > maxCount) {
        	clearInterval(id);
            console.log("Done testing");
        }
    };

    hitServer();

    // Do this every 16 minutes
    var mins = 1000 * 60 * 16;
    // var mins = 1000 * 5;
    var id = setInterval(hitServer, mins);

    // hitServer();

});

function addAudio(audioCtx, decodedAudio) {
    // var source = audioCtx.createMediaElementSource();

    // Get an AudioBufferSourceNode.
    // This is the AudioNode to use when we want to play an AudioBuffer
    var source = audioCtx.createBufferSource();
    // set the buffer in the AudioBufferSourceNode
    source.buffer = decodedAudio;
    // connect the AudioBufferSourceNode to the
    // destination so we can hear the sound
    source.connect(audioCtx.destination);
    // start the source playing
    // NOTE: This will
    source.start();

    console.log("PLAYING NOW");
    console.log(decodedAudio);
    $("#audio").append("decodedAudio");
    $("#audio").append(String(decodedAudio));
}
