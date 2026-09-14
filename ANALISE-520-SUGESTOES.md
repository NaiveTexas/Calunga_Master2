# Auditoria das 520 sugestões do Calunga

Data: 12-09-2026. Base: texto anexado e código local desta sessão. A aplicação não foi alterada para esta análise; foi criado apenas este relatório.

## Resultado e critérios

| Estado | Quantidade | Significado |
|---|---:|---|
| Implementado | 28 | Fluxo correspondente presente no escopo atual. As limitações relevantes constam em cada linha. |
| Parcial | 93 | Existe código ou uma parte utilizável, mas falta parte explícita do item. Não significa tarefa sendo executada agora. |
| Pausado | 5 | Base/protótipo relacionado ao GRAMET, em standby por orientação do usuário. |
| Não iniciado | 394 | Não encontrei implementação da função pedida. Pode existir apenas dado, placeholder ou recurso adjacente. |
| Total | 520 | IDs originais preservados, sem contar novamente a lista final das 15 prioridades. |

Não há implementação ativa nesta rodada: ela é uma análise. Portanto, “em andamento” deve ser lido como **parcialmente implementado**, e não como promessa de conclusão automática. O GRAMET é explicitamente pausado.

Os números não medem a conclusão percentual do produto. Uma sugestão pode ser um botão ou um sistema inteiro, e há duplicações entre Meteorologia, Aeródromos, Alternados, Briefing e Offline. “Implementado” não significa homologado, aprovado operacionalmente ou validado em celular.

Prioridades: **P0 — base** consolida o que já usamos; **P1 — próximo** tem valor depois da base/dependências; **P2 — futuro** é condicional ou tem custo maior que o benefício imediato; **Fora do foco** é o conjunto em voo. P0/P1 não são autorização para implementar tudo de uma vez.

## O que já está funcionando

- Missão com várias pernas; aeronave/tripulação compartilhadas, partida seguinte uma hora após o ETA arredondado a cinco minutos e ajustes manuais preservados.
- Editor de pontos com autocomplete, Enter/Tab, reordenação e remoção; mapa com trechos e distâncias.
- Cards por perna em ROTA, Combustível, Peso, Dashboard e Meteorologia.
- Aeródromo intermediário com velocidade/nível após o ponto e procedimento opcional; referência explícita SBFZ–FLZ. Não há seleção genérica de VOR por proximidade nem NEISOP automático.
- Consumo por perna, saldo no pouso e abastecimento nas escalas; carga/passageiros independentes por perna.
- METAR/TAF originais pela REDEMET e ENRC LOW/HIGH via geosserviços.

Algumas dessas entregas não têm um item exato na lista, ou aparecem agrupadas num requisito mais amplo classificado como parcial.

## Lacunas importantes que a lista pode esconder

1. **Não há salvamento de missão.** O estado está em memória. A existência de um arquivo SQLite não comprova persistência: não há fluxo conectado de salvar/carregar missões.
2. **Peso não é balanceamento.** Há massas de decolagem/pouso, mas não há braços, momentos, estações e envelope de CG.
3. **Limite cadastrado não é alerta.** maxTakeoffWeight/maxLandingWeight constam de alguns modelos, mas não são comparados na interface. Alguns modelos têm dados zerados/ausentes.
4. **Botões de unidade não fazem conversão.** LB/KG/L mudam a preferência visual, enquanto números/controles de combustível seguem LB. Isso deve ser corrigido antes de ampliar as análises.
5. **Texto DCT não é item 15 completo.** Há mudanças NxxxxFxxx para aeródromos intermediários, mas faltam parser, aerovias, regras e validação contextual.
6. **NOTAM não existe no backend atual.** O uso de WFS/WMS AISWEB não é uma integração de NOTAM.
7. **Briefing HTML ainda usa a perna selecionada.** Dashboard/Meteorologia/Peso já são por todas as pernas; o briefing textual separado ainda precisa consolidação.
8. **Cache em memória não é offline.** Não há service worker, download de missão ou preservação local das consultas.
9. **O backup feito na conversa foi da pasta do projeto.** Não é a funcionalidade de backup de missões do aplicativo.
10. **O aplicativo depende de localhost:3000.** Falta configuração de implantação, build/caminhos e backend público para uso independente pelo celular.

## Sequência recomendada

| Ordem | Entrega | IDs relacionados | Resultado esperado |
|---|---|---|---|
| 1 | Salvar e recuperar a missão | 5, 24, 434; depois 3–4 | Rascunho local, recuperação ao abrir e arquivo JSON versionado; primeiro eliminar perda ao recarregar. |
| 2 | Integridade dos cálculos e unidades | 204, 211, 217, 241–243, 247, 399, 443–453 | Conversão real LB/KG/L ou restringir a LB; parâmetros com origem; alertas de peso/combustível e entradas inválidas. |
| 3 | Fechar o resumo da missão | 35, 199–202, 339, 348, 365, 369 | Totais da missão, indicação do que falta por perna, navlog e briefing com todas as etapas. |
| 4 | Uso pelo celular e publicação | 402–403, 413, 435; implantação não está bem representada na lista | Remover dependência de localhost, preparar build/HTTPS/backend online e testar toque/rolagem em aparelho real. |
| 5 | Meteorologia com validade explícita | 160–161, 185, 189, 424–426 | Mostrar emissão/idade, TAF relacionado ao ETA e instantâneo consultado. |
| 6 | NOTAM oficial básico | 122–128, 138, 142–144; parte de 154 | Obter/testar acesso AISWEB; mensagem integral, aeródromos por perna, validade e filtro temporal conservador. |
| 7 | Relatório PDF da missão | 365–385, sobretudo 369, 381–384 | Consolidar rota, horários, combustível, pesos, meteorologia e NOTAM com data/fonte; relatório deve indicar ausências. |
| 8 | Editor textual e item 15 | 23, 61–71, 76, 81 | Começar por copiar e importar a sintaxe que já geramos; depois aerovias e validações. Sem alterações silenciosas. |
| 9 | Cartas com validade e cache | 85, 88–90, 93–94, 111, 117 | Conferir orientação, enquadrar rota/perna e registrar edição; cache persistente só com política de atualização. |
| 10 | Ficha de aeródromo e alternados | 291–308, 315, 319–330 | Concentrar pista, frequência, serviços, cartas, meteorologia e NOTAM; comparar candidatos sem declarar aptidão sem dados. |
| 11 | Checklist enxuto | 337–350 | Cobrir os módulos realmente existentes; estados pendente/conferido sem criar uma aprovação fictícia. |
| 12 | W&B completo e desempenho | 232–244, 247, 260–290 | Projeto próprio, condicionado a estações/braços/envelopes/manuais e casos aprovados; não tratar os números atuais como CG/desempenho. |

