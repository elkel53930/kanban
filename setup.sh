#!/bin/bash

# Kanban App Setup Script for Ubuntu
# このスクリプトは Ubuntu で Kanban アプリを簡単にセットアップします

set -e  # エラーが発生したら停止

echo "🎯 Kanban App セットアップを開始します..."
echo "=============================================="

# Node.js のバージョンチェック
check_nodejs() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        echo "✅ Node.js が見つかりました: $NODE_VERSION"
        
        # バージョンチェック (v16以上が必要)
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ "$NODE_MAJOR" -lt 16 ]; then
            echo "⚠️  Node.js v16以上が必要です。現在: $NODE_VERSION"
            install_nodejs
        fi
    else
        echo "❌ Node.js が見つかりません。インストールします..."
        install_nodejs
    fi
}

# Node.js のインストール
install_nodejs() {
    echo "📦 Node.js をインストールしています..."
    
    # NodeSource リポジトリを追加
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    
    # Node.js をインストール
    sudo apt-get install -y nodejs
    
    echo "✅ Node.js のインストールが完了しました"
    node --version
    npm --version
}

# Git のチェック
check_git() {
    if command -v git &> /dev/null; then
        echo "✅ Git が見つかりました: $(git --version)"
    else
        echo "📦 Git をインストールしています..."
        sudo apt-get update
        sudo apt-get install -y git
        echo "✅ Git のインストールが完了しました"
    fi
}

# プロジェクトのセットアップ
setup_project() {
    echo "📁 プロジェクトをセットアップしています..."
    
    # 現在のディレクトリに package.json があるかチェック
    if [ -f "package.json" ]; then
        echo "✅ 既存のプロジェクトディレクトリで実行中です"
    else
        echo "❌ package.json が見つかりません"
        echo "   このスクリプトはプロジェクトのルートディレクトリで実行してください"
        exit 1
    fi
    
    # npm install を実行
    echo "📦 依存関係をインストールしています..."
    npm install
    
    echo "✅ 依存関係のインストールが完了しました"
}

# データベースディレクトリの作成
setup_database() {
    echo "🗄️  データベースディレクトリを準備しています..."
    
    if [ ! -d "database" ]; then
        echo "❌ database ディレクトリが見つかりません"
        exit 1
    fi
    
    # 権限設定
    chmod 755 database/
    
    echo "✅ データベースの準備が完了しました"
}

# ファイアウォール設定の確認
check_firewall() {
    echo "🔥 ファイアウォール設定を確認しています..."
    
    if command -v ufw &> /dev/null; then
        UFW_STATUS=$(sudo ufw status | head -1)
        echo "   UFW ステータス: $UFW_STATUS"
        
        if [[ "$UFW_STATUS" == *"active"* ]]; then
            echo "⚠️  ファイアウォールがアクティブです"
            echo "   ポート3000へのアクセスを許可しますか？ [y/N]"
            read -r response
            if [[ "$response" =~ ^[Yy]$ ]]; then
                sudo ufw allow 3000
                echo "✅ ポート3000を開放しました"
            fi
        fi
    fi
}

# アプリケーションの起動テスト
test_startup() {
    echo "🚀 アプリケーションをテスト起動しています..."
    
    # バックグラウンドでサーバーを起動
    npm start &
    SERVER_PID=$!
    
    # 少し待機
    sleep 5
    
    # サーバーが起動しているかチェック
    if curl -s http://localhost:3000 > /dev/null; then
        echo "✅ サーバーが正常に起動しました！"
        echo "   ブラウザで http://localhost:3000 にアクセスしてください"
    else
        echo "❌ サーバーの起動に失敗しました"
    fi
    
    # テスト用サーバーを停止
    kill $SERVER_PID 2>/dev/null || true
    wait $SERVER_PID 2>/dev/null || true
}

# セットアップの完了メッセージ
show_completion() {
    echo ""
    echo "🎉 セットアップが完了しました！"
    echo "=============================================="
    echo ""
    echo "📝 使い方:"
    echo "  1. サーバーを起動: npm start"
    echo "  2. ブラウザで開く: http://localhost:3000"
    echo "  3. 停止: Ctrl+C"
    echo ""
    echo "📂 重要なファイル:"
    echo "  • server.js         - メインサーバー"
    echo "  • database/kanban.db - データベース（自動作成）"
    echo "  • views/index.html   - メインページ"
    echo ""
    echo "🆘 問題が発生した場合:"
    echo "  • ログを確認してください"
    echo "  • ポート3000が使用中でないか確認してください"
    echo "  • Node.js v16以上がインストールされているか確認してください"
    echo ""
}

# メイン実行部分
main() {
    echo "システム情報:"
    echo "  OS: $(lsb_release -d 2>/dev/null | cut -f2 || echo 'Unknown')"
    echo "  アーキテクチャ: $(uname -m)"
    echo ""
    
    # 各ステップを実行
    check_git
    check_nodejs
    setup_project
    setup_database
    check_firewall
    test_startup
    show_completion
}

# スクリプト実行
main "$@"