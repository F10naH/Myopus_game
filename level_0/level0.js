// --- Pine-tree silhouette generator ---
(function () {
  function mkRng(seed) {
    let s = (seed ^ 0xdeadbeef) >>> 0;
    return () => { s = (Math.imul(s, 0x9e3779b9) + 0x6b3a9d4f) >>> 0; return s / 0x100000000; };
  }

  function treePts(lx, apx, apy, rx, baseY, steps, rng) {
    const h  = baseY - apy;
    const hw = (rx - lx) / 2;
    const p  = [`${lx},${baseY}`];

    for (let i = 1; i < steps; i++) {
      const t  = i / steps;
      const y  = baseY - t * h;
      const xs = lx + t * (apx - lx);
      const w  = hw * (1 - t);
      const dx = i % 2 === 1
        ? -w * (0.09 + rng() * 0.09)
        :  w * (0.04 + rng() * 0.05);
      p.push(`${(xs + dx).toFixed(1)},${y.toFixed(1)}`);
    }

    p.push(`${apx},${apy}`);

    for (let i = steps - 1; i >= 1; i--) {
      const t  = i / steps;
      const y  = baseY - t * h;
      const xs = rx - t * (rx - apx);
      const w  = hw * (1 - t);
      const dx = i % 2 === 1
        ?  w * (0.09 + rng() * 0.09)
        : -w * (0.04 + rng() * 0.05);
      p.push(`${(xs + dx).toFixed(1)},${y.toFixed(1)}`);
    }

    p.push(`${rx},${baseY}`);
    return p.join(' ');
  }

  function poly(pts, fill) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    el.setAttribute('points', pts);
    el.setAttribute('fill', fill);
    return el;
  }

  const rng = mkRng(7);

  const backData = [
    [40,100,360,160,"#4a6e52"],[170,215,400,260,"#3d6045"],[270,325,310,380,"#4a6e52"],
    [390,445,380,500,"#3d6045"],[510,575,290,640,"#4a6e52"],[650,695,400,740,"#3d6045"],
    [770,835,320,900,"#4a6e52"],[910,965,360,1020,"#3d6045"],[1040,1095,290,1150,"#4a6e52"],
    [1170,1225,380,1280,"#3d6045"],[1295,1350,330,1405,"#4a6e52"],[1415,1470,400,1525,"#3d6045"],
    [1535,1580,360,1625,"#4a6e52"],
  ];
  const backG = document.getElementById('back-trees');
  backData.forEach(([lx,apx,apy,rx,fill]) =>
    backG.appendChild(poly(treePts(lx,apx,apy,rx,600,6,rng), fill)));

  const midData = [
    [-20,50,260,120,"#1e3d28"],[110,180,180,250,"#1a3d30"],[230,290,310,350,"#1e3d28"],
    [330,410,160,490,"#163525"],[470,530,300,590,"#1e3d28"],[570,650,140,730,"#1a3d30"],
    [710,780,250,850,"#1e3d28"],[830,900,180,970,"#163525"],[950,1020,310,1090,"#1e3d28"],
    [1070,1150,170,1230,"#1a3d30"],[1210,1280,260,1350,"#1e3d28"],[1330,1410,200,1490,"#163525"],
    [1470,1530,290,1590,"#1e3d28"],[1570,1640,210,1710,"#1a3d30"],
  ];
  const midG = document.getElementById('mid-trees');
  midData.forEach(([lx,apx,apy,rx,fill]) =>
    midG.appendChild(poly(treePts(lx,apx,apy,rx,600,7,rng), fill)));

  const frontData = [
    [-40,30,170,100,"#0d2218"],[70,145,110,220,"#162e1c"],[200,260,240,320,"#0d2218"],
    [300,380,160,460,"#0f2015"],[440,520,90,600,"#0d2218"],[580,645,230,710,"#162e1c"],
    [690,770,130,850,"#0d2218"],[830,900,200,970,"#0f2015"],[950,1030,110,1110,"#0d2218"],
    [1090,1170,190,1250,"#162e1c"],[1230,1300,250,1370,"#0d2218"],[1350,1430,130,1510,"#0f2015"],
    [1490,1560,190,1630,"#0d2218"],[1610,1685,170,1760,"#162e1c"],
  ];
  const frontG = document.getElementById('front-trees');
  frontData.forEach(([lx,apx,apy,rx,fill]) =>
    frontG.appendChild(poly(treePts(lx,apx,apy,rx,600,9,rng), fill)));
})();

// --- Slideshow Logic ---
const slides = [
  "images/flower.png",
  "images/justmarried.png",
  "images/alert.png",
  "images/mossplus.png",
  "images/tearful.png",
  "images/lightbulb.png",
];

let currentSlide = 0;

const startWorld = document.getElementById("start-world");
const titleScreen = document.getElementById("titleScreen");
const slideshowContainer = document.getElementById("slideshow-container");
const slideImg = document.getElementById("slide-img");
const leftArrow = document.getElementById("left-arrow");
const rightArrow = document.getElementById("right-arrow");
const bgMusic = document.getElementById("bg-music");

function createOverlay() {
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.backgroundColor = "black";
  overlay.style.opacity = "0";
  overlay.style.transition = "opacity 1.5s ease-in-out";
  overlay.style.zIndex = "9999";
  overlay.style.pointerEvents = "all";
  return overlay;
}

window.startSlideshow = function() {
  console.log("Start button clicked!"); 

  const overlay = createOverlay();
  document.body.appendChild(overlay);
  
  void overlay.offsetWidth;
  overlay.style.opacity = "1";

  setTimeout(() => {
    console.log("Faded to black, switching scenes...");
    startWorld.style.display = "none";
    titleScreen.style.display = "none";
    
    slideshowContainer.style.display = "flex";
    updateSlide();
    
    // Safely attempt to play music, catch and log if it fails
    bgMusic.play().catch(e => console.warn("Audio play failed:", e));

    overlay.style.opacity = "0";
    setTimeout(() => {
      overlay.remove();
    }, 1500);
  }, 1500);
};

function updateSlide() {
  slideImg.src = slides[currentSlide];
  leftArrow.style.display = currentSlide === 0 ? "none" : "block";
}

leftArrow.addEventListener("click", () => {
  if (currentSlide > 0) {
    currentSlide--;
    updateSlide();
  }
});

rightArrow.addEventListener("click", () => {
  if (currentSlide < slides.length - 1) {
    currentSlide++;
    updateSlide();
  } else {
    transitionToLevel1();
  }
});

function transitionToLevel1() {
  const overlay = createOverlay();
  document.body.appendChild(overlay);
  
  void overlay.offsetWidth;
  overlay.style.opacity = "1";

  const fadeAudio = setInterval(() => {
    if (bgMusic.volume > 0.1) {
      bgMusic.volume -= 0.1;
    } else {
      clearInterval(fadeAudio);
      bgMusic.pause();
    }
  }, 150);

  setTimeout(() => {
    window.location.href = "../level_1/level1.html"; 
  }, 1500);
}