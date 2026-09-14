# Salvar e recuperar a missão

No topo do painel de planejamento, ficam **Exportar missão**, **Importar missão** e **Nova missão**, junto do estado do salvamento.

- O rascunho é salvo automaticamente neste navegador após alterações. Ao abrir novamente, o Calunga recupera todas as pernas, aeronave, tripulação, carga, combustível e procedimentos. Os resultados são recalculados.
- **Exportar missão** baixa um arquivo `.json`. Guarde uma cópia para backup ou abra o arquivo pelo botão Importar em outro dispositivo.
- **Importar missão** valida o arquivo, pede confirmação para substituir a missão atual e recarrega a página. Exporte a missão atual antes se quiser mantê-la.
- **Nova missão** pede confirmação, remove o rascunho e recarrega com os padrões iniciais, incluindo FL100 e a próxima hora cheia em UTC.

Uma missão recuperada mantém seu nível e seus horários. O salvamento é local, por navegador e endereço do site; não há sincronização entre dispositivos. Limpar os dados do site pode apagar o rascunho. Os arquivos exportados continuam disponíveis independentemente dele.

Caso o armazenamento esteja indisponível ou cheio, o painel informa a falha. Um rascunho inválido é preservado e o salvamento automático fica suspenso até importar uma missão válida ou iniciar uma nova. A recuperação continua dependendo da inicialização dos dados de navegação; esta alteração não adiciona funcionamento offline.

O formato `calunga-mission`, versão 1, registra entradas e escolhas manuais. Dados derivados, como ETA, distância, consumo e peso, não são usados como resultados importados. Coordenadas e referências dos pontos são conservadas no arquivo; meteorologia é consultada novamente.
