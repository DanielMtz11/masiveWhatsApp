const fetch = require('node-fetch');
const logger = require('./logger');

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
    
    async sendMessage(phoneNumber, message, type = 'text', flow = {}) {
        let body = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: phoneNumber,
            type
        };

        body[type] = {};
        body[type][type == 'text' ? 'body' : 'link'] = (type != 'text' ? (process.env.PUBLIC_URL + 'files/' + flow.id + '/') : '') + message;

        logger.info('Sending message data:', body)

        let response = await fetch(this.url + '/' + this.phoneNumberID + '/messages', {
            method: 'post',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.authToken
            }
        });

        return await response.json();
    }

    async sendMessageTemplate(phoneNumber, template, flow = {}) {
        let components = [];

        let formatComponentParameter = (format, value) => {
            let parameter = { type: format };
            parameter[format] = format == 'text' ? value : { link: (process.env.PUBLIC_URL + 'files/' + flow.id + '/' + value) };
            if (format == 'document') parameter[format]['filename'] = value;
            return parameter;
        };

        for (let type in template.components) {
            let component = template.components[type];

            if (component.value == '') continue;

            if (typeof component.value == 'string') {
                component.value = [component.value];
            }

            components.push({
                type,
                parameters: component.value.map(item => (formatComponentParameter(component.format.toLowerCase(), item)))
            });
        }

        let body = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: phoneNumber,
            type: "template",
            template: {
                name: template.code,
                language: {
                    code: template.language
                },
                components: components
            }
        };

        logger.info('Sending template data:', body);

        let response = await fetch(this.url + '/' + this.phoneNumberID + '/messages', {
            method: 'post',
            body: JSON.stringify(body),
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