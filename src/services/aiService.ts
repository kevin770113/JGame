import { Race, Gender } from '../types';

interface AIDescription {
  name: string;
  story: string;
}

export const generateSlaveIdentity = async (race: Race, gender: Gender): Promise<AIDescription> => {
  const genderText = gender === 'Male' ? '男性' : '女性';
  
  try {
    const response = await fetch('/ai/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: `為一個 [性別: ${genderText}] 的 [種族: ${race}] 角色生成一個充滿黑暗奇幻風格的名字，以及一段約 30 字的簡短背景故事。`
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        name: `HTTP 錯誤: ${response.status}`,
        story: `原因: ${errorText.substring(0, 100)}`
      };
    }

    const result = await response.json();
    if (result.error) {
       return { name: '後端錯誤', story: `原因: ${result.error}` };
    }

    return result.response;
    
  } catch (error: any) {
    return {
      name: `連線失敗`,
      story: `錯誤: ${error.message || error.toString()}`
    };
  }
};
