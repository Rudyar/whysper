import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  throw new Error(
    "❌ API key is not defined. Please set the GEMINI_API_KEY environment variable."
  );
}

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === "processAudio") {
    console.log("🎧 Received Base64 Audio in background.js");

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-lite",
      });

      console.log("🔄 Sending audio to Gemini API...");

      const response = await model.generateContent([
        { text: "Transcribe this audio in the language of the audio" },
        {
          inlineData: {
            mimeType: "audio/webm",
            data: message.audio,
          },
        },
      ]);

      if (response && response.response) {
        const transcription = response.response.text();

        console.log("✅ Transcription");

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: "insertText",
            text: transcription,
          });
        });
      }
    } catch (error) {
      console.error("❌ Error with Gemini API:", error);
    }
  }
});
