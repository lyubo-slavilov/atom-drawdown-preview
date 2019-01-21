'use babel';

import {CompositeDisposable, File} from 'atom';
import { render as renderAll } from './renderer.js';
import {serialize as layoutSerialize } from './layout-serialize'

const electron = require('electron');
import {downloadSvg } from './svg2img';

export default class DrawdownPreviewView {

  constructor(state) {

    this.parsedOnce = false;
    this.element = document.createElement('div');
    this.element.classList.add('drawdown-view');

    this.element.addEventListener('mousedown', () => {
      let focused = this.element.querySelectorAll('.focused');
      for(let el of focused) {
        el.classList.remove('focused')
      }
    })

    this.disposables = new CompositeDisposable();

    this.editor = this.editorForId(state.editorId);
    this.disposables.add(this.editor.getBuffer().onDidStopChanging (() => {
      let sl = this.element.scrollLeft;
      let st = this.element.scrollTop;
      this.render();
      this.element.scrollLeft = sl;
      this.element.scrollTop = st;
    }));
  }

  onWillRender() {
    // this.disposables.add(atom.workspace.paneForURI(this.getURI()).onDidChangeFlexScale ((e) => {
    //   const section = this.element.querySelector('section');
    //   if (section) {
    //     const w = section.clientWidth;
    //     const h = section.clientHeight;
    //
    //     const svg = section.querySelector('svg');
    //
    //     if (svg) {
    //       svg.setAttribute('width', w);
    //       svg.setAttribute('height', h);
    //       const workarea = svg.querySelector('.workarea');
    //       if (workarea) {
    //         workarea.setAttribute('transform', `translate(${w/2} ${0.02*h})`);
    //       }
    //     }
    //
    //   }
    // }));
  }

  render() {
    // let renderer = new Renderer();
    //
    // let header = document.createElement('header');
    // let body = document.createElement('section');
    // let footer = document.createElement('footer');
    //
    // this.element.appendChild(header);
    // this.element.appendChild(body);
    // this.element.appendChild(footer);
    // this.element.classList.add('rendered');
    //
    // renderer.render(body, this.chartData);
    try {
      renderAll(this.element, this.editor.getText(), {
        diagramLayout: this.loadDrawdownLayout(),
        onDidDragOrZoom: (svg) => {
          let scene = svg.querySelector('.scene');
          let bbox = scene.getBBox();
          let ctm = scene.getScreenCTM();

          const w = Math.max(bbox.width*ctm.a + 80, 400);
          const h = Math.max(bbox.height*ctm.d + 40, 200);
          svg.setAttribute('width', w);
          svg.setAttribute('height', h);
        },
        onDidChangeLayout: (diagramData) => {
          this.saveDrawdownLayout(diagramData);
        },
        onDidRender: (svg) => {
          const btn = document.createElement('button');
          btn.classList.add('dd-save-as-image', 'btn', 'icon', 'icon-desktop-download');
          svg.parentNode.appendChild(btn);

          btn.addEventListener('click', () => {

            this.saveSvgAsImage(svg);

          });

        }
      });
    } catch (e) {
      console.error(e);
      this.renderError('Cant render Drawdown', e)
    }
  }

  saveSvgAsImage(svg) {
    const remote = electron.remote;
    const dialog = remote.dialog;
    const bwin = remote.BrowserWindow.getFocusedWindow();
    const path = this.projectPath();

    dialog.showSaveDialog(bwin, (filePath) => {
      svg.classList.add('paper');
      downloadSvg(svg, filePath);
      svg.classList.remove('paper');
    });
  }

  editorForId(id) {
    for (let editor of atom.workspace.getTextEditors()) {
      if (editor.id == id) {
        return editor
      }
    }
    return null;
  }

  renderError(errStatus, err) {
    const messageEl = document.createElement('div');
    const headingEl = document.createElement('h1');
    const detailsEl = document.createElement('div')

    headingEl.textContent = errStatus;

    let details = (err.message || err) + (err.parsedLine ? ` at line ${err.parsedLine}` : '');
    details += err.snippet ? `: ${err.snippet}` : '';

    detailsEl.classList.add('details');
    detailsEl.innerHTML = details

    messageEl.classList.add('message');
    messageEl.classList.add('error');

    messageEl.appendChild(headingEl);
    messageEl.appendChild(detailsEl);

    if (this.hasSuccessfulRend) {
      let messages = this.element.querySelectorAll('.message');
      for (let message of messages) {
        message.remove();
      }
      messageEl.classList.add('float');
      this.element.appendChild(messageEl);
    } else {
      this.element.innerHTML = '';
      this.element.appendChild(messageEl);
    }
  }

  projectPath() {
    let cwp = this.editor.getPath();
    let [projectPath, relativePath] = atom.project.relativizePath(cwp);
    return projectPath;
  }

  loadDrawdownLayout() {
      let projectPath = this.projectPath();
      let f = projectPath + '/.drawdown-preview-layout';
      let file = new File(f);
      try {
        let json = file.readSync();
        if (json === null) {
          throw 'File .drawdown-preview-layout is missing or empty'
        }
        return JSON.parse(json);
      } catch (e) {
        console.warn('Cant read .drawdown-preview-layout');
        console.warn(e);
        return {};
      }
  }

  saveDrawdownLayout(diagramData) {
    let projectPath = this.projectPath();

    let allLayouts = this.loadDrawdownLayout();
    let layout = layoutSerialize(diagramData);

    allLayouts[diagramData.hash] = layout;
    let json = JSON.stringify(allLayouts);
    let f = projectPath + '/.drawdown-preview-layout';
    let file = new File(f);
    file.write(json);
  }

  fileReader(filePath) {
    let file = new File(filePath, false);
    return file.readSync();
  }

  // Returns an object that can be retrieved when package is activated
  serialize() {}

  // Tear down any state and detach
  destroy() {
    this.element.remove();
  }

  getElement() {
    return this.element;
  }

  getTitle() {
    return 'Drawdown Preview'
  }

  getIconName() {
    return 'eye'
  }

  getURI() {
    return `drawdown-preview://editor/${this.editor.id}`;
  }

}
