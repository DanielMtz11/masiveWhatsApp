jsPlumbBrowserUI.ready(setJSPlumbInstance);
for (let item of Array.from(document.querySelectorAll('.fb-item'))) {
    item.style.opacity = '0.5';
    item.style.pointerEvents = 'none';
}
var canvas = document.getElementById('canvas');
var jspInstance = undefined;
var triggers = [];
function setJSPlumbInstance() {
    jspInstance = jsPlumbBrowserUI.newInstance({
        dragOptions: { containment: 'parentEnclosed', grid: { w: 15, h: 15 } },
        container: canvas,
        hoverPaintStyle: { stroke: 'green' }
    });

    jspInstance.batch(() => {
        jspInstance.bind('connection', (info, event) => {
            //info.targetEndpoint.endpoint.setVisible(false);
            console.log(info, event);
        });

        jspInstance.bind('connection:detach', (info, event) => {
            console.log(info, event);
        });

        jspInstance.bind('connection:move', (info, event) => {
            console.log(info, event);
        });

        jspInstance.bind('click', (component, event) => {
            console.log(component, event);
        });
    });

    fetch('/triggers/all')
        .then(data => data.json())
        .then(data => {
            if (data.result === true) {
                if (flowInfo.id !== undefined) {
                    recoverFlow(flowInfo.detail);
                }


                triggers = data.triggers;
                for (let item of Array.from(document.querySelectorAll('.fb-item'))) {
                    item.style.opacity = '1';
                    item.style.pointerEvents = '';
                }


                return;
            }
    
            Swal.fire('Error!', 'Error getting the list of triggers...', 'error');
            setTimeout(() => location.href = '/triggers', 2000);
        })
}

