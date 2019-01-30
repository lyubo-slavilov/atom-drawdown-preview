'use babel';
import { File } from 'atom';
import { fs } from 'fs';

function copyInlineStyles(destinationNode, sourceNode) {
  let containerElements = ["svg","g"];
  for (let cd = 0; cd < destinationNode.childNodes.length; cd++) {
    let child = destinationNode.childNodes[cd];
    if (containerElements.indexOf(child.tagName) != -1) {
      copyInlineStyles(child, sourceNode.childNodes[cd]);
      continue;
    }
    let style = sourceNode.childNodes[cd].currentStyle || window.getComputedStyle(sourceNode.childNodes[cd]);
    if (style == "undefined" || style == null) continue;
    for (let st = 0; st < style.length; st++){
      child.style.setProperty(style[st], style.getPropertyValue(style[st]));
    }
  }
}

export function downloadSvg(svg, fileName) {
  let copy = svg.cloneNode(true);
  copyInlineStyles(copy, svg);
  let canvas = document.createElement("canvas");
  let bbox = svg.getBoundingClientRect();

  canvas.width = bbox.width;
  canvas.height = bbox.height;
  let ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, bbox.width, bbox.height);

  let data = (new XMLSerializer()).serializeToString(copy);

  let img = new Image();
  let svgBlob = new Blob([data], {type: "image/svg+xml;charset=utf-8"});
  let url = URL.createObjectURL(svgBlob);

  img.onload = function () {
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    canvas.toBlob(blob => {
      let fr = new FileReader();
      fr.onload = (e) => {
        let file = new File(fileName);
        let buffer = new Buffer(e.target.result, 'binary');
        file.write(buffer);
      };
      fr.readAsArrayBuffer(blob);
    });
  };

  img.src = url;
}
