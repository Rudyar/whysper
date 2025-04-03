let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let mediaStream = null;
let statusIndicator = null;
let isProcessing = false;

function createStatusIndicator() {
  if (statusIndicator) return;

  statusIndicator = document.createElement("div");
  statusIndicator.id = "whysper-status-indicator";

  Object.assign(statusIndicator.style, {
    position: "fixed",
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: "#259C7F",
    display: "none",
    zIndex: "9999",
    transition: "all 0.3s ease",
    boxShadow: "0 0 5px rgba(0,0,0,0.2)",
    pointerEvents: "none",
  });

  const style = document.createElement("style");
  style.textContent = `
    @keyframes whysper-spin {
      to { transform: rotate(360deg); }
    }
    .whysper-loader {
      width: 5px;
      height: 5px;
      border: 1.5px solid #fff;
      border-radius: 50%;
      border-top-color: transparent;
      animation: whysper-spin 1s linear infinite;
    }
    .whysper-processing {
      display: flex !important;
      align-items: center;
      justify-content: center;
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(statusIndicator);
}

function updateIndicatorState() {
  if (!statusIndicator) return;

  if (isProcessing) {
    statusIndicator.style.backgroundColor = "#FFA500";
    statusIndicator.className = "whysper-processing";
    statusIndicator.innerHTML = '<div class="whysper-loader"></div>';
  } else if (isRecording) {
    statusIndicator.style.backgroundColor = "#da4040";
    statusIndicator.className = "";
    statusIndicator.innerHTML = "";
  } else {
    statusIndicator.style.backgroundColor = "#259C7F";
    statusIndicator.className = "";
    statusIndicator.innerHTML = "";
  }
}

function updateIndicatorPosition(element) {
  if (!statusIndicator || !element) return;

  const rect = element.getBoundingClientRect();
  statusIndicator.style.left = `${rect.left - 25}px`;
  statusIndicator.style.top = `${rect.top + 12}px`;
}

function showIndicatorIfEditable(element) {
  if (!element) return false;

  const isEditable =
    element.tagName === "TEXTAREA" ||
    (element.tagName === "INPUT" &&
      element.type !== "checkbox" &&
      element.type !== "radio" &&
      element.type !== "button") ||
    element.isContentEditable;

  if (isEditable) {
    if (!statusIndicator) createStatusIndicator();
    statusIndicator.style.display = "block";
    updateIndicatorPosition(element);
    updateIndicatorState();
    return true;
  }

  hideIndicator();
  return false;
}

function hideIndicator() {
  if (statusIndicator) {
    statusIndicator.style.display = "none";
  }
}

document.addEventListener("focusin", (event) => {
  showIndicatorIfEditable(event.target);
});

document.addEventListener("focusout", () => {
  hideIndicator();
});

document.addEventListener("DOMContentLoaded", () => {
  createStatusIndicator();
  if (document.activeElement) {
    showIndicatorIfEditable(document.activeElement);
  }
});

document.addEventListener("keydown", async (event) => {
  if (event.ctrlKey && event.code === "Space" && !isRecording) {
    event.preventDefault();
    try {
      isRecording = true;
      updateIndicatorState();

      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(mediaStream);
      audioChunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunks.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        isRecording = false;
        isProcessing = true;
        updateIndicatorState();

        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });

        if (mediaStream) {
          mediaStream.getTracks().forEach((track) => track.stop());
          mediaStream = null;
        }

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result.split(",")[1];
          chrome.runtime.sendMessage({
            action: "processAudio",
            audio: base64Audio,
          });
        };

        reader.onerror = (error) => {
          isRecording = false;
          isProcessing = false;
          updateIndicatorState();
        };
      };

      mediaRecorder.start();
    } catch (error) {
      isRecording = false;
      updateIndicatorState();

      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
        mediaStream = null;
      }
    }
  }
});

document.addEventListener("keyup", (event) => {
  if (isRecording && (event.code === "Space" || event.ctrlKey === false)) {
    if (mediaRecorder.state === "recording") {
      mediaRecorder.stop();
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "insertText") {
    isProcessing = false;
    updateIndicatorState();

    const activeElement = document.activeElement;
    if (activeElement) {
      if (
        activeElement.tagName === "TEXTAREA" ||
        activeElement.tagName === "INPUT"
      ) {
        const start = activeElement.selectionStart;
        const end = activeElement.selectionEnd;
        activeElement.value =
          activeElement.value.substring(0, start) +
          message.text +
          activeElement.value.substring(end);
        activeElement.selectionStart = activeElement.selectionEnd =
          start + message.text.length;
      } else if (activeElement.isContentEditable) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          range.insertNode(document.createTextNode(message.text));
          range.collapse(false);
        } else {
          activeElement.textContent += message.text;
        }
      } else {
        try {
          activeElement.insertAdjacentText("beforeend", message.text);
        } catch (e) {}
      }
    }
  }
});
