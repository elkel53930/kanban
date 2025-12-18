# Kanban Board Application

個人向けのシンプルなカンバンボードアプリケーションです。Ubuntuローカル環境で動作し、日々のタスク管理を効率的に行うことができます。

![Kanban Board](https://img.shields.io/badge/Status-Ready-green) ![Node.js](https://img.shields.io/badge/Node.js-v16%2B-blue) ![Platform](https://img.shields.io/badge/Platform-Ubuntu%20%7C%20Windows-lightgrey)

## 🎯 主な機能

### ✨ カンバンボード
- **4つの固定カラム**: Todo → 今日やる → 実行中 → 完了
- **ドラッグ&ドロップ**: カードを簡単に移動
- **美しいUI**: モダンでレスポンシブなデザイン

### 📝 カード管理
- **作成・編集・削除**: 完全なCRUD操作
- **Markdown対応**: 説明文とコメントでMarkdown記法を使用可能
- **タグ機能**: カテゴリ分けとカラフルな表示
- **期限設定**: 日付管理と期限切れ警告

### 💬 コメント機能
- **インライン編集**: コメントの追加・編集・削除
- **Markdown レンダリング**: リッチなコメント表示
- **作成日時表示**: いつコメントされたかを記録

### 📋 履歴管理
- **自動アーカイブ**: 完了カードは翌日自動的にカンバンから消去
- **履歴ページ**: 過去の完了カードを日付別に閲覧
- **日付フィルター**: 特定日の完了カードを絞り込み検索

## 🚀 簡単セットアップ

### 自動セットアップ（推奨）

#### Ubuntu / Linux
```bash
# プロジェクトをクローン
git clone <repository-url>
cd kanban

# セットアップスクリプトを実行
./setup.sh
```

#### Windows
```cmd
# プロジェクトをクローン
git clone <repository-url>
cd kanban

# セットアップスクリプトを実行
setup.bat
```

### 手動セットアップ

#### 1. 前提条件
- **Node.js** v16以上 ([ダウンロード](https://nodejs.org/))
- **Git** ([ダウンロード](https://git-scm.com/))

#### 2. インストール手順
```bash
# 1. プロジェクトを取得
git clone <repository-url>
cd kanban

# 2. 依存関係をインストール
npm install

# 3. サーバーを起動
npm start
```

#### 3. アクセス
ブラウザで [http://localhost:3000](http://localhost:3000) を開く

## 📖 使い方

### カードの作成
1. **「➕ カードを追加」** ボタンをクリック
2. タイトル、説明、期限、タグを入力
3. 配置するカラムを選択して **「追加」**

### カードの移動
- カードを **ドラッグ&ドロップ** で他のカラムに移動
- 「完了」に移動すると翌日自動的にカンバンから消去

### カードの編集
1. カードを **クリック** して詳細画面を表示
2. **「編集」** で説明文を編集モードに切り替え
3. **「変更を保存」** で保存

### コメント機能
1. カード詳細画面でコメントを追加
2. 既存コメントの **「編集」** で内容を変更
3. Markdown記法でリッチなコメントを作成

### 履歴の確認
1. **「📋 履歴」** ボタンをクリック
2. 日付フィルターで期間を絞り込み
3. 履歴カードをクリックで詳細表示

## 🏗️ 技術スタック

### バックエンド
- **Node.js** - JavaScript実行環境
- **Express** - Webフレームワーク
- **SQLite** - 軽量データベース
- **PM2** - プロセス管理・バックグラウンド実行

### フロントエンド
- **HTML5/CSS3** - マークアップとスタイリング
- **JavaScript (ES6+)** - インタラクティブ機能
- **Marked.js** - Markdownレンダリング

### 機能
- **RESTful API** - データ操作
- **ドラッグ&ドロップ API** - カード移動
- **Fetch API** - 非同期通信

## 📂 プロジェクト構成

```
kanban/
├── 📄 server.js            # メインサーバーファイル
├── 📄 package.json         # Node.js設定・依存関係
├── 📄 ecosystem.config.js  # PM2プロセス管理設定
├── 📁 database/            # データベース関連
│   ├── schema.sql          # テーブル定義
│   ├── init.js            # DB初期化スクリプト
│   └── kanban.db          # SQLiteデータベース（自動生成）
├── 📁 models/             # データモデル
│   ├── Card.js            # カードモデル
│   └── Comment.js         # コメントモデル
├── 📁 routes/             # APIルート
│   └── api.js             # RESTful API エンドポイント
├── 📁 views/              # HTMLテンプレート
│   └── index.html         # メインページ
├── 📁 public/             # 静的ファイル
│   ├── css/style.css      # スタイルシート
│   └── js/app.js          # フロントエンドJavaScript
├── 📁 logs/               # PM2ログファイル（自動生成）
│   ├── out-0.log          # 標準出力ログ
│   ├── err-0.log          # エラーログ
│   └── combined-0.log     # 結合ログ
├── 📄 setup.sh            # Ubuntuセットアップスクリプト
├── 📄 setup.bat           # Windowsセットアップスクリプト
└── 📄 requirements.md     # 要求仕様書
```

## 🛡️ セキュリティ

- **XSS対策**: HTMLエスケープとMarkdownサニタイズ
- **ローカル実行**: 外部ネットワークアクセス不要
- **認証不要**: 個人利用に特化したシンプル設計

## 🔧 トラブルシューティング

### よくある問題

#### サーバーが起動しない
```bash
# ポート使用状況を確認
lsof -i :3000

# Node.jsバージョンを確認
node --version  # v16以上が必要
```

#### データベースエラー
```bash
# データベースファイルを削除して再作成
rm database/kanban.db
npm start  # 自動で再作成される
```

#### 依存関係エラー
```bash
# node_modules を削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

### ログの確認
```bash
# サーバーログを確認
npm start

# デバッグモードで起動
DEBUG=* npm start
```

## 🛠️ 開発・カスタマイズ

### 開発モード
```bash
# ファイル変更時自動再起動
npm install -g nodemon
nodemon server.js

# または
npm run dev  # package.jsonにスクリプト設定済み
```

## 🚀 バックグラウンド実行

アプリケーションをバックグラウンドで実行することで、ターミナルを閉じてもブラウザからアクセスし続けることができます。

### PM2を使用した実行管理

PM2（Process Manager 2）を使用してプロセス管理を行います。

#### 基本コマンド
```bash
# バックグラウンドで起動
npm run pm2:start

# 実行状態を確認
npm run pm2:status

# アプリケーションを停止
npm run pm2:stop

# アプリケーションを再起動
npm run pm2:restart

# ログを確認（リアルタイム）
npm run pm2:logs

# プロセス監視画面を表示
npm run pm2:monit

# プロセスを完全削除
npm run pm2:delete
```

#### 使用例
```bash
# 1. バックグラウンドで起動
npm run pm2:start

# 2. ブラウザでアクセス
# http://localhost:3000

# 3. ターミナルを閉じても動作継続

# 4. 必要に応じて状態確認
npm run pm2:status

# 5. 停止する場合
npm run pm2:stop
```

#### PM2設定ファイル
- **ecosystem.config.js**: PM2の設定ファイル
- **logs/**: PM2が出力するログファイルの保存先
  - `out-0.log`: 標準出力ログ
  - `err-0.log`: エラーログ  
  - `combined-0.log`: 結合ログ

### システム起動時の自動実行設定

システム再起動時にも自動でアプリケーションを開始したい場合：

```bash
# PM2の起動スクリプトを生成
npx pm2 startup

# 現在のプロセスリストを保存
npx pm2 save

# 設定を削除する場合
npx pm2 unstartup systemd
```

### カスタマイズポイント
- **CSS**: `public/css/style.css` でスタイルを変更
- **カラム名**: `views/index.html` でカラム名を編集
- **データベース**: `database/schema.sql` でテーブル構造を変更

## 📝 ライセンス

MIT License - 自由に使用・改変・配布可能

## 🤝 コントリビューション

バグ報告や機能提案は Issues でお気軽にどうぞ。

## 🤖 開発について

このアプリケーションは **Claude Code** を使用して開発されました。

- **AI開発**: [Anthropic Claude Code](https://claude.ai/code) で設計・実装
- **完全自動生成**: 要件定義からコーディング、テスト、ドキュメント作成まで
- **人間とAIの協働**: 効率的な開発プロセスの実現

### 開発プロセス
1. 📋 要件定義（requirements.md）の作成
2. 🏗️ アーキテクチャ設計とフェーズ分割
3. ⚡ 段階的実装（フェーズ1〜5）
4. 🧪 機能テストと改善
5. 📖 ドキュメント整備
6. 🚀 デプロイメント対応

**Claude Code** により、従来の開発時間を大幅に短縮しながら、高品質なアプリケーションを実現しています。

---

**Happy Task Management! 🎉**

*Generated with ❤️ by [Claude Code](https://claude.ai/code)*