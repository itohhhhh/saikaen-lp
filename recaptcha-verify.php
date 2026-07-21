<?php
/**
 * Google reCAPTCHA v3 のトークン検証
 */

declare(strict_types=1);

function verify_recaptcha(string $token, string $expectedAction, string $secretKey, float $minScore = 0.5): bool
{
    if ($token === '' || $secretKey === '' || $secretKey === 'YOUR_RECAPTCHA_SECRET_KEY') {
        return false;
    }

    $params = http_build_query([
        'secret'   => $secretKey,
        'response' => $token,
        'remoteip' => $_SERVER['REMOTE_ADDR'] ?? '',
    ]);

    $result = false;

    if (function_exists('curl_init')) {
        $ch = curl_init('https://www.google.com/recaptcha/api/siteverify');
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $params,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 5,
        ]);
        $result = curl_exec($ch);
        curl_close($ch);
    }

    if ($result === false) {
        $context = stream_context_create([
            'http' => [
                'method'  => 'POST',
                'header'  => 'Content-Type: application/x-www-form-urlencoded',
                'content' => $params,
                'timeout' => 5,
            ],
        ]);
        $result = @file_get_contents('https://www.google.com/recaptcha/api/siteverify', false, $context);
    }

    if ($result === false || $result === null) {
        return false;
    }

    $data = json_decode((string)$result, true);

    if (!is_array($data) || empty($data['success'])) {
        return false;
    }

    if (($data['action'] ?? '') !== $expectedAction) {
        return false;
    }

    if ((float)($data['score'] ?? 0) < $minScore) {
        return false;
    }

    return true;
}
