// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(function(a) {
  a.addEventListener('click', function(e) {
    var id = a.getAttribute('href').slice(1);
    if (!id) return;
    var el = document.getElementById(id);
    if (el) {
      e.preventDefault();
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
    }
  });
});

// Hamburger menu
var hamburger = document.querySelector('.hamburger');
var mobileMenu = document.querySelector('.mobile-menu');
hamburger.addEventListener('click', function() {
  hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open');
});
mobileMenu.querySelectorAll('a').forEach(function(a) {
  a.addEventListener('click', function() {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
  });
});

// Header scroll state
var siteHeader = document.getElementById('site-header');
function updateHeader() {
  if (window.scrollY > 60) {
    siteHeader.classList.add('scrolled');
  } else {
    siteHeader.classList.remove('scrolled');
  }
}
window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();

// Hero parallax
var heroSlider = document.getElementById('hero-slider');
if (heroSlider && !window.matchMedia('(prefers-reduced-motion:reduce)').matches) {
  window.addEventListener('scroll', function() {
    var scrollY = window.scrollY;
    if (scrollY < window.innerHeight * 1.5) {
      heroSlider.style.transform = 'translateY(' + (scrollY * 0.28) + 'px)';
    }
  }, { passive: true });
}

// Hero slideshow
var heroSlides = document.querySelectorAll('.hero-slide');
if (heroSlides.length > 1 && !window.matchMedia('(prefers-reduced-motion:reduce)').matches) {
  var currentSlide = 0;

  function applyZoom(slide) {
    slide.style.animation = 'none';
    void slide.offsetWidth;
    slide.style.animation = 'heroZoomOut 6s ease-out forwards';
  }

  function scheduleNext(slide) {
    if (slide.tagName === 'VIDEO') {
      slide.addEventListener('ended', switchSlide, { once: true });
    } else {
      setTimeout(switchSlide, 5000);
    }
  }

  function switchSlide() {
    heroSlides[currentSlide].style.opacity = '0';
    if (heroSlides[currentSlide].tagName === 'VIDEO') {
      heroSlides[currentSlide].pause();
    }
    currentSlide = (currentSlide + 1) % heroSlides.length;
    heroSlides[currentSlide].style.opacity = '1';
    if (heroSlides[currentSlide].tagName === 'VIDEO') {
      heroSlides[currentSlide].currentTime = 0;
      heroSlides[currentSlide].play();
    } else {
      applyZoom(heroSlides[currentSlide]);
    }
    scheduleNext(heroSlides[currentSlide]);
  }

  // 最初のスライド（動画）を再生して開始
  var firstSlide = heroSlides[0];
  firstSlide.play();
  scheduleNext(firstSlide);
}

// Scroll reveal (standard + left/right variants)
var revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
if ('IntersectionObserver' in window) {
  var revealObs = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach(function(el) { revealObs.observe(el); });
} else {
  revealEls.forEach(function(el) { el.classList.add('visible'); });
}

// News category filter
var newsFilterBtns = document.querySelectorAll('.news-filter-btn');
if (newsFilterBtns.length) {
  var newsRows = document.querySelectorAll('.news-row[data-cat]');
  newsFilterBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      newsFilterBtns.forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var filter = btn.getAttribute('data-filter');
      newsRows.forEach(function(row) {
        row.style.display = (filter === 'all' || row.getAttribute('data-cat') === filter) ? '' : 'none';
      });
    });
  });
}

// reCAPTCHA v3: 対象フォームがあるページでのみ読み込む（サイトキーは recaptcha-config.js）
function ensureRecaptchaLoaded(callback) {
  if (typeof window.grecaptcha !== 'undefined' && window.grecaptcha.execute) {
    window.grecaptcha.ready(callback);
    return;
  }
  var existing = document.getElementById('recaptcha-api-script');
  if (existing) {
    existing.addEventListener('load', function() { grecaptcha.ready(callback); });
    return;
  }
  var script = document.createElement('script');
  script.id = 'recaptcha-api-script';
  script.src = 'https://www.google.com/recaptcha/api.js?render=' + window.RECAPTCHA_SITE_KEY;
  script.onload = function() { grecaptcha.ready(callback); };
  document.head.appendChild(script);
}

function getRecaptchaToken(action) {
  return new Promise(function(resolve, reject) {
    if (!window.RECAPTCHA_SITE_KEY) { reject(new Error('RECAPTCHA_SITE_KEY is not set')); return; }
    ensureRecaptchaLoaded(function() {
      window.grecaptcha.execute(window.RECAPTCHA_SITE_KEY, { action: action }).then(resolve, reject);
    });
  });
}

// フォーム送信共通処理：バリデーション → reCAPTCHA v3 トークン取得 → fetch 送信
function submitProtectedForm(form, recaptchaAction) {
  var idPrefix = form.id.replace(/-form$/, '');
  var submitBtn = form.querySelector('.form-submit-btn');
  var submitLabel = form.querySelector('.form-submit-label');
  var originalLabel = submitLabel ? submitLabel.textContent : '';
  var errorBox = document.getElementById(idPrefix + '-error');
  var errorText = document.getElementById(idPrefix + '-error-text');
  var successBox = document.getElementById(idPrefix + '-success');
  var tokenField = form.querySelector('[name="recaptcha_token"]');
  var formTsField = form.querySelector('[name="form_ts"]');

  if (formTsField) { formTsField.value = String(Date.now()); }
  ensureRecaptchaLoaded(function() {}); // 事前読み込み（送信時の待ち時間を減らす）

  function showError(message) {
    if (!errorBox) return;
    if (errorText) errorText.textContent = message;
    errorBox.style.display = 'flex';
    errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (errorBox) errorBox.style.display = 'none';
    if (submitBtn) submitBtn.disabled = true;
    if (submitLabel) submitLabel.textContent = '送信中…';

    getRecaptchaToken(recaptchaAction)
      .then(function(token) {
        if (tokenField) tokenField.value = token;
        return fetch(form.getAttribute('action'), {
          method: 'POST',
          body: new FormData(form),
          headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
      })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data && data.success) {
          form.style.display = 'none';
          if (successBox) {
            successBox.classList.add('visible');
            successBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        } else {
          showError((data && data.message) || '送信に失敗しました。時間をおいて再度お試しいただくか、お電話にてお問い合わせください。');
        }
      })
      .catch(function() {
        showError('通信エラーが発生しました。時間をおいて再度お試しいただくか、お電話にてお問い合わせください。');
      })
      .finally(function() {
        if (submitBtn) submitBtn.disabled = false;
        if (submitLabel) submitLabel.textContent = originalLabel;
      });
  });
}

// Reservation form: chip / radio toggle styling + submit
var yoyakuForm = document.getElementById('yoyaku-form');
if (yoyakuForm) {
  document.querySelectorAll('.variety-chip input, .form-radio input').forEach(function(input) {
    var sync = function() {
      var group = input.closest('.variety-chip') ? '.variety-chip' : '.form-radio';
      if (group === '.form-radio') {
        document.querySelectorAll('input[name="' + input.name + '"]').forEach(function(sibling) {
          sibling.closest('.form-radio').classList.toggle('checked', sibling.checked);
        });
      } else {
        input.closest('.variety-chip').classList.toggle('checked', input.checked);
      }
    };
    input.addEventListener('change', sync);
  });

  submitProtectedForm(yoyakuForm, 'yoyaku');
}

// Contact form: radio toggle styling + submit
var contactForm = document.getElementById('contact-form');
if (contactForm) {
  document.querySelectorAll('#contact-form .form-radio input').forEach(function(input) {
    input.addEventListener('change', function() {
      document.querySelectorAll('input[name="' + input.name + '"]').forEach(function(sibling) {
        sibling.closest('.form-radio').classList.toggle('checked', sibling.checked);
      });
    });
  });

  submitProtectedForm(contactForm, 'contact');
}

// Harvest calendar bar animation
var hcalInner = document.querySelector('.hcal-inner');
if (hcalInner) {
  document.querySelectorAll('.hcal-bar').forEach(function(bar, i) {
    bar.style.transitionDelay = (0.05 + i * 0.07) + 's';
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function(entries) {
      if (entries[0].isIntersecting) {
        hcalInner.classList.add('hcal-animated');
      }
    }, { threshold: 0.1 }).observe(hcalInner);
  } else {
    hcalInner.classList.add('hcal-animated');
  }
}
