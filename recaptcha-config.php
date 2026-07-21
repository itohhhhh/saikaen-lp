<?php
/**
 * Google reCAPTCHA v3 設定
 *
 * 1. https://www.google.com/recaptcha/admin/create にアクセスし、
 *    「reCAPTCHA v3」を選択してこのサイトのドメイン（uenoyama-saikaen.com）を登録してください。
 * 2. 発行された「サイトキー」を recaptcha-config.js の RECAPTCHA_SITE_KEY に設定してください。
 * 3. 発行された「シークレットキー」を下記の secret_key に設定してください。
 */

return [
    'secret_key' => '6Le18F0tAAAAALvnPjDsy3_r0Yf0kguljcUDCfwP',
    // スコアがこの値未満の送信はボットとみなして拒否します（0.0〜1.0、低いほど寛容）
    'min_score'  => 0.5,
];
