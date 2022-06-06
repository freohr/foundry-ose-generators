import { TreasureMapGen } from "./treasure-map.js";

export function registerGenerators() {
    OSEGen.TreasureMaps = TreasureMapGen;
}