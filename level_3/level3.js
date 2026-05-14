/*
========================================
LEVEL 3: THE ABANDONED ORCHARD
Main Narrative & Logic Script
========================================
*/

/* Backdrops — same layering as level 2 (photo under mood + vignette). */
const BACKDROP_IMAGES = {
  orchard: "images/orchard-main.jpg",
  hare: "images/thrashinghare.jpg",
};

/** Only `orchard_entry` and `hare_approach` use photos; other scenes use gradient only. */
const ORCHARD_BACKDROP_POSITION = "center 50%";
const HARE_BACKDROP_POSITION = "center 50%";

const ORCHARD_BACKDROP_ZOOM = "128%";
const HARE_BACKDROP_ZOOM = "128%";

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
        `The lush whimsy of the forest fades. Before you lies a grid of silent, stunted trees. The ground is covered in "False Moss"—rotting burlap sacks[cite: 47, 48]. 
        
        In the center of the row, a Mountain Hare is trapped in a web of plastic bird netting. It is thrashing hysterically[cite: 49, 51].`,
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
      let hoseText = levelState.hoseConnected
        ? "The hose is connected to the faucet. Water drips steadily."
        : "A fragment of a dried-out, cracked garden hose lies in the dirt. It looks like the 'snake' the Hare mentioned";

      let hoseOptions = levelState.hoseConnected
        ? [
            {
              text: "Back to the Orchard",
              action: () => setScene("orchard_entry"),
            },
          ]
        : [
            {
              text: "Attempt to connect the hose (Placeholder)",
              action: () => setScene("hose_game_start"),
            },
            { text: "Back", action: () => setScene("orchard_entry") },
          ];

      showText(hoseText, hoseOptions);
      break;

    case "hose_game_start":
      showText(
        "PHASE 1: You need to align the hose fragments to get water to the apple.",
        [
          {
            text: "Fix the Hose (Simulate Win)",
            action: () => {
              levelState.hoseConnected = true;
              setScene("hose_inspect");
            },
          },
        ],
      );
      break;

    case "apple_inspect":
      let appleText = levelState.appleScented
        ? "The apple is wet and smells dizzyingly sweet. The scent is potent."
        : "A mushy, brown apple sits in a depression. It needs moisture to release its scent.";

      let appleOptions = [];
      if (!levelState.hoseConnected) {
        appleText += "\nYou need a way to get water here first.";
        appleOptions.push({
          text: "Back",
          action: () => setScene("orchard_entry"),
        });
      } else if (!levelState.appleScented) {
        appleOptions.push({
          text: "Ferment the apple (Placeholder)",
          action: () => setScene("apple_game_start"),
        });
        appleOptions.push({
          text: "Back",
          action: () => setScene("orchard_entry"),
        });
      } else {
        appleOptions.push({
          text: "Back",
          action: () => setScene("orchard_entry"),
        });
      }

      showText(appleText, appleOptions);
      break;

    case "apple_game_start":
      showText(
        "PHASE 2: The water is dripping. Manage the fermentation to create the perfect scent.",
        [
          {
            text: "Complete Fermentation (Simulate Win)",
            action: () => {
              levelState.appleScented = true;
              setScene("apple_inspect");
            },
          },
        ],
      );
      break;

    case "hare_approach":
      if (!levelState.appleScented) {
        showText(
          `The Hare is "highkey tweaking"[cite: 57]. It kicks out in fear. You are too small to handle the recoil of its thrashing[cite: 66]. 
          
          HARE: "Stay back! The Spirit of the Orchard has sent the snakes for me!"`,
          [
            {
              text: "Retreat for now",
              action: () => setScene("orchard_entry"),
            },
          ],
        );
      } else if (!levelState.hareLethargic) {
        showText(
          `The Hare smells the fermented apple you prepared. Its frantic kicking slows as it begins to sniff the air[cite: 69, 70].`,
          [
            {
              text: "Feed the apple to the Hare",
              action: () => {
                levelState.hareLethargic = true;
                setScene("hare_approach");
              },
            },
          ],
        );
      } else {
        showText(
          `The Hare is now lethargic and sleepy[cite: 70]. It is safe to use the glass shard from the broken jar[cite: 61, 71].`,
          [
            {
              text: "Saw through the netting (Placeholder)",
              action: () => setScene("hare_game_start"),
            },
          ],
        );
      }
      break;

    case "hare_game_start":
      showText(
        "PHASE 3: Use the shard to saw through the plastic threads[cite: 72].",
        [
          {
            text: "Finish Sawing (Simulate Win)",
            action: () => {
              levelState.pathCleared = true;
              setScene("level_complete");
            },
          },
        ],
      );
      break;

    case "level_complete":
      showText(
        `The Hare is free! It explains it was only stealing fruit for its family[cite: 73, 74]. The path is clear.`,
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

// Initial Call
setScene("orchard_entry");
