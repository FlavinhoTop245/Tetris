# 🎮 Antigravity Tetris

Desenvolvido por: Google Antigravity
Status do Projeto: 🟢 Deploy Inicial (GitHub Pages)

Uma releitura fiel do clássico quebra-cabeça de 1984, otimizada para a web moderna. O objetivo é simples: organize as peças que caem, complete linhas e desafie a gravidade antes que o tabuleiro transborde.

## 🕹️ O Jogo

O Antigravity Tetris utiliza a lógica clássica de rotação e encaixe de poliminós. O desafio aumenta conforme a velocidade de queda das peças acelera, exigindo raciocínio rápido e precisão.

### Mecânicas Avançadas:
- **Peça Fantasma (Ghost Piece):** Visualize onde a peça cairá.
- **Segurar Peça (Hold):** Guarde uma peça para uso estratégico futuro.
- **DAS (Delayed Auto Shift):** Segure as setas para mover a peça continuamente.
- **Lock Delay:** Tempo extra ao tocar o chão para girar ou mover a peça (permite *T-Spins*).
- **Rotação Dupla:** Teclas dedicadas para girar nos dois sentidos (Horário e Anti-horário).
- **Velocidade Balanceada:** Progressão de dificuldade suave e controlada.

## 🛠️ Tecnologias Utilizadas

Para garantir leveza e compatibilidade total com o GitHub Pages:
- **HTML5:** Estrutura do jogo e elemento `<canvas>`.
- **CSS3:** Estilização responsiva e efeitos de "Glow" (estética Antigravity).
- **JavaScript (Vanilla):** Lógica complexa de colisão, rotação, DAS, persistência local e controle de tempo.

## 🚀 Como fazer o Deploy via GitHub Desktop

Como você está usando a versão desktop para realizar o commit, siga este passo a passo para colocar o jogo no ar:

1. **Commit Local:** No GitHub Desktop, selecione as alterações, escreva uma mensagem (ex: "feat: das, lock delay e rotação dupla") e clique em **Commit to main**.
2. **Push:** Clique no botão **Push origin** para enviar o código para o servidor do GitHub.
3. **Ativar o Pages:**
   - Vá até o seu repositório no site do GitHub.
   - Clique em **Settings (Configurações)** > **Pages** no menu lateral.
   - Em "Build and deployment", escolha a branch **main** e a pasta **/(root)**.
   - Clique em **Save**.
4. **Acesse:** Em poucos minutos, o link `https://seu-usuario.github.io/seu-repositorio/` estará ativo.

## ⌨️ Controles (Padrão)

Acesse o menu **AJUSTES** no jogo para remapear estas teclas:

| Ação | Tecla Padrão |
| :--- | :--- |
| **Mover lateralmente** | Setas Esquerda / Direira (Segurar para deslizar) |
| **Girar Horário** | Seta Cima |
| **Girar Anti-horário** | Z |
| **Cair Rápido** | Seta Baixo |
| **Hard Drop** | Espaço |
| **Segurar Peça** | C |
