# CasaFeita

CasaFeita é um projeto gratuito e open source para planejar uma casa a partir de uma planta editável, explorar os ambientes em 3D e testar móveis antes da obra. Fotos do terreno, plantas existentes, rabiscos e descrições poderão servir de referência para propostas, sempre com confirmação das medidas e preservação do contexto real.

## Estado atual

**Fase 0 — pesquisa e arquitetura.** Ainda não há editor funcional neste repositório. O objetivo desta fase é escolher uma base open source confiável antes de importar ou desenvolver código, conforme a visão original do projeto.

- [Análise arquitetural e bases open source](docs/analise-arquitetural.md)
- [Verificações da base candidata](docs/avaliacao-openplan3d.md)
- [Experiência, navegação e mobília](docs/experiencia-produto.md)
- [Plano de evolução em entregas pequenas](docs/roadmap.md)

## Princípios

- A planta é um conjunto de paredes, aberturas, cômodos e medidas editáveis; o 3D é gerado a partir desses dados.
- Uma foto real é referência vinculada ao projeto. O sistema não deve trocar o terreno por um cenário inventado nem apresentar medidas desconhecidas como precisas.
- A casa aparece vazia primeiro; mobiliar é uma etapa separada.
- O passeio ocupa a tela, com controles discretos, minimapa clicável e acesso rápido aos cômodos.
- O núcleo funciona sem assinatura e sem uma API paga obrigatória. Projetos podem ser exportados para que o usuário mantenha uma cópia.
- Cada entrega deve ser pequena, verificável e registrada em um commit com finalidade clara.

## Licença

O conteúdo original deste repositório usa a licença [MIT](LICENSE). Dependências e modelos 3D mantêm suas próprias licenças; a procedência de cada ativo incluído será documentada antes de sua distribuição.
