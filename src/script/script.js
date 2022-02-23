const DEBUG = false;
let canvas = document.getElementById("gl-canvas");
let gl;
let program;

let n_items = 0;

let positions = [];
let colors = [];

let vetrices_nums = [];
let offsets = [];

// return a shader
function createShader(gl, type, source){
    let shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
  
    return shader;
  }
  
// return a shader program
function createProgram(gl, vertex, fragment){
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

function init() {
    // initializations
    gl = canvas.getContext("webgl");
    
    if (!gl) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
    }
    
    let vertexShaderSource = document.getElementById("vertex-shader");
    if (!vertexShaderSource) {
        alert("Unable to find vertex shader");
        return;
    }
    vertexShaderSource = vertexShaderSource.text;
    
    let fragmentShaderSource = document.getElementById("fragment-shader");
    if (!fragmentShaderSource) {
        alert("Unable to find fragment shader");
        return;
    }
    fragmentShaderSource = fragmentShaderSource.text;
    
    let vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    let fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    program = createProgram(gl, vertexShader, fragmentShader);
}

function showFeedback(text) {
    var feedbackArea = document.getElementById("feedback-banner");
    feedbackArea.innerText = text;
}

function main() {
    init();

    var addModelButton = document.getElementById("add-model-button");
    addModelButton.addEventListener("click", function() {
        var modelDropdown = document.getElementById("model-selector");
        var selectedModel = modelDropdown.value;
    
        showFeedback(`Model ${selectedModel} added`);
        
        switch(selectedModel) {
            case ModelTypes.LINE:
                addLine();
                break;
            case ModelTypes.SQUARE:
                addSquare();
                break;
            case ModelTypes.POLYGON:
                addPolygon();
                break;
            default:
                break;
        }

        render();
    });

    var clearCanvasButton = document.getElementById("clear-canvas-button");
    clearCanvasButton.addEventListener("click", function() {
        clearCanvas();
        render();
        showFeedback("Canvas cleared");
    });
    
}

