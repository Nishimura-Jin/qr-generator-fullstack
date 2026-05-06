import { useEffect, useRef, useState } from "react";
import {
  deleteAccount,
  deleteAllHistory,
  deleteHistoryItem,
  fetchHistory,
  generateQR,
  login,
  logout,
  register,
} from "./api";

const QR_TYPES = [
  { value: "url", label: "URL" },
  { value: "text", label: "テキスト" },
  { value: "email", label: "メールアドレス" },
  { value: "phone", label: "電話番号" },
  { value: "wifi", label: "Wi-Fi" },
];

const PLACEHOLDERS = {
  url: "https://example.com",
  text: "任意のテキスト",
  email: "example@email.com",
  phone: "090-1234-5678",
  wifi: "SSID,パスワード,WPA",
};

// ================= 認証モーダル =================
function AuthModal({ onLogin, onClose }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!username || !password) {
      setError("ユーザー名とパスワードを入力してください");
      return;
    }
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        await register(username, password);
      }
      await login(username, password);
      onLogin(localStorage.getItem("username"));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          ×
        </button>

        <h2 className="text-xl font-bold text-center mb-6">
          {mode === "login" ? "ログイン" : "新規登録"}
        </h2>

        <div className="flex mb-6 rounded-xl overflow-hidden border">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 py-2 text-sm font-medium ${mode === "login" ? "bg-blue-600 text-white" : "bg-white text-gray-600"}`}
          >
            ログイン
          </button>
          <button
            onClick={() => setMode("register")}
            className={`flex-1 py-2 text-sm font-medium ${mode === "register" ? "bg-blue-600 text-white" : "bg-white text-gray-600"}`}
          >
            新規登録
          </button>
        </div>

        <label className="text-sm font-medium">ユーザー名</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full mt-1 mb-4 p-3 rounded-xl border"
        />

        <label className="text-sm font-medium">パスワード</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="w-full mt-1 mb-4 p-3 rounded-xl border"
        />

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white py-3 rounded-xl disabled:opacity-50"
        >
          {loading ? "処理中..." : mode === "login" ? "ログイン" : "登録してログイン"}
        </button>
      </div>
    </div>
  );
}

// ================= メイン画面 =================
export default function App() {
  const [username, setUsername] = useState(localStorage.getItem("username"));
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [qrType, setQrType] = useState("url");
  const [content, setContent] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [labelText, setLabelText] = useState("");
  const [labelPosition, setLabelPosition] = useState("Top");
  const [expiresAt, setExpiresAt] = useState("");
  const [qrSrc, setQrSrc] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const resultRef = useRef(null);

  const loadHistory = async () => {
    if (!username) return;
    try {
      const data = await fetchHistory();
      setHistory(data);
    } catch {
      setError("履歴の取得に失敗しました");
    }
  };

  useEffect(() => {
    loadHistory();
  }, [username]);

  const buildFileName = () => {
    if (qrType === "url") {
      try {
        const host = new URL(content).hostname;
        return `qr_${host}.png`;
      } catch {}
    }
    return `qr_${qrType}.png`;
  };

  const handleGenerate = async () => {
    if (!content) {
      setError("内容を入力してください");
      return;
    }
    if (qrType === "url") {
      try {
        new URL(content);
      } catch {
        setError("有効なURLを入力してください");
        return;
      }
    }

    setError("");
    setLoading(true);
    try {
      const src = await generateQR(qrType, content, labelText, labelPosition, expiresAt || null);
      setGeneratedContent(content);
      setQrSrc(src);
      if (username) await loadHistory();
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e) {
      setError(e.message || "QRコード生成に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedContent) return;
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleHistoryClick = (item) => {
    setQrType(item.qr_type || "url");
    setContent(item.content);
    setLabelText(item.label_text || "");
    setLabelPosition(item.label_position || "Top");
    setQrSrc(null);
    setGeneratedContent("");
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

  const handleDeleteAll = async () => {
    try {
      await deleteAllHistory();
      await loadHistory();
    } catch {
      setError("履歴の削除に失敗しました");
    }
  };

  const handleLogout = () => {
    logout();
    setUsername(null);
    setHistory([]);
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("アカウントを削除します。この操作は取り消せません。")) return;
    try {
      await deleteAccount();
      setUsername(null);
      setHistory([]);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center pt-10 px-4">
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-blue-100 via-blue-200 to-blue-400" />

      {showAuthModal && (
        <AuthModal
          onLogin={(name) => {
            setUsername(name);
            setShowAuthModal(false);
          }}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {/* サイドバー（ログイン時のみ） */}
      {sidebarOpen && username && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-10"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-20 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold">履歴</h3>
              <div className="flex items-center gap-3">
                {history.length > 0 && (
                  <button
                    onClick={handleDeleteAll}
                    className="text-sm text-red-400 hover:text-red-600"
                  >
                    全て削除
                  </button>
                )}
                <button onClick={() => setSidebarOpen(false)}>×</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {history.length === 0 && (
                <p className="text-sm text-gray-400 text-center mt-8">履歴がありません</p>
              )}
              {history.map((item) => (
                <div key={item.id} className="flex gap-2">
                  <button
                    onClick={() => handleHistoryClick(item)}
                    className="flex-1 text-left p-3 rounded-xl bg-gray-100 hover:bg-gray-200"
                  >
                    <p className="text-xs text-blue-500 font-medium mb-1">
                      {QR_TYPES.find((t) => t.value === item.qr_type)?.label || item.qr_type}
                    </p>
                    <p className="text-sm font-medium break-all">{item.content}</p>
                    <p className="text-xs text-gray-500">{item.label_text || "注釈なし"}</p>
                    {item.expires_at && (
                      <p className="text-xs text-orange-400">
                        有効期限: {new Date(item.expires_at).toLocaleDateString("ja-JP")}
                      </p>
                    )}
                  </button>
                  <button onClick={() => handleDelete(item.id)}>🗑</button>
                </div>
              ))}
            </div>
          </aside>
        </>
      )}

      <div className="w-full max-w-6xl">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-4">
          {username ? (
            <button onClick={() => setSidebarOpen(true)}>☰ 履歴</button>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-4 text-sm">
            {username ? (
              <>
                <span className="text-gray-700">{username}</span>
                <button onClick={handleLogout} className="text-gray-500 hover:text-gray-700">
                  ログアウト
                </button>
                <button onClick={handleDeleteAccount} className="text-red-400 hover:text-red-600">
                  アカウント削除
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-700"
              >
                ログイン / 登録
              </button>
            )}
          </div>
        </div>

        <h1 className="text-4xl font-bold text-center mb-2">QR Code Generator</h1>
        <p className="text-center text-gray-600 mb-8">
          各種QRコードを生成できます
          {!username && (
            <span className="block text-sm text-blue-600 mt-1">
              ログインすると履歴の保存・有効期限設定が使えます
            </span>
          )}
        </p>

        <div className={`grid gap-6 ${qrSrc ? "lg:grid-cols-2" : ""}`}>
          <div className="bg-white/90 rounded-2xl shadow-xl p-8">

            {/* QRタイプ選択 */}
            <label className="text-sm font-medium">QRコードの種類</label>
            <div className="flex flex-wrap gap-2 mt-2 mb-4">
              {QR_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => { setQrType(t.value); setContent(""); }}
                  className={`px-3 py-1 rounded-full text-sm border ${
                    qrType === t.value
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-300"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {qrType === "wifi" && (
              <p className="text-xs text-gray-400 mb-2">
                形式：SSID,パスワード,WPA（例：MyWifi,pass1234,WPA）
              </p>
            )}

            <label className="text-sm font-medium">
              {QR_TYPES.find((t) => t.value === qrType)?.label}
            </label>
            <input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={PLACEHOLDERS[qrType]}
              className="w-full mt-2 mb-4 p-3 rounded-xl border"
            />

            <details className="mb-4">
              <summary className="cursor-pointer text-sm text-gray-600">注釈・有効期限設定</summary>

              <div className="mt-3 mb-2">
                <label className="text-sm">注釈テキスト</label>
                <input
                  value={labelText}
                  onChange={(e) => setLabelText(e.target.value)}
                  className="w-full mt-1 p-2 border rounded"
                />
              </div>

              <div className="flex gap-4 mt-2 mb-3">
                <label className="flex items-center gap-1 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="labelPosition"
                    value="Top"
                    checked={labelPosition === "Top"}
                    onChange={() => setLabelPosition("Top")}
                  />
                  上に表示
                </label>
                <label className="flex items-center gap-1 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="labelPosition"
                    value="Bottom"
                    checked={labelPosition === "Bottom"}
                    onChange={() => setLabelPosition("Bottom")}
                  />
                  下に表示
                </label>
              </div>

              {username ? (
                <div>
                  <label className="text-sm">有効期限（任意）</label>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full mt-1 p-2 border rounded"
                  />
                </div>
              ) : (
                <p className="text-xs text-gray-400">
                  有効期限設定はログイン後に使えます
                </p>
              )}
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
            <div ref={resultRef} className="bg-white/90 rounded-2xl shadow-xl p-8 text-center">
              <div className="bg-gray-50 p-6 rounded-xl mb-4">
                <img src={qrSrc} alt="生成されたQRコード" className="mx-auto w-64" />
              </div>

              <div className="bg-gray-100 p-3 rounded mb-4 text-sm break-all">
                {generatedContent}
              </div>

              <button
                onClick={handleCopy}
                className="w-full bg-gray-200 py-2 rounded mb-2"
              >
                {copied ? "コピー済み！" : "内容をコピー"}
              </button>

              <a href={qrSrc} download={buildFileName()}>
                <button className="w-full bg-gray-800 text-white py-2 rounded mb-2">
                  画像を保存
                </button>
              </a>

              {qrType === "url" && (
                <a href={generatedContent} target="_blank" rel="noreferrer">
                  <p className="text-blue-500 text-sm">リンクを開く</p>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}