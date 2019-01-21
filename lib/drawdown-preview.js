'use babel';

import DrawdownPreviewView from './drawdown-preview-view';
import { CompositeDisposable } from 'atom';

export default {

  dbViewerView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {

    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'drawdown-preview:toggle': () => this.toggle()
    }));

    //Register opener which will handle 'drawdown-preview://editor/xxx' uri-s
    this.subscriptions.add(atom.workspace.addOpener(uri => {
      let [prot, path] = uri.split('://');
      if (prot != 'drawdown-preview') {
        return;
      }

      try {
        path = decodeURI(path);
        let editorId = path.startsWith('editor/') ? path.substring(7) : path;

        return new DrawdownPreviewView({
          path: path,
          editorId: editorId
        });
      } catch (e) {
        console.error(e);
        throw(e); //TODO remove me
        return
      }
    }));

    //Observe active editors and try to show toggler button
    this.subscriptions.add(atom.workspace.observeActiveTextEditor(editor => {
      if (! editor) {
        return;
      }

      let source = editor.getText();
      if (editor.getGrammar().id == 'source.gfm') {
        this.createToggler(editor);
      }

    }))
  },


  deactivate() {
    this.subscriptions.dispose();
  },

  serialize() {
    return {};
  },


  createToggler(editor) {
    let toggler = editor.element.querySelector('.drawdown-preview-toggler');
    if (!toggler) {
      let container = document.createElement('div');
      container.classList.add('drawdown-preview-toggler');

      let button = document.createElement('a');
      button.classList.add('icon', 'icon-eye');

      button.addEventListener('click', () => this.toggle());
      container.appendChild(button);
      editor.element.appendChild(container);
    }
  },

  toggle() {
    if (atom.workspace.getActivePaneItem() instanceof DrawdownPreviewView) {
      atom.workspace.destroyActivePaneItem();
      return;
    }

    //find the current editor
    let editor = atom.workspace.getActiveTextEditor();
    if (! editor) {
      return;
    }

    let grammar = editor.getGrammar().scopeName;

    if (grammar != 'source.gfm') {
      return; //TODO make this configurable
    }

    if (! this.closePreview(editor)) {
      this.openPreview(editor);
    }
  },

  uriForEditor(editor) {
    return `drawdown-preview://editor/${editor.id}`;
  },

  openPreview(editor) {
    let uri =  this.uriForEditor(editor);
    let previousActivePane = atom.workspace.getActivePane()

    let textEditor = atom.workspace.open(uri, {searchAllPanes: true, split: 'right'})

    textEditor.then(ddView => {
      //give focus back to the initial editor

      //TODO make sure the newly opened preview is actually DrawdownPreviewView...
      //You know... async stuff happenes
      previousActivePane.activate();

      ddView.onWillRender();
      ddView.render();
    });

  },

  closePreview(editor) {
    let uri = this.uriForEditor(editor);
    let previewPane = atom.workspace.paneForURI(uri);
    if (previewPane) {
      previewPane.destroyItem(previewPane.itemForURI(uri));
      return true;
    } else {
      return false;
    }
  }

};
