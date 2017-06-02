var sensors = {};
var gravity = {x:null, y:null, z:null};
var accel = {x:null, y:null, z:null};
var prevaccel = {x:null, y:null, z:null}        //used for detecting shaking motion
var diff = {x:null, y:null, z:null}        //used for detecting shaking motion
var shakingvar = 1;        //used for detecting shaking motion
var sensorfreq = 30;     //for setting desired sensor frequency
var movefreq = 1000;    //how many times a second the ball moves, TODO: affects the speed of the ball, even though probably should not
var sensors_started = false;
var mainUpdate;
var randomEvent;
var caught = false;

var drawvar;

class LowPassFilterData {       //https://w3c.github.io/motion-sensors/#pass-filters
  constructor(reading, bias) {
    Object.assign(this, { x: reading.x, y: reading.y, z: reading.z });
    this.bias = bias;
  }
        update(reading) {
                this.x = this.x * this.bias + reading.x * (1 - this.bias);
                this.y = this.y * this.bias + reading.y * (1 - this.bias);
                this.z = this.z * this.bias + reading.z * (1 - this.bias);
        }
};

function magnitude(vector)      //Calculate the magnitude of a vector
{
return Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
}

screen.orientation.lock('portrait');

var canvas;
var ctx;
var dx = 0;
var dy = 0;
//starting position
var x = 570;
var y = 360;
//canvas size
var WIDTH = 800;
var HEIGHT = 800;
var img = new Image();
var collision = 0;

function rect(x,y,w,h) {
ctx.beginPath();
ctx.rect(x,y,w,h);
ctx.closePath();
ctx.fill();
}
function clear() {
ctx.clearRect(0, 0, WIDTH, HEIGHT);
ctx.drawImage(img, 0, 0);
}
function init() {
canvas = document.getElementById("canvas");
ctx = canvas.getContext("2d");
img.src = "maze2.gif";
startSensors();
mainUpdate = setInterval(update, 1000/movefreq);
return requestAnimationFrame(draw);
}

function checkcollision() {
var imgd = ctx.getImageData(x, y, 15, 15);
var pix = imgd.data;
for (var i = 0; n = pix.length, i < n; i += 4) {
if (pix[i] == 0) {
collision = 1;
}
}
}
function draw() {
clear();
ctx.fillStyle = "purple";
rect(x, y, 15,15);
drawvar = requestAnimationFrame(draw);
}
init();

function shakeEvent()
{
        if (caught == true)
        {
                caught = false;
        }
}

function update()        //Main loop
{
        //filter noise
        if(Math.abs(gravity.x) > 0.1)
        {    
                        dx = -0.5 * gravity['x'];
        }     
        if(Math.abs(gravity.y) > 0.1)
        {            
                        dy = 0.5 * gravity['y'];                      
        }
        if(magnitude(diff) > (120/sensorfreq))  //with lower sensor frequencies the diff will be bigger
        {
                shakingvar = shakingvar + 1;
        }
        else
        {
                if(shakingvar > 0)
                {
                shakingvar = shakingvar - 1;
                }
        }
        if(shakingvar >= 100)    //shake event
        {
                //console.log("SHAKE");
                shakeEvent();
                shakingvar = 0;
        }
        //Simulate friction
        dx = dx/1.01
        dy = dy/1.01
        //y axis
        if(y + dy < HEIGHT && y + dy > 0)
        {
                if(caught == false)
                {
                        y += dy;                
                        clear();
                        checkcollision();
                        if (collision == 1){
                                y -= dy;
                                collision = 0;
                        }
                }
        }
        if(x + dx < WIDTH && x + dx > 0)
        {
                if(caught == false)
                {
                        x += dx;
                        clear();
                        checkcollision();
                        if (collision == 1){
                                x -= dx;
                                collision = 0;
                        }
                }
        }
        randomEvent = Math.random();
        //console.log(randomEvent);
        if(randomEvent > 1000*(0.99975/movefreq))
        {
                caught = true;
                console.log("RANDOM EVENT")
                ctx.font = '48px serif';
                ctx.fillText('Hello world', 50, 100);
                //ctx.fillText("You are caught by the monster! Shake the phone to free yourself!",10,90)
                cancelAnimationFrame(draw);
        }
}

function startSensors() {
                try {
                //Right now we only want to use gravity sensor (low-pass filtered daccelerometer data)
                //Accelerometer including gravity
                accelerometer = new Accelerometer({ frequency: sensorfreq, includeGravity: true });
                //accelerometer = new GravitySensor({frequency: sensorfreq})
                sensors.Accelerometer = accelerometer;
                gravity =  new LowPassFilterData(accelerometer, 0.8);   //need to find good bias value
                accelerometer.onchange = event => {
                        prevaccel = accel;
                        accel = {x:accelerometer.x, y:accelerometer.y, z:accelerometer.z};
                        for (var key in accel)
                                {
                                        diff[key] = accel[key] - prevaccel[key];
                                }
                        //For the ball to not move slow in the beginning due to gravity low-pass filtering taking very long, we set an initial value - only done on first accelerometer onchange event
                        if(gravity.x == null && gravity.y == null)
                        {
                        gravity.x = accel.x;
                        gravity.y = accel.y;
                        //console.log(gravity);
                        }
                        gravity.update(accel);
                }
                accelerometer.onerror = err => {
                  accelerometer = null;
                  console.log(`Accelerometer ${err.error}`)
                }
                accelerometer.start();
                } catch(err) { console.log(err); }
                sensors_started = true;
                return sensors;
}
