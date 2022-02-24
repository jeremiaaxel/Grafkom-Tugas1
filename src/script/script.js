// programs
let canvas = document.getElementById("gl-canvas");
let gl;
let program;

let position = []; // vertex buffer
let color = []; // fragment buffer

// model selection
let selectedModel;
let selectedColor;

// drawing
let isMouseClicked = false;
let isShouldDrawPolygon = false;


let totalPointsCreated = 0;
let nObjectsCreated = -1;
let currentObjectIndexStart = [];
let pointsForCurrentObject = [];
let nPolygonSide = 3;
let polygonStartPosition = {
  x: 0,
  y: 0,
}

const DrawMode = {
  line: "line",
  square: "square",
  rectangle: "rectangle",
  polygon: "polygon",
};

/********* PROGRAM RELATED FUNCTIONS ************/

// return a shader
function createShader(gl, type, source) {
  let shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  return shader;
}

// return a shader program
function createProgram(gl, vertex, fragment) {
  let program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);

  return program;
}

// canvas resizing
function resizeCanvas(canvas) {
  const displayWidth = canvas.clientWidth;
  const displayHeight = canvas.clientHeight;
  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }
}


/********* USER INTERFACE RELATED FUNCTIONS ************/

function clearCanvas() {
  position = [];
  color = [];
  totalPointsCreated = 0;
  nObjectsCreated = -1;
  currentObjectIndexStart = [];
  pointsForCurrentObject = [];
};

function showFeedback(text, timeout = null){
  var feedbackArea = document.getElementById("feedback-banner");
  feedbackArea.innerHTML = text;
  if (timeout) {
    setTimeout(() => {
      feedbackArea.innerHTML = "";
    }, timeout);
  }
}

function selectModel(elem) {
  var selectorButtons = document.getElementsByClassName("model-selector-button");
  var instructionBanner = document.getElementById("instruction-banner");

  selectedModel = elem.value.toLowerCase();

  for (let i = 0; i < selectorButtons.length; i++) {
    selectorButtons[i].classList.remove("active");
  }
  elem.classList.add("active");

  showFeedback(`Model ${selectedModel} selected`, 2000);
  
  let sidesInput = document.getElementById("sides-input");
  if (selectedModel == DrawMode.polygon) {
    sidesInput.style.display = "block";
    instructionBanner.innerText = "Click on the canvas to put the nodes";
  } 
  else {
    sidesInput.style.display = "none";
    instructionBanner.innerText = "Click and drag on the canvas to draw";
  } 

  sidesInput.addEventListener("change", function () {
    nPolygonSide = sidesInput.lastElementChild.value
  })
}

/********* DRAWING UTILITY FUNCTIONS ************/

function getMousePositionRelativeToCanvas(canvas, event) {
  let rect = canvas.getBoundingClientRect();
  let position = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };

  position.x = (position.x * canvas.width) / canvas.clientWidth;
  position.y = (position.y * canvas.height) / canvas.clientHeight;

  position.x = (position.x / gl.canvas.width) * 2 - 1;
  position.y = (position.y / gl.canvas.height) * -2 + 1;

  return position;
}

function createPoint(x, y) {
  position.push(x, y);

  color.push(selectedColor.r, selectedColor.g, selectedColor.b);
  color.push(selectedColor.r, selectedColor.g, selectedColor.b);

  pointsForCurrentObject[nObjectsCreated] += 2;
  totalPointsCreated += 1;

  render();
}

function initPoint(mousePosition, polygonSide, selectedModel){
  if (
    selectedModel == DrawMode.polygon &&
    pointsForCurrentObject[nObjectsCreated] < polygonSide * 4 &&
    isShouldDrawPolygon
  ) {
    drawPolygon(mousePosition, nPolygonSide);
  } else if (
    !(selectedModel == DrawMode.polygon) ||
    (selectedModel == DrawMode.polygon &&
      !pointsForCurrentObject[nObjectsCreated] &&
      nObjectsCreated == -1) ||
    (selectedModel == DrawMode.polygon &&
      pointsForCurrentObject[nObjectsCreated])
  ) {
    nObjectsCreated++;
    currentObjectIndexStart[nObjectsCreated] = totalPointsCreated;
    pointsForCurrentObject[nObjectsCreated] = 0;
    createPoint(mousePosition.x, mousePosition.y);
    polygonStartPosition = mousePosition
    isShouldDrawPolygon = true
  }
}


function createLine(a, b) {
  createPoint(a[0], a[1]);
  createPoint(b[0], b[1]);
}

function eraseLastDrawnPoint() {
  for (let i = 0; i < 2; i++) {
    position.pop();
    for (let j = 0; j < 3; j++) {
      color.pop();
    }
  }
  pointsForCurrentObject[nObjectsCreated] -= 2;
  totalPointsCreated -= 1;
}

function drawLine(mousePosition) {
  if (pointsForCurrentObject[nObjectsCreated] == 4) {
    eraseLastDrawnPoint();
    createPoint(mousePosition.x, mousePosition.y);
  } else {
    createPoint(mousePosition.x, mousePosition.y);
  }
}

