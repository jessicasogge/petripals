import express from "express";

const app = express();
app.use(express.json());
app.use(express.static("public"));

app.get("/health", async (_req, res) => {
  res.json({ ok: 'lets play a game!' });
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`Listening on http://localhost:${port}`));