function addEndpointsToItems(selector) {
    let boxes = Array.from(document.querySelectorAll(selector));
    for (let box of boxes) {
        jspInstance.addEndpoint(box, { anchor: 'Right', uuid: box.id + '-source' }, {
            endpoint: { type: 'Dot', options: { radius: 4, cssClass: 'dot-source' } },
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

        if (box.dataset.type == 'trigger') continue;

        jspInstance.addEndpoint(box, { anchor: 'Left', uuid: box.id + '-target' }, {
            endpoint: { type:'Dot', options: { radius: 6, cssClass: 'dot-target' } },
            paintStyle: { fill: '' },
            scope: 'green',
            source: false,
            connector: 'Flowchart',
            maxConnections: 1,
            target: true,
            hoverClass: 'dot-target-hover'
        });
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
    for (let connection of details) {
        let source = document.getElementById(connection.source.id);
        let target = document.getElementById(connection.target.id);

        if (source === null) {
            addItem(connection.source.type, connection.source.id, connection.source.data);
        }
        
        if (target === null) {
            addItem(connection.target.type, connection.target.id, connection.target.data);
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
    
            jspInstance.connect({ uuids: [ connection.source.uuid, connection.target.uuid ] });
        }
    }, 300);
}

function exportFlow() {
    let details = [];
    jspInstance.connections.forEach(connection => {
        let dataSource = {};
        let dataTarget = {};

        try { dataSource = JSON.parse(connection.source.dataset.data); } catch(err) { dataSource = {} }
        try { dataTarget = JSON.parse(connection.target.dataset.data); } catch(err) { dataTarget = {} }

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
        details.push({source, target});
    });

    return details;
}

function addItem(type, id = '', data = '') {
    let itemHTML = '';

    if (id === '') {
        id = `flow-item-${Math.random().toString(16).slice(8)}`;
    }

    let dataJSON = '';
    if (data !== '') {
        if (typeof data === "string") {
            dataJSON = data;
            data = JSON.parse(data);
        } else {
            dataJSON = JSON.stringify(data);
        }
    } else {
        dataJSON = '{}';
    }

    switch(type) {
        case 'trigger':
            let selected = '';
            if (typeof data !== 'string') {
                selected = data.trigger;
            }
            let options = triggers.map(item => `<option value="${item.id}" ${selected === item.id ? 'selected' : '' }>${item.name}</option>`).join('');

            itemHTML += `
                <div class="flow-item" id="${id}" style="width: 250px; background: white; background: linear-gradient(0, white 80%, white 80%, cornflowerblue 80%, cornflowerblue 100%);" data-type="${type}" data-data="${dataJSON.replace(/"/g, '\\"')}">
                    <i class="fas fa-duotone fa-xmark" style="color: white; cursor: pointer; position: absolute;position: absolute; top: 6px; right: 6px;" onclick="removeItem(this.parentElement)"></i>
                    <div class="columns is-grapless" style="height: 50px;">
                        <span class="icon-text" style="color: white; font-weight: bold;">
                            <span class="icon">
                                <i class="fas fa-rocket"></i>
                            </span>
                            <span>Once trigger is executed</span>
                        </span>
                    </div>
                    <div class="columns is-grapless is-vcentered has-text-centered">
                        <div class="column">
                            <div class="select is-link is-rounded">
                                <select id="${id}-select" onchange="updateTriggerSelected(this, this.parentElement.parentElement.parentElement.parentElement)">
                                    <option value="">Select a trigger</option>
                                    ${options}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="columns is-grapless is-vcentered has-text-centered">
                        <div class="column has-text-centered">
                            <button class="button is-warning is-light" onclick="triggerAction('edition', '${id}-select')"><i class="fas fa-duotone fa-pen-to-square"></i>&nbsp; Edit</button>
                            &nbsp;
                            <button class="button is-info is-light" onclick="triggerAction('creation')"><i class="fas fa-duotone fa-plus"></i>&nbsp; New</button>
                        </div>
                    </div>
                </div>
            `;
            break;
        case 'message':
            itemHTML += `
                <div class="flow-item" id="${id}" style="width: 250px; height: 200px" data-type="${type}" data-data="${dataJSON.replace(/"/g, '\\"')}">
                    <i class="fas fa-duotone fa-xmark" style="cursor: pointer; position: absolute;position: absolute; top: 10px; right: 10px;" onclick="removeItem(this.parentElement)"></i>
                    MESSAGE
                </div>
            `;
            break;
        case 'template':
            itemHTML += `
                <div class="flow-item" id="${id}" style="width: 250px; height: 200px" data-type="${type}" data-data="${dataJSON.replace(/"/g, '\\"')}">
                    <i class="fas fa-duotone fa-xmark" style="cursor: pointer; position: absolute;position: absolute; top: 10px; right: 10px;" onclick="removeItem(this.parentElement)"></i>
                    TEMPLATE
                </div>
            `;
            break;
        case 'delay':
            itemHTML += `
                <div class="box flow-item" id="${id}" style="width: 250px; height: 200px" data-type="${type}" data-data="${dataJSON.replace(/"/g, '\\"')}">
                    <i class="fas fa-duotone fa-xmark" style="cursor: pointer; position: absolute;position: absolute; top: 10px; right: 10px;" onclick="removeItem(this.parentElement)"></i>
                    DELAY
                </div>
            `;
            break;
    }

    for (let item of Array.from(document.querySelectorAll('.fb-item'))) {
        item.style.opacity = '0.5';
        item.style.pointerEvents = 'none';
    }

    canvas.insertAdjacentHTML('beforeend', itemHTML);
    setTimeout(() => {
        addEndpointsToItems('#' + id);
        setTimeout(() => {
            for (let item of Array.from(document.querySelectorAll('.fb-item'))) {
                item.style.opacity = '1';
                item.style.pointerEvents = '';
            }
        }, 150);
    }, 150);
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
    flowItem.setAttribute('data-data', JSON.stringify({
        trigger: select.value
    }));
}

function saveFlow(elem) {
    elem.classList.add('is-loading');
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
        preConfirm: (flowName) => {
            let flowDetails = exportFlow();

            let url = 'new';
            if (flowInfo.name !== undefined) {
                url = 'edit/' + flowInfo.id;
            }

            return fetch('/flows/' + url, {
                body: JSON.stringify({
                    name: flowName,
                    detail: JSON.stringify(flowDetails)
                }),
                method: 'post',
                headers: { "Content-Type": "application/json" }
            }).then(response => response.json())
            .then(response => {
                if (!response.result) {
                    throw new Error('Can not update!');
                }
            }).catch(error => {
                Swal.showValidationMessage(
                    `Request failed: ${error}`
                )
            });
        },
        allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
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