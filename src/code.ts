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

const COPPER = {
  r: 1,
  g: 0,
  b: 0,
};

const EDGE = {
  r: 1,
  g: 1,
  b: 1
}

function generateJankDate(date: Date){
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0'); 
  const day = String(date.getUTCDate()).padStart(2, '0');

  const hour = String(date.getUTCHours()).padStart(2, '0');
  const minute = String(date.getUTCMinutes()).padStart(2, '0');
  const second = String(date.getUTCSeconds()).padStart(2, '0');
          
  const strDate = year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;
  return strDate
}

class GerberFile {
  constructor(public fileName: string, public fileFunction: string, public contents?: string, public layer?: string) {
    this.contents = contents
    this.fileName = fileName
    this.fileFunction = fileFunction
    this.layer = layer
  }
  updateContents(newContents: string){
    this.contents += newContents
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
%TA.AperFunction,Conductor*%
%ADD10C,1.00000*%
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

function findVectors(node: SceneNode) {
  if (node.type === "VECTOR") {
    if (
      node.strokes.filter(
        (n: any) => JSON.stringify(COPPER) == JSON.stringify(n.color) // copper layer wow
      ).length
    ) {
      parseVectors(node, copperGerber)
    }
    if (
      node.strokes.filter(
        (n: any) => JSON.stringify(EDGE) == JSON.stringify(n.color) // edge layer wow
      ).length
    ) {
      parseVectors(node, edgeGerber)
    }
  }

  if ("children" in node) {
    for (const child of node.children) {
      findVectors(child);
    }
  }
}

for (const node of figma.currentPage.children) {
  findVectors(node);
}

console.log("Vector line locations:", vectorLocations);

copperGerber.generateFile();
edgeGerber.generateFile();

figma.ui.postMessage({copper: copperGerber.contents, edge: edgeGerber.contents});
