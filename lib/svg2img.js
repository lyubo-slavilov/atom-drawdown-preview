'use babel';
import { File } from 'atom';
import { fs } from 'fs';

function copyStylesInline(destinationNode, sourceNode) {
   let containerElements = ["svg","g"];
   for (let cd = 0; cd < destinationNode.childNodes.length; cd++) {
       let child = destinationNode.childNodes[cd];
       if (containerElements.indexOf(child.tagName) != -1) {
            copyStylesInline(child, sourceNode.childNodes[cd]);
            continue;
       }
       let style = sourceNode.childNodes[cd].currentStyle || window.getComputedStyle(sourceNode.childNodes[cd]);
       if (style == "undefined" || style == null) continue;
       for (let st = 0; st < style.length; st++){
            child.style.setProperty(style[st], style.getPropertyValue(style[st]));
       }
   }
}

function triggerDownload (imgURI, fileName) {
  let evt = new MouseEvent("click", {
    view: window,
    bubbles: false,
    cancelable: true
  });
  let a = document.createElement("a");
  a.setAttribute("download", fileName);
  a.setAttribute("href", imgURI);
  a.setAttribute("target", '_blank');
  a.dispatchEvent(evt);
}

export function downloadSvg(svg, fileName) {
  let copy = svg.cloneNode(true);
  copyStylesInline(copy, svg);
  let canvas = document.createElement("canvas");
  let bbox = svg.getBoundingClientRect();
  canvas.width = bbox.width;
  canvas.height = bbox.height;
  let ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, bbox.width, bbox.height);
  let data = (new XMLSerializer()).serializeToString(copy);
  let DOMURL = window.URL || window.webkitURL || window;
  let img = new Image();
  let svgBlob = new Blob([data], {type: "image/svg+xml;charset=utf-8"});
  let url = DOMURL.createObjectURL(svgBlob);

  img.onload = function () {
    ctx.drawImage(img, 0, 0);
    DOMURL.revokeObjectURL(url);
    if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob)
    {
        let blob = canvas.msToBlob();
        navigator.msSaveOrOpenBlob(blob, fileName);
    }
    else {
      canvas.toBlob(blob => {
        let fr = new FileReader();
        fr.onload = (e) => {
          let file = new File(fileName);
          let buffer = new Buffer(e.target.result, 'binary');
          file.write(buffer);
        };
        fr.readAsArrayBuffer(blob);
      });
        // canvas.toBlob(blob => {
        //   let fr = new FileReader();
        //   fr.onload = (e) => {
        //     let file = new File('/tmp/image.png');
        //
        //     file.write(e.target.result);
        //   };
        // });
        //
        // return;
        // let imgURI = canvas
        //     .toDataURL("image/png")
        //     .replace("image/png", "image/octet-stream");
        // triggerDownload(imgURI, fileName);
    }
  };
  img.src = url;
}
