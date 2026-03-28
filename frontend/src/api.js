// frontend/src/api.js

export const generateQR = async (url, labelText = "", labelPosition = "Top") => {
    const response = await fetch('/api/qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: url,
        label_text: labelText,
        label_position: labelPosition,
      }),
    });
    if (!response.ok) throw new Error('QRコードの生成に失敗しました');
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  };
  
  export const fetchHistory = async () => {
    const response = await fetch('/api/history');
    if (!response.ok) throw new Error('履歴の取得に失敗しました');
    return await response.json();
  };
  
  export const deleteHistoryItem = async (id) => {
    const response = await fetch(`/api/history/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('履歴の削除に失敗しました');
    return await response.json();
  };