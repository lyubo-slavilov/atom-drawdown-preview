'use babel';

import { render as mdRender} from './renderer/markdown';

import { factory as  parserFactory } from 'drawdown-parser';
// import {Renderer as DdRenderer } from './renderer/drawdown';
import {factory as rendererFactory} from 'drawdown-svg-render';

const diagramToRendererMap = {
  flow: 'GENERAL',
  graph: 'GENERAL',
  sequence: 'TIMELINE',
}

export function render(element, text, options) {
  let {html, drawdownScripts} = mdRender(text);

  // let dd = new DdRenderer(options);
  // let parser = new DrawdownParser();

  let diagrams = [];
  for (let script of drawdownScripts) {
    let parser = parserFactory(script.type);
    let diagramData = parser.parseText(script.content);
    diagramData.hash = script.hash;
    diagramData.type = script.type;

    diagrams.push(diagramData);
  }

  element.innerHTML = html;
  for (let diagramData of diagrams) {
    let element = document.getElementById(`dd-diagram-${diagramData.hash}`);
    const rendererType = diagramToRendererMap[diagramData.type];

    const renderer = rendererFactory(rendererType, options);

    if (element) {
      renderer.render(element, diagramData)
    }
  }

}
