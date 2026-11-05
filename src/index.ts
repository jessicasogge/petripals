import express from "express";

const app = express();
app.use(express.json());
app.use(express.static("public"));
// The pal pages (pals/mona.html), once built with npm run build:site.
app.use(express.static("site"));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`Listening on http://localhost:${port}`));