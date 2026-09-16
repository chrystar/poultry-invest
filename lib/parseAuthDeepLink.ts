// Supabase auth redirect links carry tokens either after a '#' or a '?' —
// this handles both so we don't care which flow Supabase used.
export function parseAuthParams(url: string) {
    const hashIndex = url.indexOf('#');
    const queryIndex = url.indexOf('?');
    let paramsString = '';
  
    if (hashIndex !== -1) {
      paramsString = url.substring(hashIndex + 1);
    } else if (queryIndex !== -1) {
      paramsString = url.substring(queryIndex + 1);
    }
  
    const params = new URLSearchParams(paramsString);
    return {
      access_token: params.get('access_token'),
      refresh_token: params.get('refresh_token'),
      type: params.get('type'),
      error: params.get('error_description'),
    };
  }