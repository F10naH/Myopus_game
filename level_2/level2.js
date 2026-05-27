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

const OWL_BACKDROP_POSITION = "center 28%";
const OWL_BACKDROP_ZOOM = "50%";
const MARSH_BACKDROP_ZOOM = "128%";

const OWL_PHOTO_OPACITY = 0.88;
const MARSH_PHOTO_OPACITY = 0.88;
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

let levelState = {
  currentScene: "forest_entry",
  tytoPuzzleComplete: false,
  marshPuzzleComplete: false
};

let screenTextBlocks = [];
let currentTypingToken = {};
let skipTyping = false;

// Skip typing effect if player clicks anywhere on the document body
document.addEventListener('click', (e) => {
  if (e.target.tagName === 'BUTTON' || e.target.classList.contains('interactable')) return;
  skipTyping = true;
});

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

function setScene(scene) {
  screenTextBlocks = []; // Clear dialogue history on scene change
  levelState.currentScene = scene;
  renderScene();
}

function appendText(newText) {
  screenTextBlocks.push(newText);
}

function applySceneBackdrop(sceneId) {
  const root = document.documentElement;
  // UPDATE: Added the new numbered scene names here so the owl background stays visible!
  const owlScenes = ["tyto_meeting_1", "tyto_meeting_2", "tyto_challenge_1", "tyto_reward"];
  const marshScenes = ["marsh_entry", "ending"];

  const gradients = {
    forest: `linear-gradient(165deg, rgba(14, 20, 16, 0.92) 0%, rgba(22, 32, 26, 0.88) 45%, rgba(10, 14, 12, 0.95) 100%)`,
    owl: `linear-gradient(155deg, rgba(8, 10, 16, 0.78) 0%, rgba(14, 16, 22, 0.55) 38%, rgba(6, 8, 12, 0.88) 100%)`,
    marsh: `linear-gradient(180deg, rgba(6, 14, 22, 0.85) 0%, rgba(10, 22, 30, 0.72) 42%, rgba(4, 10, 16, 0.92) 100%)`
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
  const sameImage = image === lastBackdropImageKey;
  const hadPhoto = lastPhotoOpacity > 0;

  if (photoOpacity <= 0) {
    if (photoEl) {
      photoEl.classList.add("scene-backdrop-photo--no-transition");
      root.style.setProperty("--scene-photo-opacity", "0");
      void photoEl.offsetHeight;
      photoEl.classList.remove("scene-backdrop-photo--no-transition");
    }
    lastBackdropImageKey = image;
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

  lastBackdropImageKey = image;
  lastPhotoOpacity = photoOpacity;
}

function renderScene() {
  applySceneBackdrop(levelState.currentScene);

  switch (levelState.currentScene) {
    case "forest_entry":
      appendText(`The forest thins. The birch trunks give way to ancient, resinous pines whose roots curl above the earth like gnarled fingers. It is quiet here, and the smell here is sharp and old: pine sap, decay, and something herbal.`);
      appendText(`Somewhere above, something large shifts its weight. A pair of amber eyes blinks slowly from a branch twenty times your height.`);
      showText([{ 
        text: "Approach the eyes", 
        action: () => { screenTextBlocks = []; setScene("tyto_meeting_1"); } 
      }]);
      break;

    case "tyto_meeting_1":
      appendText(`Tyto: "You are far from your roots, small one. I can count the days left in your eyes. Not many. You carry urgency like a stone in your chest. It will exhaust you before the journey does."`);
      showText([{ 
        text: 'Myopus: "I need to reach the sacred land. My partner is ill. The golden moss–"', 
        action: () => { screenTextBlocks = []; setScene("tyto_meeting_2"); } 
      }]);
      break;

    case "tyto_meeting_2":
      // Re-append Myopus's line so it displays at the top of this dialogue step, followed by Tyto's response
      appendText(`Myopus: "I need to reach the sacred land. My partner is ill. The golden moss–"`);
      appendText(`Tyto: "Yes. The glowing one. I’ve seen it before it became a legend. But the marsh stands between you and it, and the marsh does not care for urgency."`);
      showText([{ 
        text: 'Myopus: "How do I cross the marsh?"', 
        action: () => { screenTextBlocks = []; setScene("tyto_challenge_1"); } 
      }]);
      break;

    case "tyto_challenge_1":
      // Re-append Myopus's line, then fire off three Tyto blocks so he gets three separate speech bubbles
      appendText(`Myopus: "How do I cross the marsh?"`);
      appendText(`Tyto: "I can tell you something more useful than a path. I can give you what you need to take with you. But first, I am old and I do not speak freely. I speak in exchange."`);
      appendText(`Tyto: "Organize my pellets. I have kept these in order for eleven seasons, but now my mind cannot comprehend such a task."`);
      appendText(`Tyto: "I want them moved, intact, to the rightmost root. The pellets must be stacked from the largest at the bottom and the smallest on top on the new root. You may only carry one at a time. You may never place a larger one atop a smaller lest you break my precious pellets. Do this, and I will give you what you need."`);
      showText([{ 
        text: "Begin Tyto's puzzle", 
        action: startTytoPuzzle // startTytoPuzzle handles clearing text naturally when the puzzle finishes
      }]);
      break;

    case "tyto_reward":
      appendText(`Tyto: "You are small, but no less intelligent than a larger being like me. You may have my boat to cross the marsh. It will hold you long enough. Consider it a parting gift."`);
      appendText(`You accept the boat without looking back.`);
      appendText(`The marsh waits.`);
      showText([{ 
        text: "Enter the marsh", 
        action: () => { screenTextBlocks = []; setScene("marsh_entry"); } 
      }]);
      break;

    case "marsh_entry":
      appendText(`The trees end abruptly, as if they agreed not to go further.`);
      appendText(`Before you: black water, still as glass.`);
      appendText(`Something drifts beneath the surface.`);
      appendText(`Far across the water, perhaps forty body-lengths, the land resumes.`);
      showText([{ 
        text: "Use the wooden boat", 
        action: startMarshPuzzle 
      }]);
      break;

    case "ending":
      appendText(`You reach the far shore.`);
      appendText(`The scent of pine smoke lingers behind you.`);
      appendText(`Beyond the black water, the land rises into rows of stunted trees—an orchard laid out in rigid lines, as if humans had shaped the world and then walked away.`);
      appendText(`The journey continues...`);
      showText([{ 
        text: "Proceed to Chapter 3", 
        action: transitionToLevel3 
      }]);
      break;
  }
}

// --- Text & Visual Novel Logic ---

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

function normalizeStoryText(raw) {
  if (!raw) return "";
  return raw.replace(/\r\n/g, "\n").trim();
}

function parseDialogue(text) {
  let speaker = 'narrator';
  let cleanText = text;

  const myopusMatch = text.match(/^Myopus:\s*(.*)/is);
  if (myopusMatch) {
    speaker = 'myopus'; 
    cleanText = myopusMatch[1].replace(/^"|"$/g, '');
  } else {
    const tytoMatch = text.match(/^Tyto:\s*(.*)/is);
    if (tytoMatch) {
      speaker = 'tyto'; 
      cleanText = tytoMatch[1].replace(/^"|"$/g, '');
    }
  }
  return { speaker, text: cleanText };
}

async function typeHTML(element, htmlString, token) {
  const temp = document.createElement('div');
  temp.innerHTML = highlightGoldenMoss(normalizeStoryText(htmlString));
  
  async function walk(node, parent) {
    if (token !== currentTypingToken) return;
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      const textNode = document.createTextNode('');
      parent.appendChild(textNode);
      for (let i = 0; i < text.length; i++) {
        if (token !== currentTypingToken) return;
        textNode.textContent += text[i];
        if (!skipTyping) await new Promise(r => setTimeout(r, 15));
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const clone = node.cloneNode(false);
      parent.appendChild(clone);
      for (const child of node.childNodes) {
        await walk(child, clone);
      }
    }
  }
  await walk(temp, element);
}

function showText(options = []) {
  const container = document.getElementById("adventureBox");
  if (!container) return;

  // Map the text blocks directly. Do not split by \n\n.
  const parsedLines = screenTextBlocks.map(block => parseDialogue(block.trim())).filter(l => l.text);

  const textCont = document.createElement('div');
  textCont.className = 'story-text-container';
  
  // Render all previous lines instantly (dimmed)
  for (let i = 0; i < parsedLines.length - 1; i++) {
     const row = document.createElement('div');
     row.className = `dialogue-row ${parsedLines[i].speaker} read-text`;
     const bubble = document.createElement('div');
     bubble.className = `bubble ${parsedLines[i].speaker}`;
     bubble.innerHTML = highlightGoldenMoss(normalizeStoryText(parsedLines[i].text));
     row.appendChild(bubble);
     textCont.appendChild(row);
  }

  // Prepare the current line for typewriter effect
  const currentLine = parsedLines[parsedLines.length - 1];
  const currRow = document.createElement('div');
  currRow.className = `dialogue-row ${currentLine.speaker}`;
  const currBubble = document.createElement('div');
  currBubble.className = `bubble ${currentLine.speaker}`;
  currRow.appendChild(currBubble);
  textCont.appendChild(currRow);

  // Setup button container
  const btnCont = document.createElement('div');
  btnCont.className = 'button-container';
  btnCont.style.display = 'none'; 
  options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = opt.text;
    btn.onclick = (e) => { e.stopPropagation(); opt.action(); };
    btnCont.appendChild(btn);
  });

  container.innerHTML = "";
  container.appendChild(textCont);
  container.appendChild(btnCont);

  // Handle VN Portraits Visibility & Bouncing
  const myopusPortrait = document.getElementById('portrait-myopus');
  const tytoPortrait = document.getElementById('portrait-tyto');

  if (currentLine.speaker === 'narrator') {
    if (myopusPortrait) myopusPortrait.classList.add('hidden');
    if (tytoPortrait) tytoPortrait.classList.add('hidden');
  } else {
    if (myopusPortrait) myopusPortrait.classList.remove('hidden');
    if (tytoPortrait) {
      if (levelState.currentScene.startsWith('tyto_')) tytoPortrait.classList.remove('hidden');
      else tytoPortrait.classList.add('hidden');
    }
  }

  if (currentLine.speaker === 'myopus' && myopusPortrait) myopusPortrait.classList.add('speaking');
  else if (currentLine.speaker === 'tyto' && tytoPortrait) tytoPortrait.classList.add('speaking');
  
  // Start Typewriter
  currentTypingToken = {};
  skipTyping = false;
  const token = currentTypingToken;

  if (currentLine.speaker === 'narrator') {
    currBubble.innerHTML = highlightGoldenMoss(normalizeStoryText(currentLine.text));
    btnCont.style.display = 'flex';
    if (myopusPortrait) myopusPortrait.classList.remove('speaking');
    if (tytoPortrait) tytoPortrait.classList.remove('speaking');
  } else {
    typeHTML(currBubble, currentLine.text, token).then(() => {
       if (token === currentTypingToken) {
         btnCont.style.display = 'flex';
         if (myopusPortrait) myopusPortrait.classList.remove('speaking');
         if (tytoPortrait) tytoPortrait.classList.remove('speaking');
       }
    });
  }
}

