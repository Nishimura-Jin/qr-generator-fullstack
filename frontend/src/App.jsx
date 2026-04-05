import { useEffect, useRef, useState } from "react";
import { deleteHistoryItem, fetchHistory, generateQR } from "./api";

export default function App() {
  const [url, setUrl] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [labelText, setLabelText] = useState("");
  const [labelPosition, setLabelPosition] = useState("Top");
  const [qrSrc, setQrSrc] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const resultRef = useRef(null);

  const loadHistory = async () => {
    try {
      const data = await fetchHistory();
      setHistory(data);
    } catch {
      setError("履歴の取得に失敗しました");
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleGenerate = async () => {
    if (!url) {
      setError("URLが空欄です");
      return;
    }

    try {
      new URL(url);
    } catch {
      setError("有効なURLを入力してください");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const src = await generateQR(url, labelText, labelPosition);
      setGeneratedUrl(url);
      setQrSrc(src);
      await loadHistory();

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);

    } catch (e) {
      setError(e.message || "QRコード生成に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedUrl) return;
    navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleHistoryClick = (item) => {
    setUrl(item.url);
    setLabelText(item.label_text || "");
    setLabelPosition(item.label_position || "Top");
    setQrSrc(null);
    setGeneratedUrl("");
    setSidebarOpen(false);
  };

  const handleDelete = async (id) => {
    try {
      await deleteHistoryItem(id);
      await loadHistory();
    } catch {
      setError("削除に失敗しました");
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center pt-10 px-4">

      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-blue-100 via-blue-200 to-blue-400" />

      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-10"
            onClick={() => setSidebarOpen(false)}
          />

          <aside className="fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-20 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold">履歴</h3>
              <button onClick={() => setSidebarOpen(false)}>×</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {history.map((item) => (
                <div key={item.id} className="flex gap-2">
                  <button
                    onClick={() => handleHistoryClick(item)}
                    className="flex-1 text-left p-3 rounded-xl bg-gray-100 hover:bg-gray-200"
                  >
                    <p className="text-sm font-medium break-all">{item.url}</p>
                    <p className="text-xs text-gray-500">
                      {item.label_text || "注釈なし"}
                    </p>
                  </button>

                  <button onClick={() => handleDelete(item.id)}>🗑</button>
                </div>
              ))}
            </div>
          </aside>
        </>
      )}

      <div className="w-full max-w-6xl">

        <div className="mb-4">
          <button onClick={() => setSidebarOpen(true)}>☰ 履歴</button>
        </div>

        <h1 className="text-4xl font-bold text-center mb-2">
          QR Code Generator
        </h1>
        <p className="text-center text-gray-600 mb-8">
          URLからQRコードを生成できます
        </p>

        <div className={`grid gap-6 ${qrSrc ? "lg:grid-cols-2" : ""}`}>

          <div className="bg-white/90 rounded-2xl shadow-xl p-8">

            <label className="text-sm font-medium">URL</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full mt-2 mb-4 p-3 rounded-xl border"
            />

            <details className="mb-4">
              <summary>注釈設定</summary>
              <input
                value={labelText}
                onChange={(e) => setLabelText(e.target.value)}
                className="w-full mt-2 p-2 border rounded"
              />
            </details>

            {error && <p className="text-red-500 mb-3">{error}</p>}

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white py-3 rounded-xl disabled:opacity-50"
            >
              {loading ? "生成中..." : "QRコードを生成"}
            </button>
          </div>

          {qrSrc && (
            <div
              ref={resultRef}
              className="bg-white/90 rounded-2xl shadow-xl p-8 text-center"
            >
              <div className="bg-gray-50 p-6 rounded-xl mb-4">
                <img src={qrSrc} className="mx-auto w-64" />
              </div>

              <div className="bg-gray-100 p-3 rounded mb-4 text-sm break-all">
                {generatedUrl}
              </div>

              <button
                onClick={handleCopy}
                className="w-full bg-gray-200 py-2 rounded mb-2"
              >
                {copied ? "コピー済み！" : "URLをコピー"}
              </button>

              <a href={qrSrc} download>
                <button className="w-full bg-gray-800 text-white py-2 rounded mb-2">
                  画像を保存
                </button>
              </a>

              <a href={generatedUrl} target="_blank" rel="noreferrer">
                <p className="text-blue-500 text-sm">リンクを開く</p>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}