function saveSheet() {
  const data = {
    data: document.getElementById('data').value
  }
  fetch('/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  }).then(function (response) { return response.json() })
  .then(function (data) {
    console.log(data.hash)
    window.location = "/" + data.hash
  })
}

function renderSheet() {
  const data = {
    data: document.getElementById('editor').value
  }
  fetch('/render', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  }).then(function (response) { return response.json() })
  .then(function (data) {
    console.log(data.hash)
    window.location = "/" + data.hash
  })
}
