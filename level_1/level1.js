const BACKDROP_IMAGES = {
  home: "images/home_bg.png",
  brook: "images/brook_bg.png",
  firepit: "images/firepit_bg.png",
  patch: "images/patch_bg.png"
};

const LOC_TITLES = {
  home: "Home",
  brook: "The Brook",
  firepit: "The Pit",
  patch: "The Patch"
};

const BACKDROP_PHOTO_FADE_SEC = 2;
const BACKDROP_PHOTO_OPACITY = 0.55;

if (typeof document !== "undefined") {
  document.documentElement.style.setProperty(
    "--scene-photo-fade-duration",
    `${BACKDROP_PHOTO_FADE_SEC}s`
  );
}

const backdropLocationsShown = new Set();

let levelState = {
  currentLocation: "home",
  currentScene: "home",
  visitedHome: false,
  metBeaver: false,
  hasWood: false,
  hasBowl: false,
  hasSticks: false,
  hasWater: false,
  hasVeggies: false,
  fireLit: false,
  bowlPlaced: false,
  hasStew: false,
  stewGiven: false
};

let screenTextBlocks = [];

function changeLocation(loc) {
  screenTextBlocks = []; 
  levelState.currentLocation = loc;
  setScene(loc);
}

function setScene(scene) {
  levelState.currentScene = scene;
  renderScene();
}

function appendText(newText) {
  screenTextBlocks.push(newText);
}

window.handleInline = function(action) {
  screenTextBlocks = []; 
  switch(action) {
    case 'pickup_wood':
      levelState.hasWood = true;
      setScene("firepit_pickup_wood");
      break;
    case 'dig_up':
      levelState.hasVeggies = true;
      setScene("patch_dig");
      break;
    case 'light_fire':
      setScene("firepit_light_fire");
      break;
    case 'place_bowl':
      if (levelState.hasWater) {
         levelState.bowlPlaced = true;
         levelState.hasBowl = false;
         setScene("firepit_heat_water");
      } else {
         setScene("firepit_empty_bowl");
      }
      break;
    case 'use_veggies':
      if (!levelState.fireLit) {
        setScene("firepit_veggies_no_fire");
      } else if (!levelState.bowlPlaced) {
        setScene("firepit_veggies_fail");
      } else {
        setScene("firepit_make_stew");
      }
      break;
    case 'pickup_stew':
      levelState.bowlPlaced = false;
      setScene("firepit_pickup_stew");
      break;
    case 'fill_bowl':
      levelState.hasWater = true;
      setScene("brook_fill_bowl");
      break;
    case 'try_proceed':
      setScene("beaver_repel");
      break;
  }
};

function fadeInScenePhoto(root, photoEl, image, photoOpacity) {
  photoEl.classList.add("scene-backdrop-photo--no-transition");
  root.style.setProperty("--scene-photo-opacity", "0");
  root.style.setProperty("--scene-bg-image", image);
  void photoEl.offsetHeight;
  photoEl.classList.remove("scene-backdrop-photo--no-transition");
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      root.style.setProperty("--scene-photo-opacity", String(photoOpacity));
    });
  });
}

