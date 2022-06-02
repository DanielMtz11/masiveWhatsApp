const { WABAClient, WABAErrorAPI } = require("whatsapp-business");

const client = new WABAClient({
    accountId: 100156809383502,//115705297790315,
    apiToken: 'EAAIbR1eGZBdgBAJu7DAU4ykcApfu85knbX26Erq6jgLtynmBo6hHdUej7i6uhiWFCiBZAOgTDbwZBZCRXGRwuzcD92dC6jhjWZAkNC9TuOjBxDC1f1gYMktB2Q9Noa6ZAAIykZBFKTQq1UC91VPxyfL2LAEZCTKY6esaWgYSvDdTBlSJxKqxwOQJm9IZAQMduf1JG3QUySVdncwZDZD',
    phoneId: 111578454890042//1418811368578018,
});

const foo = async () => {
	try {
		const res = await client.getBusinessPhoneNumbers();
		console.log(res);
	} catch (err) {
		console.error(err.message);
	}
};

const sendTextMessage = async (body, to) => {
	try {
		const res = await client.sendMessage({ type: "text", text: { body }, to });
		console.log(res);
	} catch (err) {
		console.error(err);
	}
};

//foo();
sendTextMessage("HOLA!!", "573057538309");