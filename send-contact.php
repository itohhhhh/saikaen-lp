<?php
/**
 * お問い合わせフォーム送信処理
 * contact.html の #contact-form から fetch() で POST される想定。
 */

declare(strict_types=1);

require __DIR__ . '/recaptcha-verify.php';

mb_language('Japanese');
mb_internal_encoding('UTF-8');

header('Content-Type: application/json; charset=utf-8');

// このフォームの送信先
const MAIL_TO      = 'ito_shunichi@icloud.com';
const MAIL_FROM     = 'no-reply@uenoyama-saikaen.com';
const MAIL_FROM_NAME = '上の山彩果園 ウェブサイト';

function respond(bool $success, string $message): void
{
    echo json_encode(['success' => $success, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    respond(false, '不正なリクエストです。');
}

// スパム対策①：ハニーポット（人には見えない項目。埋まっていればボットとみなし、
// 成功したように見せかけて静かに処理を終える）
if (trim((string)($_POST['website'] ?? '')) !== '') {
    respond(true, 'お問い合わせを受け付けました。');
}

// スパム対策②：フォーム表示から3秒未満での送信は自動入力ボットとみなす
$formTs = (int)($_POST['form_ts'] ?? 0);
$elapsedMs = $formTs > 0 ? (int)(microtime(true) * 1000) - $formTs : 0;
if ($formTs === 0 || $elapsedMs < 3000) {
    respond(true, 'お問い合わせを受け付けました。');
}

// スパム対策③：Google reCAPTCHA v3
$recaptchaConfig = require __DIR__ . '/recaptcha-config.php';
$recaptchaToken = (string)($_POST['recaptcha_token'] ?? '');
if (!verify_recaptcha($recaptchaToken, 'contact', $recaptchaConfig['secret_key'], (float)$recaptchaConfig['min_score'])) {
    respond(false, '不正な送信と判定されました。お手数ですが、時間をおいて再度お試しいただくか、お電話にてお問い合わせください。');
}

$name     = trim((string)($_POST['name'] ?? ''));
$kana     = trim((string)($_POST['kana'] ?? ''));
$tel      = trim((string)($_POST['tel'] ?? ''));
$email    = trim((string)($_POST['email'] ?? ''));
$category = trim((string)($_POST['category'] ?? ''));
$message  = trim((string)($_POST['message'] ?? ''));
$agree    = (string)($_POST['agree'] ?? '');

$allowedCategories = ['果物の購入について', 'ご予約について', 'ふるさと納税について', 'その他'];

if ($name === '' || $email === '' || $category === '' || $message === '' || $agree === '') {
    respond(false, '必須項目が入力されていません。');
}

if (!in_array($category, $allowedCategories, true)) {
    respond(false, '不正な入力が検出されました。');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'メールアドレスの形式が正しくありません。');
}

// ヘッダーインジェクション対策：改行を含む入力は拒否する
foreach ([$name, $kana, $tel, $email, $category] as $field) {
    if (preg_match('/[\r\n]/', $field)) {
        respond(false, '不正な入力が検出されました。');
    }
}

if (mb_strlen($name) > 100 || mb_strlen($message) > 4000) {
    respond(false, '入力内容が長すぎます。');
}

$subject = '【上の山彩果園】お問い合わせ（' . $category . '）';

$body = "ホームページのお問い合わせフォームより送信がありました。\n\n"
    . "お名前　　　　: {$name}\n"
    . "フリガナ　　　: {$kana}\n"
    . "電話番号　　　: {$tel}\n"
    . "メールアドレス: {$email}\n"
    . "種別　　　　　: {$category}\n"
    . "\n--- お問い合わせ内容 ---\n{$message}\n";

$headers = [
    'From: ' . mb_encode_mimeheader(MAIL_FROM_NAME) . ' <' . MAIL_FROM . '>',
    'Reply-To: ' . $email,
];

$sent = mb_send_mail(MAIL_TO, $subject, $body, implode("\r\n", $headers), '-f' . MAIL_FROM);

if ($sent) {
    respond(true, 'お問い合わせを受け付けました。');
}

respond(false, '送信に失敗しました。時間をおいて再度お試しいただくか、お電話にてお問い合わせください。');
