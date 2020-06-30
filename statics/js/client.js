var socket = io();

//our username 
var name;
var connectedUser;

var rtcPeerConnection;


//****** 
//UI selectors block 
//****** 
var localVideo = document.getElementById('localVideo');
var remoteVideo = document.getElementById('remoteVideo');

var yourConn;
var stream;

var loginPage = document.getElementById('loginPage');
var usernameInput = document.getElementById('usernameInput');
var loginBtn = document.getElementById('loginBtn');

var callPage = document.getElementById('callPage');
var callToUsernameInput = document.getElementById('callToUsernameInput');
var callBtn = document.getElementById('callBtn');

var hangUpBtn = document.getElementById('hangUpBtn');

//hide call page 
callPage.style.display = "none";

// Login when the user clicks the button 
loginBtn.addEventListener("click", function () {
    name = usernameInput.value;
    if (name.length > 0) {
        socket.emit('login', { name: name });
    }
});

function handleLogin(success) {
    if (success === false) {
        alert("Ooops...try a different username");
    } else {
        //display the call page if login is successful 
        loginPage.style.display = "none";
        callPage.style.display = "block";
        //start peer connection 
    }
};


socket.on('login', (data) => { handleLogin(data.success) });
socket.on('offer', (data) => { handleOffer(data.offer, data.name) });
socket.on('answer', (data) => { handleAnswer(data.answer) });
socket.on('candidate', (data) => { handleCandidate(data.candidate) });
socket.on('leave', (data) => { handleLeave() });


function handleLogin(success) {
    if (success === false) {
        alert("Ooops...try a different username");
    } else {
        loginPage.style.display = "none";
        callPage.style.display = "block";

        //********************** 
        //Starting a peer connection 
        //********************** 

        //getting local video stream 
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((myStream) => {
                stream = myStream;

                //displaying local video stream on the page 
                localVideo.srcObject = myStream;

                //using Google public stun server 
                var configuration = { 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }] };

                rtcPeerConnection = new RTCPeerConnection(configuration);

                // setup stream listening 
                rtcPeerConnection.addStream(stream);

                //when a remote user adds stream to the peer connection, we display it 
                rtcPeerConnection.ontrack = function (e) {
                    console.log('ontrack....');
                    remoteVideo.srcObject = e.streams[0];
                };

                // Setup ice handling 
                rtcPeerConnection.onicecandidate = function (event) {
                    if (event.candidate) {
                        socket.emit('candidate', { candidate: event.candidate, name: connectedUser });
                    }
                };
            })
            .catch(err => console.error);
    }
};

//initiating a call 
callBtn.addEventListener("click", function () {
    var callToUsername = callToUsernameInput.value;
    if (callToUsername.length > 0) {
        connectedUser = callToUsername;
        // create an offer 
        console.log(rtcPeerConnection);
        rtcPeerConnection.createOffer(function (offer) {
            socket.emit('offer', { offer: offer, name: connectedUser });
            rtcPeerConnection.setLocalDescription(offer);
        }, function (error) {
            alert("Error when creating an offer");
        });
    }
});

//when somebody sends us an offer 
function handleOffer(offer, name) {
    connectedUser = name;
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    //create an answer to an offer 
    rtcPeerConnection.createAnswer(function (answer) {
        rtcPeerConnection.setLocalDescription(answer);
        socket.emit('answer', { answer: answer, name: connectedUser })
    }, function (error) {
        alert("Error when creating an answer");
    });
};

//when we got an answer from a remote user
function handleAnswer(answer) {
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(answer));
};

//when we got an ice candidate from a remote user 
function handleCandidate(candidate) {
    rtcPeerConnection.addIceCandidate(new RTCIceCandidate(candidate));
};

//hang up 
hangUpBtn.addEventListener("click", function () {
    socket.emit('leave');
    handleLeave();
});

function handleLeave() {
    connectedUser = null;
    remoteVideo.src = null;

    rtcPeerConnection.close();
    rtcPeerConnection.onicecandidate = null;
    rtcPeerConnection.ontrack = null;
};