// --- Puzzles & Transitions ---

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

document.getElementById("skipPuzzleTestBtn")?.addEventListener("click", () => {
  if (typeof activePuzzleFinish === "function") activePuzzleFinish();
});

function transitionToLevel3() {
  const overlay = document.createElement("div");
  overlay.style.position = "fixed"; overlay.style.top = "0"; overlay.style.left = "0";
  overlay.style.width = "100vw"; overlay.style.height = "100vh";
  overlay.style.backgroundColor = "black"; overlay.style.opacity = "0";
  overlay.style.transition = "opacity 1.5s ease-in-out"; overlay.style.zIndex = "9999";
  overlay.style.pointerEvents = "all"; 

  document.body.appendChild(overlay);
  void overlay.offsetWidth;
  overlay.style.opacity = "1";

  const bgMusic = document.getElementById("bg-music");
  if (bgMusic) {
    const fadeAudio = setInterval(() => {
      if (bgMusic.volume > 0.1) {
        bgMusic.volume -= 0.1;
      } else {
        clearInterval(fadeAudio);
        bgMusic.pause();
      }
    }, 150);
  }

  setTimeout(() => { window.location.href = "../level_3/level3.html"; }, 1500); 
}

function fadeInFromBlack(chapterText = "Tap to enter") {
  const overlay = document.createElement("div");
  overlay.style.cssText = "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: black; z-index: 9999; display: flex; justify-content: center; align-items: center; color: rgba(255, 235, 220, 0.7); font-family: 'Museo Slab 500', Georgia, serif; font-size: 1.2rem; letter-spacing: 0.2em; text-transform: uppercase; cursor: pointer; opacity: 1; transition: opacity 1.5s ease-in-out;";
  
  const textSpan = document.createElement("span");
  textSpan.textContent = chapterText;
  textSpan.style.animation = "tapFade 2.4s ease-in-out infinite";
  overlay.appendChild(textSpan);
  document.body.appendChild(overlay);

  overlay.addEventListener("click", () => {
    const bgMusic = document.getElementById("bg-music");
    if (bgMusic) {
      bgMusic.volume = 1;
      bgMusic.play().catch(e => console.error("Audio play failed:", e));
    }

    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";

    setTimeout(() => {
      overlay.remove();
    }, 1500);
  });
}

function initGame() {
  fadeInFromBlack("Chapter 2: The Wild Threshold");
  setScene("forest_entry");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initGame);
} else {
  initGame();
}