function applySceneBackdrop() {
  const root = document.documentElement;
  const photoEl = document.querySelector(".scene-backdrop-photo");
  const loc = levelState.currentLocation;
  
  const image = BACKDROP_IMAGES[loc] ? `url("${BACKDROP_IMAGES[loc]}")` : "none";
  const photoOpacity = BACKDROP_IMAGES[loc] ? BACKDROP_PHOTO_OPACITY : 0;

  if (photoOpacity <= 0) {
    if (photoEl) {
      photoEl.classList.add("scene-backdrop-photo--no-transition");
      root.style.setProperty("--scene-photo-opacity", "0");
      root.style.setProperty("--scene-bg-image", "none");
      void photoEl.offsetHeight;
      photoEl.classList.remove("scene-backdrop-photo--no-transition");
    } else {
      root.style.setProperty("--scene-photo-opacity", "0");
      root.style.setProperty("--scene-bg-image", "none");
    }
    return;
  }

  const isFirstAppearance = !backdropLocationsShown.has(loc);
  backdropLocationsShown.add(loc);

  if (isFirstAppearance && photoEl) {
    const urlMatch = image.match(/url\(["']?([^"')]+)["']?\)/);
    if (urlMatch) {
      const preload = new Image();
      preload.onload = () => fadeInScenePhoto(root, photoEl, image, photoOpacity);
      preload.onerror = () => fadeInScenePhoto(root, photoEl, image, photoOpacity);
      preload.src = urlMatch[1];
    } else {
      fadeInScenePhoto(root, photoEl, image, photoOpacity);
    }
    return;
  }

  root.style.setProperty("--scene-bg-image", image);
  root.style.setProperty("--scene-photo-opacity", String(photoOpacity));
}

