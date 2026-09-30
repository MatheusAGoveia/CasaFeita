# Revisão de código — 29/09/2026

Escopo: janela Electron, biblioteca local, editor CasaFeita, mobília, passeio e testes de integração. O núcleo SweetHomeJS incorporado foi examinado apenas nas interfaces usadas pelo aplicativo. Antes das correções, o build e os seis testes existentes passaram.

## Achados priorizados

| Prioridade | Achado | Evidência no código | Correção planejada |
| --- | --- | --- | --- |
| Alta | Uma falha entre a substituição do `.sh3d` e a atualização do índice pode deixar o projeto listado com conteúdo diferente do esperado. | `electron/library.cjs`: `save` renomeia o arquivo antes de `writeEntries`. | Gravação com cópia de recuperação e rollback, exercitada por falha injetada. |
| Alta | A exportação escreve diretamente no arquivo escolhido. Uma falha de escrita pode truncar a cópia anterior. | `electron/main.cjs`: `fs.writeFile(chosen.filePath, bytes)`. | Escrever arquivo temporário no mesmo diretório e substituir ao final. |
| Média | O deslizamento da câmera no eixo Y usa um ponto inicial que pode ter X atualizado e um destino com X antigo. | `Walkthrough.tsx`: ramo `slideY`. | Separar as tentativas de cada eixo e testar colisão junto à parede. |
| Média | Uma planta com muitos vértices pode estourar a pilha ao calcular limites; coordenadas inválidas podem propagá-los à busca de rota. | `navigation.ts`: `Math.min(...points.map(...))`. | Acumular limites iterativamente e validar entradas. |
| Média | O caminho pode criar uma grade excessiva para plantas com dimensões extremas. | `navigation.ts`: `columns * rows` alimenta três vetores tipados. | Limitar a grade e recusar geometria inválida sem travar a interface. |
| Média | O modal permite ações enquanto um salvamento está em curso, e o botão de abrir depende do nome digitado em outro modo. | `ProjectLibrary.tsx`: fechamento/importação e `disabled={busy || !name.trim()}`. | Travar ações conflitantes e separar as condições de abrir e substituir. |
| Média | Edições diretas de mobília precisam marcar o projeto como alterado para que a confirmação de descarte seja confiável. | `App.tsx`: medidas, rotação e acabamento alteram a peça diretamente. | Verificar e corrigir a detecção de alterações, com teste no aplicativo. |

## Limites conhecidos de produto

O editor ainda não recorta portas e janelas das paredes 3D nem oferece múltiplos níveis completos. Esses recursos exigem trabalho de geometria e não devem ser representados como concluídos nesta revisão.

## Critério de fechamento

Cada correção deve ter um commit com propósito próprio. Ao final, executar build, testes de integração, verificação do aplicativo empacotado e publicar os commits no GitHub.
