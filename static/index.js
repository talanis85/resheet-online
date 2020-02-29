var pdfjsLib = window['pdfjs-dist/build/pdf'];

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
  pdfjsLib.GlobalWorkerOptions.workerSrc = '//mozilla.github.io/pdf.js/build/pdf.worker.js';

  const data = {
    data: document.getElementById('data').value
  }
  fetch('/render', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  .then(function (data) {
    return data.arrayBuffer()
  })
  .then(function (data) {
    return pdfjsLib.getDocument({data: data}).promise
  })
  .then(function (pdf) {
    var pageNumber = 1
    return pdf.getPage(pageNumber)
  })
  .then(function(page) {
    // console.log('Page loaded');

    var scale = 1;
    var viewport = page.getViewport({scale: scale});

    // Prepare canvas using PDF page dimensions
    var canvas = document.getElementById('preview');
    var context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Render PDF page into canvas context
    var renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    var renderTask = page.render(renderContext);
    renderTask.promise.then(function () {
    //  console.log('Page rendered');
    });
  })
}

window.onload = function () {
  renderSheet()
}
