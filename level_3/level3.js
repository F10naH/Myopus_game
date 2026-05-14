/*
========================================
LEVEL 3: THE ABANDONED ORCHARD
Main Narrative & Logic Script
========================================
*/

/* Configuration for Level 3 Images */
const BACKDROP_IMAGES = {
  orchard: "images/orchard-main.jpg",
  hare: "images/hare-tweaking.jpg",
};

/** Vertical position of the photo layer (second value). Tweak if the crop feels wrong. */
const ORCHARD_BACKDROP_POSITION = "center 50%";
const HARE_BACKDROP_POSITION = "center 50%";

/**
 * Photo width as % of viewport; height is auto (keeps aspect ratio).
 * Larger = more zoomed out. Letterboxing uses the backdrop color.
 */
const ORCHARD_BACKDROP_ZOOM = "100%";
const HARE_BACKDROP_ZOOM = "100%";

/** 0 = invisible, 1 = full. Only affects the photo layer, not the gradients on top. */
const ORCHARD_PHOTO_OPACITY = 0.88;
const HARE_PHOTO_OPACITY = 0.88;

/** Fade-in duration for the photo (also sets --scene-photo-fade-duration on :root). */
const BACKDROP_PHOTO_FADE_SEC = 2;

if (typeof document !== "undefined") {
  document.documentElement.style.setProperty(
    "--scene-photo-fade-duration",
    `${BACKDROP_PHOTO_FADE_SEC}s`,
  );
}

// State tracking for transitions
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
  const container = document.getElementById("adventureBox");
  if (!container) return;

  // Apply visual backdrop based on current scene
  applySceneBackdrop(levelState.currentScene);

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
        ? "The hose is connected to the faucet. Water drips steadily[cite: 65]."
        : "A fragment of a dried-out, cracked garden hose lies in the dirt. It looks like the 'snake' the Hare mentioned[cite: 53, 63].";

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
        ? "The apple is wet and smells dizzyingly sweet. The scent is potent[cite: 69]."
        : "A mushy, brown apple sits in a depression[cite: 62]. It needs moisture to release its scent.";

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
          
          HARE: "Stay back! The Spirit of the Orchard has sent the snakes for me!"[cite: 52, 53].`,
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

  // Define which scenes show which images
  const orchardScenes = ["orchard_entry", "hose_inspect", "apple_inspect"];
  const hareScenes = ["hare_approach", "hare_game_start", "level_complete"];

  let image = "none";
  let photoOpacity = 0;
  let position = "center center";
  let zoom = "100%";

  if (orchardScenes.includes(sceneId)) {
    image = `url("${BACKDROP_IMAGES.orchard}")`;
    photoOpacity = ORCHARD_PHOTO_OPACITY;
    position = ORCHARD_BACKDROP_POSITION;
    zoom = ORCHARD_BACKDROP_ZOOM;
  } else if (hareScenes.includes(sceneId)) {
    image = `url("${BACKDROP_IMAGES.hare}")`;
    photoOpacity = HARE_PHOTO_OPACITY;
    position = HARE_BACKDROP_POSITION;
    zoom = HARE_BACKDROP_ZOOM;
  }

  // Set CSS Variables
  root.style.setProperty("--scene-bg-image", image);
  root.style.setProperty("--scene-img-position", position);
  root.style.setProperty("--scene-img-size", zoom);

  const photoEl = document.querySelector(".scene-backdrop-photo");
  if (!photoEl) return;

  // Handle the fade-in logic
  if (image !== lastBackdropImageKey) {
    photoEl.classList.add("scene-backdrop-photo--no-transition");
    root.style.setProperty("--scene-photo-opacity", "0");
    void photoEl.offsetHeight; // Force reflow
    photoEl.classList.remove("scene-backdrop-photo--no-transition");

    requestAnimationFrame(() => {
      root.style.setProperty("--scene-photo-opacity", String(photoOpacity));
    });
  }

  lastBackdropImageKey = image;
}

/**
 * Updated showText to use Event Listeners like level2.js
 */
function showText(text, options = []) {
  const container = document.getElementById("adventureBox");
  if (!container) return;

  let html = `<div class="story-text">${text}</div>`;
  // Create unique IDs for buttons to attach listeners later
  options.forEach((opt, i) => {
    html += `<button type="button" id="opt-${i}">${opt.text}</button>`;
  });

  container.innerHTML = html;

  // Attach real click listeners
  options.forEach((opt, i) => {
    const btn = document.getElementById(`opt-${i}`);
    if (btn) {
      btn.addEventListener("click", opt.action);
    }
  });
}

// Initial Call
setScene("orchard_entry");
