require("babel-polyfill");
require('babel-register')({
     // Ignore everything in node_modules except node_modules/zeppelin-solidity. 
    presets: ["es2015"],
    plugins: ["syntax-async-functions","transform-regenerator"],
//    ignore: /node_modules\/(?!zeppelin-solidity)/, 
 });

var McFlyCrowd = artifacts.require("../contracts/McFlyCrowd.sol");
var moment = require('moment');

//module.exports = function(deployer) {
//  deployer.deploy(McFlyCrowd);
//};

module.exports = async function(deployer, network, accounts) {
};