function renderScene() {
  applySceneBackdrop();
  updateInventory();

  switch (levelState.currentScene) {
    case "home":
      if (!levelState.visitedHome) {
        appendText(`<em>You step out of your burrow to a view you’ve seen hundreds of times. With your partner’s condition occupying your mind, the flowers and mosses that surround you seem to have lost all color. The crisp, clean air of the taiga that once comforted you now seems hostile. You begin to think of what might happen if you can’t find the golden moss in time — you can’t even bear the thought. You must find it. But where to begin?</em>`);
        levelState.visitedHome = true;
      } else if (levelState.metBeaver && !levelState.stewGiven) {
        appendText(`<em>Just as bleak as before. The Beaver blocks your way past the Brook.</em>`);
      } else {
        appendText(`<em>The same as before. The taiga air is crisp.</em>`);
      }
      showText([
        { text: "TO THE BROOK", action: () => {
          if (levelState.metBeaver && !levelState.hasWood && !levelState.hasBowl && !levelState.hasStew && !levelState.stewGiven) {
            setScene("home_blocked");
          } else {
            changeLocation("brook");
          }
        }},
        { text: "TO THE PIT", action: () => changeLocation("firepit") }
      ]);
      break;

    case "home_blocked":
      screenTextBlocks = [];
      appendText(`<em>It’s pointless to go back without so much as a bowl for the vegetable stew.</em>`);
      showText([
        { text: "TO THE BROOK", action: () => setScene("home_blocked") },
        { text: "TO THE PIT", action: () => changeLocation("firepit") }
      ]);
      break;

    case "brook":
      if (!levelState.metBeaver) {
        setScene("beaver_dialogue_1");
        return;
      }
      if (levelState.hasStew) {
        setScene("beaver_give_stew");
        return;
      }

      appendText(`<em>A fallen log over a brook. The <span class="interactable item-beaver" onclick="handleInline('try_proceed')">Beaver</span> rests inside the log, blocking your path.</em>`);
      
      let brookOptions = [];
      brookOptions.push({ text: "RETURN HOME", action: () => changeLocation("home") });

      if (levelState.hasWood && !levelState.hasBowl) {
        brookOptions.unshift({ text: 'Myopus: "I need you to make a bowl for me..."', action: () => { screenTextBlocks = []; setScene("beaver_carve_bowl"); } });
      }
      
      if (levelState.hasBowl && !levelState.hasWater && !levelState.bowlPlaced) {
         appendText(`\n\n<em>The brook's <span class="interactable item-water" onclick="handleInline('fill_bowl')">water</span> looks clear enough to collect.</em>`);
      }

      showText(brookOptions);
      break;

    case "beaver_repel":
      appendText(`<em>You attempt to push past the Beaver, but it is many times your size, and easily repels you.</em>`);
      showText([
        { text: "...", action: () => { screenTextBlocks = []; setScene("brook"); } }
      ]);
      break;

    case "brook_fill_bowl":
      appendText(`<em>You take the bowl down to the brook and fill it with water.</em>`);
      showText([
        { text: "RETURN HOME", action: () => changeLocation("home") }
      ]);
      break;

    case "beaver_dialogue_1":
      appendText(`<em>A fallen log over a brook. You’ve crossed through the log a few times to avoid the brook and the thicket on each side, but today, you notice something unusual. A Beaver seems to have taken residence within the log.</em>`);
      showText([
        { text: 'Myopus: "I must cross the brook. Please let me through."', action: () => setScene("beaver_dialogue_2") }
      ]);
      break;
    
    case "beaver_dialogue_2":
      appendText(`Myopus: "I must cross the brook. Please let me through."\n\nBeaver: "I’m afraid not. This is my log."`);
      showText([
        { text: 'Myopus: "You must be mistaken. I have crossed through this log many times before today, and—"', action: () => setScene("beaver_dialogue_3") }
      ]);
      break;

    case "beaver_dialogue_3":
      appendText(`Myopus: "You must be mistaken. I have crossed through this log many times before today, and—"\n\nBeaver: "Yes, before today. This morning, my home was destroyed. The trees were shattered. The lake became cloudy and was filled with thick, foul water. Many of my cousins have fallen ill."`);
      showText([
        { text: 'Myopus: "My partner is ill as well. You understand then that my time is limited. You must let me pass."', action: () => setScene("beaver_dialogue_4") }
      ]);
      break;

    case "beaver_dialogue_4":
      levelState.metBeaver = true;
      appendText(`Myopus: "My partner is ill as well. You understand then that my time is limited. You must let me pass."\n\nBeaver: "I am far too tired from the morning’s journey to move now. If you wish to pass, you must help me regain my energy…perhaps a vegetable stew would do the trick."`);
      
      let d4Options = [
        { text: "TRY TO PROCEED", action: () => { screenTextBlocks = []; setScene("beaver_repel"); } },
        { text: "RETURN HOME", action: () => changeLocation("home") }
      ];
      if (levelState.hasWood) {
        d4Options.unshift({ text: 'Myopus: "I need you to make a bowl for me, so I can make your soup."', action: () => { screenTextBlocks = []; setScene("beaver_carve_bowl"); } });
      }
      showText(d4Options);
      break;

    case "beaver_carve_bowl":
      appendText(`Myopus: "I need you to make a bowl for me, so I can make your soup."\n\nBeaver: "Very well. Give it here, and I shall gnaw it into a bowl."`);
      showText([
        { text: "GIVE THE WOOD", action: () => setScene("beaver_carve_result") }
      ]);
      break;

    case "beaver_carve_result":
      levelState.hasWood = false;
      levelState.hasBowl = true;
      levelState.hasSticks = true;
      appendText(`<em>You take the wood, now shaped into a fine bowl, back from the Beaver.</em>\n\nBeaver: "Here are the extra scraps. Come back when you have my soup."\n\n<em>The Beaver gives you some extra twigs and splinters of wood. Maybe they could be useful somehow?</em>`);
      showText([
        { text: "RETURN HOME", action: () => changeLocation("home") }
      ]);
      break;

    case "beaver_give_stew":
      appendText(`Beaver: "Ahhh…you have done well, friend. You may pass…but let me offer you a word of advice."`);
      showText([
        { text: 'Myopus: "Save your breath."', action: () => setScene("beaver_end_rude") },
        { text: 'Myopus: "Go ahead."', action: () => setScene("beaver_end_polite") }
      ]);
      break;

    case "beaver_end_rude":
      levelState.stewGiven = true;
      appendText(`Myopus: "Save your breath."\n\nBeaver: "Fine. I won’t be surprised to find your corpse on tomorrow’s walk."\n\n<em>With that, the Beaver moves out of the log, and accepts the stew. You enter deeper into the forest.</em>`);
      showText([
        { text: "Proceed to Chapter 2", action: () => transitionToLevel2() } 
      ]);
      break;
    
    case "beaver_end_polite":
      levelState.stewGiven = true;
      appendText(`Myopus: "Go ahead."\n\nBeaver: "If you seek the cure of cures, you are about to enter a much more dangerous part of the forest. A little thing like you…you ought to look after yourself carefully. You will not find the creatures there to be as friendly as I…"\n\n<em>With that, the Beaver moves out of the log, and accepts the stew. You enter deeper into the forest.</em>`);
      showText([
        { text: "Proceed to Chapter 2", action: () => transitionToLevel2() } 
      ]);
      break;

    case "firepit":
      let fpText = "<em>";
      let itemUsed = levelState.hasWood || levelState.hasBowl || levelState.hasStew || levelState.stewGiven || levelState.bowlPlaced;
      
      if (levelState.fireLit) {
        fpText += "A stone surface sits over a fire-pit, now with a warm fire crackling underneath. ";
        if (levelState.bowlPlaced) {
            if (levelState.hasStew) {
              fpText += "Your <span class='interactable item-stew' onclick='handleInline(\"pickup_stew\")'>vegetable stew</span> is bubbling on the hot stone.";
            } else {
              fpText += "Your bowl is sitting on the hot stone.";
            }
        }
      } else {
        fpText += "A stone surface sits over a burned out fire-pit. ";
        if (!itemUsed) {
            fpText += "There’s only a few embers still glowing, and a leftover, unused <span class='interactable item-wood' onclick='handleInline(\"pickup_wood\")'>chunk of wood</span>. You remember roasting blueberry leaves here with your partner...but that was so long ago.";
        } else {
            fpText += "There’s only a few embers still glowing.";
        }
      }
      fpText += "</em>";

      if (levelState.hasSticks && !levelState.fireLit) {
        fpText += "\n\n<em>You could use your <span class='interactable item-wood' onclick='handleInline(\"light_fire\")'>twigs and splinters</span> here.</em>";
      }
      if (levelState.hasBowl && levelState.fireLit && !levelState.bowlPlaced) {
        fpText += "\n\n<em>You could place your <span class='interactable item-wood' onclick='handleInline(\"place_bowl\")'>bowl</span> on the stone.</em>";
      }
      if (levelState.hasVeggies) {
        fpText += "\n\n<em>You could use your <span class='interactable item-veggies' onclick='handleInline(\"use_veggies\")'>wild onions and carrots</span> here.</em>";
      }

      appendText(fpText);

      showText([
        { text: "RETURN HOME", action: () => changeLocation("home") },
        { text: "TO THE PATCH", action: () => changeLocation("patch") }
      ]);
      break;

    case "firepit_pickup_wood":
      appendText(`<em>You pick up the chunk of wood. Maybe someone could help you turn it into something useful?</em>`);
      showText([
        { text: "RETURN HOME", action: () => changeLocation("home") },
        { text: "TO THE PATCH", action: () => changeLocation("patch") }        
      ]);
      break;

    case "firepit_light_fire":
      levelState.fireLit = true;
      levelState.hasSticks = false;
      appendText(`<em>You place the sticks into the embers and watch as a fire begins to take shape.</em>`);
      showText([{ text: "...", action: () => { screenTextBlocks = []; setScene("firepit"); } }]);
      break;

    case "firepit_heat_water":
      appendText(`<em>You place the bowl on top of the stone surface.\nYou watch as the water begins to heat up.</em>`);
      showText([{ text: "...", action: () => { screenTextBlocks = []; setScene("firepit"); } }]);
      break;

    case "firepit_empty_bowl":
      appendText(`<em>You place the bowl on top of the stone surface.\nNothing seems to happen, so you take the bowl back. Maybe you need some liquid?</em>`);
      showText([{ text: "...", action: () => { screenTextBlocks = []; setScene("firepit"); } }]);
      break;

    case "firepit_veggies_no_fire":
      appendText(`<em>What would putting the veggies on the stone accomplish? There's no bowl to hold them.</em>`);
      showText([{ text: "...", action: () => { screenTextBlocks = []; setScene("firepit"); } }]);
      break;

    case "firepit_veggies_fail":
      appendText(`<em>You shouldn’t just put the veggies straight on the hot stone.</em>`);
      showText([{ text: "...", action: () => { screenTextBlocks = []; setScene("firepit"); } }]);
      break;

    case "firepit_make_stew":
      levelState.hasVeggies = false;
      levelState.hasStew = true;
      appendText(`<em>You put the veggies in the bowl of hot water. Finally...vegetable stew.</em>`);
      showText([{ text: "...", action: () => { screenTextBlocks = []; setScene("firepit"); } }]);
      break;

    case "firepit_pickup_stew":
      appendText(`<em>You pick up the stew. Time to take it back to the Beaver.</em>`);
      showText([
        { text: "TO THE PATCH", action: () => changeLocation("patch") },
        { text: "RETURN HOME", action: () => changeLocation("home") }
      ]);
      break;

    case "patch":
      let veggiesGone = levelState.hasVeggies || levelState.hasStew || levelState.stewGiven;
      appendText(veggiesGone
        ? "<em>A few wild onions and carrots…used to be here. Now it’s just dirt.</em>"
        : "<em>A few <span class='interactable item-veggies' onclick='handleInline(\"dig_up\")'>wild onions and carrots</span>.</em>"
      );
      showText([{ text: "TO THE PIT", action: () => changeLocation("firepit") }]);
      break;

    case "patch_dig":
      appendText(`<em>You dig some of the vegetables up from the dirt. You gather the smallest onions and carrots you can find and put them in your sack.</em>`);
      showText([{ text: "TO THE PIT", action: () => changeLocation("firepit") }]);
      break;
  }
}

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