function clearScene() {
    gl.clearColor(0.5, 0.5, 0.5, 0.5);
    gl.clear(gl.COLOR_BUFFER_BIT);

    resizeCanvas(canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}

function clearCanvas() {
    positions = [];
    colors = [];
    n_items = 0;
    offsets = [];
    vetrices_nums = [];
}

function render() {
    gl.useProgram(program);
    clearScene();

    let positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    let colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    let positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const vertex_dimensions = 2;
    gl.vertexAttribPointer(positionAttributeLocation, vertex_dimensions, gl.FLOAT, false, 0, 0);

    let colorAttributeLocation = gl.getAttribLocation(program, "a_color");
    gl.enableVertexAttribArray(colorAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    const color_dimensions = 3;
    gl.vertexAttribPointer(colorAttributeLocation, color_dimensions, gl.FLOAT, false, 0, 0);

    var matrix = m3.identity();
    
    let matrixLocation = gl.getUniformLocation(program, "u_matrix");
    gl.uniformMatrix3fv(matrixLocation, false, matrix);

    if (DEBUG) console.log(`Item: ${n_items}`);
    for(let i=0;i<n_items;i++){
        if(DEBUG) {
            console.log(`Item: ${i}\nOffset: ${offsets[i]}\nNum of vertex: ${vetrices_nums[i]}\n`);
            console.log(`
            Positions: ${positions.slice(offsets[i], offsets[i]+vetrices_nums[i])}
            Color: ${colors.slice(offsets[i], offsets[i]+vetrices_nums[i]*color_dimensions)}
            `);
        }
        let types = vetrices_nums[i] === 2 ? gl.LINES : gl.TRIANGLES;
        gl.drawArrays(types, offsets[i], vetrices_nums[i]);
    }
}

var m3 = {
  projection: function(width, height) {
    // Note: This matrix flips the Y axis so that 0 is at the top.
    return [
      2 / width, 0, 0,
      0, -2 / height, 0,
      -1, 1, 1
    ];
  },

  identity: function() {
    return [
      1, 0, 0,
      0, 1, 0,
      0, 0, 1,
    ];
  },

  translation: function(tx, ty) {
    return [
      1, 0, 0,
      0, 1, 0,
      tx, ty, 1,
    ];
  },

  rotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);
    return [
      c,-s, 0,
      s, c, 0,
      0, 0, 1,
    ];
  },

  scaling: function(sx, sy) {
    return [
      sx, 0, 0,
      0, sy, 0,
      0, 0, 1,
    ];
  },

  multiply: function(a, b) {
    var a00 = a[0 * 3 + 0];
    var a01 = a[0 * 3 + 1];
    var a02 = a[0 * 3 + 2];
    var a10 = a[1 * 3 + 0];
    var a11 = a[1 * 3 + 1];
    var a12 = a[1 * 3 + 2];
    var a20 = a[2 * 3 + 0];
    var a21 = a[2 * 3 + 1];
    var a22 = a[2 * 3 + 2];
    var b00 = b[0 * 3 + 0];
    var b01 = b[0 * 3 + 1];
    var b02 = b[0 * 3 + 2];
    var b10 = b[1 * 3 + 0];
    var b11 = b[1 * 3 + 1];
    var b12 = b[1 * 3 + 2];
    var b20 = b[2 * 3 + 0];
    var b21 = b[2 * 3 + 1];
    var b22 = b[2 * 3 + 2];
    return [
      b00 * a00 + b01 * a10 + b02 * a20,
      b00 * a01 + b01 * a11 + b02 * a21,
      b00 * a02 + b01 * a12 + b02 * a22,
      b10 * a00 + b11 * a10 + b12 * a20,
      b10 * a01 + b11 * a11 + b12 * a21,
      b10 * a02 + b11 * a12 + b12 * a22,
      b20 * a00 + b21 * a10 + b22 * a20,
      b20 * a01 + b21 * a11 + b22 * a21,
      b20 * a02 + b21 * a12 + b22 * a22,
    ];
  },
};

function euclideanDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function updateVariables(number_of_vetrices) {
    vetrices_nums[n_items] = number_of_vetrices;
    offsets[n_items] = n_items == 0 ? 0 : offsets[n_items-1] + vetrices_nums[n_items-1];
}

function addLine(x1 = -0.5, y1 = 0.8, x2 = 0.5, y2 = 0.8, color = [1, 0, 0]) {
    let number_of_vetrices = 2;
    updateVariables(number_of_vetrices);
    
    // positions
    positions.push(x1, y1);
    positions.push(x2, y2);
    // colors
    for (let i = 0; i < number_of_vetrices; i++) {
        colors.push(...color);
    }

    n_items++;
}

function addSquare(x1 = 0.5, y1 = 0.5, x2 = -0.5, y2 = 0.5, x3 = -0.5, y3 = -0.5, x4 = 0.5, y4 = -0.5, color = [1, 0, 0]) {
    let number_of_vetrices = 6;
    updateVariables(number_of_vetrices);

    // positions
    positions.push(x1, y1);
    positions.push(x2, y2);
    positions.push(x3, y3);
    positions.push(x1, y1);
    positions.push(x4, y4);
    positions.push(x3, y3);
    // colors
    for (let i = 0; i < number_of_vetrices; i++) {
        colors.push(...color);
    }

    n_items++;
}

function addPolygon(n_vertex = 5, color = [1, 0, 0]) {
    let number_of_vetrices = 5;
    updateVariables(number_of_vetrices);

    // positions
    for(let i=0;i<n_vertex;i++){
        positions.push(Math.cos(2*Math.PI*i/n_vertex), Math.sin(2*Math.PI*i/n_vertex));
    }
    // colors
    for(let i=0;i<n_vertex;i++){
        colors.push(...color);
    }
}

class ModelTypes {
    static LINE = "line";
    static SQUARE = "square";
    static POLYGON = "polygon";

    constructor(name) {
        this.name = name;
    }
}

window.onload = main;