"use strict";
const hap = require("hap-nodejs");
const cameraAccessory = new hap.Accessory('Android Camera', hap.uuid.generate("Android Camera"));
const cameraSource = new hap.Camera();
//cameraSource.;
cameraAccessory.configureCameraSource(cameraSource);
cameraAccessory.on('identify', function(paired, callback) {
  console.log("Android Camera identify");
  callback(); // success
});

// Add properties for publishing (in case we're using Core.js and not BridgedCore.js)
cameraAccessory.username = "00:13:ef:20:36:4e" + "andcam";
cameraAccessory.pincode = "213-17-001";
//cameraAccessory.category= hap.Accessory.Categories.CAMERA;

module.exports = cameraAccessory;
