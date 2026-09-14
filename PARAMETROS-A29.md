# Parâmetros do A-29

Em `js/database/aircraftModels.js`, o A-29 está preparado com `fuel.defaultUnit: "KG"`.

Preencha os campos atualmente `null` com os valores de referência:

- `fuelFlow`: consumo em **kg/h**.
- `maxFuel` e `taxiFuel`: **kg**.
- `cruiseSpeed`: **kt**.
- `procedureTime` e `reserveTime`: **minutos**.
- Limites de peso: **kg**, como nas demais aeronaves.

Cadastre também as matrículas em `js/database/aircraftRegistrations.js`, associadas ao modelo A-29, com `basicWeight` em kg. Depois altere `planningAvailable` para `true`. Não foram atribuídos valores de desempenho nem matrículas fictícias.

Ao selecionar a aeronave, o combustível passa automaticamente à unidade do modelo em todos os painéis. Os valores já preenchidos e os reabastecimentos de todas as pernas são convertidos entre LB e KG; os cálculos automáticos são refeitos com o novo modelo. O combustível do A-29 já representa massa em kg no cálculo do peso.

Os arredondamentos continuam em centenas da unidade da aeronave: mínimo para cima e transferência para baixo. As missões exportadas registram a unidade dos valores, e os arquivos antigos continuam sendo interpretados em LB.
