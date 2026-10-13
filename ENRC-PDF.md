# ENRC L e H a partir dos GeoPDFs

Os blocos agora são distribuídos em 18 arquivos PMTiles, sem alterar os pixels.
Veja [ENRC-PMTILES.md](ENRC-PMTILES.md) para empacotamento e backup dos PNGs.

As 18 cartas (L1–L9 e H1–H9) usam blocos locais de 512 × 512 pixels,
com densidade 2×, nos níveis 5 a 10. A opção **Cartas PDF** começa ligada;
desligue-a para comparar com o WMS. LOW/HIGH continuam selecionando
o tipo de carta. Acima do zoom 10 há ampliação da imagem local enquanto o WMS
fornece detalhe adicional. Abaixo de 5 as cartas ficam ocultas.

O conjunto gerado contém 36.734 blocos e ocupa 1.113.617.576 bytes
(aproximadamente 1,11 GB), sem contar os PDFs e os testes anteriores.

As imagens são carregadas conforme a região visível: o dispositivo não baixa
o pacote inteiro. Um arquivo que falhar restaura a fonte anterior somente
para aquela carta, durante a sessão. Os índices remotos não bloqueiam os PDFs.

## Origem e atualização

Os PDFs foram baixados dos links do [índice oficial do AISWEB](https://aisweb.decea.mil.br/inc/cartas/enrc/index.cfm).
`assets/charts/enrc-current/sources.json` registra URL, edição e SHA-256 de cada
PDF. As edições individuais também aparecem no título do botão Cartas PDF.
Não há atualização automática: é necessário baixar e gerar uma nova versão.

1. `python scripts/download-enrc-pdfs.py`
2. `python scripts/prepare-enrc-pdf.py --all --workers 8`
3. `python scripts/check-enrc-pdfs.py`
4. `python scripts/check-enrc-tiles.py`
5. Conferir as imagens de QA em `tmp/pdfs/`.
6. Executar `python scripts/pack-enrc-pmtiles.py` e `node scripts/finish-enrc-migration.js`.
7. Executar os testes e `npm run build`.

Dependências Python: PyMuPDF, numpy, Pillow e pyproj. O conversor também procura
as bibliotecas em `tmp/enrc-python`, pasta ignorada pelo Git.

Cada carta é reprojetada do sistema definido no GeoPDF para Web Mercator.
A moldura é detectada individualmente; uma detecção ambígua interrompe a geração.
O ajuste dos controles deve ter erro inferior a 2 m, e o erro da aproximação
de reprojeção nos centros da malha deve ser inferior a 0,1 pixel.
Esses valores verificam consistência matemática, não precisão aeronáutica absoluta.

As URLs incluem o hash do PDF e a versão do algoritmo. Arquivos existentes da
mesma versão são reaproveitados ao retomar uma geração interrompida. Ao modificar
o algoritmo de imagem, incremente sua versão. Nunca altere PNGs já publicados
sob uma URL imutável. O catálogo `public/enrc-static/pdf-charts.json` só é
substituído após concluir todas as cartas. Imagens têm cache de 30 dias;
catálogos JSON são revalidados.

O backend serve os arquivos locais com a autenticação existente. O build copia
os arquivos para dist; não foi feito deploy nem configurada CDN. O piloto L3
antigo foi preservado para comparação e testes, mas não é mais a fonte padrão.
