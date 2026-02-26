# 🎮 Antigravity Tetris

Desenvolvido por: Google Antigravity
Status do Projeto: 🟢 Deploy Inicial (GitHub Pages)

Uma releitura fiel do clássico quebra-cabeça de 1984, otimizada para a web moderna. O objetivo é simples: organize as peças que caem, complete linhas e desafie a gravidade antes que o tabuleiro transborde.

## 🕹️ O Jogo

O Antigravity Tetris utiliza a lógica clássica de rotação e encaixe de poliminós. O desafio aumenta conforme a velocidade de queda das peças acelera, exigindo raciocínio rápido e precisão.

### Mecânicas Principais:
- **O Tabuleiro:** Uma matriz de 10x20 blocos.
- **As Peças (Tetriminos):** 7 formatos distintos (I, J, L, O, S, T, Z), cada um com sua cor característica.
- **Eliminação:** Sempre que uma linha horizontal de 10 blocos é preenchida, ela é removida e os blocos acima descem uma posição.
- **Game Over:** Ocorre quando uma nova peça não consegue ser gerada no topo do tabuleiro por falta de espaço.

## 🛠️ Tecnologias Utilizadas

Para garantir leveza e compatibilidade total com o GitHub Pages:
- **HTML5:** Estrutura do jogo e elemento `<canvas>`.
- **CSS3:** Estilização responsiva e efeitos de "Glow" (estética Antigravity).
- **JavaScript (Vanilla):** Lógica de colisão, rotação e controle de tempo.

## 🚀 Como fazer o Deploy via GitHub Desktop

Como você está usando a versão desktop para realizar o commit, siga este passo a passo para colocar o jogo no ar:

1. **Commit Local:** No GitHub Desktop, selecione as alterações, escreva uma mensagem (ex: "feat: implementação da lógica de linhas") e clique em **Commit to main**.
2. **Push:** Clique no botão **Push origin** para enviar o código para o servidor do GitHub.
3. **Ativar o Pages:**
   - Vá até o seu repositório no site do GitHub.
   - Clique em **Settings (Configurações)** > **Pages** no menu lateral.
   - Em "Build and deployment", escolha a branch **main** e a pasta **/(root)**.
   - Clique em **Save**.
4. **Acesse:** Em poucos minutos, o link `https://seu-usuario.github.io/seu-repositorio/` estará ativo.

## ⌨️ Comandos de Controle

| Tecla | Ação |
| :--- | :--- |
| **Seta Esquerda / Direita** | Move a peça lateralmente |
| **Seta Cima** | Rotaciona a peça em 90° |
| **Seta Baixo** | Soft Drop (Desce mais rápido) |
| **Espaço** | Hard Drop (Cai instantaneamente) |
