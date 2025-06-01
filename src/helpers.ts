const SCALING_FACTOR = 1000000; 

function formatGerberCoordinate(value: number): string {
  return (value * SCALING_FACTOR).toFixed(0); 
}

export function parseVectors(node: any, gerberFile: any){
      const vectorNetwork = node.vectorNetwork;
      if (vectorNetwork && vectorNetwork.vertices.length >= 2) {
        let layerGerberInfo: any = [];
        let parsedAsGerberInfo: any = [];
        for (let i = 0; i < vectorNetwork.vertices.length; i++){
          const startPoint = vectorNetwork.vertices[i];
          const endPoint = ( i == vectorNetwork.vertices.length - 1 ? vectorNetwork.vertices[0] : vectorNetwork.vertices[i+1]); // asummes its connected
          const transform = node.absoluteTransform;
          const x1 =
          transform[0][0] * startPoint.x +
          transform[0][1] * startPoint.y +
          transform[0][2];
          const x2 =
            transform[0][0] * endPoint.x +
            transform[0][1] * endPoint.x +
            transform[0][2];
          const y1 =
            -(transform[1][0] * startPoint.x +
            transform[1][1] * startPoint.y +
            transform[1][2]);
          const y2 =
            -(transform[1][0] * endPoint.x +
          transform[1][1] * endPoint.y +
          transform[1][2]);
        const gerberX1 = formatGerberCoordinate(x1);
        const gerberY1 = formatGerberCoordinate(y1);
        const gerberX2 = formatGerberCoordinate(x2);
        const gerberY2 = formatGerberCoordinate(y2);
        layerGerberInfo.push({
            name: node.name,
            x1: parseFloat(gerberX1),
            y1: parseFloat(gerberY1),
            x2: parseFloat(gerberX2),
            y2: parseFloat(gerberY2),
        });
      parsedAsGerberInfo.push(`%TO.N,*%
X${gerberX1}Y${gerberY1}D02*
X${gerberX2}Y${gerberY2}D01*`);
        }
        gerberFile.updateContents(parsedAsGerberInfo.join("\n"))
      }
}