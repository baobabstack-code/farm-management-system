import axios from "axios";
import fs from "fs";
import path from "path";

async function testVoiceApi() {
  const apiUrl = "http://localhost:3000/api/voice";
  const text = "How are my crops doing today?";

  console.log(`Testing Voice API at ${apiUrl} with query: "${text}"`);

  try {
    // Note: This test requires the Next.js server to be running.
    // It also assumes we can bypass auth or have a way to mock it,
    // but since the API route uses `auth()`, we might hit a 401 if running purely from script without session.
    // For a quick smoke test during development, we might need to temporarily disable auth or use a valid session token.
    // However, for this script, we'll just try to hit it and see if we get a response (even 401 proves connectivity).

    // To properly test with auth, we'd need a valid session cookie or header.
    // For now, let's just check if the endpoint is reachable.

    const response = await axios.post(
      apiUrl,
      { text },
      {
        validateStatus: () => true, // Accept all status codes so we can log them
      }
    );

    console.log(`Response Status: ${response.status}`);

    if (response.status === 401) {
      console.log(
        "Got 401 Unauthorized as expected (since we are running outside of browser context). Endpoint is reachable."
      );
      return;
    }

    if (response.status === 200) {
      const { text: responseText, audio } = response.data;
      console.log(`Received Text Response: ${responseText}`);

      if (audio) {
        const audioBuffer = Buffer.from(audio, "base64");
        const outputPath = path.join(__dirname, "test-output.mp3");
        fs.writeFileSync(outputPath, audioBuffer);
        console.log(`Audio saved to ${outputPath}`);
      } else {
        console.warn("No audio data received.");
      }
    } else {
      console.error("Unexpected response:", response.data);
    }
  } catch (error) {
    console.error("Error testing Voice API:", error);
  }
}

testVoiceApi();
