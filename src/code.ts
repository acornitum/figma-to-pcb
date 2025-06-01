// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

// This plugin creates rectangles on the screen.

class GerberFile { 
  constructor () {}
  generateFile(fileName: string, contents: string) {
    console.log(contents)
    console.log(`${fileName}.gerber contents recorded!`)
    }
}

const f = new GerberFile();
f.generateFile("name", "contentsskfjsdkl")

// Make sure to close the plugin when you're done. Otherwise the plugin will
// keep running, which shows the cancel button at the bottom of the screen.
figma.closePlugin();




// Store vector line locations here
const vectorLocations: { name: string; x: number; y: number }[] = [];

// Recursive function to find VECTOR nodes
function findVectors(node: SceneNode) {
  if (node.type === "VECTOR") {
    vectorLocations.push({
      name: node.name,
      x: node.absoluteTransform[0][2],
      y: node.absoluteTransform[1][2],
    });
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


