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
