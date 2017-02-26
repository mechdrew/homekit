try {
  // Libraries
  const _ = require("lodash");
  const fs = require("fs");
  const hap = require("hap-nodejs");
  const path = require("path");
  const storage = require("node-persist");
  // Local constants
  const DEFAULT_PORT = 22000;

  // Assign ports sequentially starting with the default.
  var targetPort = DEFAULT_PORT;
  
  function getTargetPort() {
    console.log("Device is using port " + targetPort);
    return targetPort += 10;
  }
  
  // Some accessories will need to have their own HAP server (e.g. cameras).
  function loadAccessories() {
    console.log("loading accessories");
    var accessories = hap.AccessoryLoader.loadDirectory(path.join(__dirname, "accessories"));

    // Publish accessoried separately.
    accessories.forEach(function (accessory) {
      // Make sure required properties are present.
      if (!accessory.username)
        throw new Error("Username not found on accessory '" + accessory.displayName +
                        "'. Core.js requires all accessories to define a unique 'username' property.");

      if (!accessory.pincode)
        throw new Error("Pincode not found on accessory '" + accessory.displayName +
                        "'. Core.js requires all accessories to define a 'pincode' property.");

      // publish this Accessory on the local network
      accessory.publish({
        port: getTargetPort(),
        username: accessory.username,
        pincode: accessory.pincode,
        category: accessory.category
      }, true);
    });
  }
  
  // Some accessories can be bridged together to make adding them easier.
  function loadBridge() {
    console.log("loading bridge");
    var bridgeAccessories = hap.AccessoryLoader.loadDirectory(path.join(__dirname, "accessories/bridged"));
    // Don't bother creating the bridge if there are no accessories.
    if (_.size(bridgeAccessories) < 1) {
      return;
    }
    console.log("Bridge has " + _.size(bridgeAccessories) + " accessories");
    
    var bridge = new hap.Bridge("Pi Bridge", hap.uuid.generate("Pi Bridge"));

    // Listen for bridge identification event
    bridge.on("identify", function (paired, callback) {
      callback(); // success
    });

    // Load all accessories in the /accessories/bridged folder and add to bridge.
    bridgeAccessories.forEach(function (accessory) {
      bridge.addBridgedAccessory(accessory);
    });

    // Publish the Bridge on the local network.
    bridge.publish({
      username: "00:13:ef:20:36:4e",
      port: getTargetPort(), // Might need to change back to 21317 if this doesn't work.
      pincode: "213-17-000",
      category: hap.Accessory.Categories.BRIDGE
    });
  }
  
  console.log("HAP-NodeJS starting...");

  // Initialize our storage system
  storage.initSync();

  loadBridge();
  loadAccessories();
  
  console.log("should be working...");
} catch (e) {
  console.log("caught error");
  console.log(e);
}