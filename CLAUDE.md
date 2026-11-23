# Wortschatz-Automat

Vokabel-Lernspiel für die Vorbereitung auf das Goethe-Zertifikat C1 (Schreiben) — Thema "Leitungsposition". Pixel-art/SNES-Slot-Machine mit 4 Walzen; jede Walze zieht ein Item aus einer anderen Liste (Substantiv / Präposition-Regenz / Konnektor / Verb). Danach schreibt der Nutzer einen Satz, der die 4 gezogenen Items verbindet, tippt ihn ins Feld "DEIN SATZ" und bekommt per Enter eine automatische Korrektur von einem eigenen fine-getunten Modell.

## Stack

Reines HTML/CSS/JS, kein Build-Schritt, keine Dependencies, kein Framework. Läuft direkt im Browser (`index.html` öffnen oder `python3 -m http.server`).

```
index.html      Markup
css/style.css   Styling (CSS-Variablen für die Farbpalette, Pixel-Font "Press Start 2P")
js/script.js    Gesamte Logik, eine IIFE, kein Modul-System
README.md       Dokumentation für Menschen (Setup, Nutzung, Ideen)
```

## Walzen-Logik (js/script.js)

- `DEFAULT_LISTS`: 4 Arrays (Substantiv, Präposition/Regenz, Konnektor, Verb) mit Wortschatz zum Thema Leitungsposition.
- Listen sind im Editor-Panel ("Listen bearbeiten") frei editierbar; persistiert im `localStorage` unter `wortschatzAutomatLists_v1`.
- `spinReel()` baut pro Walze einen Stapel zufälliger Items und animiert ihn per `transform: translateY()`; jede Walze hat eine andere `extraLength`, damit sie zeitlich gestaffelt stoppen.

## Korrektur-Feature

Feld `#sentenceInput` → Enter → `correctSentence()` in `js/script.js` → POST an ein lokal laufendes Modell → Ergebnis in `#correctionText` (Box `#correctionBox`).

- Zielmodell: [jeorgesilva/llama3.1-german-corrector-q4](https://huggingface.co/jeorgesilva/llama3.1-german-corrector-q4) (Llama-3.1-8B, QLoRA, GGUF Q4_K_M).
- **Aktuelle Annahme** (am Anfang der Datei als Konstanten `CORRECTOR_URL` / `CORRECTOR_MODEL` markiert): Modell läuft lokal über **Ollama**, erzeugt aus dem `Modelfile` im HF-Repo (`ollama create german-corrector -f Modelfile`). Request geht an `http://localhost:11434/api/chat`, Response wird aus `data.message.content` gelesen.
- Falls stattdessen über llama.cpp (`llama serve`) oder vLLM serviert wird (beide OpenAI-kompatibel unter `/v1/chat/completions`), müssen in `correctSentence()` die URL und das Response-Parsing (`data.choices[0].message.content` statt `data.message.content`) angepasst werden.
- **CORS-Falle:** Ollama blockiert per Default Browser-Origins. Zum Testen muss `OLLAMA_ORIGINS` gesetzt sein, bevor der Ollama-Server startet (Details in README.md, Abschnitt "Correção automática").
- Fehlerfälle (Modell nicht erreichbar, leere Antwort) werden abgefangen und zeigen eine Fehlermeldung in `#correctionBox` statt die Seite zu blockieren — beim Weiterbauen diesen Try/Catch-Pfad nicht entfernen.

## Konventionen

- Keine Build-Tools, kein npm — bewusst so belassen, damit die Datei einfach im Browser läuft. Neue Features bitte ebenfalls ohne Dependencies umsetzen, außer explizit anders gewünscht.
- Farben/Variablen zentral in `:root` in `css/style.css` — neue UI-Elemente sollen die bestehenden `--accent-*`/`--screen`/`--text-cream` Variablen wiederverwenden statt neue Hex-Werte einzuführen.
- `localStorage`-Zugriffe sind in try/catch gewrappt (Viewer-only convenience) — dieses Muster für neue persistente Felder beibehalten.
- Sprache der UI: Deutsch (mit vereinzelten portugiesischen Hinweistexten für den Nutzer selbst, z. B. im Footer) — bei neuen UI-Texten Deutsch als Hauptsprache behalten.

## Git

Lokales Repo, kein Remote konfiguriert. Commits bisher:

1. Initial commit (Grundgerüst der Slot-Machine)
2. Satz-Eingabe + Live-Korrektur über das german-corrector-Modell
