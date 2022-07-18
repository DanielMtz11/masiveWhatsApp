jsPlumbBrowserUI.ready(setJSPlumbInstance);
for (let item of Array.from(document.querySelectorAll('.fb-item'))) {
    item.style.opacity = '0.5';
    item.style.pointerEvents = 'none';
}
var canvas = document.getElementById('canvas');
var jspInstance = undefined;
var triggers = [];
var templates = {};
async function setJSPlumbInstance() {
    jspInstance = jsPlumbBrowserUI.newInstance({
        dragOptions: { containment: 'parentEnclosed', grid: { w: 15, h: 15 } },
        container: canvas,
        hoverPaintStyle: { stroke: 'green' }
    });

    jspInstance.batch(() => {
        jspInstance.bind('connection', (info, event) => {
            info.connection.connector.canvas.style.zIndex = Math.min(...[Number(info.source.style.zIndex), Number(info.target.style.zIndex)]) + 1;
            console.log(info, event);
        });

        jspInstance.bind('connection:detach', (info, event) => {
            console.log(info, event);
        });

        jspInstance.bind('drag:move', (info, event) => {
            let element = jspInstance.getManagedElements()[info.el.id];
            let connections = element.connections;
            for (let connection of connections) {
                connection.connector.canvas.style.zIndex = Math.min(...[Number(connection.source.style.zIndex), Number(connection.target.style.zIndex)]) + 1;
            }
        });

        jspInstance.bind('drag:stop', (info, event) => {
            let element = jspInstance.getManagedElements()[info.el.id];
            let connections = element.connections;
            for (let connection of connections) {
                connection.connector.canvas.style.zIndex = Math.min(...[Number(connection.source.style.zIndex), Number(connection.target.style.zIndex)]) + 1;
            }
            console.log(info, event);
        });

        jspInstance.bind('connection:move', (info, event) => {
            console.log(info, event);
        });

        jspInstance.bind('click', (component, event) => {
            console.log(component, event);
        });
    });

    let responseTriggers = await fetch('/triggers/all?status=active')
    responseTriggers = await responseTriggers.json();
    if (responseTriggers.result === true) {
        triggers = responseTriggers.triggers;
    } else {
        Swal.fire('Error!', 'Error getting the list of triggers...', 'error');
        setTimeout(() => location.href = '/triggers', 2000);
        return;
    }

    let responseTemplates = await fetch('/flows/message/templates');
    responseTemplates = await responseTemplates.json();
    if (responseTemplates.result === true) {
        templates = responseTemplates.data.templates;
    } else {
        document.getElementById('template-item').disabled = true;
        document.getElementById('template-item').style.opacity = '0.5';
        document.getElementById('template-item').style.pointerEvents = 'none';
        /*Swal.fire('Error!', 'Error getting the list of templates from Whatsapp Bussines...', 'error');
        setTimeout(() => location.href = '/', 2000);
        return;*/
    }

    if (flowInfo.id !== undefined) {
        recoverFlow(flowInfo.detail);
    }

    for (let item of Array.from(document.querySelectorAll('.fb-item'))) {
        item.style.opacity = '1';
        item.style.pointerEvents = '';
    }
}

function addEndpointsToItems(selector) {
    let boxes = Array.from(document.querySelectorAll(selector));
    for (let box of boxes) {
        jspInstance.addEndpoint(box, { anchor: 'Right', uuid: box.id + '-source' }, {
            endpoint: { type: 'Dot', options: { radius: 4, cssClass: 'dot-source dot-source-' + box.id } },
            paintStyle: { fill: 'gray' },
            source: true,
            scope: 'green',
            hoverPaintStyle: { fill: 'green' },
            connectorOverlays: [ { type:'Arrow', options: { location: 1 } } ],
            connectorStyle: { stroke: 'gray', strokeWidth: 3 },
            connector: 'Flowchart',
            maxConnections: 1,
            target: false,
            hoverClass: 'dot-source-hover'
        });

        document.querySelector('.dot-source-' + box.id).style.zIndex = Number(box.style.zIndex) + 1;

        if (box.dataset.type == 'trigger') continue;

        jspInstance.addEndpoint(box, { anchor: 'Left', uuid: box.id + '-target' }, {
            endpoint: { type:'Dot', options: { radius: 6, cssClass: 'dot-target dot-target-' + box.id } },
            paintStyle: { fill: '' },
            scope: 'green',
            source: false,
            connector: 'Flowchart',
            maxConnections: 1,
            target: true,
            hoverClass: 'dot-target-hover'
        });

        document.querySelector('.dot-target-' + box.id).style.zIndex = Number(box.style.zIndex) + 1;
    }
}

function categorizeEndpoints(endpoints) {
    let source = undefined;
    let target = undefined;
    for (let endpoint of endpoints) {
        if (endpoint.isSource) source = endpoint;
        if (endpoint.isTarget) target = endpoint;
    }
    return { source, target };
}

