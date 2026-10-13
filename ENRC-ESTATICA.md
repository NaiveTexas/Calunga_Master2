# ENRC est?tica: teste das cartas L e H at? zoom 10

> Este documento descreve o armazenamento PNG anterior. A versão atual usa
> PMTiles para as 18 cartas; veja [ENRC-PMTILES.md](ENRC-PMTILES.md).

O gerador `scripts/prepare-enrc.py` consulta os ?ndices do DECEA e prepara
as 18 cartas nos n?veis 5 a 10, em PNG de 512 ? 512 com densidade 2?.
Estimativa: 37.366 arquivos; o tamanho real depende do conte?do.

Execute com Python 3: `python scripts/prepare-enrc.py`.
O download usa quatro conex?es e tr?s tentativas por arquivo. Para retomar
ap?s uma interrup??o, execute novamente: os PNGs existentes s?o reutilizados.
Cada carta s? entra no manifesto ap?s concluir todos os seus blocos.
Enquanto o download estiver incompleto, as demais continuam pelo WMS.
Atualize a p?gina para ler o manifesto atualizado.

A vers?o `2026-09-22-z10` identifica a captura, n?o a edi??o AIRAC.
Para atualizar as cartas futuramente, altere VERSION antes de executar.
N?o reutilize a mesma vers?o para dados novos: os arquivos t?m cache longo.

O mapa mant?m os arquivos est?ticos como fundo acima do zoom 10, mas
busca detalhe adicional no WMS. Um erro de arquivo desativa apenas aquela
carta est?tica durante a sess?o, restaurando sua consulta WMS.

Ap?s concluir o download, execute `npm run build` para copiar todos os arquivos
para dist. O build feito antes da conclus?o cont?m somente os arquivos dispon?veis.
O backend local serve public/enrc-static diretamente. Nenhum deploy ? autom?tico.

Para testar, alterne L/H e zoom 5?10: cartas completas devem vir de
/enrc-static/. Acima de 10 haver? consultas WMS. O aplicativo n?o baixa
todo o pacote para o dispositivo: solicita somente os blocos necess?rios.
