type PushMessage = {
    to: string;
    title: string;
    body: string;
    data?: Record<string, any>;
  };
  
  export async function sendPushNotifications(messages: PushMessage[]) {
    if (messages.length === 0) return;
  
    const chunks: PushMessage[][] = [];
    for (let i = 0; i < messages.length; i += 100) {
      chunks.push(messages.slice(i, i + 100));
    }
  
    for (const chunk of chunks) {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chunk),
      });
    }
  }