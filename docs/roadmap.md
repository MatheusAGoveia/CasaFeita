# Roadmap incremental

Cada marco é pequeno o suficiente para ser revisado separadamente. Os commits devem descrever uma mudança verificável; o título de um marco não autoriza pular os critérios dos anteriores.

| Marco | Entrega | Evidência de aceite |
| --- | --- | --- |
| 0. Pesquisa | Visão, comparação de bases, arquitetura, referências Sweet Home 3D/Floorplanner e licenças | Documentos publicados; candidato funcional, limites e direção visual explícitos. |
| 1. Aplicativo editável | Empacotar a primeira janela Windows; integrar apenas o núcleo escolhido com origem e GPL; corrigir o build; oferecer projeto local e arquivo `.sh3d` | Criar planta com dois cômodos, portas e medidas; salvar, fechar, reabrir e editar sem perder dados; build e teste no aplicativo. |
| 2. Interface e 2D → 3D | Criar interface CasaFeita com pílulas e ferramentas contextuais; conectar a planta à cena 3D vazia; aprimorar materiais, luz e sombras | Mudar parede/porta e ver resultado coerente em 2D/3D; captura de tela legível e de acabamento consistente em 1440 × 900. |
| 3. Mobiliar | Catálogo inicial com modelos 3D reais, medidas padrão editáveis, variantes e licenças registradas | Inserir, mover, girar, duplicar, dimensionar e remover peças; salvar/reabrir mantendo dimensões e aparência. |
| 4. Passeio | WASD, mouse, colisão, gravidade/escadas, câmera na altura correta e obstáculos de mobília | Caminhar por portas sem atravessar paredes nem móveis; velocidade estável em taxas de quadros distintas. |
| 5. Navegação por planta | Minimap clicável, rota a pé, clique duplo instantâneo, pílula vertical de cômodos e ajustes de velocidade | Chegar a cômodo acessível sem atravessar obstáculos; destino inválido é rejeitado; rota pode ser interrompida. |
| 6. Referência real | Importar foto/planta/rabisco como camada, calibrar escala e traçar entidades editáveis | Reabrir o projeto e encontrar foto, escala, paredes e incertezas preservadas. |
| 7. Assistência de IA | Propor entidades e alterações com procedência, confiança e revisão humana | Um conjunto de imagens de teste mostra o que foi preservado, inferido e corrigido; nenhuma foto vira geometria falsamente precisa. |
| 8. Personalização e intercâmbio | Materiais, iluminação, GLB de móveis, exportação mais ampla e eventual render externo | Projeto continua editável, rápido para abrir e utilizável sem serviço pago obrigatório. |

Atualização de 28/09/2026: o editor Windows, a interface 2D/3D, o catálogo inicial de 16 modelos e a primeira versão do passeio com minimapa foram implementados em commits separados. O marco de mobília ainda precisa de variantes e duplicação; o passeio ainda precisa de tratamento de escadas e níveis. A biblioteca gerenciada de até três projetos ainda precisa ser criada. As capturas e comandos de teste estão no [README](../README.md).

## Ordem dos primeiros commits de código

1. Registrar a correção de direção e as provas locais do candidato SweetHomeJS.
2. Incorporar apenas os pacotes necessários, com versão exata, licença GPL, atribuições e script de build em ordem de dependência; validar desenho e reabertura de `.sh3d`.
3. Criar a janela Windows e salvar arquivos locais; limitar a biblioteca gerenciada a três projetos, preservando exportação.
4. Implementar a pílula superior, as ferramentas de planta e os painéis contextuais com uma vista 3D de qualidade suficiente para revisão visual.
5. Incluir o primeiro pacote de móveis com modelos reais e licença rastreável; depois implementar passeio, colisão e navegação por clique.

Os marcos posteriores serão detalhados em commits menores conforme o editor instalado for validado. Planta precisa, cena agradável, mobília útil e passeio confiável são requisitos de produto desde o início; as entregas os tornam verificáveis em sequência.
