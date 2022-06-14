//const { WABAClient, WABAErrorAPI } = require("whatsapp-business");
const res = require('express/lib/response');
const { json } = require('express/lib/response');
const fetch = require('node-fetch');

class WB {
    authToken = ''
    phoneNumberID = ''
    whatsappBusinessID = ''

    constructor({authToken, phoneNumberID, whatsappBusinessID}) {
        this.authToken = authToken;
        this.phoneNumberID = phoneNumberID;
        this.whatsappBusinessID = whatsappBusinessID;
        this.url = process.env.WB_URL;
    }
    
    async sendTextMessage(phoneNumber, message) {
        let response = await fetch(this.url + '/' + this.phoneNumberID + '/messages', {
            method: 'post',
            body: JSON.stringify({
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: phoneNumber,
                type: "text",
                text: {
                    "preview_url": false,
                    "body": message
                }
            }),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.authToken
            }
        });

        return await response.json();
    }

    async getMessageTemplates() {
        let response = await fetch(this.url + '/' + this.whatsappBusinessID + '/message_templates', {
            headers: {
                'Authorization': 'Bearer ' + this.authToken
            }
        });

        return await response.json();
    }
}

module.exports = WB