Eu manteria GRAMET em standby. Colaboração, governança institucional, otimização automática, treinamento extensivo e recursos 501–520 não são prioridade do planejador pessoal atual. Alguns requisitos ★, como justificativa obrigatória para NOTAM não aplicável (#140), permissões institucionais (#248/#458) e FRAT completo (#351–364), só devem entrar com uma necessidade concreta de operação/equipe.

O parser temporal de NOTAM não pode ficar inteiramente para o futuro: #126 depende de interpretar corretamente os períodos e parte de #154. Casos ambíguos devem continuar visíveis. Filtro explícito e opção de mostrar todos conciliam #126 com #138.

## Evidência e validação

- Inspeção de modelos, motores de rota/horários/combustível/peso, painéis, cartografia, serviços e endpoints do backend.
- Frontend: `npm.cmd test` — 7 testes passaram.
- Backend: `npm.cmd test` em `backend` — 7 testes passaram; respostas externas são simuladas nos testes.
- Esses testes verificam regressões e comportamento implementado, não validam performance de aeronaves contra manuais nem a disponibilidade atual de todos os provedores.
- Nenhum ensaio visual em iPhone/navegador foi concluído nesta análise.
- A [página oficial da API AISWEB](https://aisweb.decea.mil.br/?i=publicacoes&p=api) confirma NOTAM via API e necessidade de chave. Não confirmei nesta rodada os detalhes de autenticação `apiKey/apiPass` citados no texto anexado; validar no acesso/documentação antes de implementar.
- A [documentação oficial da REDEMET](https://ajuda.decea.mil.br/base-de-conhecimento/api-redemet-o-que-e/) lista produtos que permitem ampliar a integração. O código atual consulta METAR/TAF; a mera disponibilidade de um produto na API não significa que o Calunga o utiliza.

## Matriz completa

### Missões — itens 1–25

Base inspecionada: [js/models/missions.js](js/models/missions.js), [js/models/missionLegs.js](js/models/missionLegs.js), [js/core/missionEngine.js](js/core/missionEngine.js).

| ID | Sugestão original | Estado | Prioridade | Evidência ou lacuna |
|---:|---|---|---|---|
| 1 | Missões com várias pernas: `SBNT → SBSV → SBGL`. | Implementado | Manter | Lista de pernas com inclusão, seleção, remoção e horários encadeados. |
| 2 | Reaproveitar aeronave, tripulação e configuração entre pernas. | Implementado | Manter | Aeronave e tripulação compartilhadas; nível e carga copiados como valores iniciais entre pernas. |
| 3 | Duplicar uma missão anterior. | Não iniciado | P1 — próximo | Requer primeiro persistência de missões; hoje não existe missão anterior salva para duplicar. |
| 4 | Criar missão a partir de um modelo. | Não iniciado | P1 — próximo | Não há persistência nem gestão de missões; o estado atual vive em memória. |
| 5 | Salvar missão como rascunho. | Não iniciado | P0 — base | Estado fica em memória; criar persistência/recuperação é a prioridade principal. |
| 6 | Estados: rascunho, planejada, revisada, aprovada, executada e cancelada. | Não iniciado | P2 — futuro | Não há persistência nem gestão de missões; o estado atual vive em memória. |
| 7 | Número ou código interno da missão. | Não iniciado | P1 — próximo | Não há persistência nem gestão de missões; o estado atual vive em memória. |
| 8 | Nome informal: “Apoio Falcão”, “Translado”, “Adestramento”. | Não iniciado | P1 — próximo | Não há persistência nem gestão de missões; o estado atual vive em memória. |
| 9 | Tipo de missão: transporte, instrução, logística, EVAM, translado etc. | Não iniciado | P1 — próximo | Não há persistência nem gestão de missões; o estado atual vive em memória. |
| 10 | Unidade apoiada. | Não iniciado | P1 — próximo | Não há persistência nem gestão de missões; o estado atual vive em memória. |
| 11 | Data e horários locais/Zulu. | Parcial | P1 — próximo | UTC e datas dd-mm-yyyy implementados; sem alternância de horário local/fuso. |
| 12 | Aeródromo de saída, destino e alternados por perna. | Parcial | P1 — próximo | Origem, destino e um alternado por perna; não há múltiplos alternados. |
| 13 | Hora prevista de acionamento, decolagem e corte. | Parcial | P1 — próximo | ETD/ETA e intervalo de solo automáticos; sem acionamento e corte. |
| 14 | Observações gerais da missão. | Não iniciado | P1 — próximo | Não há persistência nem gestão de missões; o estado atual vive em memória. |
| 15 | Tags para pesquisar missões. | Não iniciado | P2 — futuro | Não há persistência nem gestão de missões; o estado atual vive em memória. |
| 16 | Favoritar missões recorrentes. | Não iniciado | P1 — próximo | Não há persistência nem gestão de missões; o estado atual vive em memória. |
| 17 | Histórico de alterações. | Não iniciado | P1 — próximo | Não há persistência nem gestão de missões; o estado atual vive em memória. |
| 18 | Comparar duas versões do planejamento. | Não iniciado | P1 — próximo | Não há persistência nem gestão de missões; o estado atual vive em memória. |
| 19 | Arquivar missões encerradas. | Não iniciado | P1 — próximo | Não há persistência nem gestão de missões; o estado atual vive em memória. |
| 20 | Linha do tempo completa da missão. | Parcial | P1 — próximo | Datas/ETD/ETA dos cards formam uma sequência; não existe visualização de linha do tempo. |
| 21 | Missão “ida e volta” criada automaticamente. | Não iniciado | P1 — próximo | Não há persistência nem gestão de missões; o estado atual vive em memória. |
| 22 | Missões recorrentes. | Não iniciado | P2 — futuro | Não há persistência nem gestão de missões; o estado atual vive em memória. |
| 23 | Importação de rota textual. | Não iniciado | P1 — próximo | Hoje só gera texto; importação exige parser e resolução dos identificadores. |
| 24 | Exportação e importação de arquivo próprio do Calunga. | Não iniciado | P0 — base | JSON versionado de missão é um caminho simples para salvar, compartilhar e recuperar. |
| 25 | Planejamento colaborativo entre pilotos e operações. | Não iniciado | P2 — futuro | Não há persistência nem gestão de missões; o estado atual vive em memória. |

### Rota — itens 26–60

Base inspecionada: [js/ui/routePanel.js](js/ui/routePanel.js), [js/core/routePlanning.js](js/core/routePlanning.js), [map/mission/routeLayer.js](map/mission/routeLayer.js).

| ID | Sugestão original | Estado | Prioridade | Evidência ou lacuna |
|---:|---|---|---|---|
| 26 | Adicionar fixos digitando o identificador. | Implementado | Manter | Busca de identificadores, Enter e dois Tabs para inclusão sequencial. |
| 27 | Adicionar fixos clicando no mapa. | Não iniciado | P1 — próximo | Mapa não possui interação de clique para adicionar ponto; edição ocorre no painel. |
| 28 | Arrastar um trecho da rota para inserir um ponto. | Não iniciado | P2 — futuro | Não há interação de arrastar segmento no mapa; Sortable atua apenas na lista. |
| 29 | Reordenar pontos. | Implementado | Manter | Reordenação com Sortable; recálculo após mover o ponto. |
| 30 | Remover pontos individualmente. | Implementado | Manter | Remoção individual de pontos na perna. |
| 31 | Inserir um ponto entre dois existentes. | Parcial | P1 — próximo | É possível acrescentar ao final e arrastar para o meio; falta inserir diretamente entre pontos. |
| 32 | Autocomplete de aeródromos, fixos e auxílios. | Parcial | P1 — próximo | Autocomplete de aeródromos, fixos e VOR; sem fonte específica de NDB. |
| 33 | Diferenciar visualmente aeródromo, fixo, NDB, VOR e coordenada. | Parcial | P1 — próximo | Estilos diferentes para aeroportos/fixos/VOR e estilos previstos para NDB/pontos; sem entrada completa de NDB/coordenadas. |
| 34 | Mostrar distância e rumo de cada trecho no mapa. | Implementado | Manter | Mapa mostra distância em NM e rumo verdadeiro por segmento; não é rumo magnético. |
| 35 | Distância total da perna e da missão. | Parcial | P0 — base | Distância por perna e destino–alternativa implementada; falta total consolidado da missão. |
| 36 | Curso verdadeiro e magnético. | Parcial | P1 — próximo | Cálculo/desenho de rumo verdadeiro; sem aplicação de declinação magnética. |
| 37 | Variação magnética aplicada e sua data de referência. | Não iniciado | P1 — próximo | Sem modelo/serviço de declinação e data de referência. |
| 38 | Detectar fixo inexistente ou digitado incorretamente. | Parcial | P0 — base | Busca restringe a seleção aos dados carregados; sem diagnóstico explícito de identificador inválido. |
| 39 | Identificar pontos homônimos. | Parcial | P1 — próximo | Resultados podem apresentar identificadores repetidos; falta desambiguação por região/posição. |
| 40 | Mostrar qual FIR/TMA cada trecho atravessa. | Não iniciado | P1 — próximo | Não há interseção espacial de rota com FIR/TMA. |
| 41 | Mostrar aerovias disponíveis no ponto selecionado. | Não iniciado | P2 — futuro | Editor atual é uma lista de pontos DCT; não encontrei esta interação/análise de rota. |
| 42 | Sugerir ligação possível entre dois pontos por rota ATS. | Não iniciado | P2 — futuro | Editor atual é uma lista de pontos DCT; não encontrei esta interação/análise de rota. |
| 43 | Alternar trecho entre `DCT` e aerovia. | Não iniciado | P1 — próximo | Todas as ligações atuais são DCT; não há seleção de aerovia. |
| 44 | Representar visualmente trechos DCT. | Implementado | Manter | Segmentos diretos desenhados no mapa; perna selecionada destacada. |
| 45 | Mostrar pontos intermediários de uma aerovia sem incluí-los no item 15. | Não iniciado | P2 — futuro | Editor atual é uma lista de pontos DCT; não encontrei esta interação/análise de rota. |
| 46 | Detectar descontinuidade na rota. | Não iniciado | P0 — base | Pode editar origem seguinte manualmente; falta avisar quebra de continuidade entre pernas. |
| 47 | Avisar quando uma aerovia não conecta os dois fixos indicados. | Não iniciado | P2 — futuro | Editor atual é uma lista de pontos DCT; não encontrei esta interação/análise de rota. |
| 48 | Avisar quando o sentido ou nível não é compatível com a rota. | Não iniciado | P1 — próximo | Nível está manual; não existe validação NEISOP, de sentido de aerovia ou de mínimos. |
| 49 | Inserir coordenadas em diferentes formatos. | Não iniciado | P1 — próximo | Editor atual é uma lista de pontos DCT; não encontrei esta interação/análise de rota. |
| 50 | Criar waypoint personalizado. | Não iniciado | P1 — próximo | Editor atual é uma lista de pontos DCT; não encontrei esta interação/análise de rota. |
| 51 | Fixar waypoint operacional recorrente. | Não iniciado | P2 — futuro | Editor atual é uma lista de pontos DCT; não encontrei esta interação/análise de rota. |
| 52 | Medidor livre de distância e rumo. | Não iniciado | P1 — próximo | Editor atual é uma lista de pontos DCT; não encontrei esta interação/análise de rota. |
| 53 | Rota ortodrômica versus loxodrômica. | Não iniciado | P2 — futuro | Editor atual é uma lista de pontos DCT; não encontrei esta interação/análise de rota. |
| 54 | Comparar duas rotas lado a lado. | Não iniciado | P2 — futuro | Editor atual é uma lista de pontos DCT; não encontrei esta interação/análise de rota. |
| 55 | Mostrar diferença de distância, tempo e combustível entre alternativas. | Não iniciado | P1 — próximo | Editor atual é uma lista de pontos DCT; não encontrei esta interação/análise de rota. |
| 56 | Sugerir aeródromos próximos ao longo da rota. | Não iniciado | P1 — próximo | Editor atual é uma lista de pontos DCT; não encontrei esta interação/análise de rota. |
| 57 | Destacar trechos sobre água ou região remota. | Não iniciado | P2 — futuro | Editor atual é uma lista de pontos DCT; não encontrei esta interação/análise de rota. |
| 58 | Detectar cruzamento de áreas condicionadas. | Não iniciado | P1 — próximo | Editor atual é uma lista de pontos DCT; não encontrei esta interação/análise de rota. |
| 59 | Aplicar largura de corredor configurável à rota. | Não iniciado | P1 — próximo | Editor atual é uma lista de pontos DCT; não encontrei esta interação/análise de rota. |
| 60 | Otimização de rota considerando vento, espaço aéreo e combustível. | Não iniciado | P2 — futuro | Editor atual é uma lista de pontos DCT; não encontrei esta interação/análise de rota. |

### Item 15 — itens 61–83

Base inspecionada: [js/core/routePlanning.js](js/core/routePlanning.js), [js/ui/dashboardPanel.js](js/ui/dashboardPanel.js).

| ID | Sugestão original | Estado | Prioridade | Evidência ou lacuna |
|---:|---|---|---|---|
| 61 | Gerar automaticamente o item 15 a partir do mapa. | Parcial | P1 — próximo | Gera texto DCT e alterações NxxxxFxxx; não produz/valida o item 15 completo com todas as sintaxes. |
| 62 | Inserir `DCT` entre trechos realmente diretos. | Implementado | Manter | Texto atual intercala DCT entre os pontos; todas as ligações implementadas são diretas. |
| 63 | Colocar `DCT` inicial e final quando aplicável. | Implementado | Manter | DCT inicial e final presentes no formato direto atual; suporte a aerovias é outro item. |
| 64 | Inserir designador de aerovia entre entrada e saída. | Não iniciado | P1 — próximo | Há formatação DCT/NxxxxFxxx, mas não parser/validador completo de item 15. |
| 65 | Não repetir todos os fixos intermediários da aerovia. | Não iniciado | P1 — próximo | Há formatação DCT/NxxxxFxxx, mas não parser/validador completo de item 15. |
| 66 | Interpretar item 15 colado pelo usuário. | Não iniciado | P1 — próximo | Há formatação DCT/NxxxxFxxx, mas não parser/validador completo de item 15. |
| 67 | Converter texto do item 15 em rota gráfica. | Não iniciado | P1 — próximo | Há formatação DCT/NxxxxFxxx, mas não parser/validador completo de item 15. |
| 68 | Destacar exatamente onde existe erro de sintaxe. | Não iniciado | P1 — próximo | Há formatação DCT/NxxxxFxxx, mas não parser/validador completo de item 15. |
| 69 | Detectar `DCT DCT`, aerovia sem ponto de saída e outros erros. | Não iniciado | P1 — próximo | Há formatação DCT/NxxxxFxxx, mas não parser/validador completo de item 15. |
| 70 | Validar mudanças de velocidade e nível. | Parcial | P1 — próximo | Velocidade e nível editáveis em aeródromos intermediários; checagem numérica básica, sem validação operacional/NEISOP. |
| 71 | Suportar notações `NxxxxFxxx` e equivalentes. | Parcial | P1 — próximo | Saída NxxxxFxxx implementada; sem equivalentes, parser ou mudanças arbitrárias por qualquer fixo. |
| 72 | Validar mudança de regra de voo. | Não iniciado | P2 — futuro | Há formatação DCT/NxxxxFxxx, mas não parser/validador completo de item 15. |
| 73 | Validar pontos por coordenadas. | Não iniciado | P1 — próximo | Há formatação DCT/NxxxxFxxx, mas não parser/validador completo de item 15. |
| 74 | Explicar cada elemento ao tocar nele. | Não iniciado | P1 — próximo | Há formatação DCT/NxxxxFxxx, mas não parser/validador completo de item 15. |
| 75 | Mostrar tradução operacional da rota. | Não iniciado | P1 — próximo | Há formatação DCT/NxxxxFxxx, mas não parser/validador completo de item 15. |
| 76 | Botão para copiar o item 15. | Não iniciado | P0 — base | Texto pode ser selecionado manualmente; não há botão específico de copiar. |
| 77 | Histórico das versões do item 15. | Não iniciado | P2 — futuro | Há formatação DCT/NxxxxFxxx, mas não parser/validador completo de item 15. |
| 78 | Gerar os demais campos do FPL. | Não iniciado | P2 — futuro | Há formatação DCT/NxxxxFxxx, mas não parser/validador completo de item 15. |
| 79 | Pré-visualização da mensagem FPL completa. | Não iniciado | P2 — futuro | Há formatação DCT/NxxxxFxxx, mas não parser/validador completo de item 15. |
| 80 | Checklist antes de copiar ou transmitir. | Não iniciado | P1 — próximo | Há formatação DCT/NxxxxFxxx, mas não parser/validador completo de item 15. |
| 81 | Mostrar diferenças entre rota planejada e rota textual. | Não iniciado | P1 — próximo | Há formatação DCT/NxxxxFxxx, mas não parser/validador completo de item 15. |
| 82 | Validar rotas preferenciais publicadas pelo DECEA. | Não iniciado | P2 — futuro | Há formatação DCT/NxxxxFxxx, mas não parser/validador completo de item 15. |
| 83 | Sugerir correção automática sem alterar silenciosamente o plano. | Não iniciado | P1 — próximo | Há formatação DCT/NxxxxFxxx, mas não parser/validador completo de item 15. |

### Cartografia — itens 84–121

Base inspecionada: [map/enrc/enrcLayer.js](map/enrc/enrcLayer.js), [map/enrc/enrcIndex.js](map/enrc/enrcIndex.js), [map/engine/openLayersMap.js](map/engine/openLayersMap.js).

| ID | Sugestão original | Estado | Prioridade | Evidência ou lacuna |
|---:|---|---|---|---|
| 84 | ENRC LOW como uma única camada lógica, apesar das folhas L1–L9. | Implementado | Manter | Uma camada TileWMS LOW recebe várias folhas ENRC, com alternância LOW/HIGH. |
| 85 | Corrigir orientação das legendas das folhas L5, L8 e L9. | Não iniciado | P1 — próximo | Não encontrei transformação específica para L5/L8/L9; não considerar corrigido sem conferência visual. |
| 86 | Carregar apenas as folhas visíveis. | Implementado | Manter | Seleção das folhas pela área visível e margem de carregamento, com controle por zoom. |
| 87 | Pré-carregar folhas próximas da rota. | Parcial | P1 — próximo | Há margem ao redor da janela do mapa; não é pré-carregamento ao longo da rota inteira. |
| 88 | Cache persistente das cartas. | Não iniciado | P1 — próximo | Cache de respostas em memória não é cache persistente de cartas. |
| 89 | Mostrar ciclo AIRAC e validade de cada carta. | Não iniciado | P1 — próximo | Não há exibição estruturada de ciclo/validade das cartas. |
| 90 | Alertar sobre carta vencida. | Não iniciado | P1 — próximo | Sem extração de validade, não existe alerta de vencimento. |
| 91 | Controle individual de opacidade. | Não iniciado | P1 — próximo | OpenLayers + OSM + ENRC LOW/HIGH; não encontrei este controle/produto adicional. |
| 92 | Controle de ordem das camadas. | Não iniciado | P1 — próximo | OpenLayers + OSM + ENRC LOW/HIGH; não encontrei este controle/produto adicional. |
| 93 | Zoom automático para toda a rota. | Não iniciado | P1 — próximo | OpenLayers + OSM + ENRC LOW/HIGH; não encontrei este controle/produto adicional. |
| 94 | Botão para enquadrar cada perna. | Não iniciado | P1 — próximo | OpenLayers + OSM + ENRC LOW/HIGH; não encontrei este controle/produto adicional. |
| 95 | Escala gráfica. | Não iniciado | P1 — próximo | Não há controle ScaleLine configurado no OpenLayers. |
| 96 | Coordenadas do cursor. | Não iniciado | P1 — próximo | Não há controle de coordenadas do cursor configurado. |
| 97 | Régua de distância. | Não iniciado | P1 — próximo | OpenLayers + OSM + ENRC LOW/HIGH; não encontrei este controle/produto adicional. |
| 98 | Alternar norte verdadeiro e magnético. | Não iniciado | P2 — futuro | OpenLayers + OSM + ENRC LOW/HIGH; não encontrei este controle/produto adicional. |
| 99 | Camada de aeródromos. | Parcial | P1 — próximo | Aeródromos presentes na rota são desenhados; falta camada pesquisável de todos os aeródromos. |
| 100 | Camada de pistas. | Não iniciado | P1 — próximo | OpenLayers + OSM + ENRC LOW/HIGH; não encontrei este controle/produto adicional. |
| 101 | Camada de fixos. | Parcial | P1 — próximo | Fixos presentes na rota são desenhados; falta camada geral com controle próprio. |
| 102 | Camada de auxílios. | Parcial | P1 — próximo | VORs da rota são desenhados; falta camada geral de auxílios e dados de NDB. |
| 103 | Camada de aerovias. | Não iniciado | P1 — próximo | OpenLayers + OSM + ENRC LOW/HIGH; não encontrei este controle/produto adicional. |
| 104 | Camada de FIR, TMA, CTR e ATZ. | Não iniciado | P1 — próximo | OpenLayers + OSM + ENRC LOW/HIGH; não encontrei este controle/produto adicional. |
| 105 | Camada de áreas proibidas, restritas e perigosas. | Não iniciado | P1 — próximo | OpenLayers + OSM + ENRC LOW/HIGH; não encontrei este controle/produto adicional. |
| 106 | WAC e demais cartas VFR. | Não iniciado | P2 — futuro | OpenLayers + OSM + ENRC LOW/HIGH; não encontrei este controle/produto adicional. |
| 107 | REA e REH. | Não iniciado | P2 — futuro | OpenLayers + OSM + ENRC LOW/HIGH; não encontrei este controle/produto adicional. |
| 108 | VAC. | Não iniciado | P2 — futuro | OpenLayers + OSM + ENRC LOW/HIGH; não encontrei este controle/produto adicional. |
| 109 | ADC e PDC. | Não iniciado | P1 — próximo | OpenLayers + OSM + ENRC LOW/HIGH; não encontrei este controle/produto adicional. |
| 110 | SID, STAR e IAC georreferenciadas. | Não iniciado | P2 — futuro | OpenLayers + OSM + ENRC LOW/HIGH; não encontrei este controle/produto adicional. |
| 111 | Carta de procedimento aberta ao lado do mapa. | Não iniciado | P1 — próximo | OpenLayers + OSM + ENRC LOW/HIGH; não encontrei este controle/produto adicional. |
| 112 | Favoritar cartas. | Não iniciado | P1 — próximo | OpenLayers + OSM + ENRC LOW/HIGH; não encontrei este controle/produto adicional. |
| 113 | Download de pacotes por região. | Não iniciado | P2 — futuro | OpenLayers + OSM + ENRC LOW/HIGH; não encontrei este controle/produto adicional. |
| 114 | Indicador de armazenamento ocupado. | Não iniciado | P2 — futuro | OpenLayers + OSM + ENRC LOW/HIGH; não encontrei este controle/produto adicional. |
| 115 | Atualização seletiva de cartas. | Não iniciado | P2 — futuro | OpenLayers + OSM + ENRC LOW/HIGH; não encontrei este controle/produto adicional. |
| 116 | Comparação entre edição antiga e nova. | Não iniciado | P2 — futuro | OpenLayers + OSM + ENRC LOW/HIGH; não encontrei este controle/produto adicional. |
| 117 | Mostrar a fonte e a data do dado tocado. | Não iniciado | P1 — próximo | OpenLayers + OSM + ENRC LOW/HIGH; não encontrei este controle/produto adicional. |
| 118 | Mapa-base claro, escuro e sem mapa-base. | Parcial | P2 — futuro | Mapa OSM disponível; faltam modos claro/escuro/sem base selecionáveis. |
| 119 | Impressão limpa da rota. | Não iniciado | P1 — próximo | OpenLayers + OSM + ENRC LOW/HIGH; não encontrei este controle/produto adicional. |
| 120 | Geração de tiles próprios para melhorar desempenho. | Não iniciado | P2 — futuro | OpenLayers + OSM + ENRC LOW/HIGH; não encontrei este controle/produto adicional. |
| 121 | Vetorização gradual de elementos das ENRC. | Não iniciado | P2 — futuro | OpenLayers + OSM + ENRC LOW/HIGH; não encontrei este controle/produto adicional. |

### NOTAM — itens 122–155

Base inspecionada: [backend/app.js](backend/app.js), [backend/routes](backend/routes), [backend/services](backend/services).

| ID | Sugestão original | Estado | Prioridade | Evidência ou lacuna |
|---:|---|---|---|---|
| 122 | Consultar NOTAM pela API AISWEB. | Não iniciado | P1 — próximo | Nenhuma rota/serviço de NOTAM no backend. Exige integração AISWEB e credenciais próprias. |
| 123 | NOTAM de origem, destino e alternados. | Não iniciado | P1 — próximo | Módulo NOTAM não implementado; depende de AISWEB e tratamento dos dados. |
| 124 | NOTAM das FIR atravessadas. | Não iniciado | P1 — próximo | Módulo NOTAM não implementado; depende de AISWEB e tratamento dos dados. |
| 125 | NOTAM de aeródromos ao longo da rota. | Não iniciado | P1 — próximo | Módulo NOTAM não implementado; depende de AISWEB e tratamento dos dados. |
| 126 | Filtrar pela janela temporal da missão. | Não iniciado | P1 — próximo | Nenhum filtro NOTAM implementado; interpretar validade e horários recorrentes antes de esconder resultados. |
| 127 | Separar vigente, futuro e expirado. | Não iniciado | P1 — próximo | Módulo NOTAM não implementado; depende de AISWEB e tratamento dos dados. |
| 128 | Mostrar mensagem original integral. | Não iniciado | P1 — próximo | Módulo NOTAM não implementado; depende de AISWEB e tratamento dos dados. |
| 129 | Decodificação assistida sem esconder o texto oficial. | Não iniciado | P1 — próximo | Módulo NOTAM não implementado; depende de AISWEB e tratamento dos dados. |
| 130 | Destacar pista fechada. | Não iniciado | P1 — próximo | Módulo NOTAM não implementado; depende de AISWEB e tratamento dos dados. |
| 131 | Destacar auxílio inoperante. | Não iniciado | P1 — próximo | Módulo NOTAM não implementado; depende de AISWEB e tratamento dos dados. |
| 132 | Destacar procedimento suspenso ou alterado. | Não iniciado | P1 — próximo | Módulo NOTAM não implementado; depende de AISWEB e tratamento dos dados. |
| 133 | Destacar iluminação indisponível. | Não iniciado | P1 — próximo | Módulo NOTAM não implementado; depende de AISWEB e tratamento dos dados. |
| 134 | Destacar obstáculo temporário. | Não iniciado | P1 — próximo | Módulo NOTAM não implementado; depende de AISWEB e tratamento dos dados. |
| 135 | Destacar área condicionada ativada. | Não iniciado | P1 — próximo | Módulo NOTAM não implementado; depende de AISWEB e tratamento dos dados. |
| 136 | Classificar por aeródromo, navegação, comunicação e espaço aéreo. | Não iniciado | P1 — próximo | Módulo NOTAM não implementado; depende de AISWEB e tratamento dos dados. |
| 137 | Classificar relevância como crítico, atenção e informativo. | Não iniciado | P1 — próximo | Módulo NOTAM não implementado; depende de AISWEB e tratamento dos dados. |
| 138 | Nunca ocultar automaticamente um NOTAM considerado irrelevante. | Não iniciado | P1 — próximo | Projetar acesso a todos os avisos e manter casos ambíguos visíveis; oferecer filtro explícito, sem exclusão silenciosa. |
| 139 | Permitir marcar “lido”. | Não iniciado | P1 — próximo | Módulo NOTAM não implementado; depende de AISWEB e tratamento dos dados. |
| 140 | Exigir justificativa para marcar “não aplicável”. | Não iniciado | P2 — futuro | Avaliar necessidade de justificativa obrigatória; não colocar burocracia no primeiro módulo pessoal. |
| 141 | Mostrar quantos NOTAM ainda não foram revisados. | Não iniciado | P1 — próximo | Módulo NOTAM não implementado; depende de AISWEB e tratamento dos dados. |
| 142 | Alertar quando a consulta estiver desatualizada. | Não iniciado | P1 — próximo | Módulo NOTAM não implementado; depende de AISWEB e tratamento dos dados. |
| 143 | Salvar o conjunto consultado junto à missão. | Não iniciado | P1 — próximo | Módulo NOTAM não implementado; depende de AISWEB e tratamento dos dados. |
| 144 | Registrar data e hora da última atualização. | Não iniciado | P1 — próximo | Módulo NOTAM não implementado; depende de AISWEB e tratamento dos dados. |
| 145 | Mostrar NOTAM no mapa usando coordenada e raio da linha Q. | Não iniciado | P1 — próximo | Módulo NOTAM não implementado; depende de AISWEB e tratamento dos dados. |
| 146 | Exibir período gráfico de ativação. | Não iniciado | P1 — próximo | Módulo NOTAM não implementado; depende de AISWEB e tratamento dos dados. |
| 147 | Mostrar limites verticais no perfil da rota. | Não iniciado | P2 — futuro | Módulo NOTAM não implementado; depende de AISWEB e tratamento dos dados. |
| 148 | Identificar sobreposição com o corredor da rota. | Não iniciado | P1 — próximo | Módulo NOTAM não implementado; depende de AISWEB e tratamento dos dados. |
| 149 | Comparar NOTAM entre duas atualizações. | Não iniciado | P1 — próximo | Módulo NOTAM não implementado; depende de AISWEB e tratamento dos dados. |
| 150 | Avisar quando surgiu novo NOTAM depois da revisão. | Não iniciado | P1 — próximo | Módulo NOTAM não implementado; depende de AISWEB e tratamento dos dados. |
| 151 | Favoritar NOTAM para acompanhamento. | Não iniciado | P2 — futuro | Módulo NOTAM não implementado; depende de AISWEB e tratamento dos dados. |
| 152 | Gerar resumo dos NOTAM críticos por perna. | Não iniciado | P1 — próximo | Módulo NOTAM não implementado; depende de AISWEB e tratamento dos dados. |
| 153 | Associar NOTAM a uma carta afetada. | Não iniciado | P1 — próximo | Módulo NOTAM não implementado; depende de AISWEB e tratamento dos dados. |
| 154 | Parser completo dos campos Q, A, B, C, D, E, F e G. | Não iniciado | P1 — próximo | Parte do parser temporal é dependência do item 126, não apenas uma evolução distante. |
| 155 | Motor de relevância operacional por aeronave e missão. | Não iniciado | P2 — futuro | Relevância automática por aeronave exige dados confiáveis e regras verificáveis. |

### Meteorologia — itens 156–196

Base inspecionada: [js/ui/weatherPanel.js](js/ui/weatherPanel.js), [backend/services/weatherService.js](backend/services/weatherService.js), [js/ui/grametPanel.js](js/ui/grametPanel.js), [backend/core/grametProfile.js](backend/core/grametProfile.js).

| ID | Sugestão original | Estado | Prioridade | Evidência ou lacuna |
|---:|---|---|---|---|
| 156 | METAR e SPECI de origem, destino e alternados. | Parcial | P1 — próximo | METAR de origem, intermediários, destino e alternativa por perna; sem consulta/tratamento explícito de SPECI. |
| 157 | TAF com divisão visual dos grupos de mudança. | Parcial | P1 — próximo | TAF bruto disponível; sem divisão visual dos grupos de mudança. |
| 158 | Mostrar mensagem bruta e versão decodificada. | Parcial | P1 — próximo | Mensagem bruta disponível; sem decodificador. |
| 159 | Não substituir o dado oficial pela interpretação. | Implementado | Manter | METAR e TAF são apresentados como mensagens originais, sem substituir por interpretação. |
| 160 | Horário do relatório e idade da observação. | Parcial | P0 — base | Horário pode ser lido no texto bruto; sem idade calculada nem rótulo próprio. |
| 161 | Alerta de METAR desatualizado. | Não iniciado | P0 — base | TAF/METAR não têm alerta de idade calculada. |
| 162 | Cor para VMC, marginal e IMC, com critérios configuráveis. | Não iniciado | P1 — próximo | Sem este produto/analítica; meteorologia operacional atual apresenta METAR/TAF brutos. |
| 163 | Destaque para teto e visibilidade. | Parcial | P1 — próximo | Teto/visibilidade aparecem no texto bruto; sem destaque extraído. |
| 164 | Destaque para vento e rajadas. | Parcial | P1 — próximo | Vento/rajadas aparecem no texto bruto; sem destaque extraído. |
| 165 | Componente de vento de través e de cauda por pista. | Não iniciado | P1 — próximo | Sem este produto/analítica; meteorologia operacional atual apresenta METAR/TAF brutos. |
| 166 | Identificar pista mais favorável pelo vento. | Não iniciado | P1 — próximo | Sem este produto/analítica; meteorologia operacional atual apresenta METAR/TAF brutos. |
| 167 | Alertar sobre vento acima do limite configurado. | Não iniciado | P1 — próximo | Sem este produto/analítica; meteorologia operacional atual apresenta METAR/TAF brutos. |
| 168 | QNH e tendência. | Parcial | P1 — próximo | QNH e tendência podem constar no texto bruto; sem painel/extração dedicada. |
| 169 | Temperatura e ponto de orvalho. | Parcial | P1 — próximo | Temperatura/ponto de orvalho constam no METAR bruto; sem campos destacados. |
| 170 | Spread temperatura–ponto de orvalho. | Não iniciado | P1 — próximo | Sem este produto/analítica; meteorologia operacional atual apresenta METAR/TAF brutos. |
| 171 | Condições de trovoada. | Não iniciado | P1 — próximo | Sem este produto/analítica; meteorologia operacional atual apresenta METAR/TAF brutos. |
| 172 | Chuva forte, névoa, fumaça e outros fenômenos. | Não iniciado | P1 — próximo | Sem este produto/analítica; meteorologia operacional atual apresenta METAR/TAF brutos. |
| 173 | SIGMET pertinente à rota. | Não iniciado | P1 — próximo | Sem este produto/analítica; meteorologia operacional atual apresenta METAR/TAF brutos. |
| 174 | Imagens de satélite. | Não iniciado | P1 — próximo | Sem este produto/analítica; meteorologia operacional atual apresenta METAR/TAF brutos. |
| 175 | Radar meteorológico onde disponível. | Não iniciado | P1 — próximo | Sem este produto/analítica; meteorologia operacional atual apresenta METAR/TAF brutos. |
| 176 | Horários de nascer e pôr do sol. | Não iniciado | P1 — próximo | Sem este produto/analítica; meteorologia operacional atual apresenta METAR/TAF brutos. |
| 177 | Crepúsculo civil. | Não iniciado | P1 — próximo | Sem este produto/analítica; meteorologia operacional atual apresenta METAR/TAF brutos. |
| 178 | Identificar trechos noturnos. | Não iniciado | P1 — próximo | Sem este produto/analítica; meteorologia operacional atual apresenta METAR/TAF brutos. |
| 179 | Cartas SIGWX. | Não iniciado | P1 — próximo | Sem este produto/analítica; meteorologia operacional atual apresenta METAR/TAF brutos. |
| 180 | Vento e temperatura em altitude. | Pausado | Standby | GFS fornece vento/temperatura por níveis no protótipo GRAMET; desenvolvimento em standby. |
| 181 | Turbulência prevista. | Não iniciado | P2 — futuro | Sem este produto/analítica; meteorologia operacional atual apresenta METAR/TAF brutos. |
| 182 | Nível de congelamento. | Pausado | Standby | Perfis têm temperatura, mas não há produto de nível de congelamento concluído; vinculado ao GRAMET pausado. |
| 183 | Convecção prevista. | Não iniciado | P2 — futuro | Sem este produto/analítica; meteorologia operacional atual apresenta METAR/TAF brutos. |
| 184 | Precipitação ao longo da rota. | Não iniciado | P2 — futuro | Sem este produto/analítica; meteorologia operacional atual apresenta METAR/TAF brutos. |
| 185 | Comparar METAR atual com TAF previsto para o ETA. | Não iniciado | P0 — base | TAF ainda não é associado explicitamente ao ETA de cada perna. |
| 186 | Linha temporal meteorológica por aeródromo. | Não iniciado | P1 — próximo | Sem este produto/analítica; meteorologia operacional atual apresenta METAR/TAF brutos. |
| 187 | Comparar GFS, ECMWF e ICON. | Não iniciado | P2 — futuro | Sem este produto/analítica; meteorologia operacional atual apresenta METAR/TAF brutos. |
| 188 | Indicar divergência relevante entre modelos. | Não iniciado | P2 — futuro | Sem este produto/analítica; meteorologia operacional atual apresenta METAR/TAF brutos. |
| 189 | Salvar instantâneo meteorológico usado no planejamento. | Não iniciado | P1 — próximo | Sem este produto/analítica; meteorologia operacional atual apresenta METAR/TAF brutos. |
| 190 | GRAMET próprio e interativo. | Pausado | Standby | GRAMET próprio já tem backend e canvas; interatividade e integração atual incompletas. Pausado por decisão do usuário. |
| 191 | Nuvens com base, corpo e topo. | Pausado | Standby | Protótipo calcula/desenha camadas de nuvens; validação e evolução pausadas. |
| 192 | Linha de 0 °C no perfil. | Não iniciado | P2 — futuro | Não encontrei linha de 0 °C desenhada; temperatura no perfil não equivale a essa função. |
| 193 | Terreno e níveis mínimos no mesmo perfil. | Pausado | Standby | Terreno e corredor de elevação existem no protótipo; mínimos publicados não estão integrados. Pausado. |
| 194 | Cursor sincronizado entre mapa e GRAMET. | Não iniciado | P2 — futuro | Sem cursor sincronizado mapa/GRAMET. |
| 195 | Alternância dia/noite no perfil. | Não iniciado | P2 — futuro | Sem alternância dia/noite no perfil. |
| 196 | Escolha da hora de decolagem com menor impacto meteorológico. | Não iniciado | P2 — futuro | Sem busca de horário de partida por impacto meteorológico. |

### Combustível — itens 197–228

Base inspecionada: [js/core/fuelEngine.js](js/core/fuelEngine.js), [js/core/routePlanning.js](js/core/routePlanning.js), [js/ui/fuelPanel.js](js/ui/fuelPanel.js).

| ID | Sugestão original | Estado | Prioridade | Evidência ou lacuna |
|---:|---|---|---|---|
| 197 | Táxi, etapa, contingência, alternativa e reserva final separados. | Parcial | P1 — próximo | Táxi, voo, procedimento, alternativa, reserva e extra separados; contingência não é um componente próprio. |
| 198 | Combustível por perna. | Implementado | Manter | Planejamento independente por perna, saldo de chegada e abastecimento na escala. |
| 199 | Combustível acumulado da missão. | Não iniciado | P0 — base | Cards por perna não somam consumo/necessidade da missão. Soma do requerido de cada perna pode duplicar reservas; definir as métricas. |
| 200 | Combustível de decolagem e pouso. | Parcial | P1 — próximo | A bordo e previsto no pouso calculados; ainda não há combustível de decolagem explicitamente líquido do táxi. |
| 201 | Abastecimento necessário em cada escala. | Parcial | P0 — base | Saldo anterior + abastecimento editável; falta sugerir automaticamente quanto abastecer para cumprir a próxima perna. |
| 202 | Autonomia prevista. | Não iniciado | P0 — base | Não há indicador de autonomia calculada para o usuário. |
| 203 | Comparação entre combustível requerido e abastecido. | Implementado | Manter | Requerido e a bordo aparecem juntos no cabeçalho de cada card. |
| 204 | Alertas de déficit. | Parcial | P0 — base | Valores podem ficar negativos; não há alerta visual/regra dedicada para déficit. |
| 205 | Consumo configurado por fase. | Parcial | P2 — futuro | Fluxo médio do modelo, táxi e procedimento padrão; sem desempenho/fluxos completos por fase. |
| 206 | Subida, cruzeiro e descida separados. | Não iniciado | P2 — futuro | Modelo atual usa fluxo médio e componentes básicos por perna; função específica não implementada. |
| 207 | Consumo em espera. | Não iniciado | P1 — próximo | Não há espera dedicada; procedimento/extra não substituem um modelo de espera. |
| 208 | Consumo de APU, quando aplicável. | Não iniciado | P2 — futuro | Modelo atual usa fluxo médio e componentes básicos por perna; função específica não implementada. |
| 209 | Aplicar vento por trecho. | Não iniciado | P2 — futuro | Modelo atual usa fluxo médio e componentes básicos por perna; função específica não implementada. |
| 210 | Considerar níveis diferentes por perna. | Parcial | P1 — próximo | Níveis são armazenados por perna/ponto; consumo e velocidade do modelo não variam com altitude. |
| 211 | Mostrar combustível em massa e volume. | Parcial | P0 — base | Botões LB/KG/L só mudam a preferência/estado visual; valores e passos seguem LB. |
| 212 | Conversão por densidade e temperatura. | Não iniciado | P1 — próximo | Arquivo fuelUnits.js não implementa conversão por densidade/temperatura. |
| 213 | Distribuição por tanque. | Não iniciado | P2 — futuro | Modelo atual usa fluxo médio e componentes básicos por perna; função específica não implementada. |
| 214 | Limites de tanque. | Não iniciado | P1 — próximo | maxFuel por modelo existe; não há tanques nem limites por tanque. |
| 215 | Combustível não utilizável. | Não iniciado | P1 — próximo | Modelo atual usa fluxo médio e componentes básicos por perna; função específica não implementada. |
| 216 | Política de arredondamento claramente indicada. | Parcial | P1 — próximo | ETA arredonda a 5 min e valores de combustível são arredondados na exibição; sem política de arredondamento do combustível explicada. |
| 217 | Registrar a fonte de cada parâmetro. | Parcial | P0 — base | Parâmetros ficam no código do modelo; não carregam documento, página ou versão de origem. |
| 218 | Cenário “sem abastecimento no destino”. | Parcial | P1 — próximo | Pode definir abastecimento zero na escala; não existe comparação de cenários. |
| 219 | Cenário de tanqueamento. | Não iniciado | P2 — futuro | Modelo atual usa fluxo médio e componentes básicos por perna; função específica não implementada. |
| 220 | Comparar abastecer agora ou na escala. | Não iniciado | P2 — futuro | Modelo atual usa fluxo médio e componentes básicos por perna; função específica não implementada. |
| 221 | Simular aumento de carga versus combustível. | Parcial | P1 — próximo | Peso responde à carga/combustível editados; não há ferramenta de comparação/otimização de cenários. |
| 222 | Mostrar ponto de decisão. | Não iniciado | P2 — futuro | Modelo atual usa fluxo médio e componentes básicos por perna; função específica não implementada. |
| 223 | Mostrar ponto de não retorno. | Não iniciado | P2 — futuro | Modelo atual usa fluxo médio e componentes básicos por perna; função específica não implementada. |
| 224 | Mostrar alcance com o combustível disponível. | Não iniciado | P2 — futuro | Modelo atual usa fluxo médio e componentes básicos por perna; função específica não implementada. |
| 225 | Comparar rota normal e desvio. | Não iniciado | P1 — próximo | Modelo atual usa fluxo médio e componentes básicos por perna; função específica não implementada. |
| 226 | Recalcular rapidamente com vento desfavorável. | Não iniciado | P2 — futuro | Modelo atual usa fluxo médio e componentes básicos por perna; função específica não implementada. |
| 227 | Margem personalizada pelo comandante. | Parcial | P1 — próximo | Extra é editável; falta política/margem identificada e documentada. |
| 228 | Otimização combinada de combustível, carga e escalas. | Não iniciado | P2 — futuro | Modelo atual usa fluxo médio e componentes básicos por perna; função específica não implementada. |

### Peso e balanceamento — itens 229–259

Base inspecionada: [js/ui/weightPanel.js](js/ui/weightPanel.js), [js/ui/payloadPanel.js](js/ui/payloadPanel.js), [js/core/weightEngine.js](js/core/weightEngine.js), [js/database/aircraftModels.js](js/database/aircraftModels.js).

| ID | Sugestão original | Estado | Prioridade | Evidência ou lacuna |
|---:|---|---|---|---|
| 229 | Cadastro de tripulantes por função e peso. | Implementado | Manter | Tripulação cadastrada por função e peso; compartilhada entre pernas. |
| 230 | Passageiros individualmente ou por grupos. | Implementado | Manter | Carga total, passageiros por média/grupo e listas individuais disponíveis. |
| 231 | Bagagem por pessoa. | Parcial | P1 — próximo | Modo médio tem quantidade/peso de bagagem; sem vínculo individual por passageiro. |
| 232 | Carga por compartimento. | Não iniciado | P2 — futuro | Cargas têm descrição/peso, mas nenhuma estação/compartimento. |
| 233 | Limites de cada estação. | Não iniciado | P2 — futuro | Há cálculo de massa por perna, mas não esta função de balanceamento/configuração/documentação. |
| 234 | Momento e índice. | Não iniciado | P2 — futuro | Há cálculo de massa por perna, mas não esta função de balanceamento/configuração/documentação. |
| 235 | Peso básico da matrícula. | Implementado | Manter | Peso básico definido por matrícula no cadastro local. |
| 236 | Configuração específica da aeronave. | Parcial | P1 — próximo | Modelo/matrícula selecionáveis; faltam configurações de cabine/equipamentos e suas revisões. |
| 237 | Envelope de CG. | Não iniciado | P1 — próximo | Não há braço, momento, índice ou envelope CG. |
| 238 | Gráfico com ZFW, decolagem e pouso. | Não iniciado | P1 — próximo | Pesos numéricos não equivalem a gráfico de envelope. |
| 239 | Alertar ponto fora do envelope. | Não iniciado | P1 — próximo | Há cálculo de massa por perna, mas não esta função de balanceamento/configuração/documentação. |
| 240 | Alertar compartimento excedido. | Não iniciado | P1 — próximo | Há cálculo de massa por perna, mas não esta função de balanceamento/configuração/documentação. |
| 241 | Alertar peso máximo de rampa. | Não iniciado | P0 — base | Limite de rampa em alguns cadastros; sem alerta; campo de peso de rampa no Dashboard ainda mostra '-- KG'. |
| 242 | Alertar peso máximo de decolagem. | Não iniciado | P0 — base | Limites de decolagem no cadastro não são comparados com peso calculado na UI. |
| 243 | Alertar peso máximo de pouso. | Não iniciado | P0 — base | Limites de pouso no cadastro não são comparados com peso calculado na UI. |
| 244 | Consumo de combustível deslocando o CG. | Não iniciado | P2 — futuro | Há cálculo de massa por perna, mas não esta função de balanceamento/configuração/documentação. |
| 245 | Comparar início e final da etapa. | Implementado | Manter | Pesos de decolagem e pouso disponíveis por perna; não inclui trajetória de CG. |
| 246 | Bloquear mistura indevida de configurações. | Parcial | P1 — próximo | Matrículas filtradas pelo modelo e modelos sem dados bloqueados; sem validação completa de configuração. |
| 247 | Fonte e versão dos dados da aeronave. | Parcial | P0 — base | Cadastro local de modelos; sem fonte e versão dos parâmetros. |
| 248 | Parâmetros FAB não editáveis pelo piloto comum. | Parcial | P2 — futuro | Não há tela para alterar dados-base, mas não existem perfis/permissões; isso não é controle de acesso. |
| 249 | Distribuição automática de carga. | Não iniciado | P2 — futuro | Há cálculo de massa por perna, mas não esta função de balanceamento/configuração/documentação. |
| 250 | Sugerir movimentação mínima para corrigir CG. | Não iniciado | P2 — futuro | Há cálculo de massa por perna, mas não esta função de balanceamento/configuração/documentação. |
| 251 | Biblioteca de configurações de cabine. | Não iniciado | P2 — futuro | Há cálculo de massa por perna, mas não esta função de balanceamento/configuração/documentação. |
| 252 | Assentos bloqueados ou indisponíveis. | Não iniciado | P2 — futuro | Há cálculo de massa por perna, mas não esta função de balanceamento/configuração/documentação. |
| 253 | Manifesto de passageiros. | Parcial | P1 — próximo | Lista de passageiros editável por perna; sem documento de manifesto/exportação. |
| 254 | Manifesto de carga. | Parcial | P1 — próximo | Lista de cargas editável por perna; sem documento de manifesto/exportação. |
| 255 | Artigos perigosos e observações especiais. | Não iniciado | P2 — futuro | Há cálculo de massa por perna, mas não esta função de balanceamento/configuração/documentação. |
| 256 | Importar passageiros de missão anterior. | Não iniciado | P2 — futuro | Há cálculo de massa por perna, mas não esta função de balanceamento/configuração/documentação. |
| 257 | Desembarque parcial em escalas. | Implementado | Manter | Carga/passageiros da etapa seguinte podem ser reduzidos independentemente; operação manual. |
| 258 | Embarque adicional em pernas intermediárias. | Implementado | Manter | Carga/passageiros da etapa seguinte podem ser aumentados independentemente; operação manual. |
| 259 | Otimização de carga considerando todas as pernas. | Não iniciado | P2 — futuro | Há cálculo de massa por perna, mas não esta função de balanceamento/configuração/documentação. |

### Desempenho — itens 260–290

Base inspecionada: [index.html](index.html), [js/database/aircraftModels.js](js/database/aircraftModels.js).

| ID | Sugestão original | Estado | Prioridade | Evidência ou lacuna |
|---:|---|---|---|---|
| 260 | Distância de decolagem requerida. | Não iniciado | P2 — futuro | Aba de desempenho é um placeholder; nenhum cálculo de distância de decolagem. |
| 261 | Distância de pouso requerida. | Não iniciado | P2 — futuro | Desempenho é uma aba placeholder; depende de dados/manuais específicos e validação. |
| 262 | Correção por peso. | Não iniciado | P2 — futuro | Desempenho é uma aba placeholder; depende de dados/manuais específicos e validação. |
| 263 | Correção por altitude. | Não iniciado | P2 — futuro | Desempenho é uma aba placeholder; depende de dados/manuais específicos e validação. |
| 264 | Correção por temperatura. | Não iniciado | P2 — futuro | Desempenho é uma aba placeholder; depende de dados/manuais específicos e validação. |
| 265 | Correção por vento. | Não iniciado | P2 — futuro | Desempenho é uma aba placeholder; depende de dados/manuais específicos e validação. |
| 266 | Correção por inclinação. | Não iniciado | P2 — futuro | Desempenho é uma aba placeholder; depende de dados/manuais específicos e validação. |
| 267 | Correção por pista molhada ou contaminada. | Não iniciado | P2 — futuro | Desempenho é uma aba placeholder; depende de dados/manuais específicos e validação. |
| 268 | Obstáculo após a decolagem. | Não iniciado | P2 — futuro | Desempenho é uma aba placeholder; depende de dados/manuais específicos e validação. |
| 269 | Margem sobre a distância disponível. | Não iniciado | P2 — futuro | Desempenho é uma aba placeholder; depende de dados/manuais específicos e validação. |
| 270 | TORA, TODA, ASDA e LDA. | Não iniciado | P2 — futuro | Desempenho é uma aba placeholder; depende de dados/manuais específicos e validação. |
| 271 | Identificar dado ausente. | Não iniciado | P2 — futuro | Existe bloqueio de alguns modelos sem dados, mas não um sistema de identificação de dados ausentes de desempenho. |
| 272 | Proibir extrapolação silenciosa de tabela. | Não iniciado | P2 — futuro | Desempenho é uma aba placeholder; depende de dados/manuais específicos e validação. |
| 273 | Mostrar quais interpolações foram realizadas. | Não iniciado | P2 — futuro | Desempenho é uma aba placeholder; depende de dados/manuais específicos e validação. |
| 274 | Preservar o valor original de manual. | Não iniciado | P2 — futuro | Desempenho é uma aba placeholder; depende de dados/manuais específicos e validação. |
| 275 | Registrar versão do manual utilizada. | Não iniciado | P2 — futuro | Desempenho é uma aba placeholder; depende de dados/manuais específicos e validação. |
| 276 | Limites de vento de través. | Não iniciado | P2 — futuro | Desempenho é uma aba placeholder; depende de dados/manuais específicos e validação. |
| 277 | Limites de cauda. | Não iniciado | P2 — futuro | Desempenho é uma aba placeholder; depende de dados/manuais específicos e validação. |
| 278 | Limites de temperatura. | Não iniciado | P2 — futuro | Desempenho é uma aba placeholder; depende de dados/manuais específicos e validação. |
| 279 | Limite de altitude do aeródromo. | Não iniciado | P2 — futuro | Desempenho é uma aba placeholder; depende de dados/manuais específicos e validação. |
| 280 | Melhor pista considerando vento e desempenho. | Não iniciado | P2 — futuro | Desempenho é uma aba placeholder; depende de dados/manuais específicos e validação. |
| 281 | Comparar todas as cabeceiras. | Não iniciado | P2 — futuro | Desempenho é uma aba placeholder; depende de dados/manuais específicos e validação. |
| 282 | Análise de gradiente de subida. | Não iniciado | P2 — futuro | Desempenho é uma aba placeholder; depende de dados/manuais específicos e validação. |
| 283 | Peso máximo permitido pelas condições. | Não iniciado | P2 — futuro | Desempenho é uma aba placeholder; depende de dados/manuais específicos e validação. |
| 284 | Peso limitado por pista. | Não iniciado | P2 — futuro | Desempenho é uma aba placeholder; depende de dados/manuais específicos e validação. |
| 285 | Peso limitado por subida. | Não iniciado | P2 — futuro | Desempenho é uma aba placeholder; depende de dados/manuais específicos e validação. |
| 286 | Peso limitado por pouso no destino. | Não iniciado | P2 — futuro | Desempenho é uma aba placeholder; depende de dados/manuais específicos e validação. |
| 287 | Planejamento de pouso no alternado. | Não iniciado | P2 — futuro | Desempenho é uma aba placeholder; depende de dados/manuais específicos e validação. |
| 288 | Painel “qual é o limitante?”. | Não iniciado | P2 — futuro | Desempenho é uma aba placeholder; depende de dados/manuais específicos e validação. |
| 289 | Digitalização controlada das tabelas de desempenho. | Não iniciado | P2 — futuro | Depende dos manuais corretos, revisão e processo de conferência; não estimar tabelas. |
| 290 | Testes automáticos contra exemplos conhecidos do manual. | Não iniciado | P2 — futuro | Primeiro obter exemplos de referência dos manuais; não há motor de desempenho a testar. |

### Aeródromos — itens 291–317

Base inspecionada: [backend/services/navigationService.js](backend/services/navigationService.js), [js/database/airports.js](js/database/airports.js), [js/database/airportReferences.js](js/database/airportReferences.js).

| ID | Sugestão original | Estado | Prioridade | Evidência ou lacuna |
|---:|---|---|---|---|
| 291 | Página consolidada para cada aeródromo. | Parcial | P1 — próximo | Informações distribuídas entre busca, rota e meteorologia; falta página consolidada do aeródromo. |
| 292 | Dados ROTAER. | Não iniciado | P1 — próximo | WFS carrega cadastro básico de aeródromos; isso não é uma ficha ROTAER completa. |
| 293 | Pistas e dimensões. | Não iniciado | P1 — próximo | Cadastro básico/WFS e METAR/TAF existem; sem ficha ou capacidade específica deste item. |
| 294 | Elevação. | Parcial | P1 — próximo | Elevação é carregada no dado do aeródromo; sem ficha dedicada que a exponha. |
| 295 | Declividade. | Não iniciado | P1 — próximo | Cadastro básico/WFS e METAR/TAF existem; sem ficha ou capacidade específica deste item. |
| 296 | Resistência do pavimento. | Não iniciado | P1 — próximo | Cadastro básico/WFS e METAR/TAF existem; sem ficha ou capacidade específica deste item. |
| 297 | Frequências. | Não iniciado | P1 — próximo | Frequência de VOR no dado não equivale às frequências operacionais do aeródromo. |
| 298 | Auxílios disponíveis. | Parcial | P1 — próximo | VORs são carregados e existe associação explícita SBFZ–FLZ; falta catálogo por aeródromo e situação operacional. |
| 299 | Horários de funcionamento. | Não iniciado | P1 — próximo | Cadastro básico/WFS e METAR/TAF existem; sem ficha ou capacidade específica deste item. |
| 300 | Categoria de combate a incêndio. | Não iniciado | P1 — próximo | Cadastro básico/WFS e METAR/TAF existem; sem ficha ou capacidade específica deste item. |
| 301 | Disponibilidade de combustível. | Não iniciado | P1 — próximo | Cadastro básico/WFS e METAR/TAF existem; sem ficha ou capacidade específica deste item. |
| 302 | Restrições operacionais. | Não iniciado | P1 — próximo | Cadastro básico/WFS e METAR/TAF existem; sem ficha ou capacidade específica deste item. |
| 303 | Cartas associadas. | Não iniciado | P1 — próximo | ENRC regional não é biblioteca de cartas associadas por aeródromo. |
| 304 | NOTAM vigentes. | Não iniciado | P1 — próximo | Não há módulo NOTAM. |
| 305 | METAR e TAF. | Parcial | P1 — próximo | METAR/TAF já consultados por perna; falta integrá-los a uma ficha de aeródromo. |
| 306 | Nascer e pôr do sol. | Não iniciado | P1 — próximo | Cadastro básico/WFS e METAR/TAF existem; sem ficha ou capacidade específica deste item. |
| 307 | Rotas preferenciais. | Não iniciado | P2 — futuro | Cadastro básico/WFS e METAR/TAF existem; sem ficha ou capacidade específica deste item. |
| 308 | Suplementos AIP relacionados. | Não iniciado | P1 — próximo | Cadastro básico/WFS e METAR/TAF existem; sem ficha ou capacidade específica deste item. |
| 309 | Distância da rota. | Parcial | P1 — próximo | Distância destino–alternativa disponível; não calcula distância/desvio para qualquer candidato ao longo da rota. |
| 310 | Tempo adicional para desvio. | Não iniciado | P1 — próximo | Cadastro básico/WFS e METAR/TAF existem; sem ficha ou capacidade específica deste item. |
| 311 | Favoritar aeródromos. | Não iniciado | P1 — próximo | Cadastro básico/WFS e METAR/TAF existem; sem ficha ou capacidade específica deste item. |
| 312 | Notas operacionais particulares do usuário. | Não iniciado | P1 — próximo | Cadastro básico/WFS e METAR/TAF existem; sem ficha ou capacidade específica deste item. |
| 313 | Contatos operacionais. | Não iniciado | P1 — próximo | Cadastro básico/WFS e METAR/TAF existem; sem ficha ou capacidade específica deste item. |
| 314 | Histórico das condições consultadas. | Não iniciado | P2 — futuro | Cadastro básico/WFS e METAR/TAF existem; sem ficha ou capacidade específica deste item. |
| 315 | Comparar origem, destino e alternado em uma tela. | Parcial | P1 — próximo | Cards METAR/TAF permitem comparar localidades; não abrangem pistas, NOTAM e serviços. |
| 316 | Matriz de escolha de alternado. | Não iniciado | P2 — futuro | Cadastro básico/WFS e METAR/TAF existem; sem ficha ou capacidade específica deste item. |
| 317 | Avaliação automática da compatibilidade aeronave–aeródromo. | Não iniciado | P2 — futuro | Cadastro básico/WFS e METAR/TAF existem; sem ficha ou capacidade específica deste item. |

### Alternados — itens 318–336

Base inspecionada: [js/models/missions.js](js/models/missions.js), [js/core/fuelEngine.js](js/core/fuelEngine.js), [js/ui/weatherPanel.js](js/ui/weatherPanel.js).

| ID | Sugestão original | Estado | Prioridade | Evidência ou lacuna |
|---:|---|---|---|---|
| 318 | Alternado de destino. | Implementado | Manter | Um alternado de destino por perna, usado em distância, combustível e meteorologia. |
| 319 | Alternado de decolagem. | Não iniciado | P1 — próximo | Há apenas alternado de destino; não há alternado de decolagem. |
| 320 | Segundo alternado. | Não iniciado | P1 — próximo | Há um alternado de destino por perna; sem este modelo adicional de seleção/contingência. |
| 321 | Aeródromos adequados em rota. | Não iniciado | P1 — próximo | Há um alternado de destino por perna; sem este modelo adicional de seleção/contingência. |
| 322 | Distância e EET até cada alternado. | Parcial | P1 — próximo | Distância ao alternado e tempo usado internamente no consumo; falta EET explícito e múltiplos candidatos. |
| 323 | Meteorologia no ETA previsto. | Não iniciado | P1 — próximo | Consultar TAF bruto não seleciona as condições válidas para o ETA do alternado. |
| 324 | NOTAM relevantes. | Não iniciado | P1 — próximo | Há um alternado de destino por perna; sem este modelo adicional de seleção/contingência. |
| 325 | Comprimento e resistência da pista. | Não iniciado | P1 — próximo | Há um alternado de destino por perna; sem este modelo adicional de seleção/contingência. |
| 326 | Combustível disponível. | Não iniciado | P1 — próximo | Há um alternado de destino por perna; sem este modelo adicional de seleção/contingência. |
| 327 | Cartas de aproximação disponíveis. | Não iniciado | P1 — próximo | Há um alternado de destino por perna; sem este modelo adicional de seleção/contingência. |
| 328 | Compatibilidade com os auxílios da aeronave. | Não iniciado | P1 — próximo | Há um alternado de destino por perna; sem este modelo adicional de seleção/contingência. |
| 329 | Mínimos aplicáveis. | Não iniciado | P1 — próximo | Não há base de mínimos operacionais por procedimento/aeronave. |
| 330 | Horário de funcionamento. | Não iniciado | P1 — próximo | Há um alternado de destino por perna; sem este modelo adicional de seleção/contingência. |
| 331 | Ordenar por adequação operacional. | Não iniciado | P2 — futuro | Há um alternado de destino por perna; sem este modelo adicional de seleção/contingência. |
| 332 | Cenário de desvio iniciado em cada trecho. | Não iniciado | P2 — futuro | Há um alternado de destino por perna; sem este modelo adicional de seleção/contingência. |
| 333 | Combustível remanescente no alternado. | Não iniciado | P2 — futuro | Há um alternado de destino por perna; sem este modelo adicional de seleção/contingência. |
| 334 | Alcance até alternados sobreposto no mapa. | Não iniciado | P2 — futuro | Há um alternado de destino por perna; sem este modelo adicional de seleção/contingência. |
| 335 | Identificar trechos sem alternado razoável. | Não iniciado | P2 — futuro | Há um alternado de destino por perna; sem este modelo adicional de seleção/contingência. |
| 336 | Motor de contingência para falha, meteorologia e fechamento de pista. | Não iniciado | P2 — futuro | Há um alternado de destino por perna; sem este modelo adicional de seleção/contingência. |

### Checklist e risco — itens 337–364

Base inspecionada: [js/models/missions.js](js/models/missions.js), [js/ui](js/ui).

| ID | Sugestão original | Estado | Prioridade | Evidência ou lacuna |
|---:|---|---|---|---|
| 337 | Checklist configurável por tipo de missão. | Não iniciado | P1 — próximo | Começar com checklist curto e configurável; módulo ainda não existe. |
| 338 | Checklist por fase do planejamento. | Não iniciado | P1 — próximo | Não há módulo de checklist ou FRAT. |
| 339 | Dados da missão completos. | Não iniciado | P0 — base | Falta um resumo dos campos ausentes por perna. |
| 340 | Documentação da aeronave. | Não iniciado | P1 — próximo | Não há módulo de checklist ou FRAT. |
| 341 | Peso e balanceamento conferido. | Não iniciado | P1 — próximo | Não há módulo de checklist ou FRAT. |
| 342 | Desempenho conferido. | Não iniciado | P1 — próximo | Não há módulo de checklist ou FRAT. |
| 343 | Combustível conferido. | Não iniciado | P1 — próximo | Não há módulo de checklist ou FRAT. |
| 344 | Meteorologia atualizada. | Não iniciado | P1 — próximo | Não há módulo de checklist ou FRAT. |
| 345 | NOTAM revisados. | Não iniciado | P1 — próximo | Não há módulo de checklist ou FRAT. |
| 346 | Cartas válidas baixadas. | Não iniciado | P1 — próximo | Não há módulo de checklist ou FRAT. |
| 347 | Alternado confirmado. | Não iniciado | P1 — próximo | Não há módulo de checklist ou FRAT. |
| 348 | Campos obrigatórios claramente destacados. | Não iniciado | P0 — base | Não há módulo de checklist ou FRAT. |
| 349 | Não permitir marcar automaticamente itens críticos. | Não iniciado | P1 — próximo | Não há módulo de checklist ou FRAT. |
| 350 | Nome e horário de quem conferiu. | Não iniciado | P1 — próximo | Não há módulo de checklist ou FRAT. |
| 351 | FRAT integrado. | Não iniciado | P2 — futuro | Não há módulo de checklist ou FRAT. |
| 352 | Pontuação de risco transparente. | Não iniciado | P2 — futuro | Não há módulo de checklist ou FRAT. |
| 353 | Fadiga. | Não iniciado | P2 — futuro | Não há módulo de checklist ou FRAT. |
| 354 | Experiência da tripulação. | Não iniciado | P2 — futuro | Não há módulo de checklist ou FRAT. |
| 355 | Meteorologia. | Não iniciado | P2 — futuro | Não há módulo de checklist ou FRAT. |
| 356 | Operação noturna. | Não iniciado | P2 — futuro | Não há módulo de checklist ou FRAT. |
| 357 | Aeródromo desconhecido. | Não iniciado | P2 — futuro | Não há módulo de checklist ou FRAT. |
| 358 | Pista curta. | Não iniciado | P2 — futuro | Não há módulo de checklist ou FRAT. |
| 359 | Manutenção ou restrição técnica. | Não iniciado | P2 — futuro | Não há módulo de checklist ou FRAT. |
| 360 | Múltiplas pernas. | Não iniciado | P2 — futuro | Não há módulo de checklist ou FRAT. |
| 361 | Exigir mitigação para risco elevado. | Não iniciado | P2 — futuro | Não há módulo de checklist ou FRAT. |
| 362 | Mostrar o que fez a pontuação subir. | Não iniciado | P2 — futuro | Não há módulo de checklist ou FRAT. |
| 363 | Comparar risco antes e depois das mitigações. | Não iniciado | P2 — futuro | Não há módulo de checklist ou FRAT. |
| 364 | Análise estatística dos fatores mais recorrentes. | Não iniciado | P2 — futuro | Não há módulo de checklist ou FRAT. |

### Briefing — itens 365–391

Base inspecionada: [js/ui/fullBriefingPanel.js](js/ui/fullBriefingPanel.js), [js/ui/dashboardPanel.js](js/ui/dashboardPanel.js), [index.html](index.html).

| ID | Sugestão original | Estado | Prioridade | Evidência ou lacuna |
|---:|---|---|---|---|
| 365 | Gerar um briefing único da missão. | Parcial | P1 — próximo | Briefing HTML existe, mas usa a perna selecionada; ainda não consolida toda a missão. |
| 366 | Capa com rota, aeronave, matrícula e horários. | Parcial | P1 — próximo | Cabeçalho com parte desses dados no HTML; sem capa de relatório. |
| 367 | Resumo executivo. | Parcial | P1 — próximo | Dashboard resume cada perna; falta resumo executivo consolidado da missão. |
| 368 | Mapa da rota. | Não iniciado | P1 — próximo | Mapa existe na interface, mas não é incorporado no briefing/relatório. |
| 369 | Navlog por perna. | Não iniciado | P1 — próximo | Há distância e EET total por perna; não existe tabela de navegação por trecho. |
| 370 | Combustível. | Parcial | P1 — próximo | Combustível básico no briefing HTML da perna selecionada; sem relatório completo da missão. |
| 371 | Peso e balanceamento. | Parcial | P1 — próximo | Pesos básicos de partida/chegada no HTML; não há balanceamento nem relatório completo. |
| 372 | Desempenho. | Não iniciado | P1 — próximo | Há briefing HTML básico por perna selecionada; sem esta capacidade de relatório/exportação. |
| 373 | Meteorologia. | Parcial | P1 — próximo | Briefing HTML orienta consultar a aba METAR/TAF; dados não são incorporados ao documento. |
| 374 | NOTAM. | Não iniciado | P1 — próximo | Há briefing HTML básico por perna selecionada; sem esta capacidade de relatório/exportação. |
| 375 | Aeródromos. | Não iniciado | P1 — próximo | Há briefing HTML básico por perna selecionada; sem esta capacidade de relatório/exportação. |
| 376 | Alternados. | Parcial | P1 — próximo | Alternado entra nos cálculos; falta seção completa no briefing. |
| 377 | Cartas selecionadas. | Não iniciado | P1 — próximo | Há briefing HTML básico por perna selecionada; sem esta capacidade de relatório/exportação. |
| 378 | Checklist final. | Não iniciado | P1 — próximo | Há briefing HTML básico por perna selecionada; sem esta capacidade de relatório/exportação. |
| 379 | Índice clicável. | Não iniciado | P1 — próximo | Há briefing HTML básico por perna selecionada; sem esta capacidade de relatório/exportação. |
| 380 | Numeração de páginas. | Não iniciado | P1 — próximo | Há briefing HTML básico por perna selecionada; sem esta capacidade de relatório/exportação. |
| 381 | Data e hora da geração. | Não iniciado | P1 — próximo | Há briefing HTML básico por perna selecionada; sem esta capacidade de relatório/exportação. |
| 382 | Fontes e validade dos dados. | Não iniciado | P1 — próximo | Há briefing HTML básico por perna selecionada; sem esta capacidade de relatório/exportação. |
| 383 | Identificador único do relatório. | Não iniciado | P1 — próximo | Há briefing HTML básico por perna selecionada; sem esta capacidade de relatório/exportação. |
| 384 | PDF A4 bem formatado. | Não iniciado | P1 — próximo | PDF.js está incluído como leitor; não existe geração de PDF. |
| 385 | Versão compacta para tela. | Parcial | P1 — próximo | Dashboard e briefing HTML existem; falta versão compacta completa e validada em celular. |
| 386 | Versão “somente alterações”. | Não iniciado | P2 — futuro | Há briefing HTML básico por perna selecionada; sem esta capacidade de relatório/exportação. |
| 387 | QR Code para abrir a missão. | Não iniciado | P1 — próximo | Há briefing HTML básico por perna selecionada; sem esta capacidade de relatório/exportação. |
| 388 | Assinatura/conferência digital interna. | Não iniciado | P2 — futuro | Há briefing HTML básico por perna selecionada; sem esta capacidade de relatório/exportação. |
| 389 | Anexar documentos externos. | Não iniciado | P1 — próximo | Há briefing HTML básico por perna selecionada; sem esta capacidade de relatório/exportação. |
| 390 | Pacote ZIP offline com relatório e cartas. | Não iniciado | P1 — próximo | Há briefing HTML básico por perna selecionada; sem esta capacidade de relatório/exportação. |
| 391 | Briefing adaptado por função: piloto, mecânico, operações etc. | Não iniciado | P2 — futuro | Há briefing HTML básico por perna selecionada; sem esta capacidade de relatório/exportação. |

### Interface — itens 392–420

Base inspecionada: [css/style.css](css/style.css), [js/ui/routePanel.js](js/ui/routePanel.js), [js/ui/legCards.js](js/ui/legCards.js), [js/ui/navigation.js](js/ui/navigation.js).

| ID | Sugestão original | Estado | Prioridade | Evidência ou lacuna |
|---:|---|---|---|---|
| 392 | Mapa como elemento central. | Implementado | Manter | OpenLayers é o mapa central da interface. |
| 393 | Sidebar com painéis contextuais. | Implementado | Manter | Sidebar e painéis contextuais de planejamento. |
| 394 | Missão sempre visível na barra superior. | Parcial | P1 — próximo | Cabeçalho mostra a perna selecionada; não há identificação/resumo permanente da missão inteira. |
| 395 | Icy Blue para seleção e operação normal. | Parcial | P2 — futuro | Seleção usa azul; não existe implementação formal do token Icy Blue proposto. |
| 396 | Amber para atenção. | Não iniciado | P2 — futuro | Não encontrei esta funcionalidade global; interface ainda precisa de validação em dispositivos reais. |
| 397 | Raspberry Red para condição crítica. | Não iniciado | P2 — futuro | Não encontrei esta funcionalidade global; interface ainda precisa de validação em dispositivos reais. |
| 398 | Evitar excesso de cores simultâneas. | Parcial | P1 — próximo | Tema escuro com hierarquia visual; princípio parcialmente aplicado, sem auditoria visual completa. |
| 399 | Unidades sempre visíveis. | Parcial | P0 — base | Várias unidades são visíveis; seletor KG/L ainda é incoerente com valores LB. |
| 400 | Formatação coerente de horário Zulu/local. | Parcial | P1 — próximo | UTC, dd-mm-yyyy e virada de dia tratados; sem hora local. |
| 401 | Teclado e navegação eficientes no computador. | Parcial | P1 — próximo | Enter/Tab/setas na busca e inclusão contínua; não foi auditado todo o fluxo por teclado. |
| 402 | Interface confortável no iPhone. | Parcial | P0 — base | Viewport e alguns estilos responsivos; não validado em iPhone e não está publicado. |
| 403 | Botões adequados para toque. | Parcial | P0 — base | Há botões compactos de 20–26 px; não há validação de alvos de toque. |
| 404 | Painéis recolhíveis. | Implementado | Manter | Cards recolhíveis de ROTA, Combustível, Peso, Dashboard e Meteorologia. |
| 405 | Layout salvo por usuário. | Não iniciado | P2 — futuro | Nenhuma persistência de layout/preferências por usuário. |
| 406 | Busca global. | Não iniciado | P2 — futuro | Buscas locais de aeroportos/pontos não são busca global. |
| 407 | Paleta de comandos. | Não iniciado | P2 — futuro | Sem paleta de comandos. |
| 408 | Atalhos de teclado. | Parcial | P1 — próximo | Atalhos locais da busca; sem catálogo/atalhos globais. |
| 409 | Desfazer/refazer. | Não iniciado | P1 — próximo | Sem histórico de comandos para desfazer/refazer. |
| 410 | Confirmação para alterações críticas. | Parcial | P1 — próximo | Confirma remover perna; sem desfazer ou cobertura das demais ações destrutivas. |
| 411 | Mensagens de erro explicando como corrigir. | Parcial | P1 — próximo | Alguns erros explicam causa/ação; falta padronização em todos os módulos. |
| 412 | Estados de carregamento claros. | Implementado | Manter | Mensagens de carregamento/erro na inicialização e nas consultas meteorológicas. |
| 413 | Indicador offline. | Não iniciado | P1 — próximo | Não existe indicador de conectividade. |
| 414 | Indicador de sincronização. | Não iniciado | P2 — futuro | Não encontrei esta funcionalidade global; interface ainda precisa de validação em dispositivos reais. |
| 415 | Ajuda contextual. | Parcial | P1 — próximo | Alguns títulos e dicas nos controles; sem ajuda contextual abrangente. |
| 416 | Glossário aeronáutico embutido. | Não iniciado | P1 — próximo | Não encontrei esta funcionalidade global; interface ainda precisa de validação em dispositivos reais. |
| 417 | Modo de apresentação para briefing. | Não iniciado | P2 — futuro | Não encontrei esta funcionalidade global; interface ainda precisa de validação em dispositivos reais. |
| 418 | Tela dividida entre mapa e relatório. | Parcial | P1 — próximo | Mapa com painéis e briefing HTML existem; não há modo específico de comparação mapa/relatório. |
| 419 | Temas por ambiente, mantendo a identidade escura. | Não iniciado | P2 — futuro | Não encontrei esta funcionalidade global; interface ainda precisa de validação em dispositivos reais. |
| 420 | Acessibilidade e contraste verificável. | Parcial | P1 — próximo | Labels, foco e alguns aria-live existem; faltam auditoria de contraste, teclado e leitor de tela. |

### Offline — itens 421–438

Base inspecionada: [js/app.js](js/app.js), [js/models/missions.js](js/models/missions.js), [backend/cache/responseCache.js](backend/cache/responseCache.js).

| ID | Sugestão original | Estado | Prioridade | Evidência ou lacuna |
|---:|---|---|---|---|
| 421 | Missões acessíveis sem internet. | Não iniciado | P1 — próximo | Sem service worker, cache de aplicação ou persistência de missões. |
| 422 | Aeronaves e parâmetros disponíveis offline. | Parcial | P1 — próximo | Dados de aeronave estão em arquivos locais; não há instalação/cache offline que garanta acesso. |
| 423 | Cartas selecionadas disponíveis offline. | Não iniciado | P1 — próximo | Sem service worker, persistência de missão ou sincronização; cache atual é volátil no servidor. |
| 424 | Últimos METAR, TAF e NOTAM preservados com horário. | Não iniciado | P1 — próximo | Cache em memória do servidor não preserva um briefing meteorológico/NOTAM no aparelho. |
| 425 | Nunca apresentar dado antigo como atual. | Parcial | P0 — base | Erros não são convertidos em previsões inventadas; faltam idade explícita e política de validade para cache/offline. |
| 426 | Mostrar idade de cada informação. | Não iniciado | P0 — base | Sem service worker, persistência de missão ou sincronização; cache atual é volátil no servidor. |
| 427 | Download do pacote completo da missão. | Não iniciado | P1 — próximo | Sem service worker, persistência de missão ou sincronização; cache atual é volátil no servidor. |
| 428 | Verificação automática antes de sair da internet. | Não iniciado | P1 — próximo | Sem service worker, persistência de missão ou sincronização; cache atual é volátil no servidor. |
| 429 | Lista do que ainda não foi baixado. | Não iniciado | P1 — próximo | Sem service worker, persistência de missão ou sincronização; cache atual é volátil no servidor. |
| 430 | Cache por região ou rota. | Não iniciado | P1 — próximo | Sem service worker, persistência de missão ou sincronização; cache atual é volátil no servidor. |
| 431 | Atualização apenas dos arquivos alterados. | Não iniciado | P1 — próximo | Sem service worker, persistência de missão ou sincronização; cache atual é volátil no servidor. |
| 432 | Fila de sincronização. | Não iniciado | P2 — futuro | Sem service worker, persistência de missão ou sincronização; cache atual é volátil no servidor. |
| 433 | Resolução de conflitos. | Não iniciado | P2 — futuro | Sem service worker, persistência de missão ou sincronização; cache atual é volátil no servidor. |
| 434 | Backup local. | Não iniciado | P0 — base | Foi feito backup manual da pasta do projeto nesta conversa; a funcionalidade de backup de missão no aplicativo não existe. |
| 435 | Sincronização entre computador e celular. | Não iniciado | P1 — próximo | Não há backend de missões/usuários nem sincronização entre dispositivos. |
| 436 | Acesso somente leitura a missão finalizada. | Não iniciado | P1 — próximo | Sem service worker, persistência de missão ou sincronização; cache atual é volátil no servidor. |
| 437 | Compartilhamento offline por arquivo. | Não iniciado | P1 — próximo | Sem service worker, persistência de missão ou sincronização; cache atual é volátil no servidor. |
| 438 | Sincronização institucional controlada. | Não iniciado | P2 — futuro | Sem service worker, persistência de missão ou sincronização; cache atual é volátil no servidor. |

### Integridade — itens 439–463

Base inspecionada: [backend/cache/responseCache.js](backend/cache/responseCache.js), [backend/config/index.js](backend/config/index.js), [test](test), [backend/test](backend/test).

| ID | Sugestão original | Estado | Prioridade | Evidência ou lacuna |
|---:|---|---|---|---|
| 439 | Fonte de cada informação. | Parcial | P0 — base | Fontes identificáveis no código/algumas telas; sem metadados uniformes em cada informação. |
| 440 | Data da publicação. | Não iniciado | P1 — próximo | Textos brutos podem conter data de emissão; falta metadado uniforme de publicação. |
| 441 | Data da última consulta. | Parcial | P0 — base | Cache interno tem createdAt; não é exposto/persistido com todos os resultados. |
| 442 | Ciclo AIRAC. | Não iniciado | P1 — próximo | Sem ciclo AIRAC exposto nos dados e cartões. |
| 443 | Versão dos parâmetros da aeronave. | Não iniciado | P0 — base | Sem versão do cadastro de aeronaves. |
| 444 | Versão do motor de cálculo. | Não iniciado | P0 — base | Sem versão explicitamente associada ao resultado do cálculo. |
| 445 | Registro das entradas usadas no resultado. | Parcial | P0 — base | Estado atual contém as entradas, mas não há instantâneo persistido por resultado. |
| 446 | Resultados reproduzíveis. | Parcial | P0 — base | Cálculos locais são determinísticos; sem versões e instantâneos para reproduzir consultas históricas. |
| 447 | Testes automatizados de combustível. | Parcial | P0 — base | Há testes de cálculo/encadeamento/consumo; faltam cobertura ampla e casos aprovados do manual. |
| 448 | Testes automatizados de W&B. | Parcial | P0 — base | Testes incluem pesos/carga por perna; sem CG/envelope ou validação completa de W&B. |
| 449 | Testes automatizados de desempenho. | Não iniciado | P2 — futuro | Sem motor de desempenho, logo sem testes de desempenho. |
| 450 | Casos de referência aprovados. | Não iniciado | P0 — base | Testes existentes não são exemplos aprovados de manual. |
| 451 | Detectar dados contraditórios. | Parcial | P0 — base | Algumas entradas filtradas; falta checagem cruzada de dados e fontes. |
| 452 | Não permitir `NaN`, valores vazios ou unidades incompatíveis. | Parcial | P0 — base | Velocidade/alguns campos validados; carga/peso e campos vazios ainda permitem valores inadequados. |
| 453 | Separar erro de entrada, dado indisponível e falha do servidor. | Parcial | P0 — base | Backend diferencia 400/503/502 em alguns endpoints; interface não padroniza todas as causas. |
| 454 | Log técnico sem expor credenciais. | Parcial | P1 — próximo | Logs usam mensagens de erro; não há camada sistemática de redação/segurança de logs. |
| 455 | API keys apenas no backend. | Implementado | Manter | REDEMET_API_KEY é lida pelo backend; nenhuma integração AISWEB-NOTAM implementada. |
| 456 | Nunca colocar a chave REDEMET ou AISWEB no frontend. | Implementado | Manter | Frontend chama o backend para REDEMET; não recebe a chave. AISWEB ainda não integrado. |
| 457 | Limite de requisições e cache. | Parcial | P0 — base | Cache com TTL e deduplicação de consultas simultâneas; sem rate limiting por cliente. |
| 458 | Controle de perfil e permissões. | Não iniciado | P2 — futuro | Sem autenticação/autorização. |
| 459 | Auditoria de alterações em dados institucionais. | Não iniciado | P2 — futuro | Não há mecanismo completo de proveniência, auditoria ou governança para este item. |
| 460 | Assinatura de pacotes de parâmetros. | Não iniciado | P2 — futuro | Não há mecanismo completo de proveniência, auditoria ou governança para este item. |
| 461 | Rollback para versão anterior. | Não iniciado | P1 — próximo | Backup manual permite restauração externa; não há rollback versionado no aplicativo. |
| 462 | Monitor de disponibilidade das fontes. | Não iniciado | P1 — próximo | Há endpoint de saúde do backend; ele não monitora a disponibilidade individual das fontes. |
| 463 | Ambiente separado para validação institucional. | Não iniciado | P2 — futuro | Não há mecanismo completo de proveniência, auditoria ou governança para este item. |

### Institucional — itens 464–482

Base inspecionada: [js/database/aircraftModels.js](js/database/aircraftModels.js), [js/database/aircraftRegistrations.js](js/database/aircraftRegistrations.js), [backend/app.js](backend/app.js).

| ID | Sugestão original | Estado | Prioridade | Evidência ou lacuna |
|---:|---|---|---|---|
| 464 | Perfis: piloto, instrutor, operações e administrador. | Não iniciado | P2 — futuro | Cadastro local existe; sem autenticação, perfis ou gestão institucional. |
| 465 | Aeronaves FAB predefinidas. | Implementado | Manter | Modelos FAB cadastrados, com modelos sem dados marcados como indisponíveis. |
| 466 | Matrículas e pesos básicos controlados. | Parcial | P1 — próximo | Matrículas/pesos básicos cadastrados; sem governança/aprovação/versionamento dos dados. |
| 467 | Parâmetros somente leitura para usuários comuns. | Parcial | P2 — futuro | Dados-base não têm editor na UI; sem autenticação ou autorização por perfil. |
| 468 | Configurações aprovadas por modelo. | Parcial | P1 — próximo | Há configurações predefinidas; não encontrei evidência de aprovação institucional. |
| 469 | Modelos de missão da unidade. | Não iniciado | P2 — futuro | Cadastro local existe; sem autenticação, perfis ou gestão institucional. |
| 470 | Checklist próprio da unidade. | Não iniciado | P2 — futuro | Cadastro local existe; sem autenticação, perfis ou gestão institucional. |
| 471 | Publicações internas vinculadas. | Não iniciado | P2 — futuro | Cadastro local existe; sem autenticação, perfis ou gestão institucional. |
| 472 | Avisos operacionais internos. | Não iniciado | P2 — futuro | Cadastro local existe; sem autenticação, perfis ou gestão institucional. |
| 473 | Registro de revisão pelo instrutor. | Não iniciado | P2 — futuro | Cadastro local existe; sem autenticação, perfis ou gestão institucional. |
| 474 | Painel de disponibilidade das aeronaves. | Não iniciado | P2 — futuro | Cadastro local existe; sem autenticação, perfis ou gestão institucional. |
| 475 | Planejamento de várias tripulações. | Não iniciado | P2 — futuro | Cadastro local existe; sem autenticação, perfis ou gestão institucional. |
| 476 | Exportação padronizada para apresentação. | Não iniciado | P2 — futuro | Cadastro local existe; sem autenticação, perfis ou gestão institucional. |
| 477 | Biblioteca de lições aprendidas. | Não iniciado | P2 — futuro | Cadastro local existe; sem autenticação, perfis ou gestão institucional. |
| 478 | Relacionar missão com relato ou ocorrência. | Não iniciado | P2 — futuro | Cadastro local existe; sem autenticação, perfis ou gestão institucional. |
| 479 | Estatísticas sem expor dados sensíveis. | Não iniciado | P2 — futuro | Cadastro local existe; sem autenticação, perfis ou gestão institucional. |
| 480 | Instância institucional separada da versão civil. | Não iniciado | P2 — futuro | Cadastro local existe; sem autenticação, perfis ou gestão institucional. |
| 481 | Administração central de parâmetros. | Não iniciado | P2 — futuro | Cadastro local existe; sem autenticação, perfis ou gestão institucional. |
| 482 | Distribuição controlada de atualizações. | Não iniciado | P2 — futuro | Cadastro local existe; sem autenticação, perfis ou gestão institucional. |

### Apoio e treinamento — itens 483–500

Base inspecionada: [js/ui](js/ui), [js/core](js/core).

| ID | Sugestão original | Estado | Prioridade | Evidência ou lacuna |
|---:|---|---|---|---|
| 483 | Explicar por que determinado alerta apareceu. | Não iniciado | P2 — futuro | Não há módulo de treinamento/explicação; implementar somente após estabilizar o planejamento. |
| 484 | Mostrar fórmula usada no cálculo. | Parcial | P1 — próximo | Fórmulas podem ser lidas no código; não são explicadas na interface. |
| 485 | Mostrar valores intermediários. | Parcial | P1 — próximo | Componentes de combustível/peso visíveis; falta trilha completa dos valores intermediários. |
| 486 | Referenciar o manual aplicável. | Não iniciado | P1 — próximo | Não há módulo de treinamento/explicação; implementar somente após estabilizar o planejamento. |
| 487 | Modo de treinamento com dados fictícios. | Não iniciado | P2 — futuro | Não há módulo de treinamento/explicação; implementar somente após estabilizar o planejamento. |
| 488 | Exercícios de planejamento. | Não iniciado | P2 — futuro | Não há módulo de treinamento/explicação; implementar somente após estabilizar o planejamento. |
| 489 | Missões-modelo. | Não iniciado | P1 — próximo | Não há módulo de treinamento/explicação; implementar somente após estabilizar o planejamento. |
| 490 | Comparar planejamento do aluno com uma solução de referência. | Não iniciado | P2 — futuro | Não há módulo de treinamento/explicação; implementar somente após estabilizar o planejamento. |
| 491 | Perguntas de conferência. | Não iniciado | P2 — futuro | Não há módulo de treinamento/explicação; implementar somente após estabilizar o planejamento. |
| 492 | Ocultar respostas até finalizar. | Não iniciado | P2 — futuro | Não há módulo de treinamento/explicação; implementar somente após estabilizar o planejamento. |
| 493 | Histórico de erros recorrentes. | Não iniciado | P2 — futuro | Não há módulo de treinamento/explicação; implementar somente após estabilizar o planejamento. |
| 494 | Glossário de NOTAM. | Não iniciado | P1 — próximo | Não há módulo de treinamento/explicação; implementar somente após estabilizar o planejamento. |
| 495 | Explicação visual do item 15. | Não iniciado | P1 — próximo | Não há módulo de treinamento/explicação; implementar somente após estabilizar o planejamento. |
| 496 | Visualização dos 6Ts em procedimentos. | Não iniciado | P2 — futuro | Não há módulo de treinamento/explicação; implementar somente após estabilizar o planejamento. |
| 497 | Linha do tempo IAF–IF–FAF–MAPt–MAHF. | Não iniciado | P2 — futuro | Não há módulo de treinamento/explicação; implementar somente após estabilizar o planejamento. |
| 498 | Mentalização guiada de procedimento. | Não iniciado | P2 — futuro | Não há módulo de treinamento/explicação; implementar somente após estabilizar o planejamento. |
| 499 | Anotações sobre cartas. | Não iniciado | P1 — próximo | Não há módulo de treinamento/explicação; implementar somente após estabilizar o planejamento. |
| 500 | Debrief comparando o planejado com o efetivamente realizado. | Não iniciado | P2 — futuro | Não há módulo de treinamento/explicação; implementar somente após estabilizar o planejamento. |

### Em voo — itens 501–520

Base inspecionada: [map/engine/openLayersMap.js](map/engine/openLayersMap.js), [js/models/missions.js](js/models/missions.js).

| ID | Sugestão original | Estado | Prioridade | Evidência ou lacuna |
|---:|---|---|---|---|
| 501 | Posição GPS da aeronave. | Não iniciado | Fora do foco | Não existe módulo em voo; fica fora do foco atual de planejamento pré-missão. |
| 502 | Moving map. | Não iniciado | Fora do foco | Não existe módulo em voo; fica fora do foco atual de planejamento pré-missão. |
| 503 | Track up. | Não iniciado | Fora do foco | Não existe módulo em voo; fica fora do foco atual de planejamento pré-missão. |
| 504 | Distância e tempo até o próximo fixo. | Não iniciado | Fora do foco | Não existe módulo em voo; fica fora do foco atual de planejamento pré-missão. |
| 505 | Desvio lateral da rota. | Não iniciado | Fora do foco | Não existe módulo em voo; fica fora do foco atual de planejamento pré-missão. |
| 506 | Groundspeed real. | Não iniciado | Fora do foco | Não existe módulo em voo; fica fora do foco atual de planejamento pré-missão. |
| 507 | ETA recalculado. | Não iniciado | Fora do foco | Não existe módulo em voo; fica fora do foco atual de planejamento pré-missão. |
| 508 | Consumo real versus planejado. | Não iniciado | Fora do foco | Não existe módulo em voo; fica fora do foco atual de planejamento pré-missão. |
| 509 | Troca rápida de perna. | Não iniciado | Fora do foco | Troca de perna existe no planejamento; não há fluxo operacional em voo, contexto desta seção. |
| 510 | Desvio para alternado. | Não iniciado | Fora do foco | Não existe módulo em voo; fica fora do foco atual de planejamento pré-missão. |
| 511 | Registro do trajeto. | Não iniciado | Fora do foco | Não existe módulo em voo; fica fora do foco atual de planejamento pré-missão. |
| 512 | Breadcrumb trail. | Não iniciado | Fora do foco | Não existe módulo em voo; fica fora do foco atual de planejamento pré-missão. |
| 513 | Alertas de espaço aéreo. | Não iniciado | Fora do foco | Não existe módulo em voo; fica fora do foco atual de planejamento pré-missão. |
| 514 | Proximidade de terreno. | Não iniciado | Fora do foco | Não existe módulo em voo; fica fora do foco atual de planejamento pré-missão. |
| 515 | Tela de instrumentos auxiliares. | Não iniciado | Fora do foco | Não existe módulo em voo; fica fora do foco atual de planejamento pré-missão. |
| 516 | Integração com GPS externo. | Não iniciado | Fora do foco | Não existe módulo em voo; fica fora do foco atual de planejamento pré-missão. |
| 517 | Integração com ADS-B. | Não iniciado | Fora do foco | Não existe módulo em voo; fica fora do foco atual de planejamento pré-missão. |
| 518 | Diário de bordo automático. | Não iniciado | Fora do foco | Não existe módulo em voo; fica fora do foco atual de planejamento pré-missão. |
| 519 | Debrief com trilha real. | Não iniciado | Fora do foco | Não existe módulo em voo; fica fora do foco atual de planejamento pré-missão. |
| 520 | Comparação planejado × realizado. | Não iniciado | Fora do foco | Não existe módulo em voo; fica fora do foco atual de planejamento pré-missão. |

## Resposta às 15 prioridades finais do texto anexado

| Prioridade original | Avaliação atual |
|---|---|
| Consolidar várias pernas | Núcleo implementado; faltam persistência, totais e briefing único. |
| Editor de rota no OpenLayers | Mapa desenha a rota; editor real está no painel. Clique/arrasto no mapa pendentes. |
| Distância, curso e EET por trecho | Distância e rumo verdadeiro no mapa; falta EET/navlog por trecho e rumo magnético. |
| Gerador/interpretador item 15 | Gerador DCT e sufixos básico; interpretador e validação completos pendentes. |
| Banco de aeródromos/fixos/auxílios/aerovias | Aeroportos/fixos/VOR via WFS; sem grafo de aerovias nem persistência/versionamento de navegação. |
| ENRC LOW como camada única | Implementado; orientação específica de L5/L8/L9 ainda precisa conferência. |
| Cache e validade das cartas | Sem cache persistente e sem validade/AIRAC na interface. |
| Integrar METAR/TAF REDEMET | Implementado por perna; faltam idade, validade por ETA e instantâneo salvo. |
| Credenciais e NOTAM AISWEB | Não iniciado no código; acesso específico precisa ser validado. |
| Painel consolidado de aeródromo | Não concluído; hoje os dados são fragmentados. |
| Combustível por perna | Implementado; corrigir unidades e acrescentar alertas/totais. |
| W&B com embarque/desembarque | Massa e carga por perna implementadas; CG/balanceamento ainda não. |
| Checklist de integridade | Não implementado; deve ser curto e conectado aos dados existentes. |
| Briefing PDF | Não implementado; briefing HTML atual não é exportação PDF. |
| Desempenho e GRAMET depois | Desempenho não implementado; GRAMET tem protótipo, mas permanece pausado. |