function showText(options = []) {
  const container = document.getElementById("adventureBox");
  if (!container) return;

  const title = LOC_TITLES[levelState.currentLocation] || "";
  
  // Format each appended block. The last block stays normal, earlier ones get the .read-text class.
  const body = screenTextBlocks.map((block, idx) => {
    const isLast = idx === screenTextBlocks.length - 1;
    const formatted = highlightGoldenMoss(normalizeStoryText(block));
    return isLast ? formatted : `<span class="read-text">${formatted}</span>`;
  }).join('\n\n');

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

function transitionToLevel2() {
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

  document.body.appendChild(overlay);
  void overlay.offsetWidth;
  overlay.style.opacity = "1";

  setTimeout(() => {
    window.location.href = "../level_2/level2.html";
  }, 1500); 
}

function fadeInFromBlack() {
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.backgroundColor = "black";
  overlay.style.opacity = "1";
  overlay.style.transition = "opacity 1.5s ease-in-out";
  overlay.style.zIndex = "9999";
  overlay.style.pointerEvents = "none";

  document.body.appendChild(overlay);
  void overlay.offsetWidth;
  overlay.style.opacity = "0";

  setTimeout(() => {
    overlay.remove();
  }, 1500);
}

function updateInventory() {
  const panel = document.getElementById("inventory-panel");
  const list = document.getElementById("inventory-list");
  if (!panel || !list) return;

  const items = [];

  if (levelState.hasWood) items.push("Chunk of Wood");
  if (levelState.hasSticks) items.push("Twigs and Splinters");
  if (levelState.hasVeggies) items.push("Wild Onions and Carrots");
  
  if (levelState.hasBowl) {
    items.push(levelState.hasWater ? "Bowl of Water" : "Wooden Bowl");
  }
  
  if (levelState.hasStew && !levelState.bowlPlaced && !levelState.stewGiven) {
    items.push("Vegetable Stew");
  }

  if (items.length === 0) {
    panel.style.display = "none";
  } else {
    panel.style.display = "block";
    list.innerHTML = items.map(item => `<li>${item}</li>`).join("");
  }
}

fadeInFromBlack();
changeLocation("home");