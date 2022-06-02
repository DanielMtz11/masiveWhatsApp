function logout() {
    Swal.fire({
        title: 'Are you sure?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes!'
    }).then(async (result) => {
        if (result.isConfirmed) {
            location.href = '/logout';
        }
    });
}

function deleteItem(url, id) {
    Swal.fire({
        title: 'Are you sure?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes!'
    }).then(async (result) => {
        if (result.isConfirmed) {
            location.href = url + 'delete/' + id;
        }
    });
}

async function activateItem(item, url, id) {
    let result = await fetch(url + 'activate/' + id + '?active=' + (item.checked ? '1' : '0'));
    result = await result.json();
    if (result) {
        location.reload();
    }
}