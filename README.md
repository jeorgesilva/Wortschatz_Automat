# Wortschatz-Automat

Mini-jogo de treino de vocabulário para a redação (Schreiben) do Goethe-Zertifikat C1 — tema "Leitungsposition". Visual pixel-art estilo SNES, com uma "slot machine" de 4 rolos. Cada rolo sorteia um item de uma lista diferente (substantivo, preposição/regência, conector, verbo); o objetivo é escrever uma frase curta conectando as 4 palavras sorteadas.

## Como usar

Abra `index.html` direto no navegador — não precisa de servidor nem de build. Se preferir, rode um servidor local simples:

```bash
python3 -m http.server 8000
# depois abra http://localhost:8000
```

## Estrutura

```
index.html      estrutura da página
css/style.css   visual (cabinet, luzes, rolos, editor)
js/script.js    lógica (sorteio, animação dos rolos, editor de listas, localStorage)
```

## Correção automática (campo "DEIN SATZ")

Logo abaixo de "DEINE KOMBINATION" tem um campo onde você digita a frase que escreveu com as 4 palavras sorteadas. Ao apertar **Enter**, o app chama seu modelo [jeorgesilva/llama3.1-german-corrector-q4](https://huggingface.co/jeorgesilva/llama3.1-german-corrector-q4) e mostra a frase corrigida na caixa "KORREKTUR" abaixo.

**Suposição assumida (ajustável):** o modelo é servido localmente via **Ollama**, criado a partir do `Modelfile` que está no repo do Hugging Face:

```bash
# baixa o repo (ou só o Modelfile) e, na pasta dele:
ollama create german-corrector -f Modelfile
ollama run german-corrector   # só pra confirmar que funciona; o servidor já fica de pé
```

O `js/script.js` chama `http://localhost:11434/api/chat` com `model: "german-corrector"`. Se você servir o modelo de outro jeito, ajuste no topo do `script.js`:

- **Ollama com outro nome/porta:** só mude `CORRECTOR_URL` / `CORRECTOR_MODEL`.
- **llama.cpp (`llama-server` / `llama serve`) ou vLLM**, que expõem uma API compatível com OpenAI: troque a URL para `.../v1/chat/completions` e ajuste o parsing da resposta em `correctSentence()` de `data.message.content` para `data.choices[0].message.content`.

**CORS:** por padrão o Ollama só aceita requisições do próprio app dele. Como a página é aberta no navegador (via `file://` ou `http://localhost:8000`), é preciso liberar a origem antes de iniciar o Ollama:

```bash
OLLAMA_ORIGINS="*" ollama serve
```

(ou restrinja a origem exata em vez de `*`, se preferir). Se o Ollama já estiver rodando como serviço em background (lançado pelo app do macOS), pare-o e rode esse comando manualmente, ou defina a variável permanentemente e reinicie o serviço.

Se o fetch falhar (Ollama fora do ar, CORS bloqueado, nome de modelo errado), a caixa "KORREKTUR" mostra uma mensagem de erro em vez de travar o resto da página.

## Ideias para expandir

- Histórico das últimas combinações sorteadas (e das frases escritas).
- Marcar uma combinação como "difícil" e repeti-la com mais frequência.
- Exportar/importar as listas como JSON (hoje elas só ficam salvas no localStorage do navegador).
- Adicionar um 5º rolo (ex.: um dos Fehler-Targets a praticar nessa rodada).
- Corrigir a frase automaticamente ligando a um modelo (ex.: o `german-corrector-llm`).

## Origem

Esse código nasceu como um artifact interativo gerado numa conversa com o Claude, a partir do pedido de ter algo visual para praticar vocabulário de forma lúdica. As 4 listas padrão (substantivos, preposições/regência, conectores, verbos) foram montadas com base nos erros recorrentes identificados nos textos de prática para a prova C1.
