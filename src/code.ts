figma.showUI(__html__);
figma.ui.resize(500, 300);

type VectorInfo = {
  name: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

const COPPER = {
  r: 1,
  g: 0,
  b: 0,
};


function generateJankDate(date: Date){
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Month is 0-based
  const day = String(date.getUTCDate()).padStart(2, '0');

  const hour = String(date.getUTCHours()).padStart(2, '0');
  const minute = String(date.getUTCMinutes()).padStart(2, '0');
  const second = String(date.getUTCSeconds()).padStart(2, '0');
          
  const strDate = year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;
  return strDate
}

class GerberFile {
  constructor() {}

  generateFile(fileName: string, contents: string) {
    const date = new Date();
    contents = `%TF.GenerationSoftware,KiCad,Pcbnew,9.0.0*%
%TF.CreationDate,${date.toISOString()}*%
%TF.ProjectId,athena_workshop,61746865-6e61-45f7-976f-726b73686f70,rev?*%
%TF.SameCoordinates,Original*%
%TF.FileFunction,Copper,L1,Top*%
%TF.FilePolarity,Positive*%
%FSLAX46Y46*%
G04 Gerber Fmt 4.6, Leading zero omitted, Abs format (unit mm)*
G04 Created by KiCad (PCBNEW 9.0.0) date ${generateJankDate(date)}*
%MOMM*%
%LPD*%
G01*
G04 APERTURE LIST*
%TA.AperFunction,Conductor*%
%ADD10C,0.050000*%
%TD*%
G04 APERTURE END LIST*
D10*
${contents}
%TD*%
M02*`;

    figma.ui.postMessage(contents);
    console.log(`${fileName}.gerber contents recorded!`);
  }
}

const vectorLocations: VectorInfo[] = [];
const gerberStuff: string[] = [];

// Define a scaling factor for Gerber coordinates (e.g., 1 unit = 0.01 mm)
const SCALING_FACTOR = 10000; // Scale Figma units to Gerber units (adjust as needed)

// Function to format coordinates for Gerber
function formatGerberCoordinate(value: number): string {
  return (value * SCALING_FACTOR).toFixed(0); // No decimal places
}

// Recursive function to find VECTOR nodes
function findVectors(node: SceneNode) {
  if (node.type === "VECTOR") {
    if (
      node.strokes.filter(
        (n: any) => JSON.stringify(COPPER) == JSON.stringify(n.color)
      ).length
    ) {
      const vectorNetwork = node.vectorNetwork;
      if (vectorNetwork && vectorNetwork.vertices.length >= 2) {
        // Extract the first and last points of the vector
        const startPoint = vectorNetwork.vertices[0];
        const endPoint =
          vectorNetwork.vertices[vectorNetwork.vertices.length - 1];

        // Transform local coordinates to absolute coordinates
        const transform = node.absoluteTransform;
        const x1 =
          transform[0][0] * endPoint.x +
          transform[0][1] * endPoint.y +
          transform[0][2];
        const x2 =
          transform[0][0] * startPoint.x +
          transform[0][1] * startPoint.y +
          transform[0][2];
        const y1 =
          transform[1][0] * startPoint.x +
          transform[1][1] * startPoint.y +
          transform[1][2];
        const y2 =
          transform[1][0] * endPoint.x +
          transform[1][1] * endPoint.y +
          transform[1][2];

        // Flip the Y-coordinates to match the Gerber coordinate system
        const flippedY1 = -y1;
        const flippedY2 = -y2;

        // Convert to Gerber coordinates
        const gerberX1 = formatGerberCoordinate(x1);
        const gerberY1 = formatGerberCoordinate(flippedY1);
        const gerberX2 = formatGerberCoordinate(x2);
        const gerberY2 = formatGerberCoordinate(flippedY2);

        // Add to vector locations
        vectorLocations.push({
          name: node.name,
          x1: parseFloat(gerberX1),
          y1: parseFloat(gerberY1),
          x2: parseFloat(gerberX2),
          y2: parseFloat(gerberY2),
        });

        // Generate Gerber commands for lines
        gerberStuff.push(`%TO.N,*%
X${gerberX1}Y${gerberY1}D02*
X${gerberX2}Y${gerberY2}D01*`);
      }
    }
  }

  if ("children" in node) {
    for (const child of node.children) {
      findVectors(child);
    }
  }
}

// Process all nodes in the current page
for (const node of figma.currentPage.children) {
  findVectors(node);
}

console.log("Vector line locations:", vectorLocations);

// Generate and save the Gerber file
const f = new GerberFile();
f.generateFile(figma.root.name, gerberStuff.join("\n"));