// 🌐 本番API（Render）
const BASE_URL = "https://qr-generator-fullstack.onrender.com";

// 共通のAPI通信処理
const apiFetch = async (url, options = {}, defaultMessage) => {
  try {
    const response = await fetch(BASE_URL + url, options);

    if (!response.ok) {
      let message = defaultMessage;

      try {
        const errorData = await response.json();
        if (errorData?.detail) {
          message += `（${errorData.detail}）`;
        }
      } catch {
        // JSONで返ってこない場合は無視
      }

      throw new Error(message);
    }

    return response;

  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("サーバーに接続できません");
    }
    throw error;
  }
};


// QR生成
export const generateQR = async (url, labelText = "", labelPosition = "Top") => {
  const response = await apiFetch(
    '/api/qr',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: url,
        label_text: labelText,
        label_position: labelPosition,
      }),
    },
    'QRコードの生成に失敗しました'
  );

  const blob = await response.blob();
  return URL.createObjectURL(blob);
};


// 履歴取得
export const fetchHistory = async () => {
  const response = await apiFetch(
    '/api/history',
    {},
    '履歴の取得に失敗しました'
  );

  return await response.json();
};


// 履歴削除
export const deleteHistoryItem = async (id) => {
  await apiFetch(
    `/api/history/${id}`,
    { method: 'DELETE' },
    '履歴の削除に失敗しました'
  );

  return true;
};