function recoverFlow(details) {
    let itemCount = 0;
    for (let connection of details) {
        let source = document.getElementById(connection.source.id);
        let target = document.getElementById(connection.target.id);

        if (source === null) {
            addItem(connection.source.type, connection.source.id, connection.source.data, true, itemCount * 5);
            itemCount++;
        }
        
        if (target === null) {
            addItem(connection.target.type, connection.target.id, connection.target.data, true, itemCount * 5);
            itemCount++;
        }
    }

    setTimeout(() => {
        for (let connection of details) {        
            let source = document.getElementById(connection.source.id);
            let target = document.getElementById(connection.target.id);
    
            if (source.style.top !== (connection.source.top + 'px') || source.style.left !== connection.source.left + 'px') {
                source.style.top = connection.source.top + 'px';
                source.style.left = connection.source.left + 'px';
                jspInstance.revalidate(source);
            }
            
            if (target.style.top !== (connection.target.top + 'px') || target.style.left !== connection.target.left + 'px') {
                target.style.top = connection.target.top + 'px';
                target.style.left = connection.target.left + 'px';
                jspInstance.revalidate(target);
            }
    
            let connectionItem = jspInstance.connect({ uuids: [ connection.source.uuid, connection.target.uuid ] });
            connectionItem.connector.canvas.style.zIndex = Math.min(...[Number(source.style.zIndex), Number(target.style.zIndex)]);
        }

        for (let item of Array.from(document.querySelectorAll('.fb-item'))) {
            item.style.opacity = '1';
            item.style.pointerEvents = '';
        }
    }, 300);
}

function exportFlow() {
    let details = [];
    let steps = {};
    for (let connection of jspInstance.connections) {
        let dataSource = {};
        let dataTarget = {};
    
        try { dataSource = JSON.parse(decodeURIComponent(connection.source.dataset.data)); } catch(err) { dataSource = {} }
        try { dataTarget = JSON.parse(decodeURIComponent(connection.target.dataset.data)); } catch(err) { dataTarget = {} }
    
        let source = {
            id: connection.source.id,
            uuid: connection.endpoints[0].uuid,
            top: jspInstance.getManagedElements()[connection.source.id].viewportElement.y,
            left: jspInstance.getManagedElements()[connection.source.id].viewportElement.x,
            type: connection.source.dataset.type,
            data: dataSource,
        };
        let target = {
            id: connection.target.id,
            uuid: connection.endpoints[1].uuid,
            top: jspInstance.getManagedElements()[connection.target.id].viewportElement.y,
            left: jspInstance.getManagedElements()[connection.target.id].viewportElement.x,
            type: connection.target.dataset.type,
            data: dataTarget,
        };

        if (steps[connection.source.id] === undefined) {
            steps[connection.source.id] = {
                type: source.type,
                data: source.data
            };
        }

        if (steps[connection.target.id] === undefined) {
            steps[connection.target.id] = {
                type: target.type,
                data: target.data
            };
        }

        details.push({source, target});
    }

    return { steps: Object.values(steps), detail: details };
}

