# Wortschatz-Automat

Vokabel-Lernspiel für die Vorbereitung auf das Goethe-Zertifikat C1 (Schreiben) — Thema "Leitungsposition". Pixel-art/SNES-Slot-Machine mit 4 Walzen; jede Walze zieht ein Item aus einer anderen Liste (Substantiv / Präposition-Regenz / Konnektor / Verb). Danach schreibt der Nutzer einen Satz, der die 4 gezogenen Items verbindet, tippt ihn ins Feld "DEIN SATZ" und bekommt per Enter eine automatische Korrektur von einem eigenen fine-getunten Modell.

## Stack

Reines HTML/CSS/JS, kein Build-Schritt, keine Dependencies, kein Framework. Läuft direkt im Browser; für das Korrektur-Feature über einen lokalen Server öffnen (`python3 -m http.server 8765` → `http://localhost:8765`), nicht per `file://`. Port 8000 ist auf dem Rechner des Nutzers von Docker belegt.

```
index.html        Markup
css/style.css     Styling (CSS-Variablen für die Farbpalette, Pixel-Font "Press Start 2P")
js/script.js      Gesamte Logik, eine IIFE, kein Modul-System
ollama/Modelfile  Ollama-Modell "german-corrector" (System-Prompt + temperature fürs Korrektur-Feature)
README.md         Dokumentation für Menschen (Setup, Nutzung, Ideen)
```

## Walzen-Logik (js/script.js)

- `DEFAULT_LISTS`: 4 Arrays (Substantiv, Präposition/Regenz, Konnektor, Verb) mit Wortschatz zum Thema Leitungsposition.
- Listen sind im Editor-Panel ("Listen bearbeiten") frei editierbar; persistiert im `localStorage` unter `wortschatzAutomatLists_v1`.
- `spinReel()` baut pro Walze einen Stapel zufälliger Items und animiert ihn per `transform: translateY()`; jede Walze hat eine andere `extraLength`, damit sie zeitlich gestaffelt stoppen.

## Korrektur-Feature

Feld `#sentenceInput` → Enter → `correctSentence()` in `js/script.js` → POST an Ollama → `parseCorrection()` → korrigierter Satz in `#correctionText`, Analyse eingeklappt in `#explainText` (Button `#explainToggle` "Erklärung anzeigen"), alles in der Box `#correctionBox`.

- Zielmodell: [jeorgesilva/llama3.1-german-corrector-q4](https://huggingface.co/jeorgesilva/llama3.1-german-corrector-q4) (Llama-3.1-8B, QLoRA, GGUF Q4_K_M).
- **Serving (Ende-zu-Ende getestet):** Ollama läuft über die macOS-Menüleisten-App, die `ollama serve` auf `127.0.0.1:11434` selbst startet. Das Modell `german-corrector` wird aus `ollama/Modelfile` erzeugt (`ollama create german-corrector -f ollama/Modelfile`). Das Modelfile baut auf dem per `ollama pull hf.co/jeorgesilva/llama3.1-german-corrector-q4` installierten Modell auf und ergänzt nur den System-Prompt aller Trainingsbeispiele (aus `~/german-corrector-llm/data/dataset_sharegpt.jsonl`) + `temperature 0.1`. Die Modelfiles im HF-Repo und in `german-corrector-llm` setzen keinen System-Prompt, und das HF-Modelfile nutzt `temperature 1.5`.
- Konstanten `CORRECTOR_URL` / `CORRECTOR_MODEL` am Anfang von `js/script.js`. Request an `http://localhost:11434/api/chat` mit `stream: false` und nur einer `user`-Nachricht (der System-Prompt kommt aus dem Modelfile). Response aus `data.message.content`.
- **Antwortformat** (aus den Trainingsdaten): `KORRIGIERTER TEXT:\n<Satz>\n\nPÄDAGOGISCHE ANALYSE:\n1. Fehler: '…' -> Korrektur: '…'\n   Regel: …\n   Erklärung: …`. `parseCorrection()` trennt an diesen Überschriften; fehlen sie, wird die ganze Antwort als Korrektur gezeigt. Eine Korrektur dauert ca. 5–10 s (+ ~3 s, wenn das Modell erst geladen wird); `correctionRequestId` sorgt dafür, dass nur die Antwort auf die letzte Anfrage angezeigt wird.
- Falls stattdessen über llama.cpp (`llama serve`) oder vLLM serviert wird (beide OpenAI-kompatibel unter `/v1/chat/completions`), müssen in `correctSentence()` die URL und das Response-Parsing (`data.choices[0].message.content` statt `data.message.content`) angepasst und der System-Prompt als `system`-Nachricht mitgeschickt werden.
- **CORS:** Ollama erlaubt per Default `http://localhost:*` und `http://127.0.0.1:*`, also ist **kein `OLLAMA_ORIGINS` nötig**, solange die Seite über einen lokalen HTTP-Server läuft. Per `file://` geöffnet (Origin `null`) blockiert Ollama den Preflight (403).
- Fehlerfälle (Modell nicht erreichbar, Modell fehlt / HTTP 404, Seite per `file://`, leere Antwort) werden abgefangen; `correctionErrorMessage()` zeigt eine passende Meldung in `#correctionBox`, statt die Seite zu blockieren. Beim Weiterbauen diesen Try/Catch-Pfad nicht entfernen.
- Modell-Output wird nur per `textContent` eingefügt, nie per `innerHTML`.

## Konventionen

- Keine Build-Tools, kein npm — bewusst so belassen, damit die Datei einfach im Browser läuft. Neue Features bitte ebenfalls ohne Dependencies umsetzen, außer explizit anders gewünscht.
- Farben/Variablen zentral in `:root` in `css/style.css` — neue UI-Elemente sollen die bestehenden `--accent-*`/`--screen`/`--text-cream` Variablen wiederverwenden statt neue Hex-Werte einzuführen.
- `localStorage`-Zugriffe sind in try/catch gewrappt (Viewer-only convenience) — dieses Muster für neue persistente Felder beibehalten.
- Sprache der UI: Deutsch (mit vereinzelten portugiesischen Hinweistexten für den Nutzer selbst, z. B. im Footer) — bei neuen UI-Texten Deutsch als Hauptsprache behalten.

## Git

Lokales Repo, kein Remote konfiguriert. Commits bisher:

1. Initial commit (Grundgerüst der Slot-Machine)
2. Satz-Eingabe + Live-Korrektur über das german-corrector-Modell
