import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('postifyx.openWorkspace', () => {
    const panel = vscode.window.createWebviewPanel(
      'postifyxWorkspace',
      'PostifyX Workspace',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(context.extensionPath, 'dist')),
        ],
      }
    );

    const scriptUri = String(
      panel.webview.asWebviewUri(
        vscode.Uri.file(path.join(context.extensionPath, 'dist', 'workspace.js'))
      )
    );

    panel.webview.html = getHtml(scriptUri);
  });

  context.subscriptions.push(disposable);
}

function getHtml(scriptUri: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PostifyX Workspace</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin: 0; padding: 0; overflow: hidden; }
  </style>
</head>
<body class="bg-[#0d0d0d] text-slate-300">
  <div id="root"></div>
  <script src="${scriptUri}"></script>
</body>
</html>`;
}

export function deactivate() {}