function addItem(type, id = '', data = '', recovering = false, zIndex = '') {
    let itemHTML = '';

    if (id === '') {
        id = `flow-item-${Math.random().toString(16).slice(8)}`;
    }

    if (zIndex === '') {
        zIndex = Object.keys(jspInstance.getManagedElements()).length * 5;
    }

    let dataJSON = '';
    if (data !== '') {
        if (typeof data === 'string') {
            dataJSON = data;
            data = JSON.parse(data);
        } else {
            dataJSON = JSON.stringify(data);
            console.log(dataJSON);
        }
    } else {
        dataJSON = '{}';
    }

    let selected = '';
    switch(type) {
        case 'trigger':
            if (typeof data !== 'string') {
                selected = data.trigger;
            }
            let optionsTrigger = triggers.map(item => `<option value="${item.id}" ${selected == item.id ? 'selected' : '' }>${item.name}</option>`).join('');

            itemHTML += `
                <div class="flow-item" id="${id}" style="z-index: ${zIndex}; width: 250px; background: white; background: linear-gradient(0, white 80%, white 80%, cornflowerblue 80%, cornflowerblue 100%);" data-type="${type}" data-data="${encodeURIComponent(dataJSON)}">
                    <i class="fa fa-duotone fa-xmark" style="color: white; cursor: pointer; position: absolute;position: absolute; top: 6px; right: 6px;" onclick="removeItem(this.parentElement)"></i>
                    <div class="columns is-grapless" style="height: 35px;">
                        <span class="icon-text" style="color: white; font-weight: bold;">
                            <span class="icon">
                                <i class="fa fa-rocket"></i>
                            </span>
                            <span>Once trigger is executed:</span>
                        </span>
                    </div>
                    <div class="columns is-grapless is-vcentered has-text-centered">
                        <div class="column flow-item-content">
                            <div class="select is-link is-rounded">
                                <select id="${id}-select" style="max-width: 200px;" onchange="updateTriggerSelected(this, this.parentElement.parentElement.parentElement.parentElement)">
                                    <option value="">Select a trigger</option>
                                    ${optionsTrigger}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="columns is-grapless is-vcentered has-text-centered">
                        <div class="column has-text-centered">
                            <button class="button is-warning is-light" onclick="triggerAction('edition', '${id}-select')"><i class="fa fa-duotone fa-pen-to-square"></i>&nbsp; Edit</button>
                            &nbsp;
                            <button class="button is-info is-light" onclick="triggerAction('creation')"><i class="fa fa-duotone fa-plus"></i>&nbsp; New</button>
                        </div>
                    </div>
                </div>
            `;
            break;
        case 'message':
            selected = 'text';
            if (typeof data !== 'string') {
                selected = data.type;
            }

            switch(selected) {
                case 'video':
                case 'image':
                case 'audio':
                case 'file':
                    itemHTML += `
                        <div class="flow-item" id="${id}" style="z-index: ${zIndex}; width: 250px; background: white; background: linear-gradient(0, white 82%, white 82%, mediumseagreen 82%, mediumseagreen 100%);" data-type="${type}" data-data="${encodeURIComponent(dataJSON)}">
                            <i class="fa fa-duotone fa-xmark" style="color: white; cursor: pointer; position: absolute; top: 6px; right: 6px;" onclick="removeItem(this.parentElement)"></i>
                            <i class="fa fa-duotone fa-eye" style="display: block;color: gray; cursor: pointer; position: absolute; top: 45px; right: 5px; z-index: 0; font-size: 12px;" onclick="previewFile(this.parentElement, this)"></i>
                            <div class="columns is-grapless" style="height: 35px;">
                                <span class="icon-text" style="color: white; font-weight: bold;">
                                    <span class="icon">
                                        <i class="fa fa-message"></i>
                                    </span>
                                    <span>Send a message:</span>
                                </span>
                            </div>
                            <div class="columns is-grapless is-vcentered has-text-centered">
                                <div class="column flow-item-content">
                                    <div class="file has-name is-boxed is-small" data-parent="${id}">
                                        <label class="file-label">
                                            <input class="file-input" data-parent="${id}" type="file" id=${id + '-file'} accept="${selected !== 'file' ? (selected + '/*') : ''}" onchange="fileSelected(this, '${selected}');">
                                            <span class="file-cta">
                                                <span class="file-icon">
                                                    <i class="fa fa-upload"></i>
                                                </span>
                                                <span class="file-label">
                                                    Choose the ${selected}…
                                                </span>
                                            </span>
                                            <span class="file-name">
                                                ${data.value ? data.value : ''}
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div class="columns is-grapless is-vcentered has-text-centered">
                                <div class="column has-text-centered" data-parent="${id}">
                                    <button class="button is-warning is-light is-small btn-text" onclick="changeMessageType(this.parentElement, 'text')" ${selected === 'text' ? 'disabled' : ''}><i class="fa fa-duotone fa-message"></i></button>
                                    <button class="button is-warning is-light is-small btn-image" onclick="changeMessageType(this.parentElement, 'image')" ${selected === 'image' ? 'disabled' : ''}><i class="fa fa-duotone fa-image"></i></button>
                                    <button class="button is-warning is-light is-small btn-video" onclick="changeMessageType(this.parentElement, 'video')" ${selected === 'video' ? 'disabled' : ''}><i class="fa fa-duotone fa-video"></i></button>
                                    <button class="button is-warning is-light is-small btn-audio" onclick="changeMessageType(this.parentElement, 'audio')" ${selected === 'audio' ? 'disabled' : ''}><i class="fa fa-duotone fa-microphone"></i></button>
                                    <button class="button is-warning is-light is-small btn-file" onclick="changeMessageType(this.parentElement, 'file')" ${selected === 'file' ? 'disabled' : ''}><i class="fa fa-duotone fa-file"></i></button>
                                </div>
                            </div>
                        </div>
                    `;
                    break;
                case 'text':
                default:
                    itemHTML += `
                        <div class="flow-item" id="${id}" style="z-index: ${zIndex}; width: 250px; background: white; background: linear-gradient(0, white 80%, white 80%, mediumseagreen 80%, mediumseagreen 100%);" data-type="${type}" data-data="${encodeURIComponent(dataJSON)}">
                            <i class="fa fa-duotone fa-xmark" style="color: white; cursor: pointer; position: absolute; top: 6px; right: 6px;" onclick="removeItem(this.parentElement)"></i>
                            <i class="fa fa-duotone fa-eye" style="display: block;color: gray; cursor: pointer; position: absolute; top: 45px; right: 5px; z-index: 0; font-size: 12px;" onclick="previewText(this.parentElement, this)"></i>
                            <div class="columns is-grapless" style="height: 35px;">
                                <span class="icon-text" style="color: white; font-weight: bold;">
                                    <span class="icon">
                                        <i class="fa fa-message"></i>
                                    </span>
                                    <span>Send a message:</span>
                                </span>
                            </div>
                            <div class="columns is-grapless is-vcentered has-text-centered">
                                <div class="column flow-item-content">
                                    <textarea class="textarea is-primary is-small" data-parent=${id} placeholder="Type the text you want to send" style="min-height: 80px" onkeyup="updateTextAreaData(this)">${data.value ? data.value : ''}</textarea>
                                </div>
                            </div>
                            <div class="columns is-grapless is-vcentered has-text-centered">
                                <div class="column has-text-centered" data-parent="${id}">
                                    <button class="button is-warning is-light is-small btn-text" onclick="changeMessageType(this.parentElement, 'text')" ${selected === 'text' ? 'disabled' : ''}><i class="fa fa-duotone fa-message"></i></button>
                                    <button class="button is-warning is-light is-small btn-image" onclick="changeMessageType(this.parentElement, 'image')" ${selected === 'image' ? 'disabled' : ''}><i class="fa fa-duotone fa-image"></i></button>
                                    <button class="button is-warning is-light is-small btn-video" onclick="changeMessageType(this.parentElement, 'video')" ${selected === 'video' ? 'disabled' : ''}><i class="fa fa-duotone fa-video"></i></button>
                                    <button class="button is-warning is-light is-small btn-audio" onclick="changeMessageType(this.parentElement, 'audio')" ${selected === 'audio' ? 'disabled' : ''}><i class="fa fa-duotone fa-microphone"></i></button>
                                    <button class="button is-warning is-light is-small btn-file" onclick="changeMessageType(this.parentElement, 'file')" ${selected === 'file' ? 'disabled' : ''}><i class="fa fa-duotone fa-file"></i></button>
                                </div>
                            </div>
                        </div>
                    `;
                    break;
            }
            break;
        case 'template':
            let values = ''
            let filePathSelected = '';
            templateSelected = '';
            if (typeof data !== 'string') {
                templateSelected = data.template.id;
                filePathSelected = (data.template.components.header && typeof data.template.components.header.value == 'string') ? data.template.components.header.value : '';
                values = [...((data.template.components.header && typeof data.template.components.header.value == 'string') ? [] : data.template.components.header.value), ...data.template.components.body.value].join(',');
            }
            optionsTemplate = templates.map(item => `<option value="${item.id}" ${templateSelected == item.id ? 'selected' : '' }>${item.name} - ${item.language}</option>`).join('');

            itemHTML += `
                <div class="flow-item" id="${id}" style="z-index: ${zIndex}; width: 250px; background: white; background: linear-gradient(0, white 82%, white 82%, gold 82%, gold 100%);" data-type="${type}" data-data="${encodeURIComponent(dataJSON)}">
                    <i class="fa fa-duotone fa-xmark" style="color: white; cursor: pointer; position: absolute;position: absolute; top: 6px; right: 6px;" onclick="removeItem(this.parentElement)"></i>
                    <i class="fa fa-duotone fa-eye" style="display: block;color: gray; cursor: pointer; position: absolute; top: 45px; right: 5px; z-index: 0; font-size: 12px;" onclick="previewTemplate(this.parentElement, this)"></i>
                    <div class="columns is-grapless" style="height: 35px;">
                        <span class="icon-text" style="color: white; font-weight: bold;">
                            <span class="icon">
                                <i class="fa fa-comment"></i>
                            </span>
                            <span>Send a template:</span>
                        </span>
                    </div>
                    <div class="columns is-grapless is-vcentered has-text-centered">
                        <div class="column flow-item-content">
                            <div class="select is-warning is-rounded">
                                <select id="${id}-select" style="max-width: 200px;" onchange="updateTemplateSelected(this.parentElement.parentElement.parentElement.parentElement, this)">
                                    <option value="">Select a template</option>
                                    ${optionsTemplate}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="columns is-grapless is-vcentered has-text-centered template-file-container" style="display: none;">
                        <div class="column has-text-centered">
                            <div class="file is-small is-warning">
                                <label class="file-label">
                                    <input class="file-input" data-parent="${id}" type="file" id=${id + '-template-file'} accept="" onchange="fileSelected(this);" value="">
                                    <span class="file-cta">
                                        <span class="file-icon">
                                            <i class="fa fa-upload"></i>
                                        </span>
                                        <span class="file-label">
                                            ${filePathSelected}
                                        </span>
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div class="columns is-grapless is-vcentered has-text-centered">
                        <div class="column has-text-centered">
                            <input class="input is-warning" style="opacity: 1;" type="text" placeholder="{{1}}, {{2}}, {{3}}, {{4}} ..." onkeyup="maskInputs(this.parentElement.parentElement.parentElement, this);" value="${values}"/>
                        </div>
                    </div>
                </div>
            `;
            break;
        case 'delay':
            itemHTML += `
                <div class="flow-item" id="${id}" style="z-index: ${zIndex}; width: 250px; background: white; background: linear-gradient(0, white 65%, white 65%, tomato 65%, tomato 100%);" data-type="${type}" data-data="${encodeURIComponent(dataJSON)}">
                    <i class="fa fa-duotone fa-xmark" style="color: white; cursor: pointer; position: absolute;position: absolute; top: 6px; right: 6px;" onclick="removeItem(this.parentElement)"></i>
                    <div class="columns is-grapless" style="height: 35px;">
                        <span class="icon-text" style="color: white; font-weight: bold;">
                            <span class="icon">
                                <i class="fa fa-clock"></i>
                            </span>
                            <span>Wait a delay:</span>
                        </span>
                    </div>
                    <div class="columns is-grapless is-vcentered has-text-centered">
                        <div class="column flow-item-content">
                            <input class="input is-danger is-rounded no-spin" type="number" id="${id}-input" style="max-width: 200px;" value="${data.value}" min="0" onkeyup="updateDelaySelected(this.parentElement.parentElement.parentElement)" onchange="updateDelaySelected(this.parentElement.parentElement.parentElement)" />
                        </div>
                        <div class="column flow-item-content">
                            <div class="select is-danger is-rounded">
                                <select id="${id}-select" style="max-width: 200px;" onchange="updateDelaySelected(this.parentElement.parentElement.parentElement.parentElement)">
                                    <option value="seconds" ${data.unit == 'seconds' ? 'selected' : ''}>Seconds</option>
                                    <option value="minutes" ${data.unit == 'minutes' ? 'selected' : ''}>Minutes</option>
                                    <option value="hours" ${data.unit == 'hours' ? 'selected' : ''}>Hours</option>
                                    <option value="days" ${data.unit == 'days' ? 'selected' : ''}>Days</option>
                                    <option value="weeks" ${data.unit == 'weeks' ? 'selected' : ''}>Weeks</option>
                                    <option value="months" ${data.unit == 'months' ? 'selected' : ''}>Months</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            break;
    }

    for (let item of Array.from(document.querySelectorAll('.fb-item'))) {
        item.style.opacity = '0.5';
        item.style.pointerEvents = 'none';
    }

    canvas.insertAdjacentHTML('beforeend', itemHTML);
    addEndpointsToItems('#' + id);
    
    if (type == 'template') {
        updateTemplateSelected(document.getElementById(id), document.getElementById(id + '-select'), true);
    }

    if (!recovering) {
        setTimeout(() => {
            for (let item of Array.from(document.querySelectorAll('.fb-item'))) {
                item.style.opacity = '1';
                item.style.pointerEvents = '';
            }
        }, 150);
    }
}

function previewTemplate(item, elem) {
    let template = templates.find(t => t.id == item.querySelector('select').value);

    if (!template) return;

    let actualValues = item.querySelector('input[type="text"]').value.split(',').map(v => v.trim());

    let components = {};
    for (let type in template.components) {
        components[type] = template.components[type].format == 'text' ? template.components[type].template : template.components[type].format;
        for (let i = 1; i <= template.inputs; i++) {
            components[type] = components[type].split('{{' + i + '}}').join('<span style="color: gold">' + (actualValues[i - 1] ? actualValues[i - 1] : '{{' + i + '}}') + '</span>');
        }
    }

    let html = [];
    let icon = {
        DOCUMENT: 'fa-file',
        VIDEO: 'fa-video',
        IMAGE: 'fa-image,'
    }
    if (components.header) {
        html.push(`<h3>Header</h3>
                    <p>${icon[components.header] ? '<i style="font-size:30px;" class="fa-solid ' + icon[components.header] + '"></i>&nbsp' : formatWhatsappText(components.header)}</p>`);
    }
    if (components.body) {
        html.push(`<h3>Body</h3>
                <p>${formatWhatsappText(components.body)}</p>`);
    }
    if (components.footer) {
        html.push(`<h3>Footer</h3>
                <p>${formatWhatsappText(components.footer)}</p>`);
    }

    Swal.fire({
        title: '<strong>Preview</strong>',
        html: '<div class="content is-small">' + html.join('') + '</div>',
        showCancelButton: false,
        focusConfirm: true,
        confirmButtonText: '<i class="fa fa-thumbs-up"></i> Great!'
    });
}

function updateTemplateSelected(item, elem, force = false) {
    if (elem.value === '') return;

    let template = templates.find(t => t.id == elem.value);

    let { header, body } = template.components;

    if (['DOCUMENT', 'VIDEO', 'IMAGE'].includes(header ? header.format : '')) {
        item.querySelector('.template-file-container').style.display = 'block';
        item.querySelector('.file-input').setAttribute('accept', (header.format != 'DOCUMENT' ? (header.format.toLowerCase() + '/*') : ''));
        if (!force) item.querySelector('.file-label .file-label').innerHTML = 'Choose the ' + header.format.toLowerCase() + ' header...';
        item.querySelector('.file-icon').innerHTML = '<i class="fa fa-' + (header.format != 'DOCUMENT' ? header.format.toLowerCase() : 'file') + '"></i>';
    } else {
        item.querySelector('.template-file-container').style.display = 'none';
        item.querySelector('.file-input').value = ""
    }

    if (template && template.inputs > 0) {
        let actualValues = item.querySelector('input').value.split(',').map(v => v.trim());
        item.querySelector('input').disabled = false;
        
        if (actualValues.length > template.inputs) {
            item.querySelector('input').style.opacity = 1;
            item.querySelector('input').value = '';
        } else if (actualValues.length == template.inputs) {
            item.querySelector('input').style.opacity = 0.7;
        } else {
            item.querySelector('input').style.opacity = 1;
        }
    } else {
        item.querySelector('input').disabled = true;
    }

    if (!force) {
        item.setAttribute('data-data', encodeURIComponent(JSON.stringify({
            template,
            type: 'template'
        })));
    }

    maskInputs(item, item.querySelector('input[type=text]'));
}

function maskInputs(item, elem) {
    let data = {};
    try { data = JSON.parse(decodeURIComponent(item.dataset.data)); } catch(err) {}

    if (data.template) {
        let { header, body } = data.template.components;

        let actualValues = elem.value.split(',').map(v => v.trim());
        if (actualValues.length > data.template.inputs) {
            elem.style.opacity = 0.7;
            actualValues.splice(data.template.inputs);
            elem.value = actualValues.join(',');
        } else if (actualValues.length == data.template.inputs) {
            elem.style.opacity = 0.7;
            elem.value = actualValues.join(',');
        } else {
            elem.style.opacity = 1;
            elem.value = actualValues.join(',');
        }
        
        let values = elem.value.split(',');
        if (header && header.format.toUpperCase() == 'TEXT') {
            let count = Math.min(header.template.split('{{').length - 1, header.template.split('}}').length - 1);
            data.template.components.header.value = values.splice(0, count);
        }
        if (body.format.toUpperCase() == 'TEXT') {
            let count = Math.min(body.template.split('{{').length - 1, body.template.split('}}').length - 1);
            data.template.components.body.value = values.splice(0, count);
        }
        
        item.setAttribute('data-data', encodeURIComponent(JSON.stringify(data)));
    }
}

function changeMessageType(container, type) {
    let item = document.getElementById(container.dataset.parent);
    console.log(item, type, item.querySelectorAll('i')[1]);

    container.querySelector('.btn-text').disabled = false;
    container.querySelector('.btn-video').disabled = false;
    container.querySelector('.btn-image').disabled = false;
    container.querySelector('.btn-audio').disabled = false;
    container.querySelector('.btn-file').disabled = false;
    container.querySelector('.btn-' + type).disabled = true;

    let data = {};
    try { data = JSON.parse(decodeURIComponent(item.dataset.data)); } catch(err) {}
    data.type = type;
    data.value = '';
    item.setAttribute('data-data', encodeURIComponent(JSON.stringify(data)));

    switch(type) {
        case 'text':
            item.style.background = 'linear-gradient(0, white 80%, white 80%, mediumseagreen 80%, mediumseagreen 100%)';
            item.querySelectorAll('i')[1].setAttribute('onclick', 'previewText(this.parentElement, this)');
            item.querySelector('.flow-item-content').innerHTML = `<textarea class="textarea is-primary is-small" data-parent=${item.id} placeholder="Type the text you want to send" style="min-height: 80px" onkeyup="updateTextAreaData(this)">${data.value ? data.value : ''}</textarea>`;
            break;
        case 'image':
        case 'audio':
        case 'video':
        case 'file':
            item.style.background = 'linear-gradient(0, white 82%, white 82%, mediumseagreen 82%, mediumseagreen 100%)';
            item.querySelectorAll('i')[1].setAttribute('onclick', 'previewFile(this.parentElement, this)');
            item.querySelector('.flow-item-content').innerHTML = `
                <div class="file has-name is-boxed is-small">
                    <label class="file-label">
                        <input class="file-input" type="file" data-parent="${item.id}" id=${item.id + '-file'} accept="${type !== 'file' ? (type + '/*') : ''}" onchange="fileSelected(this, '${type}');">
                        <span class="file-cta">
                            <span class="file-icon">
                                <i class="fa fa-upload"></i>
                            </span>
                            <span class="file-label">
                                Choose the ${type}…
                            </span>
                        </span>
                        <span class="file-name">
                            ${data.value ? data.value : ''}
                        </span>
                    </label>
                </div>`;
            break;
    }
}

function previewText(item, elem) {
    let textarea = item.querySelector('.textarea');
    let newElement = undefined;
    console.log(elem);
    if (elem.classList.contains('fa-eye')) {
        elem.classList.remove('fa-eye');
        elem.classList.add('fa-eye-slash');
        newElement = document.createElement('div');
        let attrCopy = Array.from(textarea.attributes);
        for (let attr of attrCopy) {
            newElement.setAttribute(attr.name, attr.value);
        }

        newElement.innerHTML = formatWhatsappText(textarea.value);
        newElement.style.textAlign = 'left';
        newElement.style.width = textarea.style.width;
        newElement.style.height = textarea.style.height;
        newElement.style.overflow = 'auto';
        newElement.style.overflowWrap = 'break-word';

        textarea.parentNode.replaceChild(newElement, textarea);
    } else {
        elem.classList.remove('fa-eye-slash');
        elem.classList.add('fa-eye');
        newElement = document.createElement('textarea');
        let attrCopy = Array.from(textarea.attributes);
        for (let attr of attrCopy) {
            newElement.setAttribute(attr.name, attr.value);
        }
        let data = {};
        try { data = JSON.parse(decodeURIComponent(item.dataset.data)); } catch(err) {}
        newElement.value = data.value ? data.value : '';
        newElement.style.textAlign = '';
        textarea.parentNode.replaceChild(newElement, textarea);
    }
}

async function previewFile(item, elem) {
    if (flowInfo.id !== undefined) {
        let response = await fetch('/flows/file/upload/' + flowInfo.id + '?verify=yes&name=' + item.querySelector('.file-name').textContent.trim());
        response = await response.json();
        if (response.result) {
            window.open('/files/' + flowInfo.id + '/' + item.querySelector('.file-name').textContent.trim(), '_blank').focus();
            return;
        }
    }

    let file = messageFiles[item.id];
    let type = file.base64.split(';')[0].split(':')[1].split('/')[0];
    let element = '';
    switch(type) {
        case 'image':
            element = '<img src="' + file.base64 + '" width="100%">';
            element += '<a href="' + file.base64 + '" download="' + file.name + '">Download';
            break;
        case 'video':
            element = '<video src="' + file.base64 + '" controls width="100%">';
            element += '<a href="' + file.base64 + '" download="' + file.name + '">Download';
            break;
        case 'audio':
            element = '<audio src="' + file.base64 + '" controls">';
            element += '<a href="' + file.base64 + '" download="' + file.name + '">Download';
            break;
        default:
            element = '<a href="' + file.base64 + '" download="' + file.name + '">Download';
    }
    let newTab = window.open();
    newTab.document.body.innerHTML = element;
}

function updateTextAreaData(elem){
    let text = elem.value;
    let item = document.getElementById(elem.dataset.parent);
    let data = {};
    
    try { data = JSON.parse(decodeURIComponent(elem.dataset.data)) } catch(err) {}

    data.value = text;
    data.type = 'text';

    item.setAttribute('data-data', encodeURIComponent(JSON.stringify(data)));   
}

function formatWhatsappText(text) {
    text = text.replace(/(?:\*)(?:(?!\s))((?:(?!\*|\n).)+)(?:\*)/g,'<b>$1</b>')
                .replace(/(?:_)(?:(?!\s))((?:(?!\n|_).)+)(?:_)/g,'<i>$1</i>')
                .replace(/(?:~)(?:(?!\s))((?:(?!\n|~).)+)(?:~)/g,'<s>$1</s>')
                .replace(/(?:--)(?:(?!\s))((?:(?!\n|--).)+)(?:--)/g,'<u>$1</u>')
                .replace(/(?:```)(?:(?!\s))((?:(?!\n|```).)+)(?:```)/g,'<tt>$1</tt>');
    return text.split('\n').join('<br>');
}

function removeItem(elem) {
    Swal.fire({
        title: 'Are you sure?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes!'
    }).then(async (result) => {
        if (result.isConfirmed) {
            jspInstance.deleteConnectionsForElement(elem);
            jspInstance.removeAllEndpoints(elem);
            // delete jspInstance._managedElements[elem.id];
            elem.remove(); 
        }
    });
}

function triggerAction(type, selectID = '') {
    let triggerID = selectID !== '' ? document.getElementById(selectID).value : '';
    Swal.fire({
        title: 'You will be redirected to the trigger ' + type + ', do you want to continue?',
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes!'
    }).then(async (result) => {
        if (result.isConfirmed) {
            if (type == 'edition') {
                location.href = '/triggers/edit/' + triggerID;
                return;
            }
            location.href = '/triggers/new';
        }
    });
}

function updateTriggerSelected(select, flowItem) {
    flowItem.setAttribute('data-data', encodeURIComponent(JSON.stringify({
        trigger: select.value
    })));

    if (select.value === '') {
        flowItem.querySelector('.button.is-warning').disabled = true;
    } else {
        flowItem.querySelector('.button.is-warning').disabled = false;
    }
}

function updateDelaySelected(item) {
    let unit = document.getElementById(item.id + '-select').value;
    let value = document.getElementById(item.id + '-input').value;

    try { data = JSON.parse(decodeURIComponent(item.dataset.data)) } catch(err) {}

    data = {
        unit,
        value
    };

    item.setAttribute('data-data', encodeURIComponent(JSON.stringify(data)));  
}

function saveFlow(elem) {
    elem.classList.add('is-loading');
    
    let flowItem = document.querySelector('[data-type="trigger"]');
    if (flowItem === null) {
        elem.classList.remove('is-loading');
        return Swal.fire('Error!', 'You need to have a trigger for the flow', 'error');
    }
    
    let flowData = {};
    try { flowData = JSON.parse(decodeURIComponent(flowItem.dataset.data)) } catch(err) {}
    
    let { steps, detail } = exportFlow();
    if (flowData.trigger === undefined) {
        elem.classList.remove('is-loading');
        return Swal.fire('Error!', 'You need to have a trigger selected for the flow', 'error');
    }

    Swal.fire({
        title: 'Save the flow with the next name:',
        input: 'text',
        inputValue: flowInfo.name,
        inputAttributes: {
            autocapitalize: 'off'
        },
        showCancelButton: true,
        confirmButtonText: 'Save',
        showLoaderOnConfirm: true,
        preConfirm: async flowName => {
            let url = 'new';
            if (flowInfo.name !== undefined) {
                url = 'edit/' + flowInfo.id;
            }

            let response = await fetch('/flows/' + url, {
                body: JSON.stringify({
                    name: flowName,
                    detail: JSON.stringify(detail),
                    steps: JSON.stringify(steps),
                    trigger: flowData.trigger
                }),
                method: 'post',
                headers: { 'Content-Type': 'application/json' }
            });
                
            try {
                response = await response.json();
    
                if (!response.result) {
                    throw new Error('Can not update!');
                }

                flowInfo = response.flow;

                if (flowInfo.detail) {
                    let files = flowInfo.detail.filter(item => {
                        let typeFiles = ['image', 'video', 'file', 'audio', 'template'];
                        return (typeFiles.includes(item.source.data.type) || typeFiles.includes(item.target.data.type)) 
                    });

                    if (files.length == 0) {
                        return true;
                    }

                    let uploadeds = [];
                    let promises = {
                        names: [],
                        promises: []
                    };
                    for (let file of files) {
                        if (['image', 'video', 'file', 'audio', 'template'].includes(file.source.data.type) && !uploadeds.includes(file.source.data.value)) {
                            uploadeds.push(file.source.data.value);
                            promises.promises.push(uploadFile(document.getElementById(file.source.id)));
                        }
                        
                        if (['image', 'video', 'file', 'audio', 'template'].includes(file.target.data.type) && !uploadeds.includes(file.target.data.value)) {
                            uploadeds.push(file.target.data.value);
                            promises.promises.push(uploadFile(document.getElementById(file.target.id)));
                        }

                    }
                    let result = await Promise.all(promises.promises);
                    if (result.includes(false)) {
                        let index = result.indexOf(false);
                        let name = promises.names[index];
                        throw new Error('Can not upload the file ' + name + '!');
                    }
                }
            } catch(error) {
                elem.classList.remove('is-loading');
                Swal.showValidationMessage(
                    `Request failed: ${error}`
                );

                if (error.indexOf('Can not upload the file') !== -1) {
                    setTimeout(() => {
                        location.href = '/flows/edit/' + flowInfo.id;
                    }, 1000);
                }
            }
        },
        allowOutsideClick: () => !Swal.isLoading(),
        backdrop: true
    }).then((result) => {
        elem.classList.remove('is-loading');
        if (result.isConfirmed) {
            Swal.fire({
                title: 'Flow saved!'
            });
            setTimeout(() => {
                location.href = '/flows';
            }, 500);
        }
    });
}

async function uploadFile(item) {
    const formData = new FormData();
    if (item.querySelector('.file-input').files.length == 0) return;
    
    formData.append('file', item.querySelector('.file-input').files[0]);
    let response = await fetch('/flows/file/upload/' + flowInfo.id, {
        method: 'post',
        body: formData
    });
    response = await response.json();
}

let messageFiles = {};
function fileSelected(elem, type) {
    let file = elem.files[0];
    if (!file) return;

    let item = document.getElementById(elem.dataset.parent);
    let data = {};
    try { data = JSON.parse(decodeURIComponent(item.dataset.data)) } catch(err) {}
    if (item.dataset.type !== 'template') {
        data.value = file.name;
        item.querySelector('.file-name').textContent = elem.files[0].name;
    } else {
        item.querySelector('.file-label .file-label').textContent = elem.files[0].name;
        data.template.components.header.value = file.name;
    }
    item.setAttribute('data-data', encodeURIComponent(JSON.stringify(data)));

    if (flowInfo.id) {
        fetch('/flows/file/upload/' + flowInfo.id + '?verify=yes&name=' + file.name)
            .then(response => response.json())
            .then(response => {
                if (response.result === true) {
                    Swal.fire('Warning!', 'This file already exists, will not be uploaded to use the existing one...', 'warning');
                }
            });
    }

    const reader = new FileReader();
    reader.addEventListener('load', function () {
        // convert image file to base64 string
        messageFiles[item.id] = {
            name: elem.files[0].name,
            base64: reader.result
        }
    }, false);
    reader.readAsDataURL(file);
}
