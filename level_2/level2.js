/*
========================================
LEVEL 2: THE WILD THRESHOLD
Text Adventure Core Script
========================================
*/

const BACKDROP_IMAGES = {
  owl: "images/tyto-owl.jpg",
  marsh: "images/marsh.jpg"
};

/** Vertical position of the photo layer (second value). Tweak if the crop feels wrong. */
const OWL_BACKDROP_POSITION = "center 28%";

/**
 * Photo width as % of viewport; height is auto (keeps aspect ratio).
 * Larger = more zoomed out. Letterboxing uses the backdrop color.
 */
const OWL_BACKDROP_ZOOM = "50%";
const MARSH_BACKDROP_ZOOM = "128%";

/** 0 = invisible, 1 = full. Only affects the photo layer, not the gradients on top. */
const OWL_PHOTO_OPACITY = 0.88;
const MARSH_PHOTO_OPACITY = 0.88;

/** Fade-in duration for the photo (also sets --scene-photo-fade-duration on :root). */
const BACKDROP_PHOTO_FADE_SEC = 2;

if (typeof document !== "undefined") {
  document.documentElement.style.setProperty(
    "--scene-photo-fade-duration",
    `${BACKDROP_PHOTO_FADE_SEC}s`
  );
}

let lastBackdropImageKey = "";
let lastPhotoOpacity = 0;

let activePuzzleFinish = null;
let activePuzzleMessageListener = null;

function setSkipPuzzleButtonVisible(visible) {
  const btn = document.getElementById("skipPuzzleTestBtn");
  if (btn) btn.hidden = !visible;
}

function forceClosePuzzleIframe() {
  if (activePuzzleMessageListener) {
    window.removeEventListener("message", activePuzzleMessageListener);
    activePuzzleMessageListener = null;
  }
  activePuzzleFinish = null;
  setSkipPuzzleButtonVisible(false);
  const frame = document.getElementById("gameFrame");
  const storyPanel = document.getElementById("storyPanel");
  if (frame) {
    frame.style.display = "none";
    frame.src = "about:blank";
  }
  if (storyPanel) storyPanel.style.display = "block";
}

let levelState = {
  currentScene: "forest_entry",
  tytoPuzzleComplete: false,
  marshPuzzleComplete: false
};

function setScene(scene) {
  levelState.currentScene = scene;
  renderScene();
}

function applySceneBackdrop(sceneId) {
  const root = document.documentElement;
  const owlScenes = ["tyto_meeting", "tyto_challenge", "tyto_reward"];
  const marshScenes = ["marsh_entry", "ending"];

  const gradients = {
    forest: `linear-gradient(
        165deg,
        rgba(14, 20, 16, 0.92) 0%,
        rgba(22, 32, 26, 0.88) 45%,
        rgba(10, 14, 12, 0.95) 100%
      )`,
    owl: `linear-gradient(
        155deg,
        rgba(8, 10, 16, 0.78) 0%,
        rgba(14, 16, 22, 0.55) 38%,
        rgba(6, 8, 12, 0.88) 100%
      )`,
    marsh: `linear-gradient(
        180deg,
        rgba(6, 14, 22, 0.85) 0%,
        rgba(10, 22, 30, 0.72) 42%,
        rgba(4, 10, 16, 0.92) 100%
      )`
  };

  let image = "none";
  let gradient = gradients.forest;
  let imgPosition = "center center";
  let imgSize = "cover";
  let photoOpacity = 0;

  if (owlScenes.includes(sceneId)) {
    image = `url("${BACKDROP_IMAGES.owl}")`;
    gradient = gradients.owl;
    imgPosition = OWL_BACKDROP_POSITION;
    imgSize = OWL_BACKDROP_ZOOM;
    photoOpacity = OWL_PHOTO_OPACITY;
  } else if (marshScenes.includes(sceneId)) {
    image = `url("${BACKDROP_IMAGES.marsh}")`;
    gradient = gradients.marsh;
    imgSize = MARSH_BACKDROP_ZOOM;
    photoOpacity = MARSH_PHOTO_OPACITY;
  }

  root.style.setProperty("--scene-bg-image", image);
  root.style.setProperty("--scene-bg-gradient", gradient);
  root.style.setProperty("--scene-img-position", imgPosition);
  root.style.setProperty("--scene-img-size", imgSize);

  const photoEl = document.querySelector(".scene-backdrop-photo");
  const imageKey = image;
  const sameImage = imageKey === lastBackdropImageKey;
  const hadPhoto = lastPhotoOpacity > 0;

  if (photoOpacity <= 0) {
    if (photoEl) {
      photoEl.classList.add("scene-backdrop-photo--no-transition");
      root.style.setProperty("--scene-photo-opacity", "0");
      void photoEl.offsetHeight;
      photoEl.classList.remove("scene-backdrop-photo--no-transition");
    } else {
      root.style.setProperty("--scene-photo-opacity", "0");
    }
    lastBackdropImageKey = imageKey;
    lastPhotoOpacity = 0;
    return;
  }

  const needsFadeIn = !sameImage || !hadPhoto;

  if (needsFadeIn && photoEl) {
    photoEl.classList.add("scene-backdrop-photo--no-transition");
    root.style.setProperty("--scene-photo-opacity", "0");
    void photoEl.offsetHeight;
    photoEl.classList.remove("scene-backdrop-photo--no-transition");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        root.style.setProperty("--scene-photo-opacity", String(photoOpacity));
      });
    });
  } else {
    root.style.setProperty("--scene-photo-opacity", String(photoOpacity));
  }

  lastBackdropImageKey = imageKey;
  lastPhotoOpacity = photoOpacity;
}

function renderScene() {
  applySceneBackdrop(levelState.currentScene);
  switch (levelState.currentScene) {
    case "forest_entry":
      showText(
        `
          The forest thins. The birch trunks give way to ancient, resinous pines whose roots curl above the earth like gnarled fingers. It is quiet here, and the smell here is sharp and old: pine sap, decay, and something herbal.

          Somewhere above, something large shifts its weight. A pair of amber eyes blinks slowly from a branch twenty times your height. 

        `,
        [{ text: "Approach the eyes", action: () => setScene("tyto_meeting") }]
      );
      break;

    case "tyto_meeting":
      showText(
        `
          TYTO:
          "You are far from your roots, small one. I can count the days left in your eyes. Not many. You carry urgency like a stone in your chest. It will exhaust you before the journey does."

          MYOPUS:
          "I need to reach the sacred land. My partner is ill. The golden moss–"

          TYTO:
          "Yes. The glowing one. I’ve seen it before it became a legend. But the marsh stands between you and it, and the marsh does not care for urgency."
        `,
        [{ text: "Ask how to cross the marsh", action: () => setScene("tyto_challenge") }]
      );
      break;

    case "tyto_challenge":
      showText(
        `
          TYTO:
          "I can tell you something more useful than a path. I can give you what you need to take with you. But first, I am old and I do not speak freely. I speak in exchange."

          "Organize my pellets. I have kept these in order for eleven seasons, but now my mind cannot comprehend such a task." 
          
          "I want them moved, intact, to the rightmost root. The pellets must be stacked from the largest at the bottom and the smallest on top on the new root. You may only carry one at a time. You may never place a larger one atop a smaller lest you break my precious pellets. Do this, and I will give you what you need."
        `,
        [{ text: "Begin Tyto's puzzle", action: startTytoPuzzle }]
      );
      break;

    case "tyto_reward":
      showText(
        `
          TYTO:
          "You are small, but no less intelligent than a larger being like me. You may have my boat to cross the march. It will hold you long enough. Consider it a parting gift."

          You accept the boat without looking back.

          The marsh waits.
        `,
        [{ text: "Enter the marsh", action: () => setScene("marsh_entry") }]
      );
      break;

    case "marsh_entry":
      showText(
        `
          The trees end abruptly, as if they agreed not to go further. 

          Before you: black water, still as glass.
          Something drifts beneath the surface.

          Far across the water, perhaps forty body-lengths, the land resumes.

        `,
        [{ text: "Use the wooden boat", action: startMarshPuzzle }]
      );
      break;

    case "ending":
      showText(
        `
          You reach the far shore.

          The scent of pine smoke lingers behind you.

          Beyond the black water, the land rises into rows of stunted trees—an orchard laid out in rigid lines, as if humans had shaped the world and then walked away.

          The journey continues...
        `,
        [
          {
            text: "Proceed to Chapter 3",
            action: () => {
              window.location.href = "../level_3/level3.html";
            },
          },
        ]
      );
      break;
  }
}

/**
 * Wraps “golden moss” in a glowing span; skips matches already inside a <span> tag.
 */
function spanDepthAt(html, index) {
  const slice = html.slice(0, index);
  let depth = 0;
  const re = /<\/?span\b[^>]*>/gi;
  let m;
  while ((m = re.exec(slice)) !== null) {
    if (m[0].startsWith("</")) depth--;
    else depth++;
    if (depth < 0) depth = 0;
  }
  return depth;
}

function highlightGoldenMoss(html) {
  if (!html || typeof html !== "string") return html;
  return html.replace(/\bgolden\s+moss\b/gi, (match, offset) => {
    if (spanDepthAt(html, offset) > 0) return match;
    return `<span class="golden-moss">${match}</span>`;
  });
}

/**
 * Strips shared leading indentation from story template literals so you can
 * indent blocks in source without changing how the text appears on screen.
 */
function normalizeStoryText(raw) {
  if (!raw) return "";
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const first = lines.findIndex((l) => l.trim());
  const last = lines.length - 1 - [...lines].reverse().findIndex((l) => l.trim());
  if (first === -1) return "";
  const body = lines.slice(first, last + 1);
  const nonempty = body.filter((l) => l.trim());
  const min = Math.min(
    ...nonempty.map((l) => {
      const m = l.match(/^[ \t]*/);
      return m ? m[0].length : 0;
    })
  );
  return body
    .map((l) => (l.trim() ? l.slice(min) : ""))
    .join("\n")
    .replace(/\n+$/, "");
}

function showText(text, options = []) {
  const container = document.getElementById("adventureBox");
  if (!container) return;

  const body = highlightGoldenMoss(normalizeStoryText(text));
  let html = `<div class="story-text">${body}</div>`;
  options.forEach((opt, i) => {
    html += `<button type="button" data-opt-index="${i}">${opt.text}</button>`;
  });
  container.innerHTML = html;

  container.querySelectorAll("button[data-opt-index]").forEach((btn) => {
    const idx = parseInt(btn.getAttribute("data-opt-index"), 10);
    btn.addEventListener("click", () => options[idx].action());
  });
}

function startTytoPuzzle() {
  launchTytoGame(() => {
    levelState.tytoPuzzleComplete = true;
    setScene("tyto_reward");
  });
}

function startMarshPuzzle() {
  launchMarshGame(() => {
    levelState.marshPuzzleComplete = true;
    setScene("ending");
  });
}

function launchTytoGame(onComplete) {
  const storyPanel = document.getElementById("storyPanel");
  const frame = document.getElementById("gameFrame");
  if (!frame || !storyPanel) {
    setTimeout(onComplete, 500);
    return;
  }
  const box = document.getElementById("adventureBox");
  if (box) box.innerHTML = "";
  storyPanel.style.display = "none";
  frame.style.display = "block";
  frame.src = "hanoi.html";

  let finished = false;
  function finish() {
    if (finished) return;
    finished = true;
    if (activePuzzleMessageListener === tytoListener) {
      window.removeEventListener("message", tytoListener);
      activePuzzleMessageListener = null;
    }
    activePuzzleFinish = null;
    setSkipPuzzleButtonVisible(false);
    frame.style.display = "none";
    storyPanel.style.display = "block";
    frame.src = "about:blank";
    onComplete();
  }

  function tytoListener(e) {
    if (e.data !== "TYTO_COMPLETE") return;
    finish();
  }

  activePuzzleMessageListener = tytoListener;
  activePuzzleFinish = finish;
  setSkipPuzzleButtonVisible(true);
  window.addEventListener("message", tytoListener);
}

function launchMarshGame(onComplete) {
  const storyPanel = document.getElementById("storyPanel");
  const frame = document.getElementById("gameFrame");
  if (!frame || !storyPanel) {
    setTimeout(onComplete, 500);
    return;
  }
  const box = document.getElementById("adventureBox");
  if (box) box.innerHTML = "";
  storyPanel.style.display = "none";
  frame.style.display = "block";
  frame.src = "index.html";

  let finished = false;
  function finish() {
    if (finished) return;
    finished = true;
    if (activePuzzleMessageListener === marshListener) {
      window.removeEventListener("message", marshListener);
      activePuzzleMessageListener = null;
    }
    activePuzzleFinish = null;
    setSkipPuzzleButtonVisible(false);
    frame.style.display = "none";
    storyPanel.style.display = "block";
    frame.src = "about:blank";
    onComplete();
  }

  function marshListener(e) {
    if (e.data !== "MARSH_COMPLETE") return;
    finish();
  }

  activePuzzleMessageListener = marshListener;
  activePuzzleFinish = finish;
  setSkipPuzzleButtonVisible(true);
  window.addEventListener("message", marshListener);
}

function restartLevel2() {
  levelState.tytoPuzzleComplete = false;
  levelState.marshPuzzleComplete = false;
  forceClosePuzzleIframe();
  setScene("forest_entry");
}

document.getElementById("skipPuzzleTestBtn")?.addEventListener("click", () => {
  if (typeof activePuzzleFinish === "function") activePuzzleFinish();
});

setScene("forest_entry");
