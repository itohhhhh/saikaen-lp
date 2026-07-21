<?php
/**
 * 予約フォーム送信処理
 * yoyaku.html の #yoyaku-form から fetch() で POST される想定。
 */

declare(strict_types=1);

require __DIR__ . '/recaptcha-verify.php';

mb_language('Japanese');
mb_internal_encoding('UTF-8');

header('Content-Type: application/json; charset=utf-8');

// このフォームの送信先
const MAIL_TO       = 'uenoyama.saikaen@gmail.com';
const MAIL_FROM      = 'no-reply@uenoyama-saikaen.com';
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
    respond(true, 'ご予約を受け付けました。');
}

// スパム対策②：フォーム表示から3秒未満での送信は自動入力ボットとみなす
$formTs = (int)($_POST['form_ts'] ?? 0);
$elapsedMs = $formTs > 0 ? (int)(microtime(true) * 1000) - $formTs : 0;
if ($formTs === 0 || $elapsedMs < 3000) {
    respond(true, 'ご予約を受け付けました。');
}

// スパム対策③：Google reCAPTCHA v3
$recaptchaConfig = require __DIR__ . '/recaptcha-config.php';
$recaptchaToken = (string)($_POST['recaptcha_token'] ?? '');
if (!verify_recaptcha($recaptchaToken, 'yoyaku', $recaptchaConfig['secret_key'], (float)$recaptchaConfig['min_score'])) {
    respond(false, '不正な送信と判定されました。お手数ですが、時間をおいて再度お試しいただくか、お電話にてお問い合わせください。');
}

$name     = trim((string)($_POST['name'] ?? ''));
$kana     = trim((string)($_POST['kana'] ?? ''));
$tel      = trim((string)($_POST['tel'] ?? ''));
$email    = trim((string)($_POST['email'] ?? ''));
$quantity = trim((string)($_POST['quantity'] ?? ''));
$method   = trim((string)($_POST['method'] ?? ''));
$address  = trim((string)($_POST['address'] ?? ''));
$date     = trim((string)($_POST['date'] ?? ''));
$remarks  = trim((string)($_POST['remarks'] ?? ''));
$agree    = (string)($_POST['agree'] ?? '');

$varietyInput = $_POST['variety'] ?? [];
$varietyInput = is_array($varietyInput) ? $varietyInput : [$varietyInput];
$allowedVarieties = ['幸水', '豊水', '二十世紀', '新星', 'あきづき', '涼豊', 'ラ・フランス', 'ル・レクチェ', 'ふじ'];
$variety = array_values(array_intersect($allowedVarieties, array_map('strval', $varietyInput)));

$allowedMethods = ['来園引き取り', '配送'];

if ($name === '' || $tel === '' || $email === '' || $method === '' || $agree === '') {
    respond(false, '必須項目が入力されていません。');
}

if (!in_array($method, $allowedMethods, true)) {
    respond(false, '不正な入力が検出されました。');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'メールアドレスの形式が正しくありません。');
}

// ヘッダーインジェクション対策：改行を含む入力は拒否する
foreach ([$name, $kana, $tel, $email, $quantity, $method, $date] as $field) {
    if (preg_match('/[\r\n]/', $field)) {
        respond(false, '不正な入力が検出されました。');
    }
}

if (mb_strlen($name) > 100 || mb_strlen($address) > 300 || mb_strlen($remarks) > 4000) {
    respond(false, '入力内容が長すぎます。');
}

$subject = '【上の山彩果園】ご予約フォームより送信';

$body = "ホームページの予約フォームより送信がありました。\n\n"
    . "お名前　　　　: {$name}\n"
    . "フリガナ　　　: {$kana}\n"
    . "電話番号　　　: {$tel}\n"
    . "メールアドレス: {$email}\n"
    . "ご希望の品種　: " . ($variety ? implode('、', $variety) : '（指定なし）') . "\n"
    . "ご希望数量　　: " . ($quantity !== '' ? $quantity : '（指定なし）') . "\n"
    . "お受け取り方法: {$method}\n"
    . "お届け先住所　: " . ($address !== '' ? $address : '（指定なし）') . "\n"
    . "ご希望日　　　: " . ($date !== '' ? $date : '（指定なし）') . "\n"
    . "\n--- 備考・ご要望 ---\n" . ($remarks !== '' ? $remarks : '（なし）') . "\n";

$headers = [
    'From: ' . mb_encode_mimeheader(MAIL_FROM_NAME) . ' <' . MAIL_FROM . '>',
    'Reply-To: ' . $email,
];

$sent = mb_send_mail(MAIL_TO, $subject, $body, implode("\r\n", $headers));

if ($sent) {
    respond(true, 'ご予約を受け付けました。');
}

respond(false, '送信に失敗しました。時間をおいて再度お試しいただくか、お電話にてお問い合わせください。');
