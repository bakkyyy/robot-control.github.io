// Получение ссылок на элементы UI
let connectButton = document.getElementById('connect');
let disconnectButton = document.getElementById('disconnect');
let terminalContainer = document.getElementById('terminal');
let sendForm = document.getElementById('send-form');

let deviceCache = null;

// Подключение к устройству при нажатии на кнопку Connect
connectButton.addEventListener('click', function () {
    connect();
});

// Отключение от устройства при нажатии на кнопку Disconnect
disconnectButton.addEventListener('click', function () {
    disconnect();
});

// Обработка события отправки формы
sendForm.addEventListener('submit', function (event) {});

// Запустить выбор Bluetooth устройства и подключиться к выбранному
function connect() {
    return (deviceCache ? Promise.resolve(deviceCache) :
        requestBluetoothDevice()).
    then(device => connectDeviceAndCacheCharacteristic(device)).
    then(characteristic => startNotifications(characteristic)).
    catch(error => log(error));

}

// Отключиться от подключенного устройства
function disconnect() {
    if (deviceCache) {
        log('Отключение от  "' + deviceCache.name + '" bluetooth device...');
        deviceCache.removeEventListener('gattserverdisconnected',
            handleDisconnection);

        if (deviceCache.gatt.connected) {
            deviceCache.gatt.disconnect();
            log('"' + deviceCache.name + '" bluetooth device отключен');
        } else {
            log('"' + deviceCache.name +
                '" bluetooth device уже отключен');
        }
    }

    characteristicCache = null;
    // Можно не обнулять, тогда при следующем подключении он подключится к предыдущему
    //deviceCache = null;
}

// Отправить данные подключенному устройству
function send(data) {
    //
}

// Запрос выбора Bluetooth устройства
function requestBluetoothDevice() {
    log('Запрашиваем bluetooth устройство...');

    return navigator.bluetooth.requestDevice({
        filters: [{
            services: [0xFFE0]
        }],
    }).
    then(device => {
        log('"' + device.name + '" bluetooth устройство выбрано ');
        deviceCache = device;
        //для отслеживания разъеденения 
        deviceCache.addEventListener('gattserverdisconnected',
            handleDisconnection);

        return deviceCache;
    });
}
//Сам обработчик разъеденения (Если обесточить устройство, то он попроует сам переподключиться)
function handleDisconnection(event) {
    let device = event.target;

    log('"' + device.name +
        '" bluetooth устройство отключено, попытка переподключиться...');

    connectDeviceAndCacheCharacteristic(device).
    then(characteristic => startNotifications(characteristic)).
    catch(error => log(error));
}

// Подключение к определенному устройству, получение сервиса и характеристики
function connectDeviceAndCacheCharacteristic(device) {
    if (device.gatt.connected && characteristicCache) {
        return Promise.resolve(characteristicCache);
    }

    log('Подключение к GATT...');

    return device.gatt.connect().
    then(server => {
        log('GATT подключен...');

        return server.getPrimaryService(0xFFE0);
    }).
    then(service => {
        log('Устройство найдено, получение характеристик...');

        return service.getCharacteristic(0xFFE1);
    }).
    then(characteristic => {
        log('Характеристики найдены');
        characteristicCache = characteristic;

        return characteristicCache;
    });
}

// Включение получения уведомлений об изменении характеристики
function startNotifications(characteristic) {
    log('Включение уведомлений...');

    return characteristic.startNotifications().
    then(() => {
        log('Уведомления включены');
    });
}

// Вывод в терминал
function log(data, type = '') {
    terminalContainer.insertAdjacentHTML('beforeend',
        '<div' + (type ? ' class="' + type + '"' : '') + '>' + data + '</div>');
}