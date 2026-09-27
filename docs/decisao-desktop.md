# Revisão da base: aplicativo instalado

Revisão de 27/09/2026, após a comparação visual feita pelo usuário. **Sweet Home 3D é a referência de profundidade funcional; Floorplanner é a referência de facilidade e apresentação.** CasaFeita deve ser um aplicativo instalado, começando pelo Windows. A interface atual do OpenPlan3D foi rejeitada como direção do produto. Os pacotes selecionados do SweetHomeJS foram incorporados em commit posterior, com origem registrada em [THIRD_PARTY.md](../THIRD_PARTY.md).

## O que cada referência oferece

| Referência | Aproveitamento possível | Limite relevante |
| --- | --- | --- |
| [Sweet Home 3D](https://www.sweethome3d.com/users-guide/) | Fluxo de planta escalada, paredes, portas e janelas, pavimentos, medidas, arrastar móveis, visualização 3D simultânea e arquivo `.sh3d`. O código Java desktop é [GPL v2 ou posterior](https://www.sweethome3d.com/license/). | A interface em quatro painéis e menus extensos não corresponde ao pedido visual. Modernizar toda a camada Swing/Java 3D seria um trabalho grande. |
| [Sweet Home 3D JS oficial](https://sourceforge.net/projects/sweethome3d/files/SweetHome3DJS/) | Editor WebGL oficial que abre e modifica projetos; também GPL. | Os exemplos de servidor usam PHP ou JSP para arquivos, sem autenticação/gestão de projetos. Reempacotar como aplicativo instalado exige substituir esses serviços e reconstruir a apresentação. |
| [SweetHomeJS de njhurst](https://github.com/njhurst/sweethomejs) | Tradução comunitária TypeScript do modelo, controladores, `.sh3d`, desenho 2D e cena Three.js, com pacotes separados da interface React. Pode fornecer o **núcleo funcional** para uma interface CasaFeita nova. | Projeto pequeno, sem histórico amplo de adoção. A interface atual também é datada e seu catálogo embutido contém móveis sem malha 3D, exibidos como caixas. Precisa de correções de build e de uma biblioteca visual própria. Licença GPL v2 ou posterior. |
| [Floorplanner](https://floorplanner.com/personal) | Referência de desenho rápido com escala, edição precisa, 3D imediato, busca visual de móveis e imagens agradáveis. | Serviço proprietário: código, interface e biblioteca de móveis não estão livres para copiar ou redistribuir. Seu [manual do editor](https://cdn.floorplanner.com/static/brochures/FloorplannerManualEN.pdf) serve para observar fluxos, não como fonte de ativos. |
| [OpenPlan3D](https://github.com/laanlabs/openPlan3D) | Algumas ideias ou módulos MIT ainda podem ser avaliados isoladamente. | A interface e a cena não alcançam a qualidade pedida; o passeio atual não tem colisão nem navegação pelo minimapa. **Deixa de ser a base recomendada para o produto.** |

## Escolha de trabalho

1. **Aplicativo Windows primeiro**, com funcionamento local e arquivos exportáveis. Usar Electron, React e TypeScript para obter uma janela instalada e uma interface inteiramente própria sobre um renderizador Chromium consistente. [Electron recomenda Electron Forge](https://www.electronjs.org/docs/latest/tutorial/application-distribution) para empacotamento. O custo é um instalador e uso de memória maiores; medir isso antes de distribuir.
2. **SweetHomeJS como candidato principal para o núcleo**, especialmente modelo da planta, controladores, leitura/escrita `.sh3d` e visualização derivada. Importar somente após corrigir a ordem de build, validar edição e reabertura de arquivo e revisar as dependências. Não publicar a interface original com uma troca superficial de cores.
3. **Construir a experiência CasaFeita** com planta legível e ferramentas contextuais, barra superior central em pílula, lista lateral de cômodos e painel de mobília que abre quando solicitado. O render 3D precisa de materiais, luz, sombras e modelos reais antes de ser apresentado como uma prévia de qualidade.
4. **Separar o passeio da câmera de edição.** WASD, colisão, minimapa com rota, duplo clique para teleporte e velocidade configurável ainda precisam ser desenvolvidos. O fato de Sweet Home 3D ter visita virtual não prova que esses comportamentos já existem no candidato.

Se a integração do núcleo TypeScript falhar na prova de edição 2D → 3D → salvar → reabrir, reavaliar o Sweet Home 3D JS oficial e o custo de um núcleo próprio. Esta condição evita assumir que uma tradução comunitária oferece a mesma estabilidade do programa original.

## Verificação local do candidato SweetHomeJS

Clone temporário de `njhurst/sweethomejs` no commit `b32104f7c978cc7d45064aa44d237ad3eec35309` (05/08/2026), sem arquivos copiados ao CasaFeita. Ambiente: Windows, Node.js 24 e npm 11.

| Checagem | Resultado |
| --- | --- |
| `npm ci` | Concluiu. Auditoria geral indicou cinco avisos em dependências de desenvolvimento; `npm audit --omit=dev --audit-level=high` encontrou zero vulnerabilidades nas dependências de produção. |
| `npm run build` na raiz limpa | **Falhou**: os workspaces `export` e `photo` foram compilados antes de `render2d` e `render3d`. Os pacotes `core`, `render2d`, `render3d`, `export`, `photo`, `ui` e `web` compilaram quando executados em ordem de dependências. O script raiz precisa ser corrigido. |
| `npm test -- --reporter=dot`, após build ordenado | 343 testes passaram; um falhou por criar o caminho Windows inválido `C:\C:\...` em `HomeScene3D.test.ts`. A falha localizada deve ser corrigida e a suíte repetida após integração. |
| Playwright `app-smoke`, `acceptance` e `fileio` | **6 testes de navegador passaram**. Cobrem abertura, desenho de parede, desfazer, carregar `.sh3d` e presença de canvas 3D. Não comprovam a qualidade visual ou a navegação pretendida. |
| Inspeção do catálogo e da interface | O catálogo embutido declara móveis básicos **sem arquivos de modelo ou ícone**. A apresentação atual é utilitária, sem a variedade e o acabamento pedidos. |

Esses resultados tornam o núcleo interessante para uma prova de integração, mas ainda não aprovam um fork integral. A primeira entrega de código deve demonstrar um arquivo real editado e reaberto no aplicativo instalado, com capturas de tela para avaliar a interface no mesmo marco.

## Licenças e mobília

Com a incorporação de código derivado de Sweet Home 3D/SweetHomeJS, o aplicativo e o código correspondente distribuído obedecem **GPL v2 ou posterior**, com avisos de autoria e código fonte disponível. Os documentos originais publicados antes da incorporação preservam MIT em `LICENSE-MIT`. A [página oficial de licenças](https://www.sweethome3d.com/license/) também explica que modelos e texturas podem ter licenças distintas e exigências de atribuição; cada pacote de móveis terá manifesto próprio. O catálogo do Floorplanner não será extraído.

Para começar com modelos reais e redistribuíveis, avaliar [Kenney Furniture Kit](https://kenney.nl/assets/furniture-kit) e [Poly Haven](https://polyhaven.com/license), ambos CC0, e bibliotecas gratuitas do Sweet Home 3D após inventário de autoria. Guardar medidas reais editáveis separadas da aparência da variante; carregar malhas e texturas sob demanda.
