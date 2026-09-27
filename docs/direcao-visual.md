# Direção visual e critérios de experiência

O CasaFeita combina a profundidade de edição do [Sweet Home 3D](https://www.sweethome3d.com/users-guide/) com a facilidade de desenho, precisão e apresentação mostradas pelo [Floorplanner](https://floorplanner.com/personal). A interface é **original**: essas referências orientam tarefas e qualidade, não fornecem componentes, telas ou modelos para copiar.

## Linguagem visual

- Fundo claro e levemente quente (`#F7F6F2`), superfícies brancas, texto grafite (`#202B29`) e acento verde profundo (`#315F50`). Cores de função ficam restritas a seleção, aviso e estado; a planta e os materiais da casa dominam a tela.
- Tipografia de sistema com tamanhos legíveis, hierarquia curta e ícones sempre acompanhados de nome acessível. Raio arredondado consistente nas pílulas, painéis e cartões, sombras discretas e bordas finas. Animação curta para abrir e fechar controles, sem atrasar a edição.
- A área de desenho e o 3D ocupam a maior parte da janela. O usuário encontra as ações principais em um olhar; propriedades detalhadas surgem ao selecionar um elemento. Nenhum menu permanente cobre o projeto.

## Janela e estados

| Estado | Elementos persistentes | Elementos abertos sob demanda |
| --- | --- | --- |
| **Planta** | Nome do projeto; pílula central **Planta / Passear / Mobiliar**; pequeno conjunto lateral de ferramentas de desenho; escala e desfazer/refazer. | Inspetor de parede, porta, janela, cômodo ou pavimento; lista de projetos e importação. Medidas aparecem no desenho enquanto se move ou edita. |
| **Passear** | Cena 3D em tela cheia, pílula central recolhida, minimapa, pílula vertical de cômodos. | Velocidade, altura dos olhos e outras opções em painel pequeno. Mensagens de rota inválida aparecem junto ao destino. |
| **Mobiliar** | Planta ou 3D com o mesmo projeto, busca e categorias em painel que recolhe. | Cartão da peça selecionada com imagem, dimensões, variantes e materiais; controles de mover, girar, duplicar e excluir. |

A pílula central fechada mostra modo atual e seta de expansão. Aberta, contém apenas os três modos. Uma pílula lateral secundária reúne projeto, importação, exportação e preferências. A pílula vertical de cômodos só mostra nomes válidos e rola quando necessário. Em janelas estreitas, os rótulos cabem em um painel expansível; funções continuam acessíveis por teclado.

## Qualidade da planta

- Paredes escuras e nítidas, áreas de piso suaves, portas com giro compreensível e janelas distintas. A seleção usa cor de acento e alças pequenas; não altera a cor definitiva da construção.
- Encaixe em cantos, alinhamento, grade opcional e entrada de medida exata. Cada mudança atualiza área do cômodo, aberturas e 3D. Zoom e pan não trocam a ferramenta ativa inesperadamente.
- Importação de imagem com escala calibrada por distância conhecida. A imagem fica sob a planta, com opacidade ajustável e indicação visível do que é estimativa.
- Prévia 3D vazia imediatamente após desenhar a estrutura. A transição para mobília é explícita, para não esconder problemas da planta sob objetos decorativos.

## Qualidade do 3D e da mobília

A vista principal precisa ter materiais coerentes, luz e sombra suaves, proporções corretas, resolução adequada à janela e controles suaves. **Caixas cinzas e modelos sem textura são marcadores de desenvolvimento, não o acabamento do produto.** Ajustes de material e luz não podem alterar as medidas do projeto.

O catálogo abre em cartões com miniaturas de objetos reais e filtros por cômodo, categoria e dimensão. Começa com peças essenciais bem acabadas e cresce por pacotes opcionais carregados sob demanda. Cada peça informa largura, profundidade e altura padrão e permite corrigir as dimensões no projeto. Variantes visuais não mudam essas medidas sem aviso. Um manifesto mantém licença, autor, origem e arquivo de cada modelo; as [bibliotecas gratuitas do Sweet Home 3D](https://www.sweethome3d.com/freeModels.jsp) exigem revisão por item.

## Critérios para avaliar a primeira interface

1. Em uma janela de 1440 × 900, desenhar dois cômodos, editar uma medida, inserir porta e janela, dar nome aos cômodos e abrir o 3D sem procurar comandos em menus extensos.
2. Abrir um projeto `.sh3d`, alterar uma parede, salvar, fechar e reabrir com a geometria e as medidas preservadas.
3. Colocar sofá, cama e mesa com modelos reais; verificar dimensões em 2D e proporções em 3D. O catálogo não oferece uma peça sem indicar tamanho e procedência do ativo.
4. Capturar as vistas Planta, Passear e Mobiliar no aplicativo Windows para revisão de legibilidade, espaços vazios, contraste, textura e qualidade da cena. A captura acompanha um teste funcional, não serve para mascarar uma tela estática.
5. No passeio, clicar no minimapa para caminhar, dar duplo clique para mudar de lugar e usar a pílula de cômodos; cada deslocamento respeita paredes e móveis.
