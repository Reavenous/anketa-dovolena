// ============================================================
//  server.js – Hlavní soubor backendu hlasovací aplikace
//  Autor: Alexandre Basseville
//  Framework: Express.js, Node.js
// ============================================================

require("dotenv").config(); // Načtení proměnných prostředí z .env souboru

const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Cesta k souboru s daty hlasování
const DATA_FILE = path.join(__dirname, "data.json");

// ---- Pomocné funkce pro práci s daty ----

// Načtení dat ze souboru data.json
function loadData() {
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(raw);
}

// Uložení dat do souboru data.json
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// ---- Middleware ----

// Servírování statických souborů ze složky /public
app.use(express.static(path.join(__dirname, "public")));

// Parsování JSON těla požadavků
app.use(express.json());

// ---- API Endpointy ----

// GET /results – Vrátí aktuální výsledky hlasování
app.get("/results", (req, res) => {
  try {
    const data = loadData();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Chyba při čtení dat." });
  }
});

// POST /vote – Uloží hlas uživatele
// Tělo požadavku: { "option": "a" }  (a, b, c nebo d)
app.post("/vote", (req, res) => {
  const { option } = req.body;
  const validOptions = ["a", "b", "c", "d"];

  // Validace vstupu
  if (!option || !validOptions.includes(option)) {
    return res.status(400).json({ error: "Neplatná možnost hlasování." });
  }

  try {
    const data = loadData();

    // Zvýšení počtu hlasů pro zvolenou možnost
    data.votes[option] = (data.votes[option] || 0) + 1;
    data.totalVotes = (data.totalVotes || 0) + 1;

    saveData(data);

    // Vrátíme aktualizované výsledky
    res.json({ success: true, results: data });
  } catch (err) {
    res.status(500).json({ error: "Chyba při ukládání hlasu." });
  }
});

// POST /reset – Vynulování všech hlasů (chráněno tokenem)
// Tělo požadavku: { "token": "tajny_token" }
app.post("/reset", (req, res) => {
  const { token } = req.body;

  // Ověření tokenu z prostředí (.env nebo Replit Secrets)
  const validToken = process.env.RESET_TOKEN;

  if (!validToken) {
    return res.status(500).json({ error: "RESET_TOKEN není nastaven na serveru." });
  }

  if (token !== validToken) {
    return res.status(403).json({ error: "Nesprávný token. Reset zamítnut." });
  }

  try {
    // Vynulování dat
    const resetData = {
      question: "Jaký typ dovolené je pro tebe ten pravý?",
      options: {
        a: "Klasická válečka na pláži u moře.",
        b: "Aktivní turistika na horách.",
        c: "Poznávací zájezd po památkách a městech.",
        d: "Nejlépe si odpočinu doma (tzv. staycation)."
      },
      votes: { a: 0, b: 0, c: 0, d: 0 },
      totalVotes: 0
    };

    saveData(resetData);
    res.json({ success: true, message: "Hlasování bylo úspěšně vynulováno." });
  } catch (err) {
    res.status(500).json({ error: "Chyba při resetování dat." });
  }
});

// ---- Spuštění serveru ----
app.listen(PORT, () => {
  console.log(`✅ Server běží na portu ${PORT}`);
});
