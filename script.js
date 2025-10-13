// LIFF設定
const LIFF_ID = "2008278807-WN3yGzDy";
const GAS_URL = "https://script.google.com/macros/s/AKfycbzj0Y12PJ4qrNvDk7rJRgXIToq4THDgGwtuSHKUYeXlV2JiOTSvIXcj9ss-thLXHbcdNw/exec";

let liffProfile = null;

document.addEventListener('DOMContentLoaded', function () {
    // LIFF初期化
    initializeLiff();

    // フォーム送信イベントの設定
    const form = document.getElementById('deliveryForm');
    form.addEventListener('submit', handleSubmit);
});

async function initializeLiff() {
    try {
        await liff.init({ liffId: LIFF_ID });

        if (liff.isLoggedIn()) {
            // ログイン済みの場合、プロフィール情報を取得
            liffProfile = await liff.getProfile();
            console.log('LIFF Profile:', liffProfile);

            // 名前フィールドに自動入力（任意）
            if (liffProfile.displayName) {
                document.getElementById('name').value = liffProfile.displayName;
            }
        } else {
            // 未ログインの場合、ログインを促す
            console.log('LIFF: Not logged in');
        }
    } catch (error) {
        console.error('LIFF initialization error:', error);
        showMessage('LINEミニアプリの初期化でエラーが発生しました', 'error');
    }
}

async function handleSubmit(event) {
    event.preventDefault();

    if (!validateForm()) {
        return;
    }

    const submitButton = document.querySelector('.submit-button');
    const buttonText = submitButton.querySelector('.button-text');

    // 送信中の表示
    submitButton.disabled = true;
    buttonText.innerHTML = '<span class="loading"></span>送信中...';

    try {
        const formData = new FormData(event.target);

        // チェックボックスの値を取得
        const services = [];
        document.querySelectorAll('input[name="services"]:checked').forEach(cb => {
            services.push(cb.value);
        });

        const data = {
            name: formData.get('name'),
            furigana: formData.get('furigana'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            company: formData.get('company'),
            area: formData.get('area'),
            services: services.join(', '),
            time: formData.get('time'),
            message: formData.get('message'),
            timestamp: new Date().toLocaleString('ja-JP'),
            // LIFF情報を追加
            lineUserId: liffProfile ? liffProfile.userId : '',
            lineDisplayName: liffProfile ? liffProfile.displayName : '',
            linePictureUrl: liffProfile ? liffProfile.pictureUrl : ''
        };

        const response = await fetch(GAS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.status === 'success') {
            showMessage('お問い合わせを受け付けました。担当者より追ってご連絡させていただきます。', 'success');
            event.target.reset();
        } else {
            throw new Error(result.message || 'エラーが発生しました');
        }

    } catch (error) {
        console.error('Error:', error);
        showMessage('送信エラーが発生しました。お手数ですが、再度お試しください。', 'error');
    } finally {
        // ボタンを元に戻す
        submitButton.disabled = false;
        buttonText.textContent = '送信する';
    }
}

function validateForm() {
    const requiredFields = ['name', 'furigana', 'email', 'phone', 'area'];
    let isValid = true;

    requiredFields.forEach(fieldName => {
        const field = document.getElementById(fieldName);
        if (!field.value.trim()) {
            field.style.borderColor = '#e74c3c';
            isValid = false;
        } else {
            field.style.borderColor = '#e1e5e9';
        }
    });

    // サービス選択のチェック
    const servicesChecked = document.querySelectorAll('input[name="services"]:checked').length > 0;
    if (!servicesChecked) {
        showMessage('ご希望のサービスを選択してください', 'error');
        isValid = false;
    }

    // メールアドレスの形式チェック
    const email = document.getElementById('email');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email.value && !emailRegex.test(email.value)) {
        email.style.borderColor = '#e74c3c';
        showMessage('メールアドレスの形式が正しくありません', 'error');
        isValid = false;
    }

    return isValid;
}

function showMessage(message, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';

    // スクロールしてメッセージを表示
    messageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // 5秒後に非表示（成功の場合）
    if (type === 'success') {
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
}

// 入力時のリアルタイムバリデーション
document.addEventListener('input', function (e) {
    if (e.target.matches('input[required], select[required]')) {
        if (e.target.value.trim()) {
            e.target.style.borderColor = '#e1e5e9';
        }
    }
});
