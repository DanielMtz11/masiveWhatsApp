async function addCondition(elem) {
    let conditions = Array.from(document.querySelectorAll('.condition'));
    let html = await fetch('/triggers/condition/' + conditions.length);
    html = await html.text();
    document.querySelector('.conditions-container').insertAdjacentHTML('beforeend', html);
}

async function deleteCondition(elem) {
    let conditions = Array.from(document.querySelectorAll('.condition'));
    if (conditions.length == 1) return;
    elem.remove();
}

function configureSource(elem) {
    let select = elem.querySelector('select');
    let source = JSON.parse(document.getElementById('source').value);

    let html = '';
    if (select.value == 'mysql') {
        html += `<div class="field">
                    <div class="control">
                        <input autocomplete="none" class="input source-input" type="text" placeholder="127.0.0.1" value="${source.host || ''}" />
                    </div>
                </div>
                <div class="field is-grouped">
                    <div class="control is-expanded">
                        <input autocomplete="none" class="input source-input" type="text" placeholder="Database name" value="${source.database || ''}" />
                    </div>
                    <div class="control is-expanded">
                        <input autocomplete="none" class="input source-input" type="text" placeholder="Table name" value="${source.table || ''}" />
                    </div>
                </div>
                <div class="field">
                    <div class="control">
                        <input autocomplete="none" class="input source-input" type="text" placeholder="Database Password" value="${source.pass || ''}" />
                    </div>
                </div>`;
    } else if (select.value == 'excel') {
        html += ``;
    }

    Swal.fire({
        title: select.value.toUpperCase() + ' Source Configuration',
        html,
        showCancelButton: false,
        focusConfirm: true,
        confirmButtonText: 'Save',
        confirmButtonColor: '#008f39'
    }).then((result) => {
        if (result.isConfirmed) {
            let host = document.querySelectorAll('.source-input')[0].value;
            let database = document.querySelectorAll('.source-input')[1].value;
            let table = document.querySelectorAll('.source-input')[2].value;
            let pass = document.querySelectorAll('.source-input')[3].value;

            document.getElementById('source').value = JSON.stringify({
                host,
                database,
                table,
                pass
            });
        }
    });
}

function saveTrigger(elem) {
    let conditions = [];
    let config = JSON.parse(document.getElementById('source').value);
    config.when = document.getElementById('when').value;
    
    let columns = Array.from(document.getElementsByName('column[]'));
    let questions = Array.from(document.getElementsByName('question[]'));
    let values = Array.from(document.getElementsByName('value[]'));
    let connectors = Array.from(document.getElementsByName('connector[]'));

    for (let i = 0; i < columns.length; i++) {
        conditions.push({
            column: columns[i].value,
            question: questions[i].value,
            value: values[i].value,
            connector: connectors[i].value
        });
    }

    Swal.fire({
        title: 'Save the trigger with the next name:',
        input: 'text',
        inputValue: triggerInfo.name,
        inputAttributes: {
            autocapitalize: 'off'
        },
        showCancelButton: true,
        confirmButtonText: 'Save',
        showLoaderOnConfirm: true,
        preConfirm: async triggetName => {
            let url = 'new';
            if (triggerInfo.name !== undefined) {
                url = 'edit/' + triggerInfo.id;
            }

            let response = await fetch('/triggers/' + url, {
                body: JSON.stringify({
                    name: triggetName,
                    conditions,
                    config,
                    type: document.getElementById('type').value
                }),
                method: 'post',
                headers: { 'Content-Type': 'application/json' }
            });
                
            try {
                response = await response.json();
    
                if (!response.result) {
                    throw new Error('Can not save or update!');
                }

                triggerInfo = response.trigger;
            } catch(error) {
                elem.classList.remove('is-loading');
                Swal.showValidationMessage(
                    `Request failed: ${error}`
                );
            }
        },
        allowOutsideClick: () => !Swal.isLoading(),
        backdrop: true
    }).then((result) => {
        elem.classList.remove('is-loading');
        if (result.isConfirmed) {
            Swal.fire({
                title: 'Trigger saved!'
            });
            setTimeout(() => {
                location.href = '/triggers';
            }, 500);
        }
    });
}