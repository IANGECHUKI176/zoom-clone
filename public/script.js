const videoGrid = document.getElementById("video__grid");
const myVideo = document.createElement("video");
myVideo.muted = true;
const socket = io("/");

let messages = document.querySelector(".messages");
let input = document.querySelector("#chat__message");
const form = document.querySelector("form");

let myVideoStream;
const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
};

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);

    let peer = new Peer(undefined, {
      path: "/peerjs",
      host: "/",
      port: "3000",
      config: { iceServers: [{ url: "stun:stun.l.google.com:19302" }] },
    });
    //whenever a new client joins a new peer Object is created after which the socket emits join-room and the server broadcasts the user-connected to all the other clients

    peer.on("open", (id) => {
      socket.emit("join-room", ROOMID, id);
    });

    socket.on("user-connected", (userId) => {
      const call = peer.call(userId, stream); // Call the user who just joined
      // Add their video
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
      // If they leave, remove their video
      call.on("close", () => {
        video.remove();
      });
    });
    peer.on("call", (call) => {
      // pick up the call and send our stream
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userStream) => {
        addVideoStream(video, userStream);
      });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      if (input.value) {
        socket.emit("message", input.value, ROOMID);
        input.value = "";
      }
    });
    socket.on("createMessage", (message) => {
      const item = document.createElement("li");
      item.textContent = message;
      messages.appendChild(item);
      const scroll = document.querySelector(".scroll");
      scroll.scrollIntoView({ behavior: "smooth" });
    });
    socket.on('user-disconnected',(userId)=>{
      peer.disconnect();
   
    })
  })
  .catch((err) => {
    console.log(err);
  });

//


//Mute and unmute video
const muteAndUnmute = () => {
  let enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnMuteButton();
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true;
    setMuteButton();
  }
};
const setUnMuteButton = () => {
  const icon = `<i class="fa fa-microphone-slash unmute" aria-hidden="true"></i> <span>Unmute</span>`;
  document.querySelector(".main__mute__button").innerHTML = icon;
};
const setMuteButton = () => {
  const icon = `  <i class="fa fa-microphone " aria-hidden="true"></i><span>Mute</span>`;
  document.querySelector(".main__mute__button").innerHTML = icon;
};

const playAndStopVideo = () => {
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideoButton();
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true;
    setStopVideoButton();
  }
};
const setPlayVideoButton = () => {
  const html = `<i class="fas fa-video-slash" aria-hidden="true"></i><span>Play Video</span>`;
  document.querySelector(".main__video__button").innerHTML = html;
};
const setStopVideoButton = () => {
  const html = `<i class="fas fa-video" aria-hidden="true"></i>
              <span>Stop Video</span>`;
  document.querySelector(".main__video__button").innerHTML = html;
};

const leaveMeeting=()=>{
  peer.disconnect()
}