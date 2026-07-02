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
