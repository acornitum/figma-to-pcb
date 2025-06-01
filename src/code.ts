// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

// This plugin creates rectangles on the screen.

type VectorInfo = {
  name: string,
  x1: number,
  y1: number, 
  x2: number,
  y2: number
}

const RED = {
  "r": 1, 
  "g": 0, 
  "b": 0
}

class GerberFile { 
  constructor () {}
  generateFile(fileName: string, contents: string) {
    console.log(contents)
    console.log(`${fileName}.gerber contents recorded!`)
    }
}

// Store vector line locations here
const vectorLocations: VectorInfo[] = [];
const copper: VectorInfo[] = []

// Define a scaling factor for Gerber coordinates (e.g., 1 unit = 0.01 mm)
const SCALING_FACTOR = 1; // Scale Figma units to Gerber units (adjust as needed)

// Function to format coordinates for Gerber
function formatGerberCoordinate(value: number): string {
  return (value * SCALING_FACTOR).toFixed(0); // No decimal places
}

// Recursive function to find VECTOR nodes
function findVectors(node: SceneNode) {
  if (node.type === "VECTOR") {
    if (node.strokes.filter((n: any) => JSON.stringify(RED) == JSON.stringify(n.color)).length) {
      const vectorNetwork = node.vectorNetwork;
      if (vectorNetwork && vectorNetwork.vertices.length >= 2) {
        // Extract the first and last points of the vector
        const startPoint = vectorNetwork.vertices[0];
        const endPoint = vectorNetwork.vertices[vectorNetwork.vertices.length - 1];

        // Transform local coordinates to absolute coordinates
        const transform = node.absoluteTransform;
        const x1 = transform[0][0] * startPoint.x + transform[0][1] * startPoint.y + transform[0][2];
        const y1 = transform[1][0] * startPoint.x + transform[1][1] * startPoint.y + transform[1][2];
        const x2 = transform[0][0] * endPoint.x + transform[0][1] * endPoint.y + transform[0][2];
        const y2 = transform[1][0] * endPoint.x + transform[1][1] * endPoint.y + transform[1][2];

        // Convert to Gerber coordinates
        const gerberX1 = formatGerberCoordinate(x1);
        const gerberY1 = formatGerberCoordinate(y1);
        const gerberX2 = formatGerberCoordinate(x2);
        const gerberY2 = formatGerberCoordinate(y2);

        // Add to vector locations
        vectorLocations.push({
          name: node.name,
          x1: parseFloat(gerberX1),
          y1: parseFloat(gerberY1),
          x2: parseFloat(gerberX2),
          y2: parseFloat(gerberY2),
        });

        // Generate Gerber commands
        const gerberCommand = `G01 X${gerberX1} Y${gerberY1} D02*  // Move to start point
G01 X${gerberX2} Y${gerberY2} D01*  // Draw to end point`;
        console.log(gerberCommand);
      }
    }
  }

  if ("children" in node) {
    for (const child of node.children) {
      findVectors(child);
    }
  }
}

// Traverse only the current (loaded) page
for (const node of figma.currentPage.children) {
  findVectors(node);
}

// Output result to console and close the plugin
console.log("Vector line locations:", vectorLocations);
figma.closePlugin(`Found ${vectorLocations.length} vector lines. Check console.`);


const f = new GerberFile();
f.generateFile("name", JSON.stringify(vectorLocations))

// Make sure to close the plugin when you're done. Otherwise the plugin will
// keep running, which shows the cancel button at the bottom of the screen.
figma.closePlugin();


