import { useEffect, useState } from "react";
import { deleteHistoryItem, fetchHistory, generateQR } from "./api";

export default function App() {
  const [url, setUrl] = useState("");
  const [labelText, setLabelText] = useState("");
  const [labelPosition, setLabelPosition] = useState("Top");
  const [qrSrc, setQrSrc] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 履歴を読み込む
  const loadHistory = async () => {
    const data = await fetchHistory();
    setHistory(data);
  };

  useEffect(() => {
    loadHistory();
  }, []);

 // QRコード生成ボタン
 const handleGenerate = async () => {
  // 1. 空チェック
  if (!url) { 
    setError("URLが空欄です"); 
    return; 
  }

  // 2. URL形式チェック (http:// または https:// で始まるか)
  const urlPattern = /^https?:\/\/.+/;
  if (!urlPattern.test(url)) {
    setError("有効なURLを入力してください (http:// または https:// から始めてください)");
    return;
  }

  setError(""); // エラーをクリア
  setLoading(true);
  try {
    const src = await generateQR(url, labelText, labelPosition);
    setQrSrc(src);
    await loadHistory(); // 生成後に履歴を更新
  } catch (e) {
    setError(e.message);
  } finally {
    setLoading(false);
  }
};

  // 履歴クリックで入力欄を復元
  const handleHistoryClick = (item) => {
    setUrl(item.url);
    setLabelText(item.label_text || "");
    setLabelPosition(item.label_position || "Top");
    setQrSrc(null);
  };

  // 履歴削除
  const handleDelete = async (id) => {
    await deleteHistoryItem(id);
    await loadHistory();
  };

  return (
    <div style={{ display: "flex", gap: 24, padding: 24, fontFamily: "sans-serif" }}>

      {/* サイドバー：履歴 */}
      <aside style={{ width: 240, flexShrink: 0 }}>
        <h3>生成履歴</h3>
        {history.length === 0 && <p style={{ color: "#888" }}>まだ履歴がありません</p>}
        {history.map((item) => (
          <div key={item.id} style={{ display: "flex", alignItems: "center", marginBottom: 8, gap: 8 }}>
            <button
              onClick={() => handleHistoryClick(item)}
              style={{ flex: 1, textAlign: "left", padding: "6px 8px", cursor: "pointer" }}
            >
              {item.url.slice(0, 25)}　{item.label_text || "注釈なし"}
            </button>
            <button onClick={() => handleDelete(item.id)} style={{ cursor: "pointer" }}>
              🗑
            </button>
          </div>
        ))}
      </aside>

      {/* メインエリア */}
      <main style={{ flex: 1 }}>
        <h1>URL to QR Generator</h1>
        <p>URLを入力してQRコードを生成できます。日本語の注釈も追加可能です。</p>

        <label>QRコードにするURLを入力:</label><br />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          style={{ width: "100%", padding: 8, marginTop: 4, marginBottom: 16 }}
        />

        <details>
          <summary style={{ cursor: "pointer", marginBottom: 8 }}>注釈（ラベル）の設定</summary>
          <label>表示する文字:</label><br />
          <input
            value={labelText}
            onChange={(e) => setLabelText(e.target.value)}
            placeholder="例：公式LINEはこちら"
            style={{ width: "100%", padding: 8, marginTop: 4, marginBottom: 12 }}
          />
          <div style={{ display: "flex", gap: 16 }}>
            {["Top", "Bottom"].map((pos) => (
              <label key={pos} style={{ cursor: "pointer" }}>
                <input
                  type="radio"
                  value={pos}
                  checked={labelPosition === pos}
                  onChange={() => setLabelPosition(pos)}
                />{" "}
                {pos}
              </label>
            ))}
          </div>
        </details>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{ marginTop: 16, padding: "10px 24px", cursor: "pointer" }}
        >
          {loading ? "生成中..." : "QRコードを生成"}
        </button>

        {/* 生成結果 */}
        {qrSrc && (
          <div style={{ marginTop: 24 }}>
            <img src={qrSrc} alt="QRコード" width={300} />
            <br />
            <a href={url} target="_blank" rel="noreferrer">
              生成したリンクをブラウザで開いて確認する
            </a>
            <br />
            <a href={qrSrc} download="qr_code.png">
              <button style={{ marginTop: 8, cursor: "pointer" }}>画像を保存する</button>
            </a>
          </div>
        )}
      </main>
    </div>
  );
}