import { parseVectors } from "./helpers";
figma.showUI(__html__);
figma.ui.resize(500, 300);

type VectorInfo = {
  name: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

const COPPER = { r: 1, g: 0, b: 0 }; // Color for vector lines
const PAD_COLOR = { r: 0.9176, g: 0.4902, b: 0.4902 }; // Color for pads (#ea7d7d)
const EDGE = { r: 1, g: 1, b: 1 }; // Color for edge layer
const SCALING_FACTOR = 1000000; // Scale Figma units to Gerber units

// Function to format coordinates for Gerber
function formatGerberCoordinate(value: number): string {
  return (value * SCALING_FACTOR).toFixed(0); // No decimal places
}

// Function to generate a formatted date string
function generateJankDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hour = String(date.getUTCHours()).padStart(2, "0");
  const minute = String(date.getUTCMinutes()).padStart(2, "0");
  const second = String(date.getUTCSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

class GerberFile {
  constructor(
    public fileName: string,
    public fileFunction: string,
    public contents: string = "",
    public layer?: string
  ) {}

  updateContents(newContents: string) {
    this.contents += newContents;
  }

  generateFile() {
    const date = new Date();
    this.contents = `%TF.GenerationSoftware,figma-to-pcb,${this.fileName},9.0.0*%
%TF.CreationDate,${date.toISOString()}*%
%TF.ProjectId,${this.fileName.replace(" ", "_")},61746865-6e61-45f7-976f-726b73686f70,rev?*%
%TF.SameCoordinates,Original*%
%TF.FileFunction,${this.fileFunction},L1,Top*%
%TF.FilePolarity,Positive*%
%FSLAX46Y46*%
G04 Gerber Fmt 4.6, Leading zero omitted, Abs format (unit mm)*
G04 Created by KiCad (PCBNEW 9.0.0) date ${generateJankDate(date)}*
%MOMM*%
%LPD*%
G01*
G04 APERTURE LIST*
%TA.AperFunction,ComponentPad*%
%ADD10C,1.600000*%
%TD*%
%TA.AperFunction,ComponentPad*%
%ADD11O,1.600000X1.600000*%
%TD*%
%TA.AperFunction,Conductor*%
%ADD11C,0.200000*%
%TD*%
G04 APERTURE END LIST*
D10*
${this.contents}
%TD*%
M02*`;
  }
}

const vectorLocations: VectorInfo[] = [];
const gerberStuff: string[] = [];
const copperGerber = new GerberFile(figma.root.name, "Copper");
const edgeGerber = new GerberFile(figma.root.name, "Edge_Cut");

// Recursive function to find VECTOR and ELLIPSE nodes
function findNodes(node: SceneNode) {
  if (node.type === "ELLIPSE") {
    // Check if the ellipse is an orange circle (pad)
    if (
      node.fills &&
      Array.isArray(node.fills) && // Ensure node.fills is an array
      node.fills.some(
        (fill: any) =>
          fill.type === "SOLID" &&
          JSON.stringify(fill.color) === JSON.stringify(PAD_COLOR)
      )
    ) {
      // Transform local coordinates to absolute coordinates
      const transform = node.absoluteTransform;
      const x = transform[0][2]; // X position
      const y = -transform[1][2]; // Flip Y-coordinate for Gerber

      // Convert to Gerber coordinates
      const gerberX = formatGerberCoordinate(x);
      const gerberY = formatGerberCoordinate(y);

      // Generate Gerber commands for the pad
      gerberStuff.push(`%TO.P,REF**,1*%`);
      gerberStuff.push(`%TO.N,N/C*%`);
      gerberStuff.push(`X${gerberX}Y${gerberY}D03*`); // D03* for circular pads
      console.log(`X${gerberX}Y${gerberY}D03*`);
    }
  } else if (node.type === "VECTOR") {
    // Handle vector nodes (lines)
    if (
      node.strokes.filter(
        (n: any) => JSON.stringify(COPPER) === JSON.stringify(n.color) // copper layer
      ).length
    ) {
      parseVectors(node, copperGerber);
    }
    if (
      node.strokes.filter(
        (n: any) => JSON.stringify(EDGE) === JSON.stringify(n.color) // edge layer
      ).length
    ) {
      parseVectors(node, edgeGerber);
    }
  }

  // Recursively process child nodes
  if ("children" in node) {
    for (const child of node.children) {
      findNodes(child);
    }
  }
}

// Process all nodes in the current page
for (const node of figma.currentPage.children) {
  findNodes(node);
}

console.log("Vector line locations:", vectorLocations);

copperGerber.generateFile();
edgeGerber.generateFile();

figma.ui.postMessage({ copper: copperGerber.contents, edge: edgeGerber.contents });