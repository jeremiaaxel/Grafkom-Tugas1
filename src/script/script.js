const DrawMode = {
  resize: "resize",
  line: "line",
  square: "square",
  rectangle: "rectangle",
  polygon: "polygon",
};

class Vertex {
  x = 0;
  y = 0;
  color = hexToRgb("#000000");

  constructor(vertex) {
    if (vertex) {
      this.x = vertex.x;
      this.y = vertex.y;
      this.color = vertex.color;
    }
  }

  setX(x) {
    this.x = x;
  }
  setY(y) {
    this.y = y;
  }
  getX() {
    return this.x;
  }
  getY() {
    return this.y;
  }

  setColor(color) {
    this.color = color;
  }
  getColor() {
    return this.color;
  }
}

class DrawObject {
  modelType = "";
  vertices = [];

  constructor(DrawObject) {
    if (DrawObject) {
      this.modelType = DrawObject.modelType;
      this.vertices = DrawObject.vertices;
    }
  }

  set modelType(model) {
    this.modelType = model;
  }
  set vertices(newvertices) {
    this.vertices = newvertices;
  }

  get vertices() {
    return this.vertices;
  }
  get length() {
    return this.vertices.length;
  }
  get modelType() {
    return this.modelType;
  }

  add(newVertex) {
    this.vertices.push(new Vertex(newVertex));
  }
  getVertex(index) {
    return new Vertex(this.vertices[index]);
  }
  setColor(color) {
    this.vertices.forEach((vertex) => vertex.setColor(color));
  }

  clear() {
    this.modelType = "";
    this.vertices = [];
  }

  removeLastVertex() {
    if (this.vertices.length > 0) this.vertices.pop();
  }
}

// programs
let canvas = document.getElementById("gl-canvas");
let gl;
let program;

// let position = []; // vertex buffer
// let color = []; // fragment buffer

let selectedObject = new DrawObject(); // a DrawnObject, 'current' selected object
let objectsList = []; // list of DrawnObject
let userSelectedObjectIndex;
let closestObjectsFromCursor;

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
  objectsList = [];
  selectedObject = new DrawObject();
}

function showFeedback(text, timeout = null) {
  var feedbackArea = document.getElementById("feedback-banner");
  feedbackArea.innerHTML = text;
  if (timeout) {
    setTimeout(() => {
      feedbackArea.innerHTML = "";
    }, timeout);
  }
}

function selectModel(elem) {
  var selectorButtons = document.getElementsByClassName(
    "model-selector-button"
  );
  var instructionBanner = document.getElementById("instruction-banner");

  selectedModel = elem.value.toLowerCase();

  for (let i = 0; i < selectorButtons.length; i++) {
    selectorButtons[i].classList.remove("active");
  }
  elem.classList.add("active");

  showFeedback(`Model ${selectedModel} selected`, 2000);

  let sidesInput = document.getElementById("sides-input");
  switch(selectedModel) {
    case DrawMode.polygon:
      sidesInput.style.display = "block";
      instructionBanner.innerText = "Click on the canvas to put the nodes";
      break;
    case DrawMode.resize:
      sidesInput.style.display = "none";
      instructionBanner.innerText = "Click on one of the object's vertex to resize";
      break;
    default:
      sidesInput.style.display = "none";
      instructionBanner.innerText = "Click and drag on the canvas to draw";
      break;
  }

  sidesInput.addEventListener("change", function () {
    nPolygonSide = sidesInput.lastElementChild.value;
  });
}

function toggleHelpModal() {
  var modal = document.getElementById("help-modal");
  modal.classList.add("open");
  var modalExitButton = document.getElementById("help-modal-exit-button");
  modalExitButton.addEventListener("click", function (event) {
    event.preventDefault();
    modal.classList.remove("open");
  });
}

