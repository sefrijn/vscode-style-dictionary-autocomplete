import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as glob from "fast-glob";

export class TokenParser {
  private tokens: string[] = [];
  private tokensFolder: string;

  constructor() {
    this.tokensFolder = this.getTokensFolder();
    console.log("Tokens folder:", this.tokensFolder);
    this.refreshTokens();
  }

  // Get the user-defined tokens folder from settings
  private getTokensFolder(): string {
    const config = vscode.workspace.getConfiguration(
      "style-dictionary-autocomplete"
    );
    const folder = config.get<string>("tokensPath", "src/tokens");
    const workspaceFolder =
      vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || "";
    return path.join(workspaceFolder, folder);
  }

  // Check if a file is inside the tokens folder
  public isInTokensFolder(filePath: string): boolean {
    return filePath.startsWith(this.tokensFolder);
  }

  // Refresh the list of tokens by scanning the folder
  public refreshTokens(): void {
    this.tokens = [];
    const pattern = path
      .join(this.tokensFolder, "**/*.json")
      .replace(/\\/g, "/");
    const files = glob.sync(pattern, { absolute: true });

    for (const file of files) {
      // Exclude files that start with a $ sign
      if (path.basename(file).startsWith("$")) {
        console.log(`Excluding file: ${file}`);
        continue;
      }

      try {
        const content = JSON.parse(fs.readFileSync(file, "utf8"));
        this.extractTokens(content);
        console.log(`Parsed file: ${file}`);
      } catch (e) {
        console.error(`Failed to parse ${file}: ${e}`);
      }
    }
  }

  // Extract tokens from a JSON object
  private extractTokens(obj: any, prefix: string = ""): void {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        const newPrefix = prefix ? `${prefix}.${key}` : key;

        if (typeof value === "object" && value !== null && "value" in value) {
          // Treat "value" as a terminal node
          console.log(`Token found: ${newPrefix}`);
          this.tokens.push(newPrefix); // Add only the token value without {}
        } else if (typeof value === "object" && value !== null) {
          this.extractTokens(value, newPrefix);
        }
      }
    }
  }

  // Get the list of tokens for autocompletion
  public getTokens(): string[] {
    return this.tokens;
  }
}
