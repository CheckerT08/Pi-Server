export async function apiCall(url, method, data) {
  const options = {
    method: method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (data) options.body = JSON.stringify(data);
  const res = await fetch(url, options);
  if(!res.ok) throw new Error('API Error: ' + res.status);
  return res.json();
};
