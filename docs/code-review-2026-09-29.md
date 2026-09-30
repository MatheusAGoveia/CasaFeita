# Revisão de código — 29/09/2026

Escopo: janela Electron, biblioteca local, editor CasaFeita, mobília, passeio e testes de integração. O núcleo SweetHomeJS incorporado foi examinado nas interfaces usadas pelo aplicativo. Antes da revisão, o build e os seis testes existentes passavam.

## Achados e correções

| Prioridade | Achado | Correção aplicada |
| --- | --- | --- |
| Alta | Uma interrupção entre substituir o `.sh3d` e atualizar o índice podia deixar o projeto inconsistente ou perder a versão anterior. | Gravação serializada com cópia de recuperação, rollback em falhas e reconciliação no próximo início. Testes simulam os pontos de interrupção. |
| Alta | A exportação escrevia diretamente no destino e podia truncar uma cópia anterior. | Gravação em arquivo temporário no mesmo diretório e substituição após concluir a escrita. Nome e conteúdo são validados. |
| Média | O deslizamento diagonal da câmera podia terminar dentro de um móvel. | Cada eixo usa a posição atual como origem; um teste verifica a colisão. |
| Média | Muitos vértices podiam estourar a pilha; coordenadas inválidas e trechos enormes podiam travar a busca. | Limites calculados iterativamente, entradas finitas obrigatórias e limites para amostragem e grade de rota. |
| Média | A biblioteca permitia ações conflitantes durante operações e a abertura de um projeto dependia do campo de nome. | Operações ocupadas bloqueiam ações concorrentes; abrir um projeto existente independe do nome digitado. |
| Média | Medidas, acabamento e rotação alteravam móveis sem marcar o projeto como modificado. | Essas edições agora ativam o estado de alteração, a confirmação de descarte e o indicador no cabeçalho. |

Também foram corrigidos os casos de índice inválido, arquivo de projeto ausente, exclusão interrompida, salvamentos simultâneos e seleção cancelada de arquivo para importação. A velocidade do passeio agora é lembrada entre sessões.

## Validação

- `npm run build -w @casafeita/desktop`: passou, incluindo a verificação TypeScript e o build Vite.
- `npx playwright test tests/ --reporter=line`: **23 testes passaram**, incluindo o aplicativo Electron, projeto salvo e reaberto, mobília, exportação, passeio e recuperação da biblioteca.
- Os testes executam o código atual no Electron instalado em `node_modules`. O instalador distribuível não foi reconstruído nesta revisão; uma cópia já aberta do aplicativo não recebe estas mudanças automaticamente.

## Limites restantes

- Portas e janelas ainda não recortam as paredes 3D; múltiplos níveis completos continuam pendentes.
- Edições diretas de medidas, acabamento e rotação acionam o estado de alteração, mas ainda não entram no histórico de desfazer/refazer.
- Uma interrupção durante a primeira gravação, antes de criar a entrada no índice, pode deixar um `.sh3d` órfão no disco. Um índice corrompido é identificado e relatado, mas ainda não reconstruído automaticamente.
- O bundle do editor recebe o aviso de tamanho do Vite (aproximadamente 1,85 MB de JavaScript antes de gzip); há espaço para divisão e carregamento sob demanda.
