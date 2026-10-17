/* ================= DOM ELEMENTS ================= */
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const statusText = document.getElementById("status");
const eyeTimerText = document.getElementById("eyeTimer");
const blinkText = document.getElementById("blinkCount");
const yawnText = document.getElementById("yawnCount");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const container = document.getElementById("container");


/* ================= CONFIGURATION ================= */
let EAR_THRESHOLD = 0.16;
const MAR_THRESHOLD = 0.45;

const WARNING_TIME = 500;
const DANGER_TIME = 1000;
const YAWN_TIME = 1200;
const MAX_YAWN_LIMIT = 3;

const TARGET_FPS = 30;
const FRAME_INTERVAL = 1000 / TARGET_FPS;
let lastFrame = 0;

const LEFT_EYE  = [33,160,158,133,153,144];
const RIGHT_EYE = [362,385,387,263,373,380];

/* ================= LOCAL AUDIO ALERTS ================= */
const warningAudio = new Audio("assets/warning-alarm.mp3");
const dangerAudio  = new Audio("assets/danger-alarm.mp3");

warningAudio.loop = true;
dangerAudio.loop = true;

warningAudio.volume = 1.0;
dangerAudio.volume = 1.0;

let audioState = "none";

function playAudio(type) {
  if (audioState === type) return;
  stopAudio();
  audioState = type;

  if (type === "warning") warningAudio.play();
  if (type === "danger") dangerAudio.play();
}

function stopAudio() {
  warningAudio.pause();
  dangerAudio.pause();
  warningAudio.currentTime = 0;
  dangerAudio.currentTime = 0;
  audioState = "none";
}

/* ================= DETECTION STATE ================= */
let eyeClosed = false;
let eyeStart = 0;
let blinkCount = 0;

let mouthOpen = false;
let yawnStart = 0;
let yawnCount = 0;

let earBuffer = [];
const BUFFER_SIZE = 4;

let lastStatus = "normal";
let detecting = false;

/* ================= UTILITY FUNCTIONS ================= */
function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function calcEAR(lm, idx) {
  const A = dist(lm[idx[1]], lm[idx[5]]);
  const B = dist(lm[idx[2]], lm[idx[4]]);
  const C = dist(lm[idx[0]], lm[idx[3]]);
  return (A + B) / (2 * C);
}

function smoothEAR(val) {
  earBuffer.push(val);
  if (earBuffer.length > BUFFER_SIZE) earBuffer.shift();
  return earBuffer.reduce((a,b)=>a+b,0) / earBuffer.length;
}

function calcMAR(lm) {
  return dist(lm[13], lm[14]) / dist(lm[78], lm[308]);
}

/* ================= ALERT STATUS ================= */
function setStatus(type) {
  if (lastStatus === type) return;
  lastStatus = type;

  container.classList.remove("warning","danger");

  if (type === "normal") {
    statusText.innerText = "NORMAL";
    stopAudio();
  }

  if (type === "warning") {
    statusText.innerText = "WARNING";
    container.classList.add("warning");
    playAudio("warning");
  }

  if (type === "danger") {
    statusText.innerText = "DANGER";
    container.classList.add("danger");
    playAudio("danger");
  }
}

/* ================= MEDIAPIPE FACE MESH ================= */
const faceMesh = new FaceMesh({
  locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`
});

faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.6,
  minTrackingConfidence: 0.6
});

faceMesh.onResults(res => {
  if (!detecting) return;

  const now = performance.now();
  if (now - lastFrame < FRAME_INTERVAL) return;
  lastFrame = now;

  ctx.filter = "brightness(1.15) contrast(1.2)";
  ctx.drawImage(res.image, 0, 0, canvas.width, canvas.height);
  ctx.filter = "none";

  if (!res.multiFaceLandmarks) return;
  const lm = res.multiFaceLandmarks[0];

  let ear = (calcEAR(lm, LEFT_EYE) + calcEAR(lm, RIGHT_EYE)) / 2;
  ear = smoothEAR(ear);

  if (ear < EAR_THRESHOLD) {
    if (!eyeClosed) {
      eyeClosed = true;
      eyeStart = now;
    }

    const dur = now - eyeStart;
    eyeTimerText.innerText = (dur / 1000).toFixed(1);

    if (dur >= DANGER_TIME) setStatus("danger");
    else if (dur >= WARNING_TIME) setStatus("warning");

  } else {
    if (eyeClosed && now - eyeStart < WARNING_TIME) {
      blinkCount++;
      blinkText.innerText = blinkCount;
    }

    eyeClosed = false;
    eyeTimerText.innerText = "0.0";
    setStatus("normal");
  }

  const mar = calcMAR(lm);
  if (mar > MAR_THRESHOLD) {
    if (!mouthOpen) {
      mouthOpen = true;
      yawnStart = now;
    }

    if (now - yawnStart > YAWN_TIME) {
      yawnCount++;
      yawnText.innerText = yawnCount;
      mouthOpen = false; // Reset the state after counting a yawn event.
      
      // Escalate the alert after the configured number of yawns.
      if (yawnCount >= MAX_YAWN_LIMIT) {
        setStatus("danger"); // Play the danger alarm after repeated yawning.
      }
    }
  } else {
    mouthOpen = false;
  }
});

/* ================= CAMERA CONTROL ================= */
let camera = null;

startBtn.onclick = () => {
  if (detecting) return;
  detecting = true;

  camera = new Camera(video, {
    onFrame: async () => {
      await faceMesh.send({ image: video });
    },
    width: 640,
    height: 480
  });

  camera.start();
};

stopBtn.onclick = () => {
  detecting = false;
  if (camera) camera.stop();
  stopAudio();
  setStatus("normal");
};
