let serialPort;
let writer;
let reader;

let motorOn = false;
let joystickTr = 0;
let joystickEl = 0;
let intervalMove;
let intervalShowPos;
let changeDir = true;

const mm2ticks = 2000;

async function openClosePort(event) {
    const button = document.getElementById('connectButton');
    if (button.textContent === 'Connect') {
        await requestSerialPort()
        //if (serialPort) {
        button.textContent = 'Disconnect';
        button.classList.add('active')
        //button.style.background = "#008080";

        posAngleShow('open');
        /*} else {
            button.textContent = 'Nope';
            button.style.background="#108080";
        }*/
    } else {
        await posAngleShow('close');
        await closeSerialPort();
        button.textContent = 'Connect';
        button.classList.remove('active')
        //button.style.background = "#5898d4"; 
    }
}

async function requestSerialPort() {
    try {
        serialPort = await navigator.serial.requestPort();
        await serialPort.open({ baudRate: 57600 }); 
        writer = await serialPort.writable.getWriter();
        reader = await serialPort.readable.getReader();
        console.log('Serial port opened successfully!');
        return true;
    } catch (error) {
        console.error('Error connecting to serial port:', error);
        return false;
    }
}

async function sendMsg(message) {
    // if (!serialPort) {
    //     console.error('Serial port not opened. Click "Open Serial Port" first.');
    //     return;
    // }
    //let message = 'Yes!';
    message = message + '\r';
    // const writer = serialPort.writable.getWriter();
    // console.log(`Sent: ${message}`);
    await writer.write(new TextEncoder().encode(message));
    // writer.releaseLock();
}


function openModal(modalType) {
    const sineModal = document.getElementById("Sine-group-modal");
    const repeatModal = document.getElementById("Repeat-group-modal");
    const button = document.querySelector(`[onclick="openModal('${modalType}')"]`);
    const rect = button.getBoundingClientRect();
    let modal;
    
    // Open the requested modal
    if (modalType === 'sine') {
      modal = sineModal;
      repeatModal.style.display = "none";
      
    } else if (modalType === 'repeat') {
      modal = repeatModal;
      sineModal.style.display = "none";
    }
    
    if (modal.style.display === "none" || modal.style.display === "") {
        modal.style.display = "block";
        // modal.style.position = "absolute";
        // modal.style.left = rect.left + "px";
        // modal.style.top = (rect.bottom + 5) + "px";
      } else {
        modal.style.display = "none";
      }
}

// function openSineModal() {
//     document.getElementById("Sine-group-modal").style.display = "block";
//   }
  
//   function closeSineModal() {
//     document.getElementById("Sine-group-modal").style.display = "none";
//   }
  

async function closeSerialPort() {
    if (serialPort) {
        await writer.releaseLock();
        await reader.releaseLock();
        await serialPort.close();
        console.log('Serial port closed.');
    }
}

function motorState(button) {
    //const button = document.getElementById('motorOnButton');
    if (motorOn) {
        // Turn Motors Off
        sendMsg("k");
        //button.style.background = "#5898d4";
        button.classList.remove('active');
        button.textContent = 'Motor Off';
    } else { // Turn Motors On
        if (!serialPort) {
            alert('Please connect to driver first');
        } else {
            sendMsg("en");
            //button.style.background = "#008080";
            button.classList.add('active');
            button.textContent = 'Motor On';
        }
    }
    motorOn = !motorOn;
}

async function sendConsoleMessage() {
    const consoleInput = document.getElementById('consoleInput');
    const message = consoleInput.value.split('\n').pop(); // Get the last line of the input
    await sendMsg(message); // Send the message
    const response = await readMsg(message); // Read the response
    consoleInput.value += '\n' + response; // Append the response to the input
}

function goToPosition(button) {

    setActiveButton(button);
    if (!motorOn) {
        motorState( document.getElementById('motorOnButton') );
    }

    sendMsg('opmode 3');    // Mode 3: Go to position
    sendMsg('en');          // Enable motors
    sendPosCommand();
    //sendMsg('ma ' + mm2ticks * document.getElementById('valueInput').value); // Move to position

}

function moveAbit(button, direction) {
    
    setActiveButton(button);
    if (!motorOn) {
        motorState( document.getElementById('motorOnButton') );
    }

    if (direction == 'up') {
        sendMsg('mi ' + (-10) * mm2ticks); // Move up`;
    } else {
        sendMsg('mi ' + 10 * mm2ticks); // Move down
    }

    sendMsg(message);
}

function sendPosCommand() {

    if (!document.querySelector('.button-container .button.active')) {
        // alert('Please activate the position button first');
        return;
    }

    sendMsg('ma ' + mm2ticks * document.getElementById('valueInput').value); // Move to position
    setBeePosition(pos);
}


function homing(button) {

    setActiveButton(button);
    if (!motorOn) {
        motorState( document.getElementById('motorOnButton') );
    }

    sendMsg('k');           // Disable motors
    sendMsg('opmode 4');    // Mode 4: Homing
    sendMsg('en');          // Enable motors   

    document.getElementById('valueInput').value = '0';
    setBeePosition(0);
}

