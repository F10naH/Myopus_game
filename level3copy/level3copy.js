/*
========================================
LEVEL 3: THE ABANDONED ORCHARD
Adapted to Level 1 Engine & Aesthetics
========================================
*/

const BACKDROP_IMAGES = {
  orchard: "images/dead_orchard.jpeg",
  hose: "images/dead_orchard.jpeg",
  apple: "images/dead_orchard.jpeg",
  hare: "images/hare_trapped.jpg",
};

const LOC_TITLES = {
  orchard_entry: "The Abandoned Orchard",
  hose_inspect: "The Rusted Tap",
  apple_inspect: "The Burlap Crater",
  hare_approach: "The Sterile Row",
  level_complete: "The Path Forward",
};

const BACKDROP_PHOTO_FADE_SEC = 2;
const BACKDROP_PHOTO_OPACITY = 0.55;

if (typeof document !== "undefined") {
  document.documentElement.style.setProperty(
    "--scene-photo-fade-duration",
    `${BACKDROP_PHOTO_FADE_SEC}s`,
  );
}

const backdropLocationsShown = new Set();
let screenText = "";

let levelState = {
  currentLocation: "orchard_entry",
  currentScene: "orchard_entry",
  hoseConnected: false,
  appleScented: false,
  hareLethargic: false,
  pathCleared: false,
  visitedHose: false,
  visitedApple: false,
  visitedHare: false,
};

let activePuzzleFinish = null;
let activePuzzleMessageListener = null;
let activeAppleSpaceListener = null;

function changeLocation(loc) {
  screenText = "";
  levelState.currentLocation = loc;
  setScene(loc);
}

function setScene(scene) {
  levelState.currentScene = scene;

  // Set gameplay track flags dynamically
  if (scene === "hose_inspect") levelState.visitedHose = true;
  if (scene === "apple_inspect") levelState.visitedApple = true;
  if (scene === "hare_approach") levelState.visitedHare = true;

  renderScene();
}

function appendText(newText) {
  if (screenText) screenText += "\n\n";
  screenText += newText;
}

// Level 1 Style Global handler for inline click events within text descriptions
window.handleInline = function (action) {
  screenText = "";
  switch (action) {
    case "inspect_hose":
      changeLocation("hose_inspect");
      break;
    case "inspect_apple":
      changeLocation("apple_inspect");
      break;
    case "inspect_hare":
      changeLocation("hare_approach");
      break;
  }
};

function setSkipPuzzleButtonVisible(visible) {
  const btn = document.getElementById("skipPuzzleTestBtn");
  if (btn) btn.hidden = !visible;
}

