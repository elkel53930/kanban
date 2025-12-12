@echo off
setlocal enabledelayedexpansion

rem Kanban App Setup Script for Windows
rem このスクリプトは Windows で Kanban アプリを簡単にセットアップします

echo 🎯 Kanban App セットアップを開始します...
echo ==============================================
echo.

rem Node.js のチェック
:check_nodejs
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js が見つかりません
    echo    Node.js v16以上をインストールしてください
    echo    ダウンロード: https://nodejs.org/
    echo.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo ✅ Node.js が見つかりました: !NODE_VERSION!
)

rem npm のチェック
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm が見つかりません
    echo    Node.js と一緒に npm もインストールしてください
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo ✅ npm が見つかりました: !NPM_VERSION!
)

echo.

rem プロジェクトファイルの存在チェック
:check_project
if not exist "package.json" (
    echo ❌ package.json が見つかりません
    echo    このスクリプトはプロジェクトのルートディレクトリで実行してください
    pause
    exit /b 1
)
echo ✅ プロジェクトファイルが見つかりました

rem 依存関係のインストール
echo.
echo 📦 依存関係をインストールしています...
call npm install
if %errorlevel% neq 0 (
    echo ❌ npm install に失敗しました
    pause
    exit /b 1
)
echo ✅ 依存関係のインストールが完了しました

rem データベースディレクトリの確認
echo.
echo 🗄️  データベースディレクトリを確認しています...
if not exist "database" (
    echo ❌ database ディレクトリが見つかりません
    pause
    exit /b 1
)
echo ✅ データベースディレクトリが確認できました

rem Windows Defender ファイアウォールの確認
echo.
echo 🔥 ファイアウォール設定について...
echo    Windows Defender ファイアウォールで、初回起動時にアクセス許可を
echo    求められた場合は、「アクセスを許可する」を選択してください

rem アプリケーションのテスト起動
echo.
echo 🚀 アプリケーションをテスト起動しています...

rem バックグラウンドでサーバーを起動
start /b npm start
timeout /t 5 /nobreak > nul

rem サーバーの起動確認（簡易チェック）
for /f "tokens=5" %%a in ('netstat -an ^| find ":3000"') do set PORT_CHECK=%%a
if "!PORT_CHECK!" == "" (
    echo ⚠️  ポート3000でのリッスンを確認できませんでした
    echo    サーバーが起動しているか確認してください
) else (
    echo ✅ サーバーが正常に起動しました！
)

rem プロセスを停止
taskkill /f /im node.exe >nul 2>nul

echo.
echo 🎉 セットアップが完了しました！
echo ==============================================
echo.
echo 📝 使い方:
echo   1. サーバーを起動: npm start
echo   2. ブラウザで開く: http://localhost:3000
echo   3. 停止: Ctrl+C
echo.
echo 📂 重要なファイル:
echo   • server.js         - メインサーバー
echo   • database\kanban.db - データベース（自動作成）
echo   • views\index.html   - メインページ
echo.
echo 🆘 問題が発生した場合:
echo   • ログを確認してください
echo   • ポート3000が使用中でないか確認してください
echo   • Node.js v16以上がインストールされているか確認してください
echo   • Windows Defender ファイアウォールの設定を確認してください
echo.

pause