const API_URL = 'https://script.google.com/macros/s/AKfycbz-xM0ggbs882SpPIP7CchkUiWC78Mk9X7v1j5fLQd2HLbmiUqgMYrkPwOV37lsmbh04Q/exec';

function publicApi(action, params = {}) {
  return new Promise((resolve, reject) => {
    const callbackName =
      'slowdazeCallback_' +
      Date.now() +
      '_' +
      Math.random().toString(36).slice(2);

    const query = new URLSearchParams({
      api: '1',
      action,
      ...params,
      callback: callbackName
    });

    const script = document.createElement('script');
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('API ตอบกลับช้าเกินไป'));
    }, 15000);

    function cleanup() {
      clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    }

    window[callbackName] = data => {
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error('เชื่อมต่อ API ไม่สำเร็จ'));
    };

    script.src = API_URL + '?' + query.toString();
    document.body.appendChild(script);
  });
}

// ทดสอบอ่านข้อมูลสาธารณะ
publicApi('publicData')
  .then(data => console.log('ข้อมูลเว็บ:', data))
  .catch(error => console.error(error));
