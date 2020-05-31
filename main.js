// Кнопки UI
let connectButton = document.getElementById('connect');
let disconnectButton = document.getElementById('disconnect');
let terminalContainer = document.getElementById('terminal');
let sendForm = document.getElementById('send-form');
let inputField = document.getElementById('input');
let clearbutton = document.getElementById('clear');
let startbutton = document.getElementById('start');
let stopbutton = document.getElementById('stop');
let moveup = document.getElementById('up');
let movedown = document.getElementById('down');
let moveleft = document.getElementById('left');
let moveright = document.getElementById('right');
let commands = ["Вперед", "ФункцияБ", "Освещение", "ФункцияА", "Конец"];
let functionA = ["Вперед", "Вниз", "Освещение", "ФункцияБ", "Конец"];
let functionB = ["Вперед", "Вниз", "Освещение", "Назад", "Конец"];

// Кэш для объекта устройства
let deviceCache = null;

// Кэш для объекта характеристики
let characteristicCache = null;

let checkConnect = false;


function blockColor(id) {
    document.getElementById(id).style.backgroundColor = "#21fe96";
}

//Функция для автоматического скроллинга терминала

function scroll() {
    let terminal = document.getElementById('terminal');
    terminal.scrollTop = 9999;
}

function clear() {
    terminalContainer.innerHTML = '';
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let count = 1;
let i = 0;
let j = 5;
let k = 10;
let stop = false;
async function StartProgram() {
    for (let i = 0; i < commands.length; i++) {
        await sleep(500);
        console.log(count++ + ")" + "П: " + commands[i])
        send(commands[i]);
        if (commands[i] == "ФункцияА") {
            await funcA();
        }
        if (commands[i] == "ФункцияБ") {
            await funcB();
        }
        if (stop == true) {
            return;
        }
        blockColor(i);
    }
    await sleep(1000);
    document.querySelectorAll(".prog").forEach(function (item) {
        item.style.backgroundColor = "#255a41";
    });
    log("Выполнение завершено")
}

async function funcA() {
    for (let j = 5; j < functionA.length + 5; j++) {
        await sleep(500);
        if (stop == true) {
            return;
        }
        send(functionA[j - 5]);
        console.log(count++ + ")" + "A: " + functionA[j - 5])
        if (functionA[j - 5] == "ФункцияА") {
            await funcA();
        } else if (functionA[j - 5] == "ФункцияБ") {
            await funcB();
        }
        blockColor(j);
    }
    await sleep(500);
    document.querySelectorAll(".fa").forEach(function (item) {
        item.style.backgroundColor = "#255a41";
    });
}

async function funcB() {
    for (let k = 10; k < functionB.length + 10; k++) {
        await sleep(500);
        if (stop == true) {
            return;
        }
        send(functionB[k - 10]);
        console.log(count++ + ")" + "Б: " + functionB[k - 10])
        if (functionB[k - 10] == "ФункцияА") {
            await funcA();
        } else if (functionB[k - 10] == "ФункцияБ") {
            await funcB();
        }
        blockColor(k);
    }
    await sleep(500);
    document.querySelectorAll(".fb").forEach(function (item) {
        item.style.backgroundColor = "#255a41";
    });
}

clearbutton.addEventListener('click', function () {
    clear();
})

moveup.addEventListener('click', function () {
    send("Вверх")
})
movedown.addEventListener('click', function () {
    send("Вниз")
})
moveleft.addEventListener('click', function () {
    send("Влево")
})
moveright.addEventListener('click', function () {
    send("Вправо")
})

startbutton.addEventListener('click', function () {
    if (checkConnect == true) {
        stop = false;
        log("Выполняю...")
        i = 0;
        j = 5;
        k = 10;
        count = 1;
        StartProgram();
    } else {
        log("[Ошибка] Устройство не подключено");
        return;
    }
})
stopbutton.addEventListener('click', async function () {
    if (checkConnect == true) {
        stop = true;
        await sleep(500);
        document.querySelectorAll(".block").forEach(function (item) {
            item.style.backgroundColor = "rgb(145, 45, 45)";
        });
        await sleep(500);
        document.querySelectorAll(".block").forEach(function (item) {
            item.style.backgroundColor = "#255a41";
        });
        log("Выполнение прекращено")
        console.log(count++ + ")" + "Прекращено пользователем")
    } else {
        log("[Ошибка] Устройство не подключено");
        return;
    }
})


// Подключение к роботу при нажатии на кнопку "Подключиться"
connectButton.addEventListener('click', function () {
    connect();
});

// Отключение от робота при нажатии на кнопку "Отключиться"
disconnectButton.addEventListener('click', function () {
    disconnect();
});

// Обработка нажатий кнопок взаимодействия с роботом(отправка формы)
sendForm.addEventListener('submit', function (event) {
    event.preventDefault();
    send(inputField.value);
    inputField.value = '';
    inputField.focus();
});

// Запустить выбор Bluetooth устройства и подключиться к выбранному
function connect() {
    return (deviceCache ? Promise.resolve(deviceCache) :
        requestBluetoothDevice()).
    then(device => connectDeviceAndCacheCharacteristic(device)).
    then(characteristic => startNotifications(characteristic)).
    catch(error => log(error));
}

// Всплывающее окно для выбора устрйства и подключения к нему
function requestBluetoothDevice() {
    log('Запрашиваю Bluetooth устройство...');
    return navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['0000aaa0-0000-1000-8000-aabbccddeeff', 0x1801, 0x1800, 0x180D, 0x181C]
    }).
    then(device => {
        log('Bluetooth устройство выбрано');
        deviceCache = device;
        deviceCache.addEventListener('gattserverdisconnected',
            handleDisconnection);

        return deviceCache;
    });
}

// Функция, обрабатывающая отсоеденения устройсва и попытку переподключиться
function handleDisconnection(event) {
    let device = event.target;

    log('Bluetooth устройство отключено, пытаюсь переподключиться...');
    connectDeviceAndCacheCharacteristic(device).
    then(characteristic => startNotifications(characteristic)).
    catch(error => log(error));
}


// Функция подключения к выьранному устройству, подключение к выбранному сервису и характеристике
function connectDeviceAndCacheCharacteristic(device) {
    if (device.gatt.connected && characteristicCache) {
        return Promise.resolve(characteristicCache);
    }

    log('Подключаюсь GATT серверу...');
    return device.gatt.connect().
    then(server => {
        log('GATT сервер подключен. Подключаюсь к нужному сервису...');
        return server.getPrimaryService("0000aaa0-0000-1000-8000-aabbccddeeff");
    }).
    then(service => {
        log('Сервис подключен. Подключаюсь к характеристике...');
        return service.getCharacteristic("0000aaa2-0000-1000-8000-aabbccddeeff");
    }).
    then(characteristic => {
        log('Характеристика подключена');
        characteristicCache = characteristic;
        return characteristicCache;
    });
}

// Функция вывода в терминал
function log(data, type = '') {
    terminalContainer.insertAdjacentHTML('beforeend',
        '<div' + (type ? ' class="' + type + '"' : '') + '>' + '>' + data + '</div>');
    scroll()
}

// Функция подключения к уведомлениям характеристики
function startNotifications(characteristic) {
    log('Включаем уведомления...');
    return characteristic.startNotifications().
    then(() => {
        log('Уведомления включены');
        log('Готово к работе');
        checkConnect = true;
        characteristic.addEventListener('characteristicvaluechanged',
            handleCharacteristicValueChanged);
    });
}

// Отключиться от подключенного устройства
function disconnect() {
    if (deviceCache) {
        log('Отключаюсь от Bluetooth устройства...');
        deviceCache.removeEventListener('gattserverdisconnected',
            handleDisconnection);

        if (deviceCache.gatt.connected) {
            deviceCache.gatt.disconnect();
            log('Bluetooth устройство отключено');
            checkConnect = false;
        } else {
            log('Bluetooth устройство уже отключено');
            checkConnect = false;
        }
    }
    if (characteristicCache) {
        characteristicCache.removeEventListener('characteristicvaluechanged',
            handleCharacteristicValueChanged);
        characteristicCache = null;
    }
    deviceCache = null;
}

// Получение данных от сервера
function handleCharacteristicValueChanged(event) {
    let value = new TextDecoder().decode(event.target.value);
    log(value, 'in');
}

// Функция отбработки полученных данных
function receive(data) {
    log(data, 'in');
}


// Функция отправки данных на сервер 
function send(data) {
    data = String(data);

    if (!data || !characteristicCache) {
        return;
    }

    data += '\n';

    if (data.length > 20) {
        let chunks = data.match(/(.|[\r\n]){1,20}/g);

        writeToCharacteristic(characteristicCache, chunks[0]);

        for (let i = 1; i < chunks.length; i++) {
            setTimeout(() => {
                writeToCharacteristic(characteristicCache, chunks[i]);
            }, i * 100);
        }
    } else {
        writeToCharacteristic(characteristicCache, data);
        characteristicCache.value = data;
    }
    log(data, 'out');
}

// Поместитть новое значение в характеристику
function writeToCharacteristic(characteristic, data) {
    characteristic.writeValue(new TextEncoder().encode(data));
}