import { updateMission } from "../core/missionEngine.js";
const payloadModes = [

    {
        id: "TOTAL",
        label: "Total"
    },

    {
        id: "AVERAGE",
        label: "Aproximado"
    },

    {
        id: "DETAILED",
        label: "Detalhado"
    }

];


export function createPayloadEditor(panel, leg) {
    const mission = { payload: leg.payload };
    let snapshot = "";
    function commit() {
        snapshot = JSON.stringify(leg.payload);
        updateTotals();
        updateMission();
    }
    function updateTotals() {
        for (const property of ["passengers", "cargo"]) {
            const total = panel.querySelector('[data-total="' + property + '"]');
            if (total) total.textContent = leg.payload.data.detailed[property].reduce((sum, item) => sum + item.weight, 0) + " kg";
        }
    }
    function refreshPayloadPanel() {

        panel.innerHTML = "";

        panel.appendChild(
            createPayloadModes()
        );

        const body = createPayloadBody();

            panel.appendChild(body);

            if (mission.payload.mode === "DETAILED") {

                refreshPassengerList();

                refreshCargoList();

            }

    }

    function createTotalPayloadRow() {

        const row = document.createElement("div");

        row.classList.add("field");

        const label = document.createElement("span");

        label.classList.add("field-label");

        label.textContent = "Payload";

        const input = document.createElement("input");

        input.type = "number";

        input.classList.add("field-control");

        input.value = mission.payload.data.total.weight;

        input.addEventListener("change", () => {

            mission.payload.data.total.weight =

                Number(input.value);

            refreshPayloadPanel();
            commit();

        });

        row.appendChild(label);

        row.appendChild(input);

        return row;

    }

    function createAveragePayloadRow() {

        const container = document.createElement("div");

        container.appendChild(

            createAverageField(
                "Passengers",
                "passengers"
            )

        );

        container.appendChild(

            createAverageField(
                "Passenger Weight",
                "passengerWeight"
            )

        );

        container.appendChild(

            createAverageField(
                "Baggage",
                "baggage"
            )

        );

        container.appendChild(

            createAverageField(
                "Baggage Weight",
                "baggageWeight"
            )

        );

        return container;

    }

    function createAverageField(labelText, property) {

        const row = document.createElement("div");

        row.classList.add("field");

        const label = document.createElement("span");

        label.classList.add("field-label");

        label.textContent = labelText;

        const input = document.createElement("input");

        input.type = "number";

        input.classList.add("field-control");

        input.value =

            mission.payload.data.average[property];

        input.addEventListener("change", () => {

            mission.payload.data.average[property] =

                Number(input.value);

            refreshPayloadPanel();
            commit();

        });

        row.appendChild(label);

        row.appendChild(input);

        return row;

    }

    function createDetailedPayloadRow() {

        const container = document.createElement("div");

        // PASSENGERS

        const passengerHeader = document.createElement("div");

        passengerHeader.classList.add("payload-header");

        const title = document.createElement("h4");

        title.textContent =
            `Passengers (${mission.payload.data.detailed.passengers.length})`;

        const total = document.createElement("span");

        total.dataset.total = "passengers";

        total.classList.add("payload-total");

        total.textContent =
            `${mission.payload.data.detailed.passengers.reduce(
                (sum,p)=>sum+p.weight,
                0
            )} kg`;

        passengerHeader.appendChild(title);

        passengerHeader.appendChild(total);

        container.appendChild(passengerHeader);

        const passengerPanel = document.createElement("div");
        passengerPanel.className = "payload-passenger-list";
        container.appendChild(passengerPanel);

        const addPassenger = document.createElement("button");
        addPassenger.textContent = "+ Add Passenger";
        addPassenger.classList.add("payload-add");

        addPassenger.onclick = () => {

            mission.payload.data.detailed.passengers.push({

                name: "",
                weight: 90

            });

            refreshPayloadPanel();
            commit();

        };

        container.appendChild(addPassenger);

        // CARGO

        const cargoHeader = document.createElement("div");

        cargoHeader.classList.add("payload-header");

        cargoHeader.style.marginTop = "28px";

        const cargoTitle = document.createElement("h4");

        cargoTitle.textContent =
            `Cargo (${mission.payload.data.detailed.cargo.length})`;

        const cargoTotal = document.createElement("span");

        cargoTotal.dataset.total = "cargo";

        cargoTotal.classList.add("payload-total");

        cargoTotal.textContent =
            `${mission.payload.data.detailed.cargo.reduce(
                (sum,c)=>sum+c.weight,
                0
            )} kg`;

        cargoHeader.appendChild(cargoTitle);

        cargoHeader.appendChild(cargoTotal);

        container.appendChild(cargoHeader);

        const cargoPanel = document.createElement("div");
        cargoPanel.className = "payload-cargo-list";
        container.appendChild(cargoPanel);

        const addCargo = document.createElement("button");
        addCargo.textContent = "+ Add Cargo";
        addCargo.classList.add("payload-add");

        addCargo.onclick = () => {

            mission.payload.data.detailed.cargo.push({

                description: "",
                weight: 20

            });

            refreshPayloadPanel();
            commit();

        };

        container.appendChild(addCargo);

        return container;

    }

    function createPayloadModes() {

        const container = document.createElement("div");

        container.classList.add("payload-modes");

        payloadModes.forEach(mode => {

            const button = document.createElement("button");

            button.textContent = mode.label;

            button.classList.add("payload-mode");

            if (mission.payload.mode === mode.id) {

                button.classList.add("selected");

            }

            button.addEventListener("click", () => {

                mission.payload.mode = mode.id;

                refreshPayloadPanel();

                commit();

            });

            container.appendChild(button);

        });

        return container;

    }

    function createPayloadBody() {

        switch (mission.payload.mode) {

            case "TOTAL":

                return createTotalPayloadRow();

            case "AVERAGE":

                return createAveragePayloadRow();

            case "DETAILED":

                return createDetailedPayloadRow();

        }

    }   

    function refreshPassengerList() {

        const list = panel.querySelector(".payload-passenger-list");

        if (!list) return;

        list.innerHTML = "";

        mission.payload.data.detailed.passengers.forEach(

            (passenger,index)=>{

                list.appendChild(

                    createPassengerRow(

                        passenger,

                        index

                    )

                );

            }

        );

    }

    function refreshCargoList() {

        const list = panel.querySelector(".payload-cargo-list");

        if (!list) return;

        list.innerHTML = "";

        mission.payload.data.detailed.cargo.forEach((cargo, index) => {

            list.appendChild(

                createCargoRow(
                    cargo,
                    index
                )

            );

        });

    }

    function createCargoRow(cargo, index) {

        const row = document.createElement("div");

        row.classList.add("crew-row");

        row.appendChild(

            createCargoDescription(cargo)

        );

        row.appendChild(

            createCargoWeight(cargo)

        );

        row.appendChild(

            createCargoRemove(index)

        );

        return row;

    }

    function createCargoDescription(cargo) {

        const input = document.createElement("input");

        input.classList.add("field-control");

        input.placeholder = "Description";

        input.value = cargo.description;

        input.addEventListener("input", () => {

            cargo.description = input.value;

        });

        return input;

    }

    function createCargoWeight(cargo) {

        const input = document.createElement("input");

        input.type = "number";

        input.classList.add("crew-weight");

        input.value = cargo.weight;

        input.addEventListener("input", () => {

            cargo.weight = Number(input.value);

            commit();

        });

        return input;

    }

    function createCargoRemove(index) {

        const button = document.createElement("button");

        button.textContent = "×";

        button.classList.add("crew-remove");

        button.onclick = () => {

            mission.payload.data.detailed.cargo.splice(index, 1);

            refreshPayloadPanel();

            commit();

        };

        return button;

    }

    function createPassengerRow(passenger,index){

        const row=document.createElement("div");

        row.classList.add("crew-row");

        row.appendChild(
            createPassengerName(passenger)
        );

        const weight = createPassengerWeight(passenger);

        row.appendChild(weight.input);

        row.appendChild(weight.unit);

        row.appendChild(
            createPassengerRemove(index)
        );

        return row;

    }

    function createPassengerName(passenger){

        const input=document.createElement("input");

        input.classList.add("field-control");

        input.placeholder="Passenger";

        input.value=passenger.name;

        input.addEventListener("input",()=>{

            passenger.name=input.value;

        });

        return input;

    }

    function createPassengerWeight(passenger){

        const input=document.createElement("input");

        input.type="number";

        input.classList.add("crew-weight");

        const unit = document.createElement("span");

        unit.textContent = "kg";

        unit.classList.add("payload-unit");

        input.value=passenger.weight;

        input.addEventListener("input",()=>{

            passenger.weight=Number(input.value);

            commit();

        });

        return {input, unit};

    }

    function createPassengerRemove(index){

        const button=document.createElement("button");

        button.textContent="×";

        button.classList.add("crew-remove");

        button.onclick=()=>{

            mission.payload.data.detailed.passengers.splice(index,1);

            refreshPayloadPanel();

            commit();

        };

        return button;

    }

    return function refresh() {
        const current = JSON.stringify(leg.payload);
        if (current !== snapshot) {
            refreshPayloadPanel();
            snapshot = current;
        }
    };
}
