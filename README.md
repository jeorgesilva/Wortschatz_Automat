# Wortschatz-Automat

Mini-jogo de treino de vocabulário para a redação (Schreiben) do Goethe-Zertifikat C1 — tema "Leitungsposition". Visual pixel-art estilo SNES, com uma "slot machine" de 4 rolos. Cada rolo sorteia um item de uma lista diferente (substantivo, preposição/regência, conector, verbo); o objetivo é escrever uma frase curta conectando as 4 palavras sorteadas.

## Como usar

Não precisa de build. Rode um servidor local simples na pasta do repo:

```bash
python3 -m http.server 8765
# depois abra http://localhost:8765
```

Abrir o `index.html` com duplo clique (`file://`) também funciona para o sorteio, mas aí a correção automática não funciona, porque o Ollama bloqueia páginas `file://`. A porta 8765 é só uma escolha: a 8000 costuma estar ocupada (por exemplo pelo Docker), e qualquer porta livre serve.

## Estrutura

```
index.html      estrutura da página
css/style.css   visual (cabinet, luzes, rolos, editor)
js/script.js    lógica (sorteio, animação dos rolos, editor de listas, localStorage, correção)
ollama/Modelfile  modelo "german-corrector" do Ollama (system prompt + temperatura)
```

## Correção automática (campo "DEIN SATZ")

Logo abaixo de "DEINE KOMBINATION" tem um campo onde você digita a frase que escreveu com as 4 palavras sorteadas. Ao apertar **Enter**, o app chama seu modelo [jeorgesilva/llama3.1-german-corrector-q4](https://huggingface.co/jeorgesilva/llama3.1-german-corrector-q4) via Ollama, localmente, e mostra a frase corrigida em destaque na caixa "KORREKTUR". A análise pedagógica (erro → correção, regra, explicação) fica recolhida atrás do botão **"Erklärung anzeigen"**. Cada correção leva uns 5–10 s.

### Setup (uma vez só)

1. Ollama instalado e rodando. O app do menu bar do macOS já sobe o servidor em `http://localhost:11434` sozinho.
2. Criar o modelo `german-corrector` a partir do [ollama/Modelfile](ollama/Modelfile) deste repo:

```bash
ollama pull hf.co/jeorgesilva/llama3.1-german-corrector-q4   # só se ainda não tiver baixado (~4.9 GB)
ollama create german-corrector -f ollama/Modelfile           # instantâneo, reaproveita os pesos
```

Esse Modelfile não baixa nada novo: usa o modelo do HF já instalado e só acrescenta o system prompt usado em todos os exemplos de treino, mais `temperature 0.1` (o Modelfile do repo HF usa 1.5, aleatório demais para correção).

### No dia a dia

Basta deixar o app do Ollama aberto e servir a página via `http://localhost` (veja "Como usar"). Não precisa de `ollama run` nem de `ollama serve` manual: o modelo é carregado na primeira correção (~3 s a mais) e descarregado sozinho depois de alguns minutos sem uso.

**CORS:** o Ollama já aceita por padrão requisições de `http://localhost:*` e `http://127.0.0.1:*`, então **não precisa configurar `OLLAMA_ORIGINS`**. A única origem bloqueada é `file://` (abrir o `index.html` com duplo clique); nesse caso a caixa mostra uma mensagem explicando isso.

### Servindo o modelo de outro jeito

O `js/script.js` chama `http://localhost:11434/api/chat` com `model: "german-corrector"`. Se você servir o modelo de outro jeito, ajuste no topo do `script.js`:

- **Ollama com outro nome/porta:** só mude `CORRECTOR_URL` / `CORRECTOR_MODEL`.
- **llama.cpp (`llama-server` / `llama serve`) ou vLLM**, que expõem uma API compatível com OpenAI: troque a URL para `.../v1/chat/completions`, ajuste o parsing da resposta em `correctSentence()` de `data.message.content` para `data.choices[0].message.content` e mande o system prompt (está em `ollama/Modelfile`) como primeira mensagem `role: "system"`, já que fora do Ollama o Modelfile não vale.

Se o fetch falhar (Ollama fora do ar, modelo não criado, página aberta via `file://`), a caixa "KORREKTUR" mostra uma mensagem de erro específica em vez de travar o resto da página.

**Qualidade:** o modelo ainda é uma primeira iteração (60 passos de treino, sem avaliação). Às vezes ele deixa erros passarem ou dá explicações contraditórias. Por isso vale abrir a "Erklärung" quando a correção parecer estranha.

## Ideias para expandir

- Histórico das últimas combinações sorteadas (e das frases escritas).
- Marcar uma combinação como "difícil" e repeti-la com mais frequência.
- Exportar/importar as listas como JSON (hoje elas só ficam salvas no localStorage do navegador).
- Adicionar um 5º rolo (ex.: um dos Fehler-Targets a praticar nessa rodada).

## Origem

Esse código nasceu como um artifact interativo gerado numa conversa com o Claude, a partir do pedido de ter algo visual para praticar vocabulário de forma lúdica. As 4 listas padrão (substantivos, preposições/regência, conectores, verbos) foram montadas com base nos erros recorrentes identificados nos textos de prática para a prova C1.
