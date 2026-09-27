# CasaFeita

CasaFeita é um projeto gratuito e open source de **aplicativo instalado** para planejar uma casa a partir de uma planta editável, explorar os ambientes em 3D e testar móveis antes da obra. Fotos do terreno, plantas existentes, rabiscos e descrições poderão servir de referência para propostas, sempre com confirmação das medidas e preservação do contexto real.

## Estado atual

**Fase 1 — fundação do aplicativo.** O núcleo GPL de planta e visualização do SweetHomeJS está sendo integrado. Ainda não há uma versão final instalável: a primeira prova precisa abrir, editar e salvar `.sh3d` em uma interface CasaFeita. A profundidade de edição segue **Sweet Home 3D**, com a clareza visual de **Floorplanner**. A primeira plataforma é Windows.

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
