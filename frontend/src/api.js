const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const getToken = () => localStorage.getItem("token");

const apiFetch = async (url, options = {}, defaultMessage) => {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(BASE_URL + url, { ...options, headers });

    if (!response.ok) {
      let message = defaultMessage;
      try {
        const errorData = await response.json();
        if (errorData?.detail) message += `（${errorData.detail}）`;
      } catch {}
      throw new Error(message);
    }

    return response;
  } catch (error) {
    if (error instanceof TypeError) throw new Error("サーバーに接続できません");
    throw error;
  }
};

export const register = async (username, password) => {
  await apiFetch(
    "/api/register",
    { method: "POST", body: JSON.stringify({ username, password }) },
    "登録に失敗しました"
  );
};

export const login = async (username, password) => {
  const response = await apiFetch(
    "/api/login",
    { method: "POST", body: JSON.stringify({ username, password }) },
    "ログインに失敗しました"
  );
  const data = await response.json();
  localStorage.setItem("token", data.access_token);
  localStorage.setItem("username", data.username);
  return data;
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
};

export const deleteAccount = async () => {
  await apiFetch("/api/user", { method: "DELETE" }, "アカウント削除に失敗しました");
  logout();
};

export const generateQR = async (qrType, content, labelText = "", labelPosition = "Top", expiresAt = null) => {
  const token = getToken();
  const body = {
    qr_type: qrType,
    content,
    label_text: labelText,
    label_position: labelPosition,
    ...(token && expiresAt ? { expires_at: expiresAt } : {}),
  };

  const response = await apiFetch(
    "/api/qr",
    { method: "POST", body: JSON.stringify(body) },
    "QRコードの生成に失敗しました"
  );

  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

export const fetchHistory = async () => {
  const response = await apiFetch("/api/history", {}, "履歴の取得に失敗しました");
  return await response.json();
};

export const deleteHistoryItem = async (id) => {
  await apiFetch(`/api/history/${id}`, { method: "DELETE" }, "履歴の削除に失敗しました");
};

export const deleteAllHistory = async () => {
  await apiFetch("/api/history", { method: "DELETE" }, "履歴の削除に失敗しました");
};