function drawSquareSides(mousePosition) {
  let latestPosition = {
    x0: position[position.length - 2],
    y0: position[position.length - 1],
  };

  let { x, y } = mousePosition;
  let { x0, y0 } = latestPosition;

  let abs = Math.abs;
  let max = Math.max(abs(x - x0), abs(y - y0));
  if (x0 > x) {
    if (y0 > y) {
      createPoint(x0 - max, y0);
      createLine([x0 - max, y0], [x0 - max, y0 - max]);
      createLine([x0 - max, y0 - max], [x0, y0 - max]);
      createLine([x0, y0 - max], [x0, y0]);
    } else {
      createPoint(x0, y0 + max);
      createLine([x0, y0 + max], [x0 - max, y0 + max]);
      createLine([x0 - max, y0 + max], [x0 - max, y0]);
      createLine([x0 - max, y0], [x0, y0]);
    }
  } else {
    if (y0 > y) {
      createPoint(x0 + max, y0);
      createLine([x0 + max, y0], [x0 + max, y0 - max]);
      createLine([x0 + max, y0 - max], [x0, y0 - max]);
      createLine([x0, y0 - max], [x0, y0]);
    } else {
      createPoint(x0 + max, y0);
      createLine([x0 + max, y0], [x0 + max, y0 + max]);
      createLine([x0 + max, y0 + max], [x0, y0 + max]);
      createLine([x0, y0 + max], [x0, y0]);
    }
  }
}

function drawSquare(mousePosition) {
  if (pointsForCurrentObject[nObjectsCreated] == 16) {
    for (let i = 0; i < 7; i++) {
      eraseLastDrawnPoint();
    }
    drawSquareSides(mousePosition);
  } else {
    drawSquareSides(mousePosition);
  }
}

function drawRectangleSides(mousePosition) {
  let latestPosition = {
    x0: position[position.length - 2],
    y0: position[position.length - 1],
  };

  let { x, y } = mousePosition;
  let { x0, y0 } = latestPosition;

  createPoint(x0, y);
  createLine([x0, y], [x, y]);
  createLine([x, y], [x, y0]);
  createLine([x, y0], [x0, y0]);
}

function drawRectangle(mousePosition) {
  if (pointsForCurrentObject[nObjectsCreated] == 16) {
    for (let i = 0; i < 7; i++) {
      pointsForCurrentObject[nObjectsCreated];
      eraseLastDrawnPoint();
    }
    drawRectangleSides(mousePosition);
  } else {
    drawRectangleSides(mousePosition);
  }
}

function drawPolygon(mousePosition, side) {
  if (
    (pointsForCurrentObject[nObjectsCreated] / 2) % 2 !== 2 &&
    pointsForCurrentObject[nObjectsCreated]
  ) {
    createPoint(mousePosition.x, mousePosition.y);
  }
  if (pointsForCurrentObject[nObjectsCreated] == side * 4 - 2) {
    isShouldDrawPolygon = false
    createPoint(
      polygonStartPosition.x, polygonStartPosition.y
    );
  }
}

function drawDraggablePolygonSide(mousePosition) {
  if ((pointsForCurrentObject[nObjectsCreated] / 2) % 2 == 1) {
    createPoint(mousePosition.x, mousePosition.y);
  } else {
    eraseLastDrawnPoint();
    createPoint(mousePosition.x, mousePosition.y);
  }
}

function drawScene(mousePosition, polygonSide, selectedModel){
  if (
    selectedModel == DrawMode.polygon &&
    pointsForCurrentObject[nObjectsCreated] &&
    pointsForCurrentObject[nObjectsCreated] <= polygonSide * 4 - 4 &&
    isShouldDrawPolygon
  ) {
    drawDraggablePolygonSide(mousePosition);
  }
  if (isMouseClicked) {
    switch (selectedModel) {
      case DrawMode.line:
        drawLine(mousePosition);
        break;
      case DrawMode.square:
        drawSquare(mousePosition);
        break;
      case DrawMode.rectangle:
        drawRectangle(mousePosition);
        break;
    }
  }
}

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/********* MAIN PROGRAM ************/

function init() {
  gl = canvas.getContext("webgl");

  let vertexShaderSource = document.getElementById("vertex-shader").text;
  let fragmentShaderSource = document.getElementById("fragment-shader").text;

  let vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  let fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
  );

  program = createProgram(gl, vertexShader, fragmentShader);

  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(program);

  resizeCanvas(canvas);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}

function render() {
  let colorNormalized = color.map((c) => (c - 255) / 255 + 1);

  gl.useProgram(program);
  resizeCanvas(canvas);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  let positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(position), gl.STATIC_DRAW);

  let colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(colorNormalized),
    gl.STATIC_DRAW
  );

  let positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

  let colorAttributeLocation = gl.getAttribLocation(program, "a_color");
  gl.enableVertexAttribArray(colorAttributeLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.vertexAttribPointer(colorAttributeLocation, 3, gl.FLOAT, false, 0, 0);

  for (let i = 0; i <= nObjectsCreated; i++) {
    gl.drawArrays(
      gl.LINES,
      currentObjectIndexStart[i],
      pointsForCurrentObject[i] / 2
    );
  }
}

function main() {
  
  init();

  const clearCanvasButton = document.getElementById("clear-canvas-button");
  clearCanvasButton.addEventListener("click", function () {
    clearCanvas()
    render();
    showFeedback("Canvas cleared", 2000);
  });

  const colorSelector = document.getElementById("color-selector");
  selectedColor = hexToRgb(colorSelector.value);
  colorSelector.addEventListener('change', function() {
    selectedColor = hexToRgb(colorSelector.value);
  });

  canvas.addEventListener("mousedown", function (event) {
    isMouseClicked = true;
    let mousePosition = getMousePositionRelativeToCanvas(canvas, event);
    initPoint(mousePosition, nPolygonSide, selectedModel);

  });

  canvas.addEventListener("mouseup", function () {
    isMouseClicked = false;
  });

  canvas.addEventListener("mousemove", function (event) {
    let mousePosition = getMousePositionRelativeToCanvas(canvas, event);
    drawScene(mousePosition, nPolygonSide, selectedModel);
    
  });
}

window.onload = main;
