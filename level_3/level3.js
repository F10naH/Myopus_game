/*
========================================
LEVEL 3: THE ABANDONED ORCHARD
Main Narrative & Logic Script
========================================
*/

/* Backdrops — same layering as level 2 (photo under mood + vignette). */
const BACKDROP_IMAGES = {
  orchard: "images/dead_orchard.jpeg",
  hare: "images/hare_trapped.jpg",
};

/** Only `orchard_entry` and `hare_approach` use photos; other scenes use gradient only. */
const ORCHARD_BACKDROP_POSITION = "center 50%";
const HARE_BACKDROP_POSITION = "center 50%";

const ORCHARD_BACKDROP_ZOOM = "80%";
const HARE_BACKDROP_ZOOM = "70%";

const ORCHARD_PHOTO_OPACITY = 0.9;
const HARE_PHOTO_OPACITY = 0.88;

const BACKDROP_PHOTO_FADE_SEC = 2;

if (typeof document !== "undefined") {
  document.documentElement.style.setProperty(
    "--scene-photo-fade-duration",
    `${BACKDROP_PHOTO_FADE_SEC}s`,
  );
}

let lastBackdropImageKey = "";
let lastPhotoOpacity = 0;

let levelState = {
  currentScene: "orchard_entry",
  hoseConnected: false, // Requirement 1
  appleScented: false, // Requirement 2
  hareLethargic: false, // Set after feeding apple
  pathCleared: false, // Final Goal
  visitedHose: false,
  visitedApple: false,
  visitedHare: false,
};

let activePuzzleFinish = null;
let activePuzzleMessageListener = null;
let activeAppleSpaceListener = null;
let currentTypingToken = {};
let skipTyping = false;
const seenStoryTextKeys = new Set();

document.addEventListener("click", (e) => {
  if (e.target.closest?.(".chapter-overlay")) return;
  if (e.target.tagName === "BUTTON") return;
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

function setScene(scene) {
  levelState.currentScene = scene;
  // NEW: Automatically trip the visit flags when entering a scene
  if (scene === "hose_inspect") levelState.visitedHose = true;
  if (scene === "apple_inspect") levelState.visitedApple = true;
  if (scene === "hare_approach") levelState.visitedHare = true;
  renderScene();
}

function renderScene() {
  applySceneBackdrop(levelState.currentScene);

  const container = document.getElementById("adventureBox");
  if (!container) return;

  switch (levelState.currentScene) {
    case "orchard_entry":
      showText(
        `The lush whimsy of the deep forest dies at a invisible border, surrendered to a heavy, unnatural silence. Before you lies an Abandoned Orchard, left entirely empty by human hands. The trees here are not free; they stand stunted sentinels forced into a rigid, geometric grid that chokes the chaotic beauty you've been used to on your journey.
        \nJust a few feet away to your left, half-buried in the dust and dry weeds, lies a long, stiff loop of vibrant, yellow plastic: a cracked garden hose, severed from its source, a rusty faucet further down the row. Nearby, resting at the bottom of a shallow burlap crater, sits a solitary, shriveled apple; a  relic of past harvests, baked dry by the sun and locking its sleeping sugars away from the world. 
        \nIn the dead center of this sterile row, the silence is broken by a desperate, frantic struggle. A Mountain Hare is pinned to the dirt, hopelessly entangled beneath a massive, discarded bird netting. It is thrashing hysterically, its paws catching in the synthetic threads of a trap originally meant to protect the orchard's fruit. 
        \nThe heavy tangle of this iron-like mesh stretches across the entire row, completely blocking your path forward. To save your partner, you must find a way past this synthetic barrier.`,
        [
          {
            text: "Investigate the Hose",
            action: () => setScene("hose_inspect"),
          },
          {
            text: "Examine the Bitter Fruit",
            action: () => setScene("apple_inspect"),
          },
          {
            text: "Approach the Hare",
            action: () => setScene("hare_approach"),
          },
        ],
      );
      break;

    case "hose_inspect":
      let hoseText = "";
      let hoseOptions = [];

      if (!levelState.hoseConnected) {
        hoseText = `You step cautiously toward the base of the rusted iron tap protruding from the packed earth. There, half-buried in the dust and crumbling microplastics, lies a fragment of a dried-out, cracked garden hose. To your small eyes, it is a hollow, synthetic carcass—vibrant yellow but stiffened and split by seasons of neglect. `;

        // NEW: Dynamic Matrix Responses based on your file listings
        if (levelState.visitedApple && levelState.visitedHare) {
          hoseText += `<span style="color: #f4e8c8;">This broken plastic 'snake' may be both the source of the Hare's terror and the only tool capable of watering the bitter fruit down the row.</span> `;
        } else if (levelState.visitedHare) {
          hoseText += `<span style="color: #f4e8c8;">Staring at the stiff, yellow rubber coils, the pieces click together this was the terrifying 'Yellow Snake' the Hare was screaming about in its delirium.</span> `;
        } else if (levelState.visitedApple) {
          hoseText += `<span style="color: #f4e8c8;">Looking at the hose, you think back to the shriveled apple rotting in the burlap: if you can patch this hose, it might be the perfect way to rehydrate the fruit.</span> `;
        }

        hoseText += `If it could somehow be mended and tethered back to the iron faucet, it might prove useful.`;

        hoseOptions = [
          {
            text: "Attempt to connect the hose",
            action: () => setScene("hose_game_start"),
          },
          {
            text: "Return to the Orchard Rows",
            action: () => setScene("orchard_entry"),
          },
        ];
      } else {
        hoseText = `You wrestled the hose into alignment, its cracked seams forced together and locked tightly onto the rusted iron tap. The transformation is immediate. A low, hollow hiss echoes through the rubber tubing as water surges from deep beneath the ground. The hose is alive once more.`;

        hoseOptions = [
          {
            text: "Back to the Orchard Rows",
            action: () => setScene("orchard_entry"),
          },
        ];
      }

      showText(hoseText, hoseOptions);
      break;

    case "hose_game_start":
      // Hide the dialogue box text, show the minigame iframe frame
      const storyPanel = document.getElementById("storyPanel");
      const frame = document.getElementById("gameFrame");

      if (storyPanel && frame) {
        storyPanel.style.display = "none";
        frame.style.display = "block";
        frame.src = "hose_puzzle.html"; // Load the grid puzzle file
      }

      let finished = false;
      function finish() {
        if (finished) return;
        finished = true;
        if (activePuzzleMessageListener === hoseMessageListener) {
          window.removeEventListener("message", hoseMessageListener); //
          activePuzzleMessageListener = null; //
        }
        activePuzzleFinish = null; //
        setSkipPuzzleButtonVisible(false); //
        frame.style.display = "none"; //
        storyPanel.style.display = "block"; //
        frame.src = "about:blank"; //

        // Save progress state and redirect
        levelState.hoseConnected = true; //
        setScene("hose_inspect"); //
      }

      // Hook up an asynchronous listener to wait for the puzzle's message window
      function hoseMessageListener(e) {
        if (e.data === "HOSE_COMPLETE") {
          //
          finish();
        }
      }

      activePuzzleMessageListener = hoseMessageListener; //
      activePuzzleFinish = finish; //
      setSkipPuzzleButtonVisible(true); //
      window.addEventListener("message", hoseMessageListener); //
      break;

    case "apple_inspect":
      let appleText = "";
      let appleOptions = [];

      if (!levelState.hoseConnected) {
        // Branch 1: No water, no progress
        appleText = `You lean over the edge of a deep, collapsed crater in the rotting burlap. At the bottom sits a single, forgotten apple, mushy, shriveled, and bruised. You sniff at it. The sun has baked it dry, locking its sugars away. It desperately needs moisture if it is ever to release a sweet scent once again. `;

        // NEW: Dynamic Matrix Responses based on your file listings
        if (levelState.visitedHose && levelState.visitedHare) {
          appleText += `<span style="color: #f4e8c8;">You now see the full picture: you must use the yellow hose to rehydrate the dry apple, creating the perfect scent to soothe the trapped Hare.</span> `;
        } else if (levelState.visitedHare) {
          appleText += `<span style="color: #f4e8c8;">As you look down at the shriveled fruit, you remember the Hare's wide, bloodshot eyes and realize it might be the exact tranquilizer needed to quiet its manic thrashing.</span> `;
        } else if (levelState.visitedHose) {
          appleText += `<span style="color: #f4e8c8;">With the image of the cracked yellow hose fresh in your mind, you realize that if you can fix the water flow, you could rehydrate the apple.</span> `;
        }

        appleText += `\n\nYou look back toward the iron faucet. Maybe you can find a way to route the water here first?`;

        appleOptions = [
          {
            text: "Return to the Orchard Rows",
            action: () => setScene("orchard_entry"),
          },
        ];
      } else if (!levelState.appleScented) {
        // Branch 2: Water is flowing, ready for the mini-game
        appleText = `The shriveled apple rests quietly in its crater, and a sudden spark of intuition hits you. Recognizing that moisture is the missing key to unlocking the fruit's sweet aroma, you carefully retrieve it from the earth. You carry the dry fruit over to the base of the rusted iron faucet where the water from your newly mended hose can pool around it. 
        \nAs the moisture seeps deep into the bruised flesh, the fruit begins to swell. Tiny, pale bubbles of fermentation hiss and crackle at its surface, fighting against the decay. However, the faucet spits out toxic waste as well as water. The sugars are waiting for a precise, rhythmic touch to guide the fermentation process and unlock the true, potent depth of its hidden aroma.`;

        appleOptions = [
          {
            text: "Ferment the apple",
            action: () => setScene("apple_game_start"),
          },
          {
            text: "Return to the Orchard Rows",
            action: () => setScene("orchard_entry"),
          },
        ];
      } else {
        // Branch 3: Mini-game complete, apple is fully aromatic
        appleText = `You step back as a thick, invisible wave of scent rolls out from the depression, pooling heavily between the straight rows of trees. The apple is completely drenched, practically dissolving into a rich, dark mush under the steady rhythm of the water droplets.
        \nThe aroma is so thick it feels warm, cutting through the chemical stink of the old orchard. You think to yourself how this scent could soothe anyone.`;

        appleOptions = [
          {
            text: "Return to the Orchard Rows",
            action: () => setScene("orchard_entry"),
          },
        ];
      }

      showText(appleText, appleOptions);
      break;

    case "apple_game_start":
      // Pull structural reference layers out of the layout
      const appleStoryPanel = document.getElementById("storyPanel");
      const appleFrame = document.getElementById("gameFrame");

      if (appleStoryPanel && appleFrame) {
        appleStoryPanel.style.display = "none";
        appleFrame.style.display = "block";
        appleFrame.addEventListener(
          "load",
          () => {
            appleFrame.focus();
            try {
              appleFrame.contentWindow?.focus();
              appleFrame.contentDocument
                ?.getElementById("gameCanvas")
                ?.focus({ preventScroll: true });
            } catch (_) {
              /* cross-origin guard */
            }
          },
          { once: true },
        );
        appleFrame.src = "apple_puzzle.html";
        requestAnimationFrame(() => appleFrame.focus());
      }

      let appleFinished = false;

      if (activeAppleSpaceListener) {
        window.removeEventListener("keydown", activeAppleSpaceListener);
        activeAppleSpaceListener = null;
      }
      activeAppleSpaceListener = (e) => {
        if (e.code !== "Space" || appleFrame.style.display === "none") return;
        try {
          const input = appleFrame.contentWindow?.handleAppleInput;
          if (typeof input !== "function") return;
          e.preventDefault();
          input(e);
        } catch (_) {
          /* iframe not ready */
        }
      };
      window.addEventListener("keydown", activeAppleSpaceListener);

      function finishApplePuzzle() {
        if (appleFinished) return;
        appleFinished = true;

        if (activeAppleSpaceListener) {
          window.removeEventListener("keydown", activeAppleSpaceListener);
          activeAppleSpaceListener = null;
        }

        if (activePuzzleMessageListener === appleMessageListener) {
          window.removeEventListener("message", appleMessageListener);
          activePuzzleMessageListener = null;
        }

        activePuzzleFinish = null;
        setSkipPuzzleButtonVisible(false); // Hide test button layer
        appleFrame.style.display = "none";
        appleStoryPanel.style.display = "block";
        appleFrame.src = "about:blank";

        // Mutate progress variables up and bounce redirect paths back
        levelState.appleScented = true;
        setScene("apple_inspect");
      }

      function appleMessageListener(e) {
        if (e.data === "APPLE_COMPLETE") {
          finishApplePuzzle();
        }
      }

      // Bind local operations into global engine variables to enable the skip button
      activePuzzleMessageListener = appleMessageListener;
      activePuzzleFinish = finishApplePuzzle;
      setSkipPuzzleButtonVisible(true); // Render the operational skip option

      window.addEventListener("message", appleMessageListener);
      break;

    case "hare_approach":
      if (!levelState.appleScented) {
        // Branch A: Hare is frantic, terrified, and warning of snakes
        let hareText = `You step carefully onto the rotting burlap, but the moment your paws rustle the material, the Mountain Hare erupts into a blind, hysterical frenzy. It is thrashing wildly, kicking out with powerful, desperate back legs. The heavy plastic mesh of the bird netting stretches and snaps back; you are simply too small to handle the violent recoil of its panic. You are forced to stay back.
\nThe creature’s eyes are wide, glassy, and rolled back in terror. It stares blankly at the plastic threads pinning it down, completely blind to the reality of the human garbage that holds it.
\nHARE: "Stay back, small one! Back! The Spirit of the Orchard has finally come for me! It has woven a web of iron to punish my sins... and it has unleashed its demons! Beware the Yellow Snake sent down by the Spirit! I saw it writhing in the dirt, slithering through the rows to choke me... I was running from its venom when the web swallowed me whole! Go, before it wraps around you too!"`;

        // NEW: Dynamic Response for Row 7 (Seen Hose, but not Apple yet)
        if (levelState.visitedHose && !levelState.visitedApple) {
          hareText += `\n\n<span style="color: #f4e8c8;">A 'Yellow Snake' slithering through the dirt... your mind flashes back to the harmless, stiff plastic hose you just found half-buried in the weeds nearby.</span>`;
        }

        hareText += `\n\nYou realize you cannot examine the net or get any closer without being struck by its thrashing legs. To move forward and clear the path, you think you must find a way to quiet its racing mind.`;

        // NEW: Dynamic Response for Row 6 (Seen Apple, but not Hose yet)
        if (levelState.visitedApple && !levelState.visitedHose) {
          hareText += ` <span style="color: #f4e8c8;">The desperate creature's panic fills the space, and you think back to the shriveled apple down the row; if you could somehow make it a little more appetizing it might soothe this frenzy.</span>`;
        }

        showText(hareText, [
          {
            text: "Retreat to safety",
            action: () => setScene("orchard_entry"),
          },
        ]);
      } else if (!levelState.hareLethargic) {
        // Branch B: Apple is fermented, attracting the Hare
        showText(
          `You return, carrying the heavy, intoxicating aroma of the fermented apple. As you draw near, the thick cloud of wild sugars cuts through the stagnant chemical stink of the orchard grid. 
          \nThe Hare’s violent kicking abruptly stops. Its long ears twitch, and its nose ripples as it catches the heavy fragrance drifting across the burlap sacks. The hysterical terror in its eyes softens, replaced by a sudden, hollow hunger. It stops fighting the plastic threads, entirely transfixed by the hypnotic scent of the apple.`,
          [
            {
              text: "Feed the fermented apple to the Hare",
              action: () => {
                levelState.hareLethargic = true;
                setScene("hare_approach");
              },
            },
          ],
        );
      } else {
        // Branch C: Hare is fed and lethargic, ready for rescue
        showText(
          `The Hare devours the mushy fruit. Its frantic, erratic movements have given way to a deep, heavy lethargy. Its eyes are half-closed, its breathing slow and rhythmic against the damp earth.
          \nIt is finally safe to approach. You pull out a sharp glass shard stuck nearby in the ground. The plastic bird netting is tight and unyielding, but with the hare resting quietly, you can position the blade without the risk of a crushing kick. It is time to slice through the 'Spirit's web.'`,
          [
            {
              text: "Saw through the netting",
              action: () => setScene("hare_game_start"),
            },
          ],
        );
      }
      break;

    case "level_complete":
      // Concluding dialogue block containing the full lore payoff
      showText(
        `With a sharp, plastic snap, the final structural thread severs. The heavy roll of bird netting slumps away into the dust, completely uncoiling from the Hare's back. The path forward is finally clear. The Hare stirs, shaking the remaining synthetic fibers from its fur. It stands up, looking at its paws, then down at you with a profound, quiet gratitude.
        \nHARE: "The iron web... it is broken. You fought the Spirit's curse and won... No, listen to me. I see it clearly now. When the humans still tended to these straight rows, I would sneak beneath the canopy and steal the bitter, fallen fruit to feed my family. It was wrong, but we were hungry. But recently, the humans vanished. The orchard was abandoned. The fruit withered, and there was never enough to fill our bellies.
        \nHARE: "I thought the Spirit of the Orchard was angry with me. I figured because I was taking what wasn't mine, the Spirit had cursed this entire place, slowing down all the growth and sending the snakes and the nets to punish my thievery. But you... you used the snake to bring life, and you used the fruit to bring peace. You have saved my life, small adventurer."
        \nHARE: "I have learned my lesson about taking from these dead human orchards. But hearing your story, knowing how far you have traveled for your partner's salvation, has inspired me. If a creature as small as a Myopus can brave these hollow lands, then I can find the courage to do some adventuring of my own. I will seek out new, wilder lands to secure clean food for my family. Thank you, and I sincerely hope you find what you are looking for."`,
        [
          {
            text: "Move toward the Village",
            action: () => transitionToEnding(),
          },
        ],
      );
      break;

    case "hare_game_start":
      // Pull document framework visual view hooks out
      const hareStoryPanel = document.getElementById("storyPanel");
      const hareFrame = document.getElementById("gameFrame");

      if (hareStoryPanel && hareFrame) {
        hareStoryPanel.style.display = "none";
        hareFrame.style.display = "block";
        hareFrame.src = "hare_puzzle.html"; // Load the sawing execution script canvas view
      }

      let hareFinished = false;
      function finishHarePuzzle() {
        if (hareFinished) return;
        hareFinished = true;

        if (activePuzzleMessageListener === hareMessageListener) {
          window.removeEventListener("message", hareMessageListener);
          activePuzzleMessageListener = null;
        }

        activePuzzleFinish = null;
        setSkipPuzzleButtonVisible(false); // Clear standard test buttons away
        hareFrame.style.display = "none";
        hareStoryPanel.style.display = "block";
        hareFrame.src = "about:blank";

        // Push level progress markers upward
        levelState.pathCleared = true;
        setScene("level_complete");
      }

      function hareMessageListener(e) {
        if (e.data === "HARE_COMPLETE") {
          finishHarePuzzle();
        }
      }

      // Track active parameters globally to integrate with the layout's skip puzzle buttons
      activePuzzleMessageListener = hareMessageListener;
      activePuzzleFinish = finishHarePuzzle;
      setSkipPuzzleButtonVisible(true); // Mount testing shortcuts seamlessly

      window.addEventListener("message", hareMessageListener);
      break;
  }
}

function applySceneBackdrop(sceneId) {
  const root = document.documentElement;

  const gradients = {
    neutral: `linear-gradient(
        165deg,
        rgba(28, 22, 16, 0.94) 0%,
        rgba(42, 34, 24, 0.9) 45%,
        rgba(18, 14, 10, 0.96) 100%
      )`,
    orchardPhoto: `linear-gradient(
        155deg,
        rgba(22, 18, 12, 0.82) 0%,
        rgba(36, 30, 20, 0.72) 42%,
        rgba(14, 12, 8, 0.9) 100%
      )`,
    harePhoto: `linear-gradient(
        160deg,
        rgba(14, 12, 18, 0.8) 0%,
        rgba(28, 22, 26, 0.68) 40%,
        rgba(10, 8, 12, 0.9) 100%
      )`,
  };

  let image = "none";
  let gradient = gradients.neutral;
  let imgPosition = "center center";
  let imgSize = "cover";
  let photoOpacity = 0;

  if (sceneId === "orchard_entry") {
    image = `url("${BACKDROP_IMAGES.orchard}")`;
    gradient = gradients.orchardPhoto;
    imgPosition = ORCHARD_BACKDROP_POSITION;
    imgSize = ORCHARD_BACKDROP_ZOOM;
    photoOpacity = ORCHARD_PHOTO_OPACITY;
  } else if (sceneId === "hare_approach") {
    image = `url("${BACKDROP_IMAGES.hare}")`;
    gradient = gradients.harePhoto;
    imgPosition = HARE_BACKDROP_POSITION;
    imgSize = HARE_BACKDROP_ZOOM;
    photoOpacity = HARE_PHOTO_OPACITY;
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

async function typeHTML(element, htmlString, token) {
  const temp = document.createElement("div");
  temp.innerHTML = normalizeStoryText(htmlString);

  async function walk(node, parent) {
    if (token !== currentTypingToken) return;

    if (node.nodeType === Node.TEXT_NODE) {
      const textNode = document.createTextNode("");
      parent.appendChild(textNode);

      for (const char of node.textContent) {
        if (token !== currentTypingToken) return;
        textNode.textContent += char;
        if (!skipTyping) {
          await new Promise((resolve) => setTimeout(resolve, 15));
        }
      }
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const clone = node.cloneNode(false);
      parent.appendChild(clone);

      for (const child of node.childNodes) {
        await walk(child, clone);
      }
    }
  }

  for (const child of temp.childNodes) {
    await walk(child, element);
  }
}

function showText(text, options = []) {
  const container = document.getElementById("adventureBox");
  if (!container) return;

  const body =
    typeof text === "string" ? normalizeStoryText(text) : String(text);
  const textKey = `${levelState.currentScene}\n${body}`;
  const hasShownThisText = seenStoryTextKeys.has(textKey);
  seenStoryTextKeys.add(textKey);

  const storyText = document.createElement("div");
  storyText.className = "story-text";

  const buttonContainer = document.createElement("div");
  buttonContainer.className = "button-container";
  buttonContainer.style.display = "none";

  options.forEach((opt, i) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.optIndex = String(i);
    button.textContent = opt.text;
    button.addEventListener("click", () => options[i].action());
    buttonContainer.appendChild(button);
  });

  container.innerHTML = "";
  container.appendChild(storyText);
  container.appendChild(buttonContainer);

  currentTypingToken = {};
  skipTyping = false;
  const token = currentTypingToken;

  if (hasShownThisText) {
    storyText.innerHTML = body;
    buttonContainer.style.display = "flex";
    return;
  }

  typeHTML(storyText, body, token).then(() => {
    if (token === currentTypingToken) {
      buttonContainer.style.display = "flex";
    }
  });
}

document.getElementById("skipPuzzleTestBtn")?.addEventListener("click", () => {
  if (typeof activePuzzleFinish === "function") activePuzzleFinish();
});

function transitionToEnding() {
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

  setTimeout(() => {
    window.location.href = "../ending/ending.html";
  }, 1500);
}

function fadeInFromBlack(chapterText = "Tap to enter") {
  const overlay = document.createElement("div");
  overlay.className = "chapter-overlay";
  overlay.style.cssText = "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: black; z-index: 9999; display: flex; justify-content: center; align-items: center; padding: 2rem; color: rgba(255, 235, 220, 0.7); font-family: 'Museo Slab 500', Georgia, serif; font-size: clamp(0.95rem, 4vw, 1.2rem); letter-spacing: 0.12em; line-height: 1.55; text-align: center; text-transform: uppercase; cursor: pointer; opacity: 1; transition: opacity 1.5s ease-in-out;";

  const textSpan = document.createElement("span");
  textSpan.textContent = chapterText;
  textSpan.style.animation = "tapFade 2.4s ease-in-out infinite";
  overlay.appendChild(textSpan);
  document.body.appendChild(overlay);

  overlay.addEventListener("click", () => {
    const bgMusic = document.getElementById("bg-music");
    if (bgMusic) {
      bgMusic.volume = 1;
      bgMusic.play().catch((e) => console.error("Audio play failed:", e));
    }

    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";

    setTimeout(() => {
      overlay.remove();
    }, 1500);
  });
}

function initGame() {
  fadeInFromBlack("Chapter 3: The Abandoned Orchard");
  setScene("orchard_entry");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initGame);
} else {
  initGame();
}