function runMCT(button) {

    setActiveButton(button);
    if (!motorOn) {
        motorState( document.getElementById('motorOnButton') );
    }

    sendMsg('k');           // Disable motors
    sendMsg('opmode 6');    // Mode 5: Sine wave
    sendMsg('en');          // Enable motors
    sendMsg('mstart 1');      // Run MCT
}

function sineShake(button) {

    setActiveButton(button);
    if (!motorOn) {
        motorState( document.getElementById('motorOnButton') );
    }

    sendMsg('k');           // Disable motors
    sendMsg('opmode 5');    // Mode 5: Sine wave
    sendMsg('en');          // Enable motors
}


function startScenario(scenarioNumber) {

    let message = '';

    if (motorOn) {
        joystickTr = 0;
        joystickEl = 0;

        switch (scenarioNumber) {

            case 1:  // Home
                message = 'R1[12]=0; R1[22]=0; R1[11]=0; R1[21]=0; R1[1]=1;';
                break;

            case 2:   // Scan
                message = 'R1[12]=0; R1[22]=0; R1[11]=0; R1[21]=0; R1[1]=2;';
                break

            case 3:   // Demo
                message = 'R1[13]=1; R1[14]=100; R1[15]=90; R1[23]=5; R1[24]=30; R1[25]=10; R1[1]=3;';
                break
            case 4:   // Demo 2
                //message = 'R1[13]=1; R1[14]=50; R1[15]=-60; R1[23]=3; R1[24]=30; R1[25]=15; R1[1]=3;';
                jumpBackForth();
                break                
        }

        console.log(message);
        sendMsg(message);
    } else {
        alert('Please turn on motors first');
    }
}


function sineMove(ax){

    if (motorOn) {
        let message = '';
        // console.log('sineFrq' + ax + '-input');
        const sineFrq = document.getElementById('sineFrq' + ax + '-input').value;
        const sineAmp = document.getElementById('sineAmp' + ax + '-input').value;
        const trAng = document.getElementById('ang' + ax + '-input').value;
        if (ax == 'Tr'){
            message = `R1[13]=${10*sineFrq}; R1[14]=${10*sineAmp}; R1[15]=${trAng}; R1[1]=3`;
        } else {
            message = `R1[23]=${10*sineFrq}; R1[24]=${10*sineAmp}; R1[25]=${trAng}; R1[1]=3`;
        }
        console.log(message);
        sendMsg(message);
    } else {
        alert('Motors are off, \nPlease turn on motors first');
    }
}

function repeatMove() {
    if (motorOn) {
        const trMin = document.getElementById('repeatTrMin-input').value;
        const trMax = document.getElementById('repeatTrMax-input').value;
        const trVel = document.getElementById('repeatTrVel-input').value;
        const elMin = document.getElementById('repeatElMin-input').value;
        const elMax = document.getElementById('repeatElMax-input').value;
        const elVel = document.getElementById('repeatElVel-input').value;
        const iterations = document.getElementById('repeatIter-input').value;
        document.getElementById('repeatButton').style.background = "#008080";
        document.getElementById('repeatIter-input').value = '1 / ' + iterations;

        // Validate input ranges
        if (trMin > trMax || elMin > elMax) {
            alert('Min values must be less than Max values');
            return;
        }

        let iterCount = 0;
        let goingToMax = false;

        if (intervalMove) {
            clearInterval(intervalMove);
            intervalMove = null;
        }

        intervalMove = setInterval(async () => {
            if (iterCount >= iterations) {
                clearInterval(intervalMove);
                intervalMove = null;

                document.getElementById('repeatButton').style.background = "#5898d4";
                document.getElementById('repeatIter-input').value = iterations;
                return;
            }

            //let currTr = await readMsg('R1[31]') / 10.0;
            //let currEl = await readMsg('R1[41]') / 10.0;
            let currTr = document.getElementById('angTr-pos').value;
            let currEl = document.getElementById('angEl-pos').value;
            console.log(`Current TR: ${currTr}, Current EL: ${currEl}`);

            if (goingToMax) {
                if (Math.abs(currTr - trMax) < 2 && Math.abs(currEl - elMax) < 2) {
                    sendMsg(`R1[11]=${trMin}; R1[21]=${elMin};`);
                    goingToMax = false;
                }// else {
                //    sendMsg(`R1[11]=${trMin}; R1[21]=${elMin};`);
                //}
            } else {
                if (Math.abs(currTr - trMin) < 2 && Math.abs(currEl - elMin) < 2) {
                    sendMsg(`R1[11]=${trMax}; R1[21]=${elMax};`);
                    goingToMax = true;
                    iterCount++;
                    document.getElementById('repeatIter-input').value = iterCount + ' / ' + iterations;
                }
            }
        }, 200);

        const message = `R1[16]=${trMin}; R1[17]=${trMax}; R1[18]=${trVel}; R1[26]=${elMin}; R1[27]=${elMax}; R1[28]=${elVel}; R1[29]=${iterations}; R1[1]=4;`;
        console.log(message);
        sendMsg(message);
        sendMsg(`R1[11]=${trMin}; R1[21]=${elMin};`);
        sendMsg(message);

    } else {
        alert('Motors are off, \nPlease turn on motors first');
    }
}


