import * as vscode from "vscode";
import { TokenParser } from "./tokenParser";

console.log("Loading extension");

export function activate(context: vscode.ExtensionContext) {
  console.log("Activating extension");
  console.log("Languages registered:", vscode.languages.getLanguages());

  const tokenParser = new TokenParser();

  // Register the completion provider
  const provider = vscode.languages.registerCompletionItemProvider(
    { scheme: "file", language: "json" },
    {
      provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
      ) {
        // Do nothing if outside the tokens folder or no tokens exist
        if (
          !tokenParser.isInTokensFolder(document.uri.fsPath) ||
          tokenParser.getTokens().length === 0
        ) {
          return undefined;
        }

        const linePrefix = document
          .lineAt(position)
          .text.substr(0, position.character)
          .trim();

        // Check if we're inside a token reference (e.g., "{token...")
        const match = linePrefix.match(/{([^}]*)$/);
        if (!match) {
          return undefined;
        }

        const typedText = match[1]; // Get the text after the opening brace
        console.log("Typed text for filtering:", typedText);

        const tokens = tokenParser.getTokens();
        const filteredTokens = tokens.filter((token) =>
          token.toLowerCase().includes(typedText.toLowerCase())
        );

        return filteredTokens.map((token) => {
          const item = new vscode.CompletionItem(
            token,
            vscode.CompletionItemKind.Value
          );
          item.insertText = `${token}}`; // Wrap the token in {} when inserting
          return item;
        });
      },
    },
    '"',
    "{" // Trigger on quote (after "value": ) or brace (for references)
  );

  // Watch for changes in the tokens folder to refresh tokens
  const watcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(tokenParser["tokensFolder"], "**/*.json")
  );
  watcher.onDidChange(() => tokenParser.refreshTokens());
  watcher.onDidCreate(() => tokenParser.refreshTokens());
  watcher.onDidDelete(() => tokenParser.refreshTokens());

  context.subscriptions.push(provider, watcher);

  // Refresh tokens when configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("style-dictionary-autocomplete.tokensPath")) {
        tokenParser["tokensFolder"] = tokenParser["getTokensFolder"]();
        tokenParser.refreshTokens();
      }
    })
  );
}

export function deactivate() {}
