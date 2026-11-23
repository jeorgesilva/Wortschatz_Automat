(function(){
  "use strict";

  var STORAGE_KEY = "wortschatzAutomatLists_v1";

  // --- Korrektur-Modell (jeorgesilva/llama3.1-german-corrector-q4) ---
  // Default-Annahme: Modell lokal über Ollama servieren, mit dem im HF-Repo
  // enthaltenen Modelfile erzeugt:
  //   ollama create german-corrector -f Modelfile
  //   ollama run german-corrector      (einmal laufen lassen reicht, dann läuft der Server)
  // Falls du es anders servierst (llama.cpp --jinja / llama serve / vLLM OpenAI-API),
  // hier URL + Request/Response-Parsing in correctSentence() anpassen (siehe README).
  var CORRECTOR_URL = "http://localhost:11434/api/chat";
  var CORRECTOR_MODEL = "german-corrector";

  var DEFAULT_LISTS = [
    {
      label: "SUBSTANTIV",
      items: [
        "die Leitungsposition","die Führungskraft","der Vorgesetzte","die Verantwortung",
        "die Erfahrung","die Autorität","der Einfluss","das Vertrauen","die Anerkennung",
        "die Voraussetzung","die Qualifikation","die Beförderung","die Herausforderung",
        "die Entscheidung","der Druck"
      ]
    },
    {
      label: "PRÄPOSITION / REGENZ",
      items: [
        "Einstieg in","Einfluss auf","Verantwortung für","Vertrauen in","Erfahrung mit",
        "Voraussetzung für","Beförderung zu","sich verlassen auf","sich wenden an",
        "Autorität über","im Vergleich zu","im Hinblick auf"
      ]
    },
    {
      label: "KONNEKTOR",
      items: [
        "jedoch","obwohl","während","zwar... aber","einerseits... andererseits",
        "im Gegensatz zu","trotzdem","außerdem","nicht nur... sondern auch",
        "deshalb","infolgedessen","sodass"
      ]
    },
    {
      label: "VERB",
      items: [
        "übernehmen","anstreben","sich entwickeln","leiten","lenken","anleiten",
        "steuern","koordinieren","sich verlassen auf","sich wenden an","genießen",
        "erfordern","sich bewähren"
      ]
    }
  ];

  var ITEM_HEIGHT = 64;

  function loadLists(){
    try{
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if(!raw) return clone(DEFAULT_LISTS);
      var parsed = JSON.parse(raw);
      if(!Array.isArray(parsed) || parsed.length !== 4) return clone(DEFAULT_LISTS);
      for(var i=0;i<4;i++){
        if(!parsed[i] || !Array.isArray(parsed[i].items) || parsed[i].items.length === 0){
          return clone(DEFAULT_LISTS);
        }
      }
      return parsed;
    }catch(e){
      return clone(DEFAULT_LISTS);
    }
  }

  function saveLists(lists){
    try{
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
    }catch(e){ /* ignore: viewer-only convenience */ }
  }

  function clone(x){ return JSON.parse(JSON.stringify(x)); }

  var state = {
    lists: loadLists(),
    spinning: false,
    current: ["—","—","—","—"]
  };

  var reelsEl = document.getElementById("reels");
  var pullBtn = document.getElementById("pullBtn");
  var comboText = document.getElementById("comboText");
  var toggleEdit = document.getElementById("toggleEdit");
  var editor = document.getElementById("editor");
  var editorGrid = document.getElementById("editorGrid");
  var saveBtn = document.getElementById("saveBtn");
  var resetBtn = document.getElementById("resetBtn");
  var statusMsg = document.getElementById("statusMsg");
  var sentenceInput = document.getElementById("sentenceInput");
  var correctionBox = document.getElementById("correctionBox");
  var correctionText = document.getElementById("correctionText");

  function pickRandom(arr){
    return arr[Math.floor(Math.random()*arr.length)];
  }

  function buildReelsDOM(){
    reelsEl.innerHTML = "";
    state.lists.forEach(function(list, idx){
      var unit = document.createElement("div");
      unit.className = "reel-unit";

      var label = document.createElement("div");
      label.className = "reel-label";
      label.textContent = list.label;
      unit.appendChild(label);

      var win = document.createElement("div");
      win.className = "reel-window";
      win.id = "reelWindow"+idx;

      var strip = document.createElement("div");
      strip.className = "reel-strip";
      strip.id = "reelStrip"+idx;
      strip.style.transform = "translateY(0px)";

      var item = document.createElement("div");
      item.className = "reel-item";
      item.textContent = state.current[idx];
      strip.appendChild(item);

      win.appendChild(strip);
      unit.appendChild(win);
      reelsEl.appendChild(unit);
    });
  }

  function spinReel(idx, extraLength, onDone){
    var list = state.lists[idx].items;
    var win = document.getElementById("reelWindow"+idx);
    var strip = document.getElementById("reelStrip"+idx);
    win.classList.remove("landed");

    var rowCount = 14 + extraLength;
    var finalItem = pickRandom(list);

    strip.style.transition = "none";
    strip.style.transform = "translateY(0px)";
    strip.innerHTML = "";

    for(var i=0;i<rowCount-1;i++){
      var row = document.createElement("div");
      row.className = "reel-item";
      row.textContent = pickRandom(list);
      strip.appendChild(row);
    }
    var finalRow = document.createElement("div");
    finalRow.className = "reel-item";
    finalRow.textContent = finalItem;
    strip.appendChild(finalRow);

    var duration = rowCount * 55;
    void strip.offsetHeight;

    requestAnimationFrame(function(){
      strip.style.transition = "transform "+duration+"ms cubic-bezier(0.12, 0.72, 0.18, 1)";
      strip.style.transform = "translateY(-"+((rowCount-1)*ITEM_HEIGHT)+"px)";
    });

    window.setTimeout(function(){
      win.classList.add("landed");
      state.current[idx] = finalItem;
      if(onDone) onDone(finalItem);
    }, duration + 40);
  }

  function updateCombo(){
    comboText.textContent = state.current.join("   /   ");
  }

  function pullLever(){
    if(state.spinning) return;
    state.spinning = true;
    pullBtn.disabled = true;
    comboText.textContent = "...";

    var results = [null,null,null,null];
    var remaining = 4;

    [0,1,2,3].forEach(function(idx){
      spinReel(idx, idx*5, function(finalItem){
        results[idx] = finalItem;
        remaining--;
        if(remaining === 0){
          state.spinning = false;
          pullBtn.disabled = false;
          updateCombo();
        }
      });
    });
  }

  function buildEditorDOM(){
    editorGrid.innerHTML = "";
    state.lists.forEach(function(list, idx){
      var field = document.createElement("div");
      field.className = "editor-field";

      var label = document.createElement("label");
      label.textContent = list.label;
      label.setAttribute("for","listArea"+idx);

      var ta = document.createElement("textarea");
      ta.id = "listArea"+idx;
      ta.value = list.items.join("\n");

      field.appendChild(label);
      field.appendChild(ta);
      editorGrid.appendChild(field);
    });
  }

  function applyEditorValues(){
    var newLists = clone(state.lists);
    var ok = true;
    for(var idx=0; idx<4; idx++){
      var ta = document.getElementById("listArea"+idx);
      var rawLines = ta.value.split("\n");
      var cleaned = [];
      for(var j=0;j<rawLines.length;j++){
        var t = rawLines[j].trim();
        if(t.length>0) cleaned.push(t);
      }
      if(cleaned.length === 0){ ok = false; break; }
      newLists[idx].items = cleaned;
    }
    if(!ok){
      statusMsg.textContent = "Jede Liste braucht mindestens 1 Eintrag.";
      return;
    }
    state.lists = newLists;
    saveLists(state.lists);
    statusMsg.textContent = "Gespeichert!";
    buildReelsDOM();
    window.setTimeout(function(){ statusMsg.textContent = ""; }, 1800);
  }

  function resetToDefault(){
    state.lists = clone(DEFAULT_LISTS);
    saveLists(state.lists);
    buildEditorDOM();
    buildReelsDOM();
    statusMsg.textContent = "Auf Standard zurückgesetzt.";
    window.setTimeout(function(){ statusMsg.textContent = ""; }, 1800);
  }

  function setCorrectionState(state, text){
    correctionBox.classList.remove("loading","error");
    if(state) correctionBox.classList.add(state);
    correctionText.textContent = text;
  }

  function correctSentence(rawText){
    var text = (rawText || "").trim();
    if(text.length === 0) return;

    setCorrectionState("loading", "... korrigiere ...");

    fetch(CORRECTOR_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: CORRECTOR_MODEL,
        messages: [{ role: "user", content: text }],
        stream: false
      })
    })
      .then(function(res){
        if(!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function(data){
        var corrected = data && data.message && typeof data.message.content === "string"
          ? data.message.content.trim()
          : "";
        if(!corrected) throw new Error("Leere Antwort vom Modell");
        setCorrectionState(null, corrected);
      })
      .catch(function(err){
        setCorrectionState("error", "Fehler: Modell nicht erreichbar. Läuft 'ollama run german-corrector'? (siehe README, Abschnitt Korrektur-Feature)");
        if(window.console && console.error) console.error("Korrektur fehlgeschlagen:", err);
      });
  }

  sentenceInput.addEventListener("keydown", function(e){
    if(e.key === "Enter"){
      e.preventDefault();
      correctSentence(sentenceInput.value);
    }
  });

  pullBtn.addEventListener("click", pullLever);

  toggleEdit.addEventListener("click", function(){
    editor.classList.toggle("open");
    if(editor.classList.contains("open")) buildEditorDOM();
  });

  saveBtn.addEventListener("click", applyEditorValues);
  resetBtn.addEventListener("click", resetToDefault);

  state.current = state.lists.map(function(l){ return pickRandom(l.items); });
  buildReelsDOM();
  updateCombo();
})();
