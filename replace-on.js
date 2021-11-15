const vscode = require('vscode');

const getProperty = (obj, prop, deflt) => { return obj.hasOwnProperty(prop) ? obj[prop] : deflt; };
const isString = obj => typeof obj === 'string';
const isObject = obj => typeof obj === 'object';
const isArray = obj => Array.isArray(obj);
const isUri = obj => isObject(obj) && obj.hasOwnProperty('scheme');

class ReplaceProvider {
  constructor() {
    this.replaceMap = {};
    this.ignoreNextSelectionChanged = false;
  }
  /** @param {vscode.TextEditor} editor */
  updateEditorReplaceMap(editor) {
    this.replaceMap = {};
    if (!editor) { return; }
    var document = editor.document;
    if (!document) { return; }
    var workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    var config = vscode.workspace.getConfiguration('replace-on.selection-changed', workspaceFolder ? workspaceFolder.uri : null);
    this.replaceMap = this.parseConfiguration(config, document.languageId);
  }
  parseConfiguration(config, languageId) {
    let replaceMap = {};
    this.updateReplaceMap(replaceMap, config['all']);
    this.updateReplaceMap(replaceMap, config[languageId]);
    return replaceMap;
  }
  updateReplaceMap(replaceMap, replaceJSON) {
    for (const search in replaceJSON) {
      if (!replaceJSON.hasOwnProperty(search)) { continue; }
      const properties = replaceJSON[search];
      let rule = {};
      rule.replace = getProperty(properties, 'replace');
      if (rule.replace === undefined) { continue; }
      rule.immediate = getProperty(properties, 'immediate');
      rule.literal = getProperty(properties, 'literal');
      if (rule.literal) {
        rule.search = search;
      } else {
        let flags = getProperty(properties, 'flags');
        rule.search = new RegExp(search, flags);
      }
      replaceMap[search] = rule;
    }
  }
  /** @param {vscode.TextEditor} editor @param {vscode.TextEditorEdit} edit */
  selectionChanged(editor, edit, args, byCommand) {
    if (this.ignoreNextSelectionChanged) {
      this.ignoreNextSelectionChanged = false;
      return;
    }
    let replaceMap = this.replaceMap;
    if (args) {
      replaceMap = this.parseConfiguration(args, editor.document.languageId);
    }
    for (const selection of editor.selections) {
      if (selection.isEmpty) { continue; }
      let text = editor.document.getText(new vscode.Range(selection.start, selection.end));
      for (const search in replaceMap) {
        if (!replaceMap.hasOwnProperty(search)) { continue; }
        const rule = replaceMap[search];
        if (Boolean(rule.immediate) !== Boolean(byCommand) ) {  // logical XOR
          if (rule.literal) {
            if (rule.search !== text) { continue; }
            text = rule.replace;
          } else {
            let match = text.match(rule.search);
            if (match === null || match.index !== 0 || match[0] !== text) { continue; }
            text = text.replace(rule.search, rule.replace);
          }
          edit.replace(selection, text);
          this.ignoreNextSelectionChanged = true;
          break;
        }
      }
    }
  }
}

function activate(context) {

  const replaceProvider = new ReplaceProvider();

  context.subscriptions.push(vscode.commands.registerTextEditorCommand('replace-on.selection-changed', (editor, edit, args) => replaceProvider.selectionChanged(editor, edit, args, true)));

  vscode.window.onDidChangeTextEditorSelection(changeEvent => { changeEvent.textEditor.edit( editBuilder => replaceProvider.selectionChanged(changeEvent.textEditor, editBuilder) ); },
        null, context.subscriptions);

  const onChangeActiveTextEditor = () => {
    replaceProvider.updateEditorReplaceMap(vscode.window.activeTextEditor);
  };
  vscode.window.onDidChangeActiveTextEditor(onChangeActiveTextEditor, null, context.subscriptions);
  onChangeActiveTextEditor();
}

function deactivate() {
}

module.exports = {
  activate,
  deactivate
}
