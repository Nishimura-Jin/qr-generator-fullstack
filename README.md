# 注釈付きQRコード生成ツール（フルスタック版）

URLを入力するだけでQRコードを生成し、日本語の注釈付き画像としてダウンロードできるWebアプリです。

---

## デモ

https://qr-generator-fullstack.vercel.app/

※ Renderの無料プランを使っているため、初回アクセス時はバックエンドの起動に数十秒かかる場合があります。

---

## 開発の背景

以前にStreamlitでQRコード生成アプリを作っていました。

- Streamlit版: https://github.com/Nishimura-Jin/url-to-qr-generator

Streamlitはシンプルに動くものを作るには便利でしたが、「UIの自由度に限界がある」「APIとして他から呼び出せない」という点が気になっていました。

就職後の開発現場で使われる構成を自分でも経験しておきたいと思い、React + FastAPI の構成に作り直しました。独学でフロントとバックを別々に勉強してきたので、それを一つのアプリとして繋げて動かす経験がしたかったという気持ちもありました。

---

## 機能一覧

- QRコード生成（URLまたは任意のテキスト）
- 日本語注釈の追加（QRコードの上または下に配置）
- 生成画像のPNGダウンロード
- リンク先をブラウザで開く機能
- 生成履歴の保存・一覧表示（クリックで再利用可能）
- 履歴の個別削除
- URL形式チェック（http / https）

---

## 使用技術

- **Language:** Python 3.11 / JavaScript
- **Frontend:** React 19 + Vite 8
- **Backend:** FastAPI
- **Libraries:**
  - qrcode（QRコード生成）
  - Pillow（画像処理・テキスト描画）
  - sqlite3（履歴管理）
- **Infrastructure:** Docker / Docker Compose
- **Dev Environment:** WSL2 (Ubuntu)

---

## 技術選定理由

**React**
実務で広く使われていること、Progate で学習済みだったこともあり採用しました。コンポーネント単位でUIを管理する設計を実際のアプリで使ってみたかったという理由もあります。

**FastAPI**
Python で書いたQR生成の処理をそのまま活かしながらAPI化できる点が決め手です。フロントエンドに依存しない構成にすることで、将来的に別のフロントから呼び出すこともできます。

**Docker**
自分のPCでしか動かない状態を避けるために導入しました。`docker compose up --build` の1コマンドで開発環境が立ち上がるようにしています。

---

## こだわった点

**入力バリデーション**
URLが空欄の場合や `http / https` で始まらない場合はエラーを表示し、バックエンドに不正なリクエストが飛ばないようにしました。

**状態管理**
入力中のURLと生成結果のURLをstateで分けて管理することで、生成後の表示・コピー・リンク先が入力変更の影響を受けないようにしました。

**エラーハンドリング**
API通信の処理を `apiFetch` にまとめて、サーバーから返ってくるエラーメッセージも画面に表示できるようにしました。どこで何が起きたか分かりやすくするのが目的です。

**日本語フォントへの対応**
注釈を画像に描画する際、フォントの読み込みに失敗しても処理が止まらないようにデフォルトフォントにフォールバックする処理を入れました。

**スクロールの自動移動**
QRコードの生成後、結果エリアまで自動でスクロールするようにしました。スマホで見たときに生成後の画像が見えなくなることがあったためです。

---

## 苦労した点

**状態管理による表示の不整合**
生成後に入力欄のURLを変更すると、表示・コピー・リンク先がすべて変わってしまう問題がありました。入力用と生成結果用のstateを分けることで解決しました。

**API連携時のエラー処理**
エラーが発生したときに原因が画面に出てこなかったため、デバッグに時間がかかりました。API通信処理を `apiFetch` に共通化し、サーバーから返ってくるメッセージを表示するようにしてから、問題の特定がしやすくなりました。

**日本語フォントの対応**
環境によって日本語が正しく表示されない問題がありました。フォントを明示的に指定し、読み込みに失敗した場合のフォールバック処理を追加して対応しました。

---

## フォルダ構成

```
qr-generator-fullstack/
├── backend/
│   ├── data/
│   │   └── history.db
│   ├── src/
│   │   ├── fonts/
│   │   │   └── NotoSansJP-Medium.ttf
│   │   ├── database.py
│   │   ├── main_api.py
│   │   └── qr_service.py
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── index.css
│   │   └── main.jsx
│   ├── vite.config.js
│   └── package.json
├── docker-compose.yml
├── docker-compose.dev.yml
└── README.md
```

---

## APIエンドポイント

| メソッド | パス | 説明 |
|---|---|---|
| `GET` | `/` | 動作確認用 |
| `POST` | `/api/qr` | QRコードを生成してPNG画像を返す |
| `GET` | `/api/history` | 生成履歴を取得（新しい順・最大20件） |
| `DELETE` | `/api/history/{id}` | 指定した履歴を削除 |

リクエスト例（POST /api/qr）:
```json
{
  "url": "https://example.com",
  "label_text": "公式LINEはこちら",
  "label_position": "Top"
}
```

`http://localhost:8000/docs` でFastAPIの自動生成ドキュメントを確認できます。

---

## セットアップ

### 必要なもの

- Docker / Docker Compose
- （Windowsの場合）WSL2

### 起動手順

```bash
git clone https://github.com/Nishimura-Jin/qr-generator-fullstack.git
cd qr-generator-fullstack

docker compose up --build
```

起動後、以下のURLにアクセスできます。

- フロントエンド: http://localhost:5173
- APIドキュメント: http://localhost:8000/docs

### 開発時（ホットリロードあり）

```bash
docker compose -f docker-compose.dev.yml up --build
```

### Dockerを使わない場合

```bash
# バックエンド
cd backend
pip install -r requirements.txt
uvicorn src.main_api:app --reload --port 8000

# フロントエンド（別ターミナルで）
cd frontend
npm install
npm run dev
```

---

## 作者

GitHub: [Nishimura-Jin](https://github.com/Nishimura-Jin)