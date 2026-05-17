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

const ORCHARD_PHOTO_OPACITY = 0.88;
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
};

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

function setScene(scene) {
  levelState.currentScene = scene;
  renderScene();
}

function renderScene() {
  applySceneBackdrop(levelState.currentScene);

  const container = document.getElementById("adventureBox");
  if (!container) return;

  switch (levelState.currentScene) {
    case "orchard_entry":
      showText(
        `The lush whimsy of the deep forest dies at a invisible border, surrendered to a heavy, unnatural silence. Before you lies the Abandoned Orchard—a landscape ravished, hollowed out, and left entirely empty by human hands. Where moss once thrived, the ground is choked by the rot of "False Moss," a graveyard of decaying burlap sacks and unyielding plastic weed barriers. The trees here are not free; they stand as stunted, uniform sentinels forced into a rigid, geometric grid that chokes the chaotic beauty of the natural world.

        In the dead center of this sterile row, the silence is broken by a desperate, frantic struggle. A Mountain Hare is pinned to the dirt, hopelessly entangled beneath a massive, discarded roll of plastic BIRD NETTING. It is thrashing hysterically, its paws catching in the synthetic threads of a trap originally engineered to protect the orchard's hoarded fruit. Now abandoned, the plastic has outlived its purpose, acting as a permanent, ghostly snare that has stolen the hare’s freedom. 

        The heavy tangle of this iron-like mesh stretches across the entire row, completely blocking your path forward. To save your partner, you must find a way past this synthetic barrier.`,
        [
          {
            text: "Investigate the 'Yellow Snake' (Hose)",
            action: () => setScene("hose_inspect"),
          },
          {
            text: "Examine the 'Bitter Fruit' (Apple)",
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
        hoseText = `You step cautiously toward the base of the rusted iron tap protruding from the packed earth. There, half-buried in the dust and crumbling microplastics, lies a fragment of a dried-out, cracked garden hose. To your small eyes, it is a hollow, synthetic carcass—vibrant yellow but stiffened and split by seasons of neglect. 

          This must be the 'snake' the Hare was screaming about in its delirium. Its rubber skin smells faintly of chemicals, ancient dust, and stagnant iron. It leads nowhere, completely severed from its source, a useless line of plastic cutting across the dead soil. Yet, if it could somehow be mended and tethered back to the iron faucet, it might hold the moisture needed to wake the orchard's sleeping sugars.`;

        hoseOptions = [
          {
            text: "Attempt to connect the hose (Mini-game)",
            action: () => setScene("hose_game_start"),
          },
          {
            text: "Return to the Orchard Rows",
            action: () => setScene("orchard_entry"),
          },
        ];
      } else {
        hoseText = `The 'Yellow Snake' has been wrestled into alignment, its cracked seams forced together and locked tightly onto the threads of the rusted iron tap. The transformation is immediate. 

          A low, hollow hiss echoes through the rubber tubing as water surges from deep beneath the ground. At the puncture points, small, clear droplets swell and fall, sinking instantly into the parched earth with a soft, drinking sound. The hose is no longer a dead piece of litter; it has become an artificial artery, pulsing with life-giving moisture that creeps steadily down the grid toward the depression where the bitter fruit waits.`;

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
        appleText = `You lean over the edge of a deep, collapsed crater in the rotting burlap. At the bottom sits a single, forgotten apple, half-buried in the dust. It is mushy, shriveled, and bruised a sickly dark brown—a bitter relic left behind when the humans abandoned this place. 

          You sniff at it, but there is no comfort here. It smells only of dry rot, dust, and old wood. The sun has baked it dry, locking its sugars away. It desperately needs moisture if it is ever to release the potent, dizzying scent required to soothe the panicked Hare. 
          
          You look back toward the iron faucet. You need to find a way to route the water here first.`;

        appleOptions = [
          {
            text: "Return to the Orchard Rows",
            action: () => setScene("orchard_entry"),
          },
        ];
      } else if (!levelState.appleScented) {
        // Branch 2: Water is flowing, ready for the mini-game
        appleText = `The apple rests in its shallow dirt depression, but the world around it has changed. Clear, cold water from the newly mended hose is pooling at its base, slowly soaking through the leathery, wrinkled skin. 

          As the moisture seeps deep into the bruised flesh, the fruit begins to swell. Tiny, pale bubbles of fermentation hiss and crackle at its surface, fighting against the dry decay. The air is thick with anticipation. The sugars are waking up, waiting for a precise, rhythmic touch to guide the fermentation process and unlock the true, potent depth of its hidden aroma.`;

        appleOptions = [
          {
            text: "Ferment the apple (Mini-game)",
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

          It smells dizzyingly sweet, overwhelming your small nose with a potent, heavy fragrance of wild sugars, sharp cider, and intoxicating fermentation. The aroma is so thick it feels warm, cutting through the chemical stink of the old orchard. It is a powerful, hypnotic scent—exactly what you need to cut through the Hare's blind panic and soothe its breaking mind.`;

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
        appleFrame.src = "apple_puzzle.html"; // Route into the rhythm canvas frame
      }

      let appleFinished = false;
      function finishApplePuzzle() {
        if (appleFinished) return;
        appleFinished = true;

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
        showText(
          `You step carefully onto the rotting burlap, but the moment your paws rustle the material, the Mountain Hare erupts into a blind, hysterical frenzy. It is thrashing wildly, kicking out with powerful, desperate back legs. The heavy plastic mesh of the bird netting stretches and snaps back; you are simply too small to handle the violent recoil of its panic. You are forced to stay back.

          The creature’s eyes are wide, glassy, and rolled back in terror. It stares blankly at the plastic threads pinning it down, completely blind to the reality of the human garbage that holds it.

          HARE: "Stay back, small one! Back! The Spirit of the Orchard has finally come for me! It has woven a web of iron to punish my sins... and it has unleashed its demons! Beware the Yellow Snake sent down by the Spirit! I saw it writhing in the dirt, slithering through the rows to choke me... I was running from its venom when the web swallowed me whole! Go, before it wraps around you too!"

          You realize you cannot examine the net or get any closer without being struck by its thrashing legs. To move forward and clear the path to the next area, you must find a way to quiet its racing mind and cut the synthetic threads.`,
          [
            {
              text: "Retreat to safety",
              action: () => setScene("orchard_entry"),
            },
          ],
        );
      } else if (!levelState.hareLethargic) {
        // Branch B: Apple is fermented, attracting the Hare
        showText(
          `You return, carrying the heavy, intoxicating aroma of the fermented apple. As you draw near, the thick cloud of wild sugars and warm, sharp cider cuts through the stagnant chemical stink of the orchard grid. 

          The Hare’s violent kicking abruptly stops. Its long ears twitch, and its nose ripples as it catches the potent, heavy fragrance drifting across the burlap sacks. The hysterical terror in its eyes softens, replaced by a sudden, hollow hunger. It stops fighting the plastic threads, entirely transfixed by the hypnotic scent of the waking sugars.`,
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
          `The Hare has devoured the mushy fruit, and the heavy fermentation has done its work. The frantic, erratic movements have given way to a deep, heavy lethargy. Its eyes are half-closed, its breathing slow and rhythmic against the damp earth.

          It is finally safe to approach. You pull the sharp glass shard from your pack—the jagged relic from the broken jar. The plastic bird netting is tight and unyielding, but with the animal resting quietly, you can position the blade without the risk of a crushing kick. It is time to slice through the 'Spirit's web.'`,
          [
            {
              text: "Saw through the netting (Mini-game)",
              action: () => setScene("hare_game_start"),
            },
          ],
        );
      }
      break;

    case "level_complete":
      // Concluding dialogue block containing the full lore payoff
      showText(
        `With a sharp, plastic snap, the final structural thread severs. The heavy roll of bird netting slumps away into the dust, completely uncoiling from the Hare's back. The path forward is finally clear.

        The Hare stirs, shaking the remaining synthetic fibers from its fur. It stands up, looking at its paws, then down at you with a profound, quiet gratitude.

        HARE: "The iron web... it is broken. You fought the Spirit's curse and won... No, listen to me. I see it clearly now. When the humans still tended to these straight rows, I would sneak beneath the canopy and steal the bitter, fallen fruit to feed my family. It was wrong, but we were hungry. But recently, the humans vanished. The orchard was abandoned. The fruit withered, and there was never enough to fill our bellies.

        I thought the Spirit of the Orchard was angry with me. I figured because I was taking what wasn't mine, the Spirit had cursed this entire place, slowing down all the growth and sending the snakes and the nets to punish my thievery. But you... you used the snake to bring life, and you used the fruit to bring peace. You have saved my life, small adventurer.

        I have learned my lesson about taking from these dead human orchards. But hearing your story—knowing how far you have traveled into the wide, changing world—has inspired me. If a creature as small as a Myopus can brave these hollow lands for their partner, then I can find the courage to do some adventuring of my own. I will seek out new, wilder lands to secure clean food for my family. Thank you."`,
        [
          {
            text: "Move toward the Village",
            action: () => alert("End of Level 3"),
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

    case "level_complete":
      showText(
        `The Hare is free! It explains it was only stealing fruit for its family. The path is clear.`,
        [
          {
            text: "Move toward the Village",
            action: () => alert("End of Level 3"),
          },
        ],
      );
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

function showText(text, options = []) {
  const container = document.getElementById("adventureBox");
  if (!container) return;

  const body =
    typeof text === "string" ? normalizeStoryText(text) : String(text);

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

document.getElementById("skipPuzzleTestBtn")?.addEventListener("click", () => {
  if (typeof activePuzzleFinish === "function") activePuzzleFinish();
});

// Initial Call
setScene("orchard_entry");
