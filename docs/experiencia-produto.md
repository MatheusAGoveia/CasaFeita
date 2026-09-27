# Experiência do CasaFeita

Esta especificação traduz os pedidos de interface, planta, passeio e mobília em comportamentos observáveis. É uma proposta para a primeira implementação, não uma descrição de funcionalidades já entregues.

**Plataforma:** aplicativo instalado, Windows primeiro. A [direção visual](direcao-visual.md) define o acabamento inspirado pela facilidade do Floorplanner e a [decisão de base](decisao-desktop.md) registra o núcleo funcional próximo do Sweet Home 3D.

## Estrutura visual

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                      [ Projeto · Planta | Passear | Mobiliar ]          │
│                                                                          │
│ [ações]                                                       [cômodos] │
│                                                              [  Sala  ] │
│                        PLANTA OU 3D                         [ Cozinha ] │
│                                                              [ Quarto ] │
│                                                                          │
│ [ minimapa / planta clicável ]                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

O desenho usa o visor como área principal, especialmente no 3D. A barra horizontal central no alto tem formato de pílula. Fechada, mostra apenas o modo atual e o comando de abrir; aberta, oferece **Planta**, **Passear** e **Mobiliar**. Uma pílula pequena lateral reúne ações menos frequentes, como importar, exportar, histórico e configurações. Outra pílula vertical lista os cômodos quando há espaço; pode recolher para um ícone. Painéis contextuais aparecem somente quando o usuário seleciona uma parede, abertura ou móvel.

No editor de planta, a ferramenta atual e uma dica curta ficam visíveis; medidas e pontos de encaixe aparecem no próprio desenho. No passeio, a interface recua visualmente para que a casa ocupe quase toda a tela. O minimapa permanece acessível, com opção de reduzir seu tamanho ou ocultá-lo. Todos os controles têm nome e foco de teclado; o visual compacto não elimina o caminho de acesso a ações importantes.

## Fluxo de criação

1. Escolher **Projeto em branco**, **Importar planta/imagem** ou **Descrever ideia**. Foto de terreno e captura de rabisco serão entradas próprias quando a assistência estiver pronta.
2. Se houver imagem, fixá-la como referência. Para atribuir escala, indicar uma distância conhecida entre dois pontos; sem essa distância, medidas ficam explicitamente marcadas como estimadas.
3. Editar a planta: desenhar/mover paredes, portas e janelas; ajustar dimensões e nomes de cômodos; ver áreas calculadas; desfazer/refazer.
4. Abrir 3D com a estrutura **vazia** para conferir espaços e circulação.
5. Entrar no passeio ou voltar à planta a qualquer momento. Depois, ativar **Mobiliar** e aplicar materiais/cores.
6. Salvar localmente e exportar o projeto editável. O limite inicial é de três projetos na biblioteca do aplicativo; importar um quarto exige liberar um espaço, sem apagar automaticamente nenhum projeto.

## Passeio e minimapa

| Ação | Resultado esperado |
| --- | --- |
| Clique único em ponto livre do minimapa | Traça rota válida e caminha até o destino à velocidade configurada; a câmera permanece à altura de uma pessoa. |
| Clique duplo em ponto livre | Muda de lugar imediatamente, com transição visual curta opcional; nunca coloca a câmera dentro de uma parede ou móvel sólido. |
| Clique em um cômodo da pílula vertical | Caminha até um ponto livre daquele cômodo pela mesma lógica do minimapa. |
| Clique duplo em cômodo | Vai imediatamente ao ponto livre do cômodo. |
| WASD | Movimenta a pessoa; interrompe a rota automática se ela estiver ativa. |
| Mouse | Olha ao redor ao entrar no modo de captura do ponteiro; `Esc` libera o ponteiro e fecha o passeio quando apropriado. |
| Ponto inacessível | Mostra um aviso curto e mantém a posição atual. |

Clique único e duplo precisam ser distinguidos por uma pequena janela de tempo: só iniciar a rota após saber que não houve segundo clique. O destino é validado no espaço caminhável, com margem para a largura da pessoa. Portas fechadas, paredes, desníveis e móveis que bloqueiam passagem entram no cálculo. A rota é cancelada ou recalculada quando a planta muda. A pessoa não deve atravessar uma parede durante o percurso nem no teleporte.

Configurações do passeio: velocidade normal (proposta inicial 1,3 m/s), velocidade rápida, sensibilidade do mouse, altura dos olhos, transição do teleporte e exibição do minimapa. Não usar uma velocidade fixa na animação independente da taxa de quadros. Em ambientes pequenos, oferecer também navegação pelo teclado e por lista de cômodos a quem não utiliza mouse.

## Montagem da planta

A planta deve permanecer o centro do produto: paredes conectadas, espessura e altura reais, aberturas ancoradas nas paredes, medidas editáveis, áreas derivadas de polígonos fechados e histórico de alterações. Mover uma parede deve atualizar o cômodo, o piso 3D, os pontos de navegação e o minimapa. Se a edição abrir um cômodo, a área não deve continuar mostrando um número antigo.

Ao importar uma foto ou desenho, permitir traçar paredes sobre a imagem com encaixe em cantos e guias. Propostas automáticas entram como sugestões selecionáveis, e o usuário corrige cada parte. Exibir medidas incertas como **estimativa**, com a referência usada no cálculo. O usuário pode fixar elementos reais do terreno para que propostas posteriores os preservem.

## Modo mobiliar

O catálogo começa com categorias reconhecíveis: estar, quarto, cozinha, banheiro, jantar, trabalho e decoração. A busca aparece na mesma pílula, sem ocupar continuamente uma barra grande. Um item tem miniatura 2D leve, dimensões padrão, variantes de modelo e materiais. O primeiro conjunto prioriza as peças essenciais; pacotes adicionais ampliam a variedade sem aumentar o carregamento inicial.

Ao colocar um móvel, mostrar a dimensão no piso e uma prévia antes de confirmar. Permitir mover, girar, duplicar, excluir, trocar cor/material e ajustar dimensões quando o objeto permitir. Mostrar colisão com paredes e uma faixa de circulação recomendada como aviso editável, sem impedir experimentação. O mesmo móvel deve aparecer na planta superior e no passeio. A navegação deve reagir a móveis sólidos adicionados ou movidos.

Padrões são **pontos de partida**, não promessa de medidas comerciais exatas. O projeto guarda as dimensões efetivamente escolhidas, independentemente da variante visual, para que trocar o modelo não altere silenciosamente o espaço ocupado. Cada modelo distribuído terá origem e licença registradas; modelos sem arquivo 3D válido usam representação simples até o ativo carregar.