function forceClosePuzzleIframe() {
  if (activePuzzleMessageListener) {
    window.removeEventListener("message", activePuzzleMessageListener);
    activePuzzleMessageListener = null;
  }
  if (activeAppleSpaceListener) {
    window.removeEventListener("keydown", activeAppleSpaceListener);
    activeAppleSpaceListener = null;
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

function applySceneBackdrop() {
  const root = document.documentElement;
  const photoEl = document.querySelector(".scene-backdrop-photo");
  const loc = levelState.currentLocation;
  let image = "none";
  let photoOpacity = BACKDROP_PHOTO_OPACITY;

  if (loc === "orchard_entry") image = `url("${BACKDROP_IMAGES.orchard}")`;
  else if (loc === "hose_inspect") image = `url("${BACKDROP_IMAGES.hose}")`;
  else if (loc === "apple_inspect") image = `url("${BACKDROP_IMAGES.apple}")`;
  else if (loc === "hare_approach") image = `url("${BACKDROP_IMAGES.hare}")`;
  else if (loc === "level_complete") image = `url("${BACKDROP_IMAGES.hare}")`;
  else photoOpacity = 0;

  if (photoOpacity <= 0) {
    if (photoEl) {
      photoEl.classList.add("scene-backdrop-photo--no-transition");
      root.style.setProperty("--scene-photo-opacity", "0");
      root.style.setProperty("--scene-bg-image", "none");
      void photoEl.offsetHeight;
      photoEl.classList.remove("scene-backdrop-photo--no-transition");
    }
    return;
  }

  const isFirstAppearance = !backdropLocationsShown.has(loc);
  backdropLocationsShown.add(loc);

  if (isFirstAppearance && photoEl) {
    root.style.setProperty("--scene-photo-opacity", "0");
    root.style.setProperty("--scene-bg-image", image);
    void photoEl.offsetHeight;
    root.style.setProperty("--scene-photo-opacity", String(photoOpacity));
    return;
  }

  root.style.setProperty("--scene-bg-image", image);
  root.style.setProperty("--scene-photo-opacity", String(photoOpacity));
}

function renderScene() {
  applySceneBackdrop();
  screenText = "";

  switch (levelState.currentScene) {
    case "orchard_entry":
      let entryText = `The lush whimsy of the deep forest dies at an invisible border, surrendered to a heavy, unnatural silence. Before you lies an Abandoned Orchard, left entirely empty by human hands. The trees stand stunted sentinels forced into a rigid, geometric grid that chokes the chaotic beauty you've been used to on your journey.\n\nJust a few feet away, half-buried in the dust, lies a vibrant <span class="interactable item-hose" onclick="handleInline('inspect_hose')">yellow hose</span>, severed from its source down the row. Nearby, resting at the bottom of a shallow crater, sits a solitary <span class="interactable item-apple" onclick="handleInline('inspect_apple')">shriveled apple</span>, locking its sleeping sugars away.\n\nIn the dead center of this sterile row, a frantic <span class="interactable item-hare" onclick="handleInline('inspect_hare')">Mountain Hare</span> is pinned to the dirt, hopelessly entangled beneath a massive sheet of bird netting. To save your partner, you must find a way past this synthetic barrier.`;

      appendText(entryText);
      showText([
        {
          text: "Investigate the Hose",
          action: () => setScene("hose_inspect"),
        },
        {
          text: "Examine the Bitter Fruit",
          action: () => setScene("apple_inspect"),
        },
        { text: "Approach the Hare", action: () => setScene("hare_approach") },
      ]);
      break;

    case "hose_inspect":
      if (!levelState.hoseConnected) {
        let hoseText = `You step cautiously toward the base of the rusted iron tap protruding from the packed earth. There lies a fragment of a dried-out, cracked garden hose. To your small eyes, it is a hollow, synthetic carcass—stiffened and split by seasons of neglect. `;

        if (levelState.visitedApple && levelState.visitedHare) {
          hoseText += `This broken plastic 'snake' may be both the source of the Hare's terror and the only tool capable of watering the bitter fruit down the row. `;
        } else if (levelState.visitedHare) {
          hoseText += `Staring at the stiff rubber coils, the pieces click together: this was the terrifying 'Yellow Snake' the Hare was screaming about in its delirium. `;
        } else if (levelState.visitedApple) {
          hoseText += `Looking at the hose, you think back to the shriveled apple rotting in the burlap: if you can patch this hose, it might be the perfect way to rehydrate the fruit. `;
        }
        hoseText += `If it could somehow be mended and tethered back to the iron faucet, it might prove useful.`;

        appendText(hoseText);
        showText([
          {
            text: "Attempt to connect the hose",
            action: () => setScene("hose_game_start"),
          },
          {
            text: "Return to Orchard",
            action: () => changeLocation("orchard_entry"),
          },
        ]);
      } else {
        appendText(
          `You wrestled the hose into alignment, its cracked seams forced together and locked tightly onto the rusted iron tap. A low, hollow hiss echoes through the rubber tubing as water surges from deep beneath the ground. The hose is alive once more.`,
        );
        showText([
          {
            text: "Return to Orchard",
            action: () => changeLocation("orchard_entry"),
          },
        ]);
      }
      break;

    case "hose_game_start":
      handlePuzzleFrameLoad("hose_puzzle.html", () => {
        levelState.hoseConnected = true;
        setScene("hose_inspect");
      });
      break;

    case "apple_inspect":
      if (!levelState.hoseConnected) {
        let appleText = `You lean over the edge of a deep crater in the rotting burlap. At the bottom sits a single, forgotten apple, mushy and shriveled. You sniff at it. The sun has baked it dry, locking its sugars away. It desperately needs moisture if it is ever to release a sweet scent once again. `;

        if (levelState.visitedHose && levelState.visitedHare) {
          appleText += `You now see the full picture: you must use the yellow hose to rehydrate the dry apple, creating the perfect scent to soothe the trapped Hare.`;
        } else if (levelState.visitedHare) {
          appleText += `As you look down at the shriveled fruit, you remember the Hare's wide, bloodshot eyes and realize it might be the exact tranquilizer needed to quiet its manic thrashing.`;
        } else if (levelState.visitedHose) {
          appleText += `With the image of the cracked yellow hose fresh in your mind, you realize that if you can fix the water flow, you could rehydrate the apple.`;
        }
        appleText += `\nYou look back toward the iron faucet. Maybe you can find a way to route the water here first?`;

        appendText(appleText);
        showText([
          {
            text: "Return to Orchard",
            action: () => changeLocation("orchard_entry"),
          },
        ]);
      } else if (!levelState.appleScented) {
        appendText(
          `The shriveled apple rests quietly in its crater. Recognizing that moisture is the missing key to unlocking the fruit's aroma, you carry it over to the base of the rusted iron faucet where the water from your mended hose can pool around it.\n\nAs the moisture seeps deep into the bruised flesh, the fruit begins to swell. Tiny, pale bubbles of fermentation hiss at its surface. However, the faucet spits out waste as well as water. The sugars are waiting for a precise, rhythmic touch to guide the fermentation process.`,
        );
        showText([
          {
            text: "Ferment the apple",
            action: () => setScene("apple_game_start"),
          },
          {
            text: "Return to Orchard",
            action: () => changeLocation("orchard_entry"),
          },
        ]);
      } else {
        appendText(
          `You step back as a thick, invisible wave of scent rolls out from the depression, pooling heavily between the straight rows of trees. The apple is completely drenched, practically dissolving into a rich, dark mush under the steady rhythm of the water droplets.\n\nThe aroma is so thick it feels warm, cutting through the chemical stink of the old orchard. You think to yourself how this scent could soothe anyone.`,
        );
        showText([
          {
            text: "Return to Orchard",
            action: () => changeLocation("orchard_entry"),
          },
        ]);
      }
      break;

    case "apple_game_start":
      setupAppleGameInput();
      handlePuzzleFrameLoad("apple_puzzle.html", () => {
        levelState.appleScented = true;
        setScene("apple_inspect");
      });
      break;

    case "hare_approach":
      if (!levelState.appleScented) {
        let hareText = `You step carefully onto the rotting burlap, but the moment your paws rustle the material, the Mountain Hare erupts into a blind, hysterical frenzy. It is thrashing wildly, kicking out with powerful back legs. The heavy plastic mesh of the netting stretches and snaps back; you are simply too small to handle the violent recoil of its panic.\n\nHARE: "Stay back, small one! Back! The Spirit of the Orchard has woven a web of iron to punish my sins... Beware the Yellow Snake writhing in the dirt, slithering through the rows to choke me! Go, before it wraps around you too!"`;

        if (levelState.visitedHose && !levelState.visitedApple) {
          hareText += `\n\nA 'Yellow Snake' slithering through the dirt... your mind flashes back to the harmless, stiff plastic hose you just found half-buried in the weeds nearby.`;
        }
        hareText += `\n\nYou realize you cannot get closer without being struck. To move forward and clear the path, you must find a way to quiet its racing mind.`;
        if (levelState.visitedApple && !levelState.visitedHose) {
          hareText += ` The desperate creature's panic fills the space, and you think back to the shriveled apple down the row; if you could somehow make it appetizing it might soothe this frenzy.`;
        }

        appendText(hareText);
        showText([
          {
            text: "Retreat to safety",
            action: () => changeLocation("orchard_entry"),
          },
        ]);
      } else if (!levelState.hareLethargic) {
        appendText(
          `You return, carrying the intoxicating aroma of the fermented apple. As you draw near, the thick cloud of wild sugars cuts through the stagnant chemical stink.\n\nThe Hare’s violent kicking abruptly stops. Its long ears twitch, and its nose ripples as it catches the heavy fragrance. The hysterical terror in its eyes softens, replaced by a sudden, hollow hunger.`,
        );
        showText([
          {
            text: "Feed the apple to the Hare",
            action: () => {
              levelState.hareLethargic = true;
              setScene("hare_approach");
            },
          },
        ]);
      } else {
        appendText(
          `The Hare devours the mushy fruit. Its frantic movements have given way to a deep, heavy lethargy. Its eyes are half-closed, its breathing slow and rhythmic.\n\nIt is finally safe to approach. You pull out a sharp glass shard stuck nearby in the ground. The plastic bird netting is tight, but with the hare resting quietly, you can position the blade without the risk of a crushing kick. It is time to slice through the netting.`,
        );
        showText([
          {
            text: "Saw through the netting",
            action: () => setScene("hare_game_start"),
          },
        ]);
      }
      break;

    case "hare_game_start":
      handlePuzzleFrameLoad("hare_puzzle.html", () => {
        levelState.pathCleared = true;
        levelState.currentLocation = "level_complete";
        setScene("level_complete");
      });
      break;

    case "level_complete":
      appendText(
        `With a sharp, plastic snap, the final structural thread severs. The heavy roll of bird netting slumps away into the dust, completely uncoiling from the Hare's back. The path forward is finally clear. The Hare stirs, shaking the remaining fibers from its fur. It looks down at you with a profound, quiet gratitude.\n\nHARE: "The iron web... it is broken. You used the snake to bring life, and you used the fruit to bring peace. You have saved my life, small adventurer. Hearing your story, knowing how far you have traveled for your partner's salvation, has inspired me. If a creature as small as a Myopus can brave these hollow lands, then I can find the courage to do some adventuring of my own. Thank you, and I sincerely hope you find what you are looking for."`,
      );
      showText([
        {
          text: "Move toward the Village",
          action: () => (window.location.href = "../ending/ending.html"),
        },
      ]);
      break;
  }
}

/* Framework Helper to manage puzzle loading contexts consistently */
function handlePuzzleFrameLoad(url, completionCallback) {
  const storyPanel = document.getElementById("storyPanel");
  const frame = document.getElementById("gameFrame");

  if (storyPanel && frame) {
    storyPanel.style.display = "none";
    frame.style.display = "block";
    frame.src = url;
  }

  let finished = false;
  function finish() {
    if (finished) return;
    finished = true;

    if (activePuzzleMessageListener) {
      window.removeEventListener("message", activePuzzleMessageListener);
      activePuzzleMessageListener = null;
    }
    if (activeAppleSpaceListener) {
      window.removeEventListener("keydown", activeAppleSpaceListener);
      activeAppleSpaceListener = null;
    }

    activePuzzleFinish = null;
    setSkipPuzzleButtonVisible(false);
    frame.style.display = "none";
    storyPanel.style.display = "block";
    frame.src = "about:blank";

    completionCallback();
  }

  function messageListener(e) {
    if (
      e.data === "HOSE_COMPLETE" ||
      e.data === "APPLE_COMPLETE" ||
      e.data === "HARE_COMPLETE"
    ) {
      finish();
    }
  }

  activePuzzleMessageListener = messageListener;
  activePuzzleFinish = finish;
  setSkipPuzzleButtonVisible(true);
  window.addEventListener("message", messageListener);
}

function setupAppleGameInput() {
  const appleFrame = document.getElementById("gameFrame");
  if (!appleFrame) return;

  appleFrame.addEventListener(
    "load",
    () => {
      appleFrame.focus();
      try {
        appleFrame.contentWindow?.focus();
        appleFrame.contentDocument
          ?.getElementById("gameCanvas")
          ?.focus({ preventScroll: true });
      } catch (_) {}
    },
    { once: true },
  );

  if (activeAppleSpaceListener)
    window.removeEventListener("keydown", activeAppleSpaceListener);

  activeAppleSpaceListener = (e) => {
    if (e.code !== "Space" || appleFrame.style.display === "none") return;
    try {
      const input = appleFrame.contentWindow?.handleAppleInput;
      if (typeof input === "function") {
        e.preventDefault();
        input(e);
      }
    } catch (_) {}
  };
  window.addEventListener("keydown", activeAppleSpaceListener);
}

function normalizeStoryText(raw) {
  if (!raw) return "";
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const first = lines.findIndex((l) => l.trim());
  const last =
    lines.length - 1 - [...lines].reverse().findIndex((l) => l.trim());
  if (first === -1) return "";
  const body = lines.slice(first, last + 1);
  const nonempty = body.filter((l) => l.trim());
  const min = Math.min(
    ...nonempty.map((l) => {
      const m = l.match(/^[ \t]*/);
      return m ? m[0].length : 0;
    }),
  );
  return body
    .map((l) => (l.trim() ? l.slice(min) : ""))
    .join("\n")
    .replace(/\n+$/, "");
}

function showText(options = []) {
  const container = document.getElementById("adventureBox");
  if (!container) return;

  const title = LOC_TITLES[levelState.currentLocation] || "";
  const body = normalizeStoryText(screenText);

  let html = `<div class="location-title">${title}</div>`;
  html += `<div class="story-text">${body}</div>`;
  html += `<div class="button-container">`;

  options.forEach((opt, i) => {
    html += `<button type="button" data-opt-index="${i}">${opt.text}</button>`;
  });

  html += `</div>`;
  container.innerHTML = html;

  container.querySelectorAll("button[data-opt-index]").forEach((btn) => {
    const idx = parseInt(btn.getAttribute("data-opt-index"), 10);
    btn.addEventListener("click", () => options[idx].action());
  });
}

document.getElementById("skipPuzzleTestBtn")?.addEventListener("click", () => {
  if (typeof activePuzzleFinish === "function") activePuzzleFinish();
});

// Init
changeLocation("orchard_entry");
