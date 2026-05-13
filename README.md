# QRコード生成アプリ

URLや各種情報からQRコードを生成できるWebアプリです。ゲストでも利用可能で、アカウント登録すると生成履歴の保存・有効期限設定が使えます。

---

## デモ

https://qr-generator-fullstack.vercel.app/

[![アプリ画面](docs/demo.png)](https://qr-generator-fullstack.vercel.app/)

> ⚠️ Renderの無料プランを使っているため、**初回アクセス時はバックエンドの起動に数十秒かかる場合があります。** 画面が表示されない場合は少し待ってからリロードしてみてください。

---

## 開発の背景

以前にStreamlitでQRコード生成アプリを作っていました。Streamlitはシンプルに動くものを作るには便利でしたが、UIの自由度に限界があり、APIとして外部から呼び出せない点も気になっていました。フロントエンドとバックエンドを分けた構成を自分でも経験しておきたいと思い、React + FastAPIの構成に作り直しました。その後、ユーザー管理を追加したことで複数ユーザーの同時書き込みが発生する設計になったため、SQLiteからPostgreSQL（Supabase）に移行しました。

---

## 機能一覧

**ゲスト（ログインなし）**
- QRコードの種類別生成（URL・テキスト・メールアドレス・電話番号・Wi-Fi）
- 日本語注釈の追加（QRコードの上または下に配置）
- 生成画像のPNGダウンロード
- 生成内容のコピー
- URL形式チェック

**ログイン後**
- 生成履歴の保存・一覧表示（クリックで再利用可能）
- 履歴の個別削除・一括削除
- QRコードの有効期限設定
- アカウント削除

**認証まわり**
- パスワードバリデーション（8文字以上・英字と数字を含む）
- トークンの有効期限切れ時に自動でログアウト

---

## 使用技術

| カテゴリ | 技術 |
|------|------|
| バックエンド | FastAPI / Python 3.11 |
| フロントエンド | React 19 / Vite |
| 画像処理 | qrcode / Pillow |
| 認証 | JWT（python-jose）/ bcrypt（passlib） |
| DB | PostgreSQL（Supabase） / SQLAlchemy |
| インフラ | Docker / Docker Compose |
| デプロイ | Vercel（フロントエンド）/ Render（バックエンド） |

---

## 技術選定理由

**React**
実務で広く使われていること、Streamlitでは難しかった細かいUI制御ができることから選びました。フロントエンドとバックエンドを完全に分離した構成を経験しておきたいという目的もありました。

**FastAPI**
PythonでQR生成の処理をそのまま活かしながらAPI化できる点が決め手です。ユーザー管理・認証・DB連携を含むAPIサーバーとしての構成を実装するのに適していると判断しました。

**PostgreSQL（Supabase）への移行**
ユーザー管理を追加したことで複数ユーザーの同時書き込みが発生する設計になりました。SQLiteでは同時アクセス時の競合リスクがあるためPostgreSQLに移行しました。ホスティングにはSupabaseの無料プランを使用しています。

**JWT認証**
ログイン機能の実装方法として広く使われているため採用しました。サーバー側でセッションを管理する必要がなく、フロントエンドとバックエンドを分離した構成に向いています。

**Docker**
自分のPC以外でも同じ環境で動かせるよう導入しました。`docker compose up --build` の1コマンドで開発環境が立ち上がるようにしています。

---

## こだわった点

**ゲスト・ログイン両対応の設計**
ゲストでもQR生成・ダウンロードができるようにしつつ、ログインすることで履歴保存・有効期限設定が使えるようになる設計にしました。未ログイン時は画面上に使える機能の案内を表示しています。

**Wi-Fi対応**
Streamlit版を作っていた時に既存のQRコードサービスを調べていたところ、Wi-Fi接続用のQRコードがあることを知りました。カフェや店舗のフリーWi-Fi案内など実用的な使い道があると思い対応しました。バックエンドで `WIFI:T:WPA;S:SSID;P:PASSWORD;;` 形式に変換する処理を実装しています。

**ダウンロードファイル名**
URLのQRコードを保存する際、`qr_example.com.png` のようにドメイン名をファイル名に含めるようにしました。複数のQRコードを生成したときに区別しやすくするためです。

**入力バリデーション**
URLが空欄の場合や正しい形式でない場合はフロントエンド側でエラーを表示し、バックエンドに不正なリクエストが飛ばないようにしました。登録時のパスワードも同様に、8文字未満や英数字が混在していない場合はサーバーに送る前にエラーを出すようにしています。

**URL確認リンク**
URL種別でQRコードを生成した際のみ、生成結果の画面に「リンクを開く」リンクを表示するようにしました。スマホのカメラで読み込まなくても、生成したQRコードが正しいURLで作られているかをその場で確認できます。

**日本語フォントへの対応**
デフォルトフォントでは日本語の注釈が文字化けしてしまうため、日本語対応のNotoSansJPフォントファイルを読み込む処理を実装しました。

---

## フォルダ構成

```
fastapi-react-qr-generator/
├── backend/
│   ├── src/
│   │   ├── fonts/
│   │   │   ├── NotoSansJP-Medium.ttf
│   │   │   └── NotoSansJP-Regular.ttf
│   │   ├── auth.py
│   │   ├── database.py
│   │   ├── main_api.py
│   │   └── qr_service.py
│   ├── .env.example
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── api.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── index.html
│   ├── tailwind.config.js
│   └── vite.config.js
├── docker-compose.yml
├── docker-compose.override.yml
└── README.md
```

---

## APIエンドポイント

| メソッド | パス | 認証 | 説明 |
|---|---|---|---|
| `GET` | `/` | 不要 | 動作確認用 |
| `POST` | `/api/register` | 不要 | ユーザー登録 |
| `POST` | `/api/login` | 不要 | ログイン・トークン取得 |
| `DELETE` | `/api/user` | 必要 | アカウント削除 |
| `POST` | `/api/qr` | 任意 | QRコード生成（ゲスト可・ログイン時は履歴保存） |
| `GET` | `/api/history` | 必要 | 生成履歴を取得 |
| `DELETE` | `/api/history` | 必要 | 履歴を全件削除 |
| `DELETE` | `/api/history/{id}` | 必要 | 指定した履歴を削除 |

`http://localhost:8000/docs` でFastAPIの自動生成ドキュメントを確認できます。

---

## セットアップ

### 必要なもの

- Docker / Docker Compose
- （Windowsの場合）Docker Desktop

### 環境変数の設定

`backend/.env.example` を `.env` にコピーして、以下の内容を設定してください。

```
DATABASE_URL=postgresql://ユーザー名:パスワード@ホスト:5432/postgres
```

### 起動手順

```bash
git clone https://github.com/Nishimura-Jin/fastapi-react-qr-generator.git
cd fastapi-react-qr-generator
docker compose up --build
```

起動後、以下のURLにアクセスできます。

- フロントエンド: http://localhost:5173
- APIドキュメント: http://localhost:8000/docs

---

## 作者

GitHub: [Nishimura-Jin](https://github.com/Nishimura-Jin)