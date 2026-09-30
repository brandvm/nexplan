import Lenis from "lenis";
import { initNexplan } from "./runtime.js";

// Capture this script's versioned directory before any async initialization.
const assetBase = new URL(".", document.currentScript?.src || document.baseURI).href;
initNexplan(Lenis, assetBase);
