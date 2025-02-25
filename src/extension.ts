import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

export function activate(context: vscode.ExtensionContext) {
  console.log("auto-exports extension is now active");

  // 파일 시스템 감시자 생성
  let fileWatcher: vscode.FileSystemWatcher | undefined;

  let disposable = vscode.commands.registerCommand(
    "auto-exports.generateBarrelExports",
    async (uri: vscode.Uri) => {
      if (!uri) {
        return;
      }

      try {
        await generateBarrelExports(uri);

        // 기존 감시자가 있다면 제거
        if (fileWatcher) {
          fileWatcher.dispose();
        }

        // 새로운 감시자 생성
        fileWatcher = vscode.workspace.createFileSystemWatcher(
          new vscode.RelativePattern(uri, "**/index.{ts,tsx,js,jsx}")
        );

        // 파일 생성 이벤트
        fileWatcher.onDidCreate(async (uri) => {
          const folderUri = vscode.Uri.file(
            path.dirname(path.dirname(uri.fsPath))
          );
          await generateBarrelExports(folderUri);
        });

        // 파일 삭제 이벤트
        fileWatcher.onDidDelete(async (uri) => {
          const folderUri = vscode.Uri.file(
            path.dirname(path.dirname(uri.fsPath))
          );
          await generateBarrelExports(folderUri);
        });

        // 파일 변경 이벤트 (선택적)
        fileWatcher.onDidChange(async (uri) => {
          const folderUri = vscode.Uri.file(
            path.dirname(path.dirname(uri.fsPath))
          );
          await generateBarrelExports(folderUri);
        });

        // 감시자를 context에 추가하여 확장이 비활성화될 때 정리되도록 함
        context.subscriptions.push(fileWatcher);

        vscode.window.showInformationMessage(
          "Barrel exports generated and watching for changes!"
        );
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to generate barrel exports: ${error}`
        );
      }
    }
  );

  context.subscriptions.push(disposable);
}

async function generateBarrelExports(folderUri: vscode.Uri) {
  const config = vscode.workspace.getConfiguration("autoExports");
  const exportStyle = config.get<string>("exportStyle") || "default";
  const customPattern =
    config.get<string>("exportPattern") ||
    "export { default as ${name} } from './${path}';";
  const indexFileNames = config.get<string[]>("indexFileNames") || [
    "index.tsx",
    "index.ts",
    "index.jsx",
    "index.js",
  ];
  const outputFileName = config.get<string>("outputFileName") || "index.ts";

  const files = await vscode.workspace.fs.readDirectory(folderUri);
  const exportStatements: string[] = [];

  // 현재 존재하는 export 구문들을 보존
  const existingExports = new Map<string, string>();
  const indexUri = vscode.Uri.file(path.join(folderUri.fsPath, outputFileName));
  try {
    const existingContent = await vscode.workspace.fs.readFile(indexUri);
    const existingLines = Buffer.from(existingContent).toString().split("\n");
    for (const line of existingLines) {
      const match = line.match(
        /export.*from\s+['"]\.\/([^/'"]*)\/([^'"]*)['"]/
      );
      if (match) {
        existingExports.set(match[1], match[2]); // 폴더명 -> 파일명 매핑 저장
      }
    }
  } catch (error) {
    // 파일이 없는 경우 무시
  }

  for (const [name, type] of files) {
    if (type === vscode.FileType.Directory) {
      let foundIndexFile = false;
      for (const indexFile of indexFileNames) {
        const indexPath = path.join(folderUri.fsPath, name, indexFile);
        if (fs.existsSync(indexPath)) {
          // 이전에 있던 파일 확장자를 우선 사용하거나, 새로 찾은 파일의 확장자 사용
          const exportPath = existingExports.has(name)
            ? `${name}/${existingExports.get(name)}`
            : `${name}/${indexFile}`;

          let statement: string;
          switch (exportStyle) {
            case "default":
              statement = `export { default as ${name} } from './${exportPath}';`;
              break;
            case "named":
              statement = `export { ${name} } from './${exportPath}';`;
              break;
            case "star":
              statement = `export * as ${name} from './${exportPath}';`;
              break;
            case "custom":
              statement = customPattern
                .replace("${name}", name)
                .replace("${path}", exportPath);
              break;
            default:
              statement = `export { default as ${name} } from './${exportPath}';`;
          }

          exportStatements.push(statement);
          foundIndexFile = true;
          break;
        }
      }
    }
  }

  if (exportStatements.length > 0) {
    const indexContent = exportStatements.join("\n") + "\n";
    await vscode.workspace.fs.writeFile(indexUri, Buffer.from(indexContent));
  }
}

// This method is called when your extension is deactivated
export function deactivate() {
  // FileSystemWatcher는 context.subscriptions에 추가되어 있으므로
  // 자동으로 정리됩니다.
}
