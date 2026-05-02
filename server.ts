import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import cors from "cors";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Focus NFe API Bases
const FOCUS_PRODUCTION = "https://api.focusnfe.com.br";
const FOCUS_HOMOLOGATION = "https://homologacao.focusnfe.com.br";

// Logger helper
const log = (msg: string) => console.log(`[FISCAL-PROXY] ${msg}`);

// Focus NFe Proxy Endpoints
app.post("/api/fiscal/emit", async (req, res) => {
  const { focusApiKey,ambiente, tipo, payload } = req.body;
  
  if (!focusApiKey) return res.status(400).json({ error: "API Key is required" });

  const baseUrl = ambiente === "producao" ? FOCUS_PRODUCTION : FOCUS_HOMOLOGATION;
  const endpoint = tipo === "nfe" ? "/v2/nfe" : "/v2/nfce";
  
  try {
    log(`Emitting ${tipo} in ${ambiente} mode...`);
    const response = await axios.post(`${baseUrl}${endpoint}?ref=${payload.reference}`, payload, {
      auth: {
        username: focusApiKey,
        password: ""
      }
    });
    res.json(response.data);
  } catch (error: any) {
    log(`Error emitting note: ${error.response?.data?.mensagem || error.message}`);
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.get("/api/fiscal/status/:ref", async (req, res) => {
  const { ref } = req.params;
  const { focusApiKey, ambiente, tipo } = req.query;

  if (!focusApiKey) return res.status(400).json({ error: "API Key is required" });

  const baseUrl = (ambiente as string) === "producao" ? FOCUS_PRODUCTION : FOCUS_HOMOLOGATION;
  const endpoint = (tipo as string) === "nfe" ? `/v2/nfe/${ref}` : `/v2/nfce/${ref}`;

  try {
    log(`Checking status for ${ref}...`);
    const response = await axios.get(`${baseUrl}${endpoint}`, {
      auth: {
        username: focusApiKey as string,
        password: ""
      }
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.post("/api/fiscal/cancel/:ref", async (req, res) => {
  const { ref } = req.params;
  const { focusApiKey, ambiente, tipo, justificativa } = req.body;

  if (!focusApiKey) return res.status(400).json({ error: "API Key is required" });

  const baseUrl = ambiente === "producao" ? FOCUS_PRODUCTION : FOCUS_HOMOLOGATION;
  const endpoint = tipo === "nfe" ? `/v2/nfe/${ref}` : `/v2/nfce/${ref}`;

  try {
    log(`Cancelling note ${ref}...`);
    const response = await axios.delete(`${baseUrl}${endpoint}`, {
      auth: {
        username: focusApiKey,
        password: ""
      },
      data: { justificativa }
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

// Vite middleware setup
async function startServer() {
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
