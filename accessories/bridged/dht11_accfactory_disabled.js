(function () {
  // Libraries
  const _ = require("lodash");
  const hap = require("hap-nodejs");
  const Accessory = hap.Accessory;
  const Service = hap.Service;
  const Characteristic = hap.Characteristic;
  const uuid = hap.uuid;
  const raspiSensors = require('raspi-sensors');
  // Local
  const temperature = {
    id: "TempSensor",
    value: 0
  };
  const humidity = {
    id: "HumiditySensor",
    value: 0
  };
  const sensor = new raspiSensors.Sensor({
    type    : "DHT11",
    pin : 0X4
  }, "DHT11");
  const sensors = [];
  
  var tempUUID = uuid.generate("hap-nodejs:accessories:" + temperature.id);
  var tempAccessory = new Accessory("Temperature Sensor", tempUUID);
  sensors.push(tempAccessory);

  _.assign(tempAccessory, {
    username: "00:13:ef:20:36:4e" + temperature.id,
    pincode: "213-17-001"
  });
    
  tempAccessory
    .getService(Service.AccessoryInformation)
    .setCharacteristic(Characteristic.Manufacturer, "DHT")
    .setCharacteristic(Characteristic.Model, "11");

  tempAccessory.on('identify', function(paired, callback) {
    callback(); // success
  });

  tempAccessory
    .addService(Service.TemperatureSensor)
    .getCharacteristic(Characteristic.CurrentTemperature)
    .on('get', function(callback) {
      callback(null, temperature.value);
    });

  var humidityUUID = uuid.generate("hap-nodejs:accessories:" + humidity.id);
  var humidityAccessory = new Accessory("Humidity Sensor", humidityUUID);
  sensors.push(humidityAccessory);

  _.assign(humidityAccessory, {
    username: "00:13:ef:20:36:4e" + humidity.id,
    pincode: "213-17-001"
  });
    
  humidityAccessory
    .getService(Service.AccessoryInformation)
    .setCharacteristic(Characteristic.Manufacturer, "DHT")
    .setCharacteristic(Characteristic.Model, "11");

  humidityAccessory.on('identify', function(paired, callback) {
    callback(); // success
  });

  humidityAccessory
    .addService(Service.HumiditySensor)
    .getCharacteristic(Characteristic.CurrentRelativeHumidity)
    .on('get', function(callback) {
      callback(null, humidity.value);
    });
	
  function updateValues(err, data) {
    if (err) {
      console.error("An error occured!");
      console.error(err.cause);
      return;
    }

	  // Log the values
	  if (data.type === "Temperature") {
      var temp = parseInt(data.value, 10);
      if (temp !== temperature.value) {
        temperature.value = temp;
        tempAccessory
          .getService(Service.TemperatureSensor)
          .setCharacteristic(Characteristic.CurrentTemperature, temperature.value);
      }
	  }
	  if (data.type === "Humidity") {
      var humid = parseInt(data.value, 10);
      if (humidity.value !== humid) {
        humidity.value = humid;
        humidityAccessory
          .getService(Service.HumiditySensor)
          .setCharacteristic(Characteristic.CurrentRelativeHumidity, humidity.value);
      }
	  }
  }
  
  sensor.fetchInterval(updateValues, 10);
  module.exports = sensors;
}());
