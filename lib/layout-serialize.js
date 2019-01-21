'use babel';

export function serialize(diagramData) {

  let layout = {blocks:{}};

  if (diagramData.transform) {
    layout.transform = diagramData.transform;
  }
  for (let block of diagramData.blocks) {
    layout.blocks[block.id] = {
      ... block.layout
    }
  }

  return layout;

}
