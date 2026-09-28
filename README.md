# CasaFeita

CasaFeita é um projeto gratuito e open source de **aplicativo instalado** para planejar uma casa a partir de uma planta editável, explorar os ambientes em 3D e testar móveis antes da obra. Fotos do terreno, plantas existentes, rabiscos e descrições poderão servir de referência para propostas, sempre com confirmação das medidas e preservação do contexto real.

## Estado atual

**Prévia 0.1 para Windows.** O aplicativo instalado já desenha paredes, cômodos e cotas em uma planta editável, mostra a estrutura em 3D em tempo real e abre/salva projetos locais `.sh3d`. A interface CasaFeita usa uma seleção central em pílula e mantém as ferramentas de desenho discretas. O núcleo de edição deriva do SweetHomeJS; **Sweet Home 3D** orienta a profundidade funcional e **Floorplanner** orienta a clareza visual.

![Editor CasaFeita com planta e vista 3D](docs/preview-editor.png)

Esta é uma versão de desenvolvimento. O catálogo de móveis com modelos reais, passeio em primeira pessoa, minimapa com navegação e biblioteca limitada a três projetos ainda estão no [roadmap](docs/roadmap.md). A exportação local `.sh3d` já funciona, sem conta nem serviço pago.

## Executar no Windows

Requer Node.js e npm. Na raiz do repositório:

```powershell
npm ci
npm run build:engine
npm run build -w @casafeita/desktop
npm start -w @casafeita/desktop
```

Para gerar o instalador e um ZIP portátil, execute `npm run make -w @casafeita/desktop`. Os arquivos saem em `apps/desktop/out/make`. Se o gerenciador de pacotes bloquear o script de instalação do Electron e o executável estiver ausente, execute `node node_modules/electron/install.js` antes de iniciar. O instalador atual não é assinado digitalmente.

O teste de integração do aplicativo usa `npx playwright test tests/desktop.spec.ts`; ele cria, salva e reabre uma planta na janela Electron.

- [Análise arquitetural e bases open source](docs/analise-arquitetural.md)
- [Verificações da base candidata](docs/avaliacao-openplan3d.md)
- [Revisão para aplicativo instalado e avaliação de SweetHomeJS](docs/decisao-desktop.md)
- [Experiência, navegação e mobília](docs/experiencia-produto.md)
- [Direção visual e critérios de experiência](docs/direcao-visual.md)
- [Plano de evolução em entregas pequenas](docs/roadmap.md)

## Princípios

- A planta é um conjunto de paredes, aberturas, cômodos e medidas editáveis; o 3D é gerado a partir desses dados.
- Uma foto real é referência vinculada ao projeto. O sistema não deve trocar o terreno por um cenário inventado nem apresentar medidas desconhecidas como precisas.
- A casa aparece vazia primeiro; mobiliar é uma etapa separada.
- O passeio ocupa a tela, com controles discretos, minimapa clicável e acesso rápido aos cômodos. A planta e a mobília precisam ter recursos suficientes para uso real, com a maior parte dos comandos aparecendo no contexto da tarefa.
- O núcleo funciona sem assinatura e sem uma API paga obrigatória. Projetos podem ser exportados para que o usuário mantenha uma cópia.
- Cada entrega deve ser pequena, verificável e registrada em um commit com finalidade clara.

## Licença

O aplicativo derivado é distribuído sob [GPL v2 ou posterior](LICENSE). Os documentos originais publicados antes da incorporação mantêm a licença [MIT](LICENSE-MIT). A origem do núcleo está em [THIRD_PARTY.md](THIRD_PARTY.md). Modelos 3D e texturas mantêm suas próprias licenças e terão procedência registrada.
