# Roadmap incremental

Cada marco é pequeno o suficiente para ser revisado separadamente. Os commits devem descrever uma mudança verificável; o título de um marco não autoriza pular os critérios dos anteriores.

| Marco | Entrega | Evidência de aceite |
| --- | --- | --- |
| 0. Pesquisa | Visão, comparação de bases, arquitetura, experiência e licenças | Documentos publicados; base recomendada e seus limites explícitos. |
| 1. Base editável | Incorporar a base escolhida com origem e licença, executar verificações, reduzir navegação inicial, salvar até três projetos locais e exportar backup | Criar planta com dois cômodos, portas e medidas; salvar, reabrir e editar sem perder dados; testes e build registrados. |
| 2. Estrutura 2D → 3D | Conectar edição de planta à cena, iniciar 3D vazio, preservar áreas e aberturas | Mudar uma parede/porta e ver resultado coerente no 3D e no minimapa. |
| 3. Passeio | WASD, mouse, colisão, gravidade/escadas, câmera na altura correta | Caminhar por portas sem atravessar paredes; velocidade estável em taxas de quadros distintas. |
| 4. Navegação por planta | Minimap clicável, rota a pé, clique duplo instantâneo, pílula vertical de cômodos e ajustes de velocidade | Chegar a cômodo acessível sem atravessar obstáculos; destino inválido é rejeitado; rota pode ser interrompida. |
| 5. Mobiliar | Catálogo essencial com medidas padrão editáveis, variações, posicionamento em 2D/3D e ativos com licença registrada | Inserir, mover, girar, duplicar, dimensionar e remover; o passeio respeita o móvel. |
| 6. Referência real | Importar foto/planta/rabisco como camada, calibrar escala e traçar entidades editáveis | Reabrir o projeto e encontrar foto, escala, paredes e incertezas preservadas. |
| 7. Assistência de IA | Propor entidades e alterações com procedência, confiança e revisão humana | Um conjunto de imagens de teste mostra o que foi preservado, inferido e corrigido; nenhuma foto vira geometria falsamente precisa. |
| 8. Personalização e intercâmbio | Materiais, iluminação, GLB de móveis, exportação mais ampla e eventual render externo | Projeto continua editável, rápido para abrir e utilizável sem serviço pago obrigatório. |

## Ordem dos primeiros commits de código

1. Importar a versão exata da base aprovada, mantendo atribuições e um registro de origem.
2. Registrar os resultados de tipos, testes, build e fluxo manual da base no ambiente local.
3. Introduzir o limite de três projetos **locais** e a exportação sempre disponível, com mensagens claras.
4. Implementar a pílula superior e mover ações secundárias para controles laterais.
5. Implementar o novo controlador de caminhada antes da navegação por clique.

Os marcos posteriores só serão especificados em commits menores quando houver evidência do anterior. A prioridade do produto é a correção da planta e do passeio; visual sofisticado e IA não substituem uma geometria confiável.
