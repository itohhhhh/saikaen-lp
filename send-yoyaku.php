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
const MAIL_TO       = 'ito_shunichi@icloud.com';
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

$name      = trim((string)($_POST['name'] ?? ''));
$kana      = trim((string)($_POST['kana'] ?? ''));
$tel       = trim((string)($_POST['tel'] ?? ''));
$email     = trim((string)($_POST['email'] ?? ''));
$postal    = trim((string)($_POST['postal'] ?? ''));
$address   = trim((string)($_POST['address'] ?? ''));
$variety   = trim((string)($_POST['variety'] ?? ''));
$boxSize   = trim((string)($_POST['box_size'] ?? ''));
$fruitSize = trim((string)($_POST['fruit_size'] ?? ''));
$method    = trim((string)($_POST['method'] ?? ''));
$payment   = trim((string)($_POST['payment'] ?? ''));
$remarks   = trim((string)($_POST['remarks'] ?? ''));
$agree     = (string)($_POST['agree'] ?? '');

// お届け先（最大3件、依頼主と異なる場合のみ入力）
$destNames     = array_slice((array)($_POST['dest_name'] ?? []), 0, 3);
$destTels      = array_slice((array)($_POST['dest_tel'] ?? []), 0, 3);
$destPostals   = array_slice((array)($_POST['dest_postal'] ?? []), 0, 3);
$destAddresses = array_slice((array)($_POST['dest_address'] ?? []), 0, 3);
$destinations  = [];
for ($i = 0; $i < 3; $i++) {
    $dn = trim((string)($destNames[$i] ?? ''));
    $dt = trim((string)($destTels[$i] ?? ''));
    $dp = trim((string)($destPostals[$i] ?? ''));
    $da = trim((string)($destAddresses[$i] ?? ''));
    if ($dn === '' && $dt === '' && $dp === '' && $da === '') {
        continue;
    }
    foreach ([$dn, $dt, $dp, $da] as $field) {
        if (preg_match('/[\r\n]/', $field)) {
            respond(false, '不正な入力が検出されました。');
        }
    }
    if (mb_strlen($dn) > 100 || mb_strlen($da) > 300) {
        respond(false, '入力内容が長すぎます。');
    }
    $destinations[] = ['name' => $dn, 'tel' => $dt, 'postal' => $dp, 'address' => $da];
}

$allowedVarieties  = ['幸水', '豊水', '二十世紀', '新星', 'あきづき', '涼豊', 'ラ・フランス', 'ル・レクチェ', 'ふじ'];
$allowedBoxSizes   = ['3kg', '5kg', '10kg', '15kg'];
$allowedFruitSizes = ['2L', '3L', '4L', '5L', '6L'];
$allowedMethods    = ['来園引き取り', '配送'];
$allowedPayments   = ['代金引換', '郵便払込', '銀行振込', '店頭でのお支払い'];

if ($name === '' || $tel === '' || $email === '' || $method === '' || $payment === '' || $agree === '') {
    respond(false, '必須項目が入力されていません。');
}

if ($variety !== '' && !in_array($variety, $allowedVarieties, true)) {
    respond(false, '不正な入力が検出されました。');
}

if ($boxSize !== '' && !in_array($boxSize, $allowedBoxSizes, true)) {
    respond(false, '不正な入力が検出されました。');
}

if ($fruitSize !== '' && !in_array($fruitSize, $allowedFruitSizes, true)) {
    respond(false, '不正な入力が検出されました。');
}

if (!in_array($method, $allowedMethods, true)) {
    respond(false, '不正な入力が検出されました。');
}

if (!in_array($payment, $allowedPayments, true)) {
    respond(false, '不正な入力が検出されました。');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'メールアドレスの形式が正しくありません。');
}

// ヘッダーインジェクション対策：改行を含む入力は拒否する
foreach ([$name, $kana, $tel, $email, $postal, $address, $variety, $boxSize, $fruitSize, $method, $payment] as $field) {
    if (preg_match('/[\r\n]/', $field)) {
        respond(false, '不正な入力が検出されました。');
    }
}

if (mb_strlen($name) > 100 || mb_strlen($address) > 300 || mb_strlen($remarks) > 4000) {
    respond(false, '入力内容が長すぎます。');
}

$subject = '【上の山彩果園】ご予約フォームより送信';

$destinationsText = '（依頼主と同じ／指定なし）';
if ($destinations) {
    $lines = [];
    foreach ($destinations as $i => $dest) {
        $lines[] = "  [お届け先" . ($i + 1) . "]"
            . " お名前: " . ($dest['name'] !== '' ? $dest['name'] : '（指定なし）')
            . " / 電話番号: " . ($dest['tel'] !== '' ? $dest['tel'] : '（指定なし）')
            . " / 郵便番号: " . ($dest['postal'] !== '' ? $dest['postal'] : '（指定なし）')
            . " / ご住所: " . ($dest['address'] !== '' ? $dest['address'] : '（指定なし）');
    }
    $destinationsText = "\n" . implode("\n", $lines);
}

$body = "ホームページの予約フォームより送信がありました。\n\n"
    . "お名前　　　　: {$name}\n"
    . "フリガナ　　　: {$kana}\n"
    . "電話番号　　　: {$tel}\n"
    . "メールアドレス: {$email}\n"
    . "郵便番号　　　: " . ($postal !== '' ? $postal : '（指定なし）') . "\n"
    . "ご住所　　　　: " . ($address !== '' ? $address : '（指定なし）') . "\n"
    . "ご希望の品種　: " . ($variety !== '' ? $variety : '（指定なし）') . "\n"
    . "ご希望の箱サイズ: " . ($boxSize !== '' ? $boxSize . '箱' : '（指定なし）') . "\n"
    . "ご希望の果実の大きさ: " . ($fruitSize !== '' ? $fruitSize : '（指定なし）') . "\n"
    . "お受け取り方法: {$method}\n"
    . "お届け先　　　: {$destinationsText}\n"
    . "お支払方法　　: {$payment}\n"
    . "\n--- 備考・ご要望 ---\n" . ($remarks !== '' ? $remarks : '（なし）') . "\n";

$headers = [
    'From: ' . mb_encode_mimeheader(MAIL_FROM_NAME) . ' <' . MAIL_FROM . '>',
    'Reply-To: ' . $email,
];

$sent = mb_send_mail(MAIL_TO, $subject, $body, implode("\r\n", $headers), '-f' . MAIL_FROM);

if ($sent) {
    respond(true, 'ご予約を受け付けました。');
}

respond(false, '送信に失敗しました。時間をおいて再度お試しいただくか、お電話にてお問い合わせください。');
