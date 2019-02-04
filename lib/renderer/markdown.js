'use babel';

import MarkdownIt from 'markdown-it';
import md5 from 'md5';

export function render(text) {
  let md = new MarkdownIt();

  let defaultRule = md.renderer.rules.fence;

  let drawdownScripts = [];
  //Init Markdown parser
  md.renderer.rules.fence =  function (tokens, idx, options, env, self) {
    let token = tokens[idx];
    console.log(token);
    let regex = /drawdown\.(flow|graph|tree|sequence)\.([a-zA-Z][0-9a-zA-Z\-\_]*)/g;
    try {
      let [fullMatch, diagramType, diagramName] = regex.exec(token.info);
      const hash = md5(diagramName);
      drawdownScripts.push({
        hash,
        type: diagramType,
        content: token.content.trim()
      });
      return `<div class="dd-diagram-container dd-diagram-type-${diagramType}" id="dd-diagram-${hash}"></div>`;
    } catch (e) {
      console.error(e);
      return defaultRule(tokens, idx, options, env, self)
    }
  }

  let html = md.render(text);
  return {
    html,
    drawdownScripts
  };
}
