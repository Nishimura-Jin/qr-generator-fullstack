# QRコード生成アプリ

URLや各種情報からQRコードを生成できるWebアプリです。ゲストでも利用可能で、アカウント登録すると生成履歴の保存・有効期限設定が使えます。

---

## デモ

https://qr-generator-fullstack.vercel.app/

※ Renderの無料プランを使っているため、初回アクセス時はバックエンドの起動に数十秒かかる場合があります。

---

## 開発の背景

以前にStreamlitでQRコード生成アプリを作っていました。Streamlitはシンプルに動くものを作るには便利でしたが、「UIの自由度に限界がある」「APIとして他から呼び出せない」という点が気になっていました。就職後の開発現場で使われる構成を自分でも経験しておきたいと思い、React + FastAPI の構成に作り直しました。その後、複数ユーザーの同時アクセスに対応するためSQLiteからPostgreSQL（Supabase）に移行しました。

---

## 機能一覧

**ゲスト（ログインなし）**
- QRコードの種類別生成（URL・テキスト・メールアドレス・電話番号・Wi-Fi）
- 日本語注釈の追加（QRコードの上または下に配置）
- 生成画像のPNGダウンロード
- URL形式チェック

**ログイン後**
- 生成履歴の保存・一覧表示（クリックで再利用可能）
- 履歴の個別削除・一括削除
- QRコードの有効期限設定
- アカウント削除

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
実務で広く使われていること、学習後に実務に近い構成で実装するために選びました。

**FastAPI**
Python で書いたQR生成の処理をそのまま活かしながらAPI化できる点が決め手です。フロントエンドに依存しない構成にすることで、将来的に別のフロントから呼び出すこともできます。

**PostgreSQL（Supabase）への移行**
ユーザー管理を追加したことで複数ユーザーの同時書き込みが発生する設計になりました。SQLiteでは同時アクセス時の競合が起きるリスクがあるため、PostgreSQLに移行しました。ホスティングにはSupabaseの無料プランを使用しています。

**JWT認証**
ログイン状態をサーバー側で管理せずトークンベースで認証する設計にしました。スケールしやすく、フロントエンドとバックエンドを完全に分離した構成に適しています。

**Docker**
自分のPCでしか動かない状態を避けるために導入しました。`docker compose up --build` の1コマンドで開発環境が立ち上がるようにしています。

---

## こだわった点

**ゲスト・ログイン両対応の設計**
ログイン必須にするとユーザーの離脱につながるため、ゲストでもQR生成・ダウンロードができるようにしました。ログインするとより便利になる機能（履歴・有効期限）を追加し、登録のメリットを自然に伝える設計にしています。

**QRコードの種類別対応**
URL以外にもテキスト・メールアドレス・電話番号・Wi-Fiに対応しました。Wi-Fiは `WIFI:T:WPA;S:SSID;P:PASSWORD;;` 形式に変換する処理をバックエンドで実装しています。

**有効期限の管理**
期限切れの履歴は取得時にフィルタリングし、フロントには返さない設計にしました。

**入力バリデーション**
URLが空欄の場合や正しい形式でない場合はエラーを表示し、バックエンドに不正なリクエストが飛ばないようにしました。

**日本語フォントへの対応**
注釈を画像に描画する際、フォントの読み込みに失敗しても処理が止まらないようデフォルトフォントにフォールバックする処理を入れました。

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