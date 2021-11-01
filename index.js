import puppeteer from "puppeteer";

(async () => {
	const browser = await puppeteer.launch({ headless: false });
	const page = await browser.newPage();

	await login(page, "39051380", "giladon95");

	await irAHorariosComedorBuscado(page, "Siberia");

	for (let flag = true; flag; flag) {
		flag = await comprarTodosLosMenues({
			page,
			horaInicial: 12,
			horaFinal: 13,
		});
	}

	for (let flag = true; flag; flag) {
		flag = await comprarTodosLosMenues({
			page,
			horaInicial: 12,
			horaFinal: 15,
			paraLlevar: true,
		});
	}

	await browser.close();
})();

async function comprarTodosLosMenues({
	page,
	horaInicial,
	horaFinal,
	paraLlevar = false,
	isForNextMonth = false,
}) {
	try {
		await page.evaluate(
			(horaInicial, horaFinal, paraLlevar) => {
				const reserveTurn = document.querySelectorAll(`.reservar-servicio`);

				let turn12to13reserveContainer;

				for (const element of reserveTurn) {
					if (
						element.innerHTML.includes(horaInicial) &&
						element.innerHTML.includes(horaFinal) &&
						(paraLlevar || !element.innerHTML.includes("llevar"))
					) {
						turn12to13reserveContainer = element;
					}
				}

				turn12to13reserveContainer.click();
			},
			horaInicial,
			horaFinal,
			paraLlevar
		);

		await page.waitForSelector(".calendario-dia-turno");
		await page.waitForTimeout(3000);

		await page.screenshot({ path: "comedores5.jpg" });

		if (isForNextMonth) {
			await page.evaluate(() => {
				const buttons = document.querySelectorAll(`.btn-transparente`);

				let nextMonthButton;

				for (const element of buttons) {
					if (element.attributes[0].textContent.includes("subirMes")) {
						nextMonthButton = element;
					}
				}

				nextMonthButton.click();
			});
		}

		await page.waitForSelector(".calendario-dia-turno");
		await page.waitForTimeout(3000);
		await page.waitForSelector(".calendario-dia-acciones-toggle");

		await page.click(
			`.calendario-dia-turno[data-bind="click: $component.onClickDia, clickBubble: false"]`
		);

		await page.waitForSelector(".swal2-confirm");
		await page.waitForTimeout(3000);
		await page.click(".swal2-confirm");

		await page.waitForTimeout(5000);
		await page.waitForSelector(`button[data-bind="click: cerrarTicket"]`);

		await page.waitForTimeout(3000);
		await page.click(`button[data-bind="click: cerrarTicket"]`);
		return true;
	} catch (error) {
		console.log(error);
		await irAHorariosComedorBuscado(page, "Siberia");
		return false;
	}
}

async function irAHorariosComedorBuscado(page, palabraClave) {
	await page.goto("https://comedores.unr.edu.ar/comedor-reserva/reservar");
	await page.waitForSelector(".reservar-comedores-contenedor");
	await page.waitForTimeout(3000);

	await page.evaluate(async (palabraClave) => {
		const reserveCards = document.querySelectorAll(`.reservar-comedor`);

		let wantedReserveCard;

		for await (let reserveCard of reserveCards) {
			if (reserveCard.innerHTML.includes(palabraClave)) {
				wantedReserveCard = reserveCard;
			}
		}

		const wantedButtonContainer = wantedReserveCard.lastElementChild;

		const wantedButton = wantedButtonContainer.firstElementChild;
		wantedButton.click();
	}, palabraClave);

	await page.waitForSelector(".reservar-servicio");
	await page.waitForTimeout(3000);
}

async function login(page, dni, clave) {
	await page.goto("https://comedores.unr.edu.ar/inicio");

	await page.type(`.form-control[name="dni"]`, dni);
	await page.type(`.form-control[name="clave"]`, clave);

	await page.click(`button[name="botones[botonEnviar]"]`);
	await page.waitForSelector(".card-saldo-comensal-saldo");
	await page.waitForTimeout(3000);
}
