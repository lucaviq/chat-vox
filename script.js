let username = "";
let mediaRecorder;
let audioChunks = [];
let replyingTo = null;

let timer;
let seconds = 0;

const loginScreen =
document.getElementById("loginScreen");

const app =
document.getElementById("app");

const nicknameInput =
document.getElementById("nicknameInput");

const joinBtn =
document.getElementById("joinBtn");

const userInfo =
document.getElementById("userInfo");

const recordingTime =
document.getElementById("recordingTime");

const recordBtn =
document.getElementById("recordBtn");

const sendBtn =
document.getElementById("sendBtn");

const clearBtn =
document.getElementById("clearBtn");

const replyBox =
document.getElementById("replyBox");

const messagesDiv =
document.getElementById("messages");

const savedUser =
localStorage.getItem(
  "chatvox_user"
);

if(savedUser){

  username = savedUser;

  userInfo.innerHTML =
    `👤 ${username}`;

  loginScreen.remove();

  app.classList.remove(
    "hidden"
  );

}

joinBtn.addEventListener(
  "click",
  enterApp
);

nicknameInput.addEventListener(
  "keypress",
  (e)=>{
    if(e.key==="Enter"){
      enterApp();
    }
  }
);

function enterApp(){

  const nickname =
    nicknameInput.value.trim();

  if(!nickname){

    alert(
      "Ingresa un alias"
    );

    return;
  }

  username = nickname;

  localStorage.setItem(
    "chatvox_user",
    username
  );

  userInfo.innerHTML =
    `👤 ${username}`;

  loginScreen.remove();

  app.classList.remove(
    "hidden"
  );

}

function updateTimer(){

  seconds++;

  const mins =
    Math.floor(seconds / 60);

  const secs =
    seconds % 60;

  recordingTime.textContent =
    `${String(mins).padStart(2,"0")}:${String(secs).padStart(2,"0")}`;

}

recordBtn.addEventListener(
  "click",
  async ()=>{

    try{

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio:true
        });

      mediaRecorder =
        new MediaRecorder(stream);

      audioChunks = [];

      mediaRecorder.ondataavailable =
        (event)=>{

          if(event.data.size > 0){
            audioChunks.push(
              event.data
            );
          }

        };

      mediaRecorder.start();

      seconds = 0;

      recordingTime.textContent =
        "00:00";

      timer =
        setInterval(
          updateTimer,
          1000
        );

      recordBtn.disabled = true;
      sendBtn.disabled = false;

    }catch(error){

      console.error(error);

      alert(
        "No se pudo acceder al micrófono."
      );

    }

  }
);

sendBtn.addEventListener(
  "click",
  ()=>{

    if(!mediaRecorder){
      return;
    }

    clearInterval(timer);

    mediaRecorder.onstop =
      saveAudio;

    mediaRecorder.stop();

    recordBtn.disabled = false;
    sendBtn.disabled = true;

  }
);

function saveAudio(){

  if(audioChunks.length === 0){
    return;
  }

  const blob =
    new Blob(
      audioChunks,
      {
        type:"audio/webm"
      }
    );

  const reader =
    new FileReader();

  reader.onloadend =
    ()=>{

      const messages =
        JSON.parse(
          localStorage.getItem(
            "voiceMessages"
          )
        ) || [];

      messages.push({

        id: Date.now(),

        sender: username,

        audio: reader.result,

        replyTo: replyingTo,

        duration:
          recordingTime.textContent,

        createdAt:
          new Date()
            .toLocaleString()

      });

      localStorage.setItem(
        "voiceMessages",
        JSON.stringify(
          messages
        )
      );

      replyingTo = null;

      replyBox.classList.add(
        "hidden"
      );

      recordingTime.textContent =
        "00:00";

      loadMessages();

    };

  reader.readAsDataURL(
    blob
  );

}

function loadMessages(){

  const messages =
    JSON.parse(
      localStorage.getItem(
        "voiceMessages"
      )
    ) || [];

  messagesDiv.innerHTML = "";

  messages.forEach(msg=>{

    const div =
      document.createElement(
        "div"
      );

    div.className =
      "message";

    let html = "";

    if(msg.replyTo){

      html += `
        <div class="reply-preview">
          ↩️ Respuesta a un mensaje anterior
        </div>
      `;

    }

    html += `
      <div class="sender">
        👤 ${msg.sender}
      </div>

      <audio controls src="${msg.audio}"></audio>

      <div class="duration">
        ⏱ ${msg.duration}
      </div>

      <div class="duration">
        📅 ${msg.createdAt}
      </div>

      <br>

      <button onclick="reply(${msg.id})">
        ↩️ Responder
      </button>
    `;

    div.innerHTML = html;

    messagesDiv.prepend(
      div
    );

  });

}

function reply(id){

  replyingTo = id;

  replyBox.innerHTML = `
    <div>
      🎙️ Estás respondiendo a un mensaje anterior
    </div>

    <div style="margin-top:10px;">
      Presiona "🎤 Grabar"
      para grabar tu respuesta.
    </div>

    <br>

    <button onclick="cancelReply()">
      ❌ Cancelar respuesta
    </button>
  `;

  replyBox.classList.remove(
    "hidden"
  );

  replyBox.scrollIntoView({
    behavior:"smooth"
  });

}

function cancelReply(){

  replyingTo = null;

  replyBox.classList.add(
    "hidden"
  );

}

clearBtn.addEventListener(
  "click",
  ()=>{

    if(
      !confirm(
        "¿Borrar todos los mensajes?"
      )
    ){
      return;
    }

    localStorage.removeItem(
      "voiceMessages"
    );

    loadMessages();

  }
);

loadMessages();