# Cartas ENRC em PMTiles

As 18 cartas (L1–L9 e H1–H9) são armazenadas em um PMTiles por carta.
O catálogo `public/enrc-static/pdf-charts.json` preserva edição, georreferência,
extensão, densidade e limites de zoom. Cada URL inclui o hash do pacote.

O mapa utiliza os pacotes por padrão, com as mesmas imagens PNG de 512 × 512.
O navegador solicita somente intervalos HTTP necessários. Acima do zoom 10,
o WMS complementa o detalhe; a falha de uma carta restaura o WMS somente para ela.
O botão Cartas PDF permite alternar entre as cartas locais e o WMS.

## Preparar e migrar

1. Gerar os PNGs com `python scripts/prepare-enrc-pdf.py --all`.
2. Executar `python scripts/pack-enrc-pmtiles.py` (dependência Python: pmtiles).
3. O empacotador compara TODOS os blocos com os originais antes de publicar o catálogo.
4. Executar `node scripts/finish-enrc-migration.js`: valida hashes e tamanhos dos
   18 pacotes, move as pastas PNG para `tmp/enrc-png-backup/` e atualiza catálogos legados.
5. Executar os testes e `npm run build`.

O backup é local e ignorado pelo Git. O empacotador também pode ler esse backup.
O servidor precisa aceitar HTTP Range (206, Content-Range); o Express atual aceita.

PMTiles reduz a quantidade de arquivos, mantendo a qualidade. Não é uma
recompressão das imagens e não reduz automaticamente o histórico em `.git`.
Os PNGs antigos ficam preservados no backup e no histórico anterior.
O piloto L3 continua disponível como catálogo de compatibilidade.

## Resultado desta migração

- 36.734 blocos PNG das 18 cartas, todos comparados byte a byte com os pacotes.
- 18 PMTiles: 1.109.993.967 bytes (PNG original: 1.113.617.576 bytes).
- Redução de bytes: 0,325%; a principal redução é na quantidade de arquivos.
- 29 pastas de PNGs atuais e versões anteriores preservadas no backup local.
