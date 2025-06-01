import { parseVectors, formatGerberCoordinate, generateJankDate } from "./helpers";
figma.showUI(__html__);
figma.ui.resize(500, 300);

type VectorInfo = {
  name: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

const COPPER = { r: 1, g: 0, b: 0 }; 
const PAD_COLOR = { r: 0, g: 1, b: 0 }; 
const EDGE = { r: 1, g: 1, b: 1 }; 

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
const copperGerber = new GerberFile(figma.root.name, "Copper");
const edgeGerber = new GerberFile(figma.root.name, "Edge_Cut");

function findNodes(node: SceneNode) {
  if (node.type === "ELLIPSE") {
    if (
      node.fills &&
      Array.isArray(node.fills) && 
      node.fills.some(
        (fill: any) =>
          fill.type === "SOLID" &&
          JSON.stringify(fill.color) === JSON.stringify(PAD_COLOR)
      )
    ) {
      const localGerberStuff = []
      const transform = node.absoluteTransform;
      const x = transform[0][2]; 
      const y = -transform[1][2]; 

      const gerberX = formatGerberCoordinate(x);
      const gerberY = formatGerberCoordinate(y);

      localGerberStuff.push(`%TO.P,REF**,1*%`);
      localGerberStuff.push(`%TO.N,N/C*%`);
      localGerberStuff.push(`X${gerberX}Y${gerberY}D03*`);
      copperGerber.updateContents(localGerberStuff.join("\n"))
    }
  } else if (node.type === "VECTOR") {
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