function showDrawnObjects() {
  var drawnObjectsBar = document.getElementById("drawn-objects-list");
  drawnObjectsBar.innerHTML = "";

  objectsList.forEach((object, index) => {
    let li = document.createElement("li");
    li.classList.add("no-bullet");
    li.innerHTML = `<div style="cursor: pointer;" id="drawn-object-item-${index}" class="drawn-object-item"><div class="drawn-object-index">${index}</div><div class="drawn-object-title">${
      // li.innerHTML = `<div style="cursor: pointer;" onClick='${setUserSelectedObject(index, object.modelType)}' id="drawn-object-item-${index}" class="drawn-object-item"><div class="drawn-object-index">${index}</div><div class="drawn-object-title">${
      object.modelType
    }</div><input type="color" id="drawn-object-color-${index}" value="${colorToHex(
      object.getVertex(0).getColor()
    )}" /></div>`;
    li.addEventListener("click", function () {
      setUserSelectedObject(index, object.modelType);
    });
    drawnObjectsBar.appendChild(li);
  });
}

function updateDrawnColor() {
  objectsList.forEach((drawnObject, index) => {
    console.log(drawnObject);
    var searchQuery = "drawn-object-color-" + index;
    var drawnObjectColor = document.getElementById(searchQuery);
    drawnObjectColor.addEventListener("change", function () {
      drawnObject.setColor(hexToRgb(drawnObjectColor.value));
      render();
    });
  });
}

function slider() {
  let x = document.getElementById("x");
  let y = document.getElementById("y");

  x.oninput = () => {
    if (userSelectedObjectIndex>=0) {
      x.nextElementSibling.value = x.value;

      let object = objectsList[userSelectedObjectIndex];
      let vertices = object.vertices;

      let diff = parseFloat(x.value) - vertices[0].getX();

      vertices.forEach((vertex) => {
        vertex.setX(vertex.getX() + diff);
      });
      render();
    }
  };

  y.oninput = () => {
    if (userSelectedObjectIndex>=0) {
      y.nextElementSibling.value = y.value;

      let object = objectsList[userSelectedObjectIndex];
      let vertices = object.vertices;

      let diff = parseFloat(y.value) - vertices[0].getY();

      vertices.forEach((vertex) => {
        vertex.setY(vertex.getY() + diff);
      });
      render();
    }
  };
}

function setUserSelectedObject(index, name) {
  let x = document.getElementById("x");
  let y = document.getElementById("y");
  let p = document.getElementById("user-selected-object-text");

  userSelectedObjectIndex = index;

  let object = objectsList[userSelectedObjectIndex];
  let firstVertices = object.vertices[0];

  x.value = firstVertices.getX();
  x.nextElementSibling.value = x.value;

  y.value = firstVertices.getY();
  y.nextElementSibling.value = y.value;

  p.innerHTML = name + " " + index;
}

function getDistance(a, b) {
  return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
}

function getClosestObjectFromCursorIndex(mousePosition){
  let maxDistance = 0.03; // Maximum distance from an object to be selected

  let closestObject = {
    distance: 3,
    indexObject: undefined,
    indexVertex: undefined,
    modelType: undefined
  }

  objectsList.forEach((object, indexObject)=>{
    object.vertices.forEach((vertex, indexVertex)=>{
      let distance = getDistance(mousePosition, vertex)
      if(distance < closestObject.distance){
        closestObject.distance = distance
        closestObject.indexObject = indexObject
        closestObject.indexVertex = indexVertex
        closestObject.modelType = object.modelType
      }
    })
  })
  
  if (closestObject.indexObject != undefined) {
    setUserSelectedObject(closestObject.indexObject, closestObject.modelType)

    return closestObject
  }
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
  var vertex = new Vertex();
  vertex.setX(x);
  vertex.setY(y);
  vertex.setColor(selectedColor);

  if (selectedObject === undefined) selectedObject = new DrawObject();
  selectedObject.modelType = selectedModel;
  selectedObject.add(vertex);

  render();
}

function initPoint(mousePosition, polygonSide, selectedModel) {
  if (
    isShouldDrawPolygon &&
    selectedModel === DrawMode.polygon &&
    selectedObject.length < polygonSide * 2
  ) {
    // 2 vertex for each side
    // if current object is not empty, add a point to the last vertex
    drawPolygon(mousePosition, polygonSide);
  } else if (
    selectedModel !== DrawMode.polygon ||
    (selectedModel === DrawMode.polygon && selectedObject.length === 0)
  ) {
    createPoint(mousePosition.x, mousePosition.y);
    polygonStartPosition = mousePosition;
    if (selectedModel === DrawMode.polygon) {
      isShouldDrawPolygon = true;
    }
  }
}

function createLine(a, b) {
  createPoint(a[0], a[1]);
  createPoint(b[0], b[1]);
}

function drawLine(mousePosition) {
  if (selectedObject.length === 2) selectedObject.removeLastVertex();
  createPoint(mousePosition.x, mousePosition.y);
}

function drawSquareSides(mousePosition) {
  let x0 = selectedObject.getVertex(0).x;
  let y0 = selectedObject.getVertex(0).y;

  let { x, y } = mousePosition;

  let max = Math.max(Math.abs(x - x0), Math.abs(y - y0));
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
  if (selectedObject.length === 4 * 2) {
    // 2 points for each side

    [...Array(7)].forEach(() => {
      selectedObject.removeLastVertex();
    });
  }

  drawSquareSides(mousePosition);
}

function drawRectangleSides(mousePosition) {
  let x0 = selectedObject.getVertex(0).x;
  let y0 = selectedObject.getVertex(0).y;

  let { x, y } = mousePosition;

  createPoint(x0, y);
  createLine([x0, y], [x, y]);
  createLine([x, y], [x, y0]);
  createLine([x, y0], [x0, y0]);
}

function drawRectangle(mousePosition) {
  if (selectedObject.length === 4 * 2) {
    [...Array(7)].forEach(() => {
      selectedObject.removeLastVertex();
    });
  }
  drawRectangleSides(mousePosition);
}

function drawPolygon(mousePosition, side) {
  // if a line is not created, currently selecting the next polygon point
  if (selectedObject.length % 2 !== 1) {
    createPoint(mousePosition.x, mousePosition.y);
  }
  // if this is the last point of the polygon to be drawn
  if (selectedObject.length === side * 2 - 1) {
    isShouldDrawPolygon = false;
    createPoint(polygonStartPosition.x, polygonStartPosition.y);
  }
}

function drawDraggablePolygonSide(mousePosition) {
  // there is already a line
  if (selectedObject.length % 2 === 1) {
    createPoint(mousePosition.x, mousePosition.y);
  } else {
    selectedObject.removeLastVertex();
    createPoint(mousePosition.x, mousePosition.y);
  }
}

function drawScene(mousePosition, polygonSide, selectedModel) {
  if (selectedModel === DrawMode.polygon && isShouldDrawPolygon) {
    // drawPolygon(mousePosition, polygonSide);
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
      default:
        break;
    }
  }
}

function getFarthestVertex(position) {
  let vertex = selectedObject.getVertex(0);
  let distance = getDistance(position, vertex);
  for (let i = 1; i < selectedObject.length; i++) {
    let currentVertex = selectedObject.getVertex(i);
    let currentDistance = getDistance(position, currentVertex);
    if (currentDistance > distance) {
      vertex = currentVertex;
      distance = currentDistance;
    }
  }
  return vertex;
}

function resizeSelectedObject(mousePosition) {
  if(closestObjectsFromCursor && closestObjectsFromCursor.distance < 0.05 && isMouseClicked){
    let vertices = objectsList[closestObjectsFromCursor.indexObject].vertices
    let closestVertex = vertices[closestObjectsFromCursor.indexVertex]
    if(closestObjectsFromCursor.modelType == DrawMode.line){
      closestVertex.setX(mousePosition.x)
      closestVertex.setY(mousePosition.y)
      render();
    }else if (
      closestObjectsFromCursor.modelType == DrawMode.square || closestObjectsFromCursor.modelType == DrawMode.rectangle
    ){
      selectedObject = objectsList[closestObjectsFromCursor.indexObject];
      var farthestVertex = new Vertex(getFarthestVertex(mousePosition));
      selectedObject.clear();
      selectedObject.modelType = objectsList[closestObjectsFromCursor.indexObject].modelType;
      selectedObject.add(farthestVertex);
      if (closestObjectsFromCursor.modelType == DrawMode.square) drawSquare(mousePosition);
      else drawRectangle(mousePosition);
    }
  }
}
function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function colorToHex(color) {
  return rgbToHex(color.r, color.g, color.b);
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
  var color = [];
  var position = [];

  for (let i = 0; i < objectsList.length; i++) {
    let drawnObject = objectsList[i];
    for (let j = 0; j < drawnObject.length; j++) {
      let vertex = drawnObject.getVertex(j);
      position.push(vertex.x, vertex.y);
      color.push(vertex.getColor().r, vertex.getColor().g, vertex.getColor().b);
    }
  }

  for (let i = 0; i < selectedObject.length; i++) {
    let vertex = selectedObject.getVertex(i);
    position.push(vertex.getX(), vertex.getY());
    color.push(vertex.getColor().r, vertex.getColor().g, vertex.getColor().b);
  }

  // console.log(color);

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

  let offset = 0;
  let a = 0;
  objectsList.forEach((drawnObject) => {
    gl.drawArrays(gl.LINES, offset, drawnObject.length);
    offset += drawnObject.length;
  });

  gl.drawArrays(gl.LINES, offset, selectedObject.length);
}

function main() {
  init();
  slider();

  const clearCanvasButton = document.getElementById("clear-canvas-button");
  clearCanvasButton.addEventListener("click", function () {
    clearCanvas();
    objectsList = []
    showDrawnObjects();
    render();
    showFeedback("Canvas cleared", 2000);
  });

  const helpButton = document.getElementById("help-button");
  helpButton.addEventListener("click", function (event) {
    event.preventDefault();
    toggleHelpModal();
  });

  const colorSelector = document.getElementById("color-selector");
  selectedColor = hexToRgb(colorSelector.value);
  colorSelector.addEventListener("change", function () {
    selectedColor = hexToRgb(colorSelector.value);
  });

  canvas.addEventListener("mousedown", function (event) {
    let mousePosition = getMousePositionRelativeToCanvas(canvas, event);
    if (!(selectedModel == undefined || selectedModel == DrawMode.resize)) {
      isMouseClicked = true;

      initPoint(mousePosition, nPolygonSide, selectedModel);
    }else if(selectedModel == DrawMode.resize){
      let closestObject = getClosestObjectFromCursorIndex(mousePosition);
      if (closestObject != undefined) {
        closestObjectsFromCursor = closestObject;
        isMouseClicked = true;
      }
    }
  });

  canvas.addEventListener("mouseup", function () {
    if (!(selectedModel == undefined || selectedModel == DrawMode.resize)) {
      isMouseClicked = false;

      // push selected object to object list and re initialize selected object
      if (
        selectedModel !== DrawMode.polygon ||
        (selectedModel === DrawMode.polygon &&
          selectedObject.length === nPolygonSide * 2)
      ) {
        if (objectsList === undefined) objectsList = [];
        objectsList.push(new DrawObject(selectedObject));
        selectedObject.clear();
      }

      render();

      if (!isMouseClicked) {
        // if (!isMouseClicked && !isShouldDrawPolygon) {
        showDrawnObjects();
        updateDrawnColor();
      }
    }else if(selectedModel == DrawMode.resize){
      isMouseClicked = false
    }
  });

  canvas.addEventListener("mousemove", function (event) {
    let mousePosition = getMousePositionRelativeToCanvas(canvas, event);
    if (!(selectedModel == undefined || selectedModel == DrawMode.resize)) {
      drawScene(mousePosition, nPolygonSide, selectedModel);
    }
    if(selectedModel == DrawMode.resize){
      resizeSelectedObject(mousePosition);
    }
  });
}

window.onload = main;
