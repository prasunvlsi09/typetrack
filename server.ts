import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import Groq from "groq-sdk";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin
function getAdminAuth() {
  if (getApps().length === 0) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Firebase Admin credentials are not set in environment variables. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.');
    }

    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }
  return getAuth(getApp());
}

function getAdminDb() {
  getAdminAuth(); // Ensure initialized
  return getFirestore(getApp(), "ai-studio-de18491e-ad46-4c57-9988-26a4d31d2a9f");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit for base64 images
  app.use(express.json({ limit: '10mb' }));

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/reset-password", async (req, res) => {
    try {
      const { resetCode, newPassword } = req.body;
      const authHeader = req.headers.authorization;

      if (resetCode !== '2078') {
        return res.status(400).json({ error: 'Invalid reset code.' });
      }

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized. Please log in first.' });
      }

      const token = authHeader.split('Bearer ')[1];
      
      const adminAuth = getAdminAuth();
      const decodedToken = await adminAuth.verifyIdToken(token);
      const uid = decodedToken.uid;

      await adminAuth.updateUser(uid, {
        password: newPassword,
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  app.post("/api/reset-username", async (req, res) => {
    try {
      const { resetCode, newUsername } = req.body;
      const authHeader = req.headers.authorization;

      if (resetCode !== '2078') {
        return res.status(400).json({ error: 'Invalid reset code.' });
      }

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized. Please log in first.' });
      }

      if (!newUsername || newUsername.length < 3) {
        return res.status(400).json({ error: 'Username must be at least 3 characters.' });
      }

      const token = authHeader.split('Bearer ')[1];
      
      const adminAuth = getAdminAuth();
      const decodedToken = await adminAuth.verifyIdToken(token);
      const uid = decodedToken.uid;

      const userRecord = await adminAuth.getUser(uid);
      const currentDisplayName = userRecord.displayName || '';
      
      // Strip any manually added .admin or .dev to prevent spoofing
      const cleanNewUsername = newUsername.trim().replace(/\.admin$/i, '').replace(/\.dev$/i, '');
      
      const cleanUsername = cleanNewUsername.toLowerCase().replace(/[^a-z0-9]/g, '');
      const newEmail = `${cleanUsername}@typetrack.local`;

      await adminAuth.updateUser(uid, {
        email: newEmail,
      });

      try {
        await getAdminDb().collection('users').doc(uid).update({
          email: newEmail
        });
      } catch (dbError) {
        console.error('Failed to update Firestore user email:', dbError);
      }

      res.json({ success: true, newEmail });
    } catch (error: any) {
      console.error('Reset username error:', error);
      if (error.code === 'auth/email-already-exists') {
        return res.status(400).json({ error: 'This username is already taken.' });
      }
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  app.post("/api/reset-display-name", async (req, res) => {
    try {
      const { resetCode, newDisplayName } = req.body;
      const authHeader = req.headers.authorization;

      if (resetCode !== '2078') {
        return res.status(400).json({ error: 'Invalid reset code.' });
      }

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized. Please log in first.' });
      }

      if (!newDisplayName || newDisplayName.trim().length < 1) {
        return res.status(400).json({ error: 'Display name cannot be empty.' });
      }

      const token = authHeader.split('Bearer ')[1];
      
      const adminAuth = getAdminAuth();
      const decodedToken = await adminAuth.verifyIdToken(token);
      const uid = decodedToken.uid;

      const userRecord = await adminAuth.getUser(uid);
      const currentDisplayName = userRecord.displayName || '';
      
      let suffix = '';
      if (currentDisplayName.endsWith('.admin')) suffix = '.admin';
      else if (currentDisplayName.endsWith('.dev')) suffix = '.dev';

      // Strip any manually added .admin or .dev to prevent spoofing
      const cleanNewDisplayName = newDisplayName.trim().replace(/\.admin$/i, '').replace(/\.dev$/i, '');
      const finalDisplayName = cleanNewDisplayName + suffix;

      await adminAuth.updateUser(uid, {
        displayName: finalDisplayName,
      });

      try {
        await getAdminDb().collection('users').doc(uid).update({
          displayName: finalDisplayName
        });
      } catch (dbError) {
        console.error('Failed to update Firestore user displayName:', dbError);
      }

      res.json({ success: true, newDisplayName: finalDisplayName });
    } catch (error: any) {
      console.error('Reset display name error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  app.get("/download-zip", (req, res) => {
    const zipPath = path.resolve(process.cwd(), 'website.zip');
    if (fs.existsSync(zipPath)) {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="website.zip"');
      fs.createReadStream(zipPath).pipe(res);
    } else {
      res.status(404).send('Zip file not found. Please ask the AI to generate it again.');
    }
  });

  app.get("/download-cloudflare", (req, res) => {
    const zipPath = path.resolve(process.cwd(), 'cloudflare.zip');
    if (fs.existsSync(zipPath)) {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="cloudflare.zip"');
      fs.createReadStream(zipPath).pipe(res);
    } else {
      res.status(404).send('Zip file not found. Please ask the AI to generate it again.');
    }
  });

  app.get("/download-local", (req, res) => {
    const zipPath = path.resolve(process.cwd(), 'local.zip');
    if (fs.existsSync(zipPath)) {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="local.zip"');
      fs.createReadStream(zipPath).pipe(res);
    } else {
      res.status(404).send('Zip file not found. Please ask the AI to generate it again.');
    }
  });

  app.get("/download-ais", (req, res) => {
    const zipPath = path.resolve(process.cwd(), 'ais.zip');
    if (fs.existsSync(zipPath)) {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="ais.zip"');
      fs.createReadStream(zipPath).pipe(res);
    } else {
      res.status(404).send('Zip file not found. Please ask the AI to generate it again.');
    }
  });

  app.get("/api/auth/github/url", (req, res) => {
    const redirectUri = `${req.protocol}://${req.get('host')}/auth/github/callback`;
    const clientId = process.env.GITHUB_CLIENT_ID;
    
    if (!clientId) {
      return res.status(500).json({ error: "GITHUB_CLIENT_ID is not set" });
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'repo user',
    });

    res.json({ url: `https://github.com/login/oauth/authorize?${params}` });
  });

  app.get(["/auth/github/callback", "/auth/github/callback/"], async (req, res) => {
    const { code } = req.query;
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!code || !clientId || !clientSecret) {
      return res.status(400).send("Missing code or credentials");
    }

    try {
      // Exchange code for token
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        })
      });

      const tokenData = await tokenResponse.json();
      
      // We could store the token in the database here, but for now we just signal success
      
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'GITHUB_AUTH_SUCCESS', token: '${tokenData.access_token || ''}' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("GitHub OAuth error:", error);
      res.status(500).send("Authentication failed");
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, model, image, useDeepThinking } = req.body;
      
      if (!process.env.TOPE_API_KEY) {
        return res.status(500).json({ error: "TOPE_API_KEY is not set" });
      }
      
      const ai = new GoogleGenAI({ apiKey: process.env.TOPE_API_KEY });
      
      let systemPrompt = "You are Tope, a helpful and friendly AI assistant for a typing test application called TypeTrack.";
      let geminiModel = "gemini-3-flash-preview";
      let thinkingConfig = undefined;
      let tools: any = undefined;

      if (model === 'turbo') {
        geminiModel = "gemini-3.1-flash-lite-preview";
        systemPrompt = "You are Tope Nano 2.6. Answer questions as quickly and concisely as possible. Keep your answers short and to the point.";
      } else if (model === 'pro') {
        geminiModel = "gemini-3-flash-preview";
        systemPrompt = "You are Tope Kai 2.7. Answer questions with detailed paragraphs and provide comprehensive explanations.";
        if (useDeepThinking) {
          thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
          systemPrompt += " Deep Thinking is ENABLED. You must think step-by-step and provide an extremely detailed, analytical response.";
        }
      } else if (model === 'apex') {
        geminiModel = "gemini-3-flash-preview";
        systemPrompt = "You are Tope Apex 1.5. You are a highly advanced model that carefully considers the user's request before answering.";
        if (useDeepThinking) {
          thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
          systemPrompt += " Deep Thinking is ENABLED.";
        }
      } else if (model === 'tt2') {
        geminiModel = "gemini-3-flash-preview";
        systemPrompt = `You are Tope Limn 2.0, an expert AI assistant for TypeTrack.
TypeTrack is a modern typing test application with the following features:
- Modes: Words (type a specific number of words), Time (type for a specific duration), Zen (endless typing mode, developer only).
- Error Modes: Free (developer only, allows continuing after mistakes), Word (stops on incorrect word), Letter (stops immediately on incorrect letter).
- Punctuation: None, Basic, Intermediate (developer only).
- Difficulty: Basic, Intermediate, Advanced (developer only).
- Capital Letters: Can be toggled on/off.
- Visual Keyboard: Shows an on-screen keyboard.
- Keyboard Sound: Plays a click sound on keypress.
- Theme: Light and Dark modes (toggle is developer only).
- Dev Mode: Users with ".dev" at the end of their display name get access to premium features (Zen mode, Free error mode, Intermediate punctuation, Advanced difficulty, Theme toggle, Clear All Data).
When the user shares their screen, you will receive an image of their current TypeTrack session. Analyze it to give them specific advice on their typing speed (WPM), accuracy, and settings.`;
      } else if (model === 'tt') {
        geminiModel = "gemini-3-flash-preview";
        systemPrompt = `You are Tope Limn 1.4, an expert AI assistant for TypeTrack.
TypeTrack is a modern typing test application. You provide helpful advice on typing speed, accuracy, and settings. You do not have access to screen analysis.`;
      }

      systemPrompt += `\n\nCRITICAL KNOWLEDGE: Your owner and creator is prat.dev. Your assistant creator is Hydrojet.dev (rajarin@typetrack.local). You are powered by the Google Gemini AI model (${geminiModel}).`;

      const formattedMessages = messages.map((msg: any) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      // If there's an image and the model is tt2, add it to the last user message
      if (image && model === 'tt2' && formattedMessages.length > 0) {
        const lastMsg = formattedMessages[formattedMessages.length - 1];
        if (lastMsg.role === 'user') {
          lastMsg.parts.unshift({
            inlineData: {
              data: image.split(',')[1],
              mimeType: image.split(';')[0].split(':')[1]
            }
          });
        }
      }

      const response = await ai.models.generateContent({
        model: geminiModel,
        contents: formattedMessages,
        config: {
          systemInstruction: systemPrompt,
          ...(thinkingConfig ? { thinkingConfig } : {}),
          ...(tools ? { tools } : {})
        }
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      const thought = parts.filter(p => p.thought).map(p => p.text).join('\n');
      const text = parts.filter(p => !p.thought && p.text).map(p => p.text).join('\n') || response.text;

      return res.json({ 
        message: text || "Sorry, I could not generate a response.",
        thought: thought || undefined
      });
    } catch (error: any) {
      console.error("Error calling AI API:", error);
      
      const errorMessage = error.message || String(error);
      
      // If it's a 429, return the exact error message so the user can see which quota they hit
      if (errorMessage.includes('429')) {
        return res.json({ 
          message: `API Quota Error: ${errorMessage}` 
        });
      }
      
      res.status(500).json({ error: "Failed to generate response", details: errorMessage });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
