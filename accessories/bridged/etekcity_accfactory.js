(function () {
  // Constants
  const EMITTER_PIN = 0; // WiringPi Pin
  const PULSE_LENGTH = 185; // ms
  // Libraries
  const _ = require("lodash");
  const hap = require("hap-nodejs");
  const Accessory = hap.Accessory;
  const Service = hap.Service;
  const Characteristic = hap.Characteristic;
  const uuid = hap.uuid;
  const rpi433 = require("rpi-433");
  const emitterOptions = {
    pulseLength: PULSE_LENGTH,
    pin: EMITTER_PIN
  };
  const rfEmitter = rpi433.emitter(emitterOptions);
  
  const sniffer = rpi433.sniffer({
    pin: 1, 
    debounceDelay: 500
  });
  
  const outlets = [
    {
      deviceID: "etek1",
      name: "Bedroom Air Conditioner (Outlet 1)",
      codes: {
        on: 4527411,
        off: 4527420
      },
      turnedOn: false
    },
    {
      deviceID: "etek2",
      name: "Living Room Seasonal (Outlet 2)",
      codes: {
        on: 4527555,
        off: 4527564
      },
      turnedOn: false
    },
    {
      deviceID: "etek3",
      name: "Bathroom Fan (Outlet 3)",
      codes: {
        on: 4527875,
        off: 4527884
      },
      turnedOn: false
    }
  ];
  
  // For fun for now.
  sniffer.on('data', function (data) {
    console.log('Code received: ' + data.code + ' pulse length : ' + data.pulseLength);
  });

  function createOutlet(outlet) {
    var outletUUID = uuid.generate("hap-nodejs:accessories:" + outlet.deviceID);
    var outletAccessory = new Accessory(outlet.name, outletUUID);
      
    _.assign(outletAccessory, {
      username: "00:13:ef:20:36:4e" + outlet.deviceID,
      pincode: "213-17-001"
    });
      
    outletAccessory
      .getService(Service.AccessoryInformation)
      .setCharacteristic(Characteristic.Manufacturer, "Etekcity")
      .setCharacteristic(Characteristic.Model, "025706341288");

    outletAccessory.on('identify', function(paired, callback) {
      //console.log("Outlet \"" + outlet.name + "\"");
      callback(); // success
    });

    outletAccessory
      .addService(Service.Outlet, outlet.name)
      .getCharacteristic(Characteristic.On)
      .on("set", function(value, callback) {
        var code = outlet.codes[value ? "on": "off"];
        return rfEmitter
          .sendCode(code, emitterOptions)
          .then(function(stdout) {
            //console.log(stdout);
            setTimeout(() => {
              //console.log("Sent code " + code);
              return callback();
            }, 500);
          }, function(error) {
            console.log("Error sending outlet code: " + error);
            return callback(error);
          });
      });

    outletAccessory
      .getService(Service.Outlet)
      .getCharacteristic(Characteristic.On)
      .on('get', function(callback) {
        //console.log("Is \"" + outlet.name + "\" on? " + (outlet.powerOn ? "Yes" : "No") + ".");
        callback(null, outlet.powerOn);
      });

    return outletAccessory;
  }

  module.exports = _.map(outlets, createOutlet);
}());
