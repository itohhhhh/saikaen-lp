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

// Reservation form: chip / radio toggle styling + placeholder submit
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

  yoyakuForm.addEventListener('submit', function(e) {
    e.preventDefault();
    if (!yoyakuForm.checkValidity()) {
      yoyakuForm.reportValidity();
      return;
    }
    yoyakuForm.style.display = 'none';
    document.getElementById('yoyaku-success').classList.add('visible');
    document.getElementById('yoyaku-success').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

// Contact form: radio toggle styling + placeholder submit
var contactForm = document.getElementById('contact-form');
if (contactForm) {
  document.querySelectorAll('#contact-form .form-radio input').forEach(function(input) {
    input.addEventListener('change', function() {
      document.querySelectorAll('input[name="' + input.name + '"]').forEach(function(sibling) {
        sibling.closest('.form-radio').classList.toggle('checked', sibling.checked);
      });
    });
  });

  contactForm.addEventListener('submit', function(e) {
    e.preventDefault();
    if (!contactForm.checkValidity()) {
      contactForm.reportValidity();
      return;
    }
    contactForm.style.display = 'none';
    document.getElementById('contact-success').classList.add('visible');
    document.getElementById('contact-success').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
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