function jumpBackForth() {

    if (intervalMove) {
        clearInterval(intervalMove);
        intervalMove = null;
        console.log("Stopped sending commands");
    } else {
        console.log("Start sending commands");
        intervalMove = setInterval(() => {
            if (changeDir) {
                message = 'R1[11]=195; R1[21]=55;';
            } else {
                message = 'R1[11]=200; R1[21]=60;';
            }
            sendMsg(message);
            changeDir = !changeDir;
        }, 1000);
    }
}

async function posAngleShow(state) {

    if (intervalShowPos && state=='close') {
        clearInterval(intervalShowPos);
        intervalShowPos = null;
        console.log("Stopped show pos command interval");
    } else if (state=='open')  {
        console.log("Start show pos command interval");
        intervalShowPos = setInterval(() => {
            setPosBoxes();
        }, 10);
    }
}

async function setPosBoxes() {
    let pos = await readMsg('pfb');
    updateInputValue('input-position', pos, 1/mm2ticks);
    let vel = await readMsg('vfb');
    updateInputValue('input-velociy', vel, 1/mm2ticks);
    let cur = await readMsg('i');
    updateInputValue('input-current', cur);
}

async function readMsg(message) {
    // Send the message
    await sendMsg(message);
  
    // Initialize the reader for the serial port
    // let reader = serialPort.readable.getReader();
  
    try {
      // Read data from the serial port
      const { value, done } = await reader.read();
  
      if (value) {
        // Convert Uint8Array to string and process the response
        const decodedValue = new TextDecoder().decode(value);
        const response = removeCommand(message, decodedValue);
        return response; // Return the processed response
      } else {
        console.warn("No data received or connection closed.");
        return null;
      }
    } catch (error) {
      console.error("Error reading from serial port:", error);
      return null;
    } finally {
      // Always release the reader lock
    //   await reader.releaseLock();
    }
  }

// async function readMsg(message) {

//             await sendMsg(message);
//             let reader = serialPort.readable.getReader();
//             const { value, done } = await reader.read();
//             if (value) {
//                 // Convert Uint8Array to string for easier reading
//                 // console.log("Received data:", new TextDecoder().decode(value));
//                 response = removeCommand(message, new TextDecoder().decode(value));
//                 console.log(response);
//             }
//             await reader.releaseLock();
// }

function removeCommand(command, response) {
    if (response.startsWith(command)) {
      let result = response.slice(command.length); // Remove the command
      if (result.endsWith(';')) {
        result = result.slice(0, -1); // Remove the trailing ';'
      }
      return result;
    }
    return null; // If command is not at the start, return the original response
  }

  async function updateInputValue(inputId, valueString, factor = 1) {
    // Convert the valueString to a number
    const number = parseFloat(valueString);
    if (isNaN(number)) {
      //console.error(`Invalid number: "${valueString}"`);
      return;
    }
  
    // Calculate the new value
    const newValue = number / factor;
  
    // Update the input box value
    const inputElement = document.getElementById(inputId);
    if (inputElement) {
      inputElement.value = newValue;
    } else {
      console.error(`Input with id "${inputId}" not found.`);
    }
  }

function playTune() {

    if (motorOn) {
        let message = 'R1[1]=8';
        sendMsg(message);
    } else {
        alert('Motors are off, \nPlease turn on motors first');
    }
}


function playLocalTone() {
    const audioElement = document.getElementById('localAudio');
    audioElement.play();
}

const bee = document.getElementById("bee");
const input = document.getElementById("valueInput");
const sliderFill = document.getElementById("sliderFill");
const sliderHeight = 300;
let min = 0, max = 400;

function setBeePosition(value) {
    let percentage = (value - min) / (max - min);
    let position = percentage * (sliderHeight - 40);
    bee.style.top = position + "px";
    sliderFill.style.height = (sliderHeight - position) + "px";
}

function getValueFromPosition(y) {
    let percentage = y / (sliderHeight - 40);
    return Math.round(min + percentage * (max - min));
}

bee.onmousedown = function(event) {
    event.preventDefault();
    document.onmousemove = function(e) {
        let newY = e.clientY - bee.parentElement.getBoundingClientRect().top - 20;
        newY = Math.max(0, Math.min(newY, sliderHeight - 40));
        bee.style.top = newY + "px";
        sliderFill.style.height = (sliderHeight - newY) + "px";
        input.value = getValueFromPosition(newY);
    };
    document.onmouseup = function() {
        document.onmousemove = null;
        document.onmouseup = null;
    };
};

input.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        let value = Math.max(min, Math.min(max, input.value));
        setBeePosition(value);
        sendPosCommand();
    }
});

// input.addEventListener("input", function(event) {
//     sendPosCommand();
// });

function setActiveButton(button) {
    //document.querySelectorAll('.button').forEach(btn => btn.classList.remove('active'));
    const beesliderWrapper = document.querySelector('.button-container');
    beesliderWrapper.querySelectorAll('.button').forEach(btn => btn.classList.remove('active'));

    button.classList.add('active');
}

setBeePosition(input.value);
