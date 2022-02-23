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
    
}

function clearScene() {
    gl.clearColor(0.5, 0.5, 0.5, 0.5);
    gl.clear(gl.COLOR_BUFFER_BIT);

    resizeCanvas(canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
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

    console.log(`Item: ${n_items}`);
    for(let i=0;i<n_items;i++){
        console.log(`Item: ${i}\nOffset: ${offsets[i]}\nNum of vertex: ${vetrices_nums[i]}\n`);
        console.log(`
        Positions: ${positions.slice(offsets[i], offsets[i]+vetrices_nums[i])}
        Color: ${colors.slice(offsets[i], offsets[i]+vetrices_nums[i]*color_dimensions)}
        `);
        gl.drawArrays(gl.LINES, offsets[i], vetrices_nums[i]);
    }
}

function addLine() {
    vetrices_nums[n_items] = 2;

    if (n_items === 0) offsets[n_items] = 0;
    else offsets[n_items] = offsets[n_items-1] + vetrices_nums[n_items-1];
    
    // positions
    positions.push(-0.5,0);
    positions.push(0.5,0);
    // colors
    colors.push(1,0,0);
    colors.push(1,0,0);

    n_items++;
}

function addSquare() {
    console.log("square");
}

function addPolygon() {
    console.log("polygon");
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