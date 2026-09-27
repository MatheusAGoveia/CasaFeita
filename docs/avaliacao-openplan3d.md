# Avaliação reproduzível da base candidata

Data: 27/09/2026. Repositório avaliado: `laanlabs/openPlan3D`, commit `d68cadf703578f2cd3a7c77f820e18d342580c32` da branch `main`. A avaliação ocorreu em um clone temporário, sem importar arquivos do projeto ao CasaFeita.

## Verificações executadas

Ambiente: Windows, Node.js `v24.18.0`, npm `11.16.0`.

| Comando | Resultado |
| --- | --- |
| `npm ci` | Instalou 260 pacotes, auditoria sem vulnerabilidades. O script `prepare` mostrou uma falha de carregamento da configuração Svelte e a ocultou com seu fallback; não deve ser tomado como validação do projeto. |
| `NODE_ENV=production npm run check` | Concluiu com **0 erros e 0 avisos**. |
| `NODE_ENV=production npm test -- --reporter=dot` | **125 arquivos e 1.175 testes Vitest passaram**. |
| `NODE_ENV=production npm run build` | Build cliente e servidor concluído. Houve aviso de importação não utilizada de `OrbitControls` em `CustomModelPreview.svelte`. |

`NODE_ENV=production` foi definido apenas nos processos de verificação porque a configuração Vite do projeto exige esse valor para comandos de build. Os testes Playwright de navegador presentes no repositório **não foram executados** nesta avaliação. Também não houve validação manual de desenho, salvamento ou passeio em navegador. Esses passos são obrigatórios antes de declarar a base adotada para o primeiro marco de código.

## Constatações para o escopo CasaFeita

- A base passa por verificações automatizadas relevantes e possui um catálogo de móveis amplo com medidas padrão.
- O passeio implementa movimento de câmera sem colisão/gravidade física. Seu mapa de teclas difere do WASD de deslocamento solicitado.
- Recursos de importação, servidor, IA opcional e ativos existentes precisam de revisão por função e licença antes de aparecerem na interface simplificada.
- A opção de três projetos por pessoa não decorre automaticamente do armazenamento local. A primeira versão pode limitar três projetos por navegador e comunicar essa diferença com clareza.

Esta avaliação recomenda uma **prova de integração pequena** após a escolha da stack, não uma migração total sem revisão.
