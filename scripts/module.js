import { registerGenerators } from "./lib/registration.js";

//namespace
window.OSEGen = window.OSEGen || {
    moduleName: `foundry-ose-generators`,
    TreasureMaps: {}
};

Hooks.once('init', async function () {


});

Hooks.once('ready', async function () {
    registerGenerators();
});
