"use strict";
// Libraries
const _ = require("lodash");
const hap = require("hap-nodejs");
const Service = hap.Service;
const Characteristic = hap.Characteristic;
const mqtt = require("mqtt");
// Local
const accessories = [];
const devices = [
  {
    displayName: "1st Sensor",
    ip: "192.168.1.28"
  }
];
const deviceMap = {};
const mqttClient = mqtt.connect([{
  clientId: "HAP-Nodejs",
  host: "localhost",
  port: 1883
}]);

function createTemperatureSensor(device) {
  var temperatureUUID = hap.uuid.generate("hap-nodejs:accessories:" + device.ip + ":temp");
  var temperatureAccessory = new hap.Accessory(device.displayName || device.ip + " Temperature", temperatureUUID);
  device.accessories.temperature = temperatureAccessory;
  accessories.push(temperatureAccessory);

  _.assign(temperatureAccessory, {
    username: "00:13:ef:20:36:4e" + device.ip,
    pincode: "213-17-001"
  });
    
  temperatureAccessory
    .getService(hap.Service.AccessoryInformation)
    .setCharacteristic(hap.Characteristic.Manufacturer, "DHT")
    .setCharacteristic(hap.Characteristic.Model, "11");

  temperatureAccessory.on("identify", function (paired, callback) {
    callback(); // success
  });

  temperatureAccessory
    .addService(hap.Service.TemperatureSensor)
    .getCharacteristic(hap.Characteristic.CurrentTemperature)
    .on("get", function(callback) {
      if (_.isNumber(device.temperature)) {
        callback(null, device.temperature);
      } else {
        callback("Temperature unavailable");
      }
    });
}

function createHumiditySensor(device) {
  var humidityUUID = hap.uuid.generate("hap-nodejs:accessories:" + device.ip + ":humidity");
  var humidityAccessory = new hap.Accessory(device.displayName || device.ip + " Humidity", humidityUUID);
  device.accessories.humidity = humidityAccessory;
  accessories.push(humidityAccessory);

  _.assign(humidityAccessory, {
    username: "00:13:ef:20:36:4e" + device.ip,
    pincode: "213-17-001"
  });
    
  humidityAccessory
    .getService(hap.Service.AccessoryInformation)
    .setCharacteristic(hap.Characteristic.Manufacturer, "DHT")
    .setCharacteristic(hap.Characteristic.Model, "11");

  humidityAccessory.on("identify", function(paired, callback) {
    callback(); // success
  });

  humidityAccessory
    .addService(hap.Service.HumiditySensor)
    .getCharacteristic(hap.Characteristic.CurrentRelativeHumidity)
    .on("get", function(callback) {
      if (_.isNumber(device.humidity)) {
        callback(null, device.humidity);
      } else {
        callback("Humidity unavailable");
      }
    });
}

function updateTemperature(error, data) {
  if (error) {
    return console.log(error);
  } else {
    return console.log(data);
  }
  // Log the values
  if (data.type === "Temperature") {
    var temp = parseInt(data.value, 10);
    if (temp !== temperature.value) {
      temperature.value = temp;
      temperatureAccessory
        .getService(Service.TemperatureSensor)
        .setCharacteristic(Characteristic.CurrentTemperature, temperature.value);
    }
  }
}

function updateSensor(data) {
  var json = JSON.parse(data);
  var device = deviceMap[json.ip];
  if (device) {
    if (json.temperature !== device.temperature) {
      device
        .accessories
        .temperature
        .getService(Service.TemperatureSensor)
        .setCharacteristic(Characteristic.CurrentTemperature, json.temperature);
      device.temperature = json.temperature;
    }
    if (json.humidity !== device.humidity) {
      device
        .accessories
        .humidity
        .getService(Service.HumiditySensor)
          .setCharacteristic(Characteristic.CurrentRelativeHumidity, json.humidity);
      device.humidity = json.humidity;
    }
    
  }
}

function initialize() {
  mqttClient.on("DHT11 ESP8266", updateSensor);
  mqttClient.on("message", function (topic, data) {
    if (topic === "DHT11 ESP8266") {
      updateSensor(data);
    } else {
      console.log(topic);
    }
  });

  mqttClient.subscribe("DHT11 ESP8266");
  _.each(devices, function (device) {
    deviceMap[device.ip] = device;
    device.accessories = {};
    createHumiditySensor(device);
    createTemperatureSensor(device);
  });
}

initialize();
console.log(accessories.length);
// Module
module.exports = accessories;
