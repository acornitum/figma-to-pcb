// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

// This plugin creates rectangles on the screen.

type VectorInfo = {
  name: string,
  x: number,
  y: number
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

// Recursive function to find VECTOR nodes
function findVectors(node: SceneNode) {
  if (node.type === "VECTOR") {
    if (node.strokes.filter((n: any) => JSON.stringify(RED) == JSON.stringify(n.color) ).length){
    vectorLocations.push({
      name: node.name,
      x: node.absoluteTransform[0][2],
      y: node.absoluteTransform[1][2],
    });
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


