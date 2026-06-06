const BACKDROP_IMAGES = {
  home: "images/home_bg.png",
  brook: "images/brook_bg.png",
  firepit: "images/firepit_bg.png",
  patch: "images/patch_bg.png"
};

const LOC_TITLES = { home: "Home", brook: "The Brook", firepit: "The Pit", patch: "The Patch" };
const BACKDROP_PHOTO_FADE_SEC = 2;
const BACKDROP_PHOTO_OPACITY = 0.55;

if (typeof document !== "undefined") {
  document.documentElement.style.setProperty("--scene-photo-fade-duration", `${BACKDROP_PHOTO_FADE_SEC}s`);
}

const backdropLocationsShown = new Set();
const visitedLocations = new Set();
let levelState = {
  currentLocation: "home", currentScene: "home", visitedHome: false, metBeaver: false,
  hasWood: false, hasBowl: false, hasSticks: false, hasWater: false, hasVeggies: false,
  fireLit: false, bowlPlaced: false, hasStew: false, stewGiven: false
};

let screenTextBlocks = [];
let currentTypingToken = {};
let skipTyping = false;

document.addEventListener('click', (e) => {
  if (e.target.tagName === 'BUTTON' || e.target.classList.contains('interactable')) return;
  skipTyping = true;
});

function changeLocation(loc) {
  screenTextBlocks = []; 
  levelState.currentLocation = loc;
  visitedLocations.add(loc);
  setScene(loc);
}

function setScene(scene) {
  levelState.currentScene = scene;
  renderScene();
}

function appendText(newText) {
  screenTextBlocks.push(newText);
}

function hasActionableObjective(loc) {
  if (loc === levelState.currentLocation || levelState.stewGiven) return false;

  if (loc === "brook") {
    return (
      (!levelState.metBeaver && !levelState.hasBowl && !levelState.hasStew) ||
      (levelState.hasWood && !levelState.hasBowl) ||
      (levelState.hasBowl && !levelState.hasWater && !levelState.bowlPlaced) ||
      levelState.hasStew
    );
  }

  if (loc === "firepit") {
    return (
      (!levelState.hasWood && !levelState.hasBowl && !levelState.hasStew) ||
      (levelState.hasSticks && !levelState.fireLit) ||
      (levelState.hasBowl && levelState.fireLit && !levelState.bowlPlaced) ||
      (levelState.hasVeggies && levelState.fireLit && levelState.bowlPlaced && !levelState.hasStew) ||
      (levelState.hasStew && levelState.bowlPlaced)
    );
  }

  if (loc === "patch") {
    return levelState.hasBowl && !levelState.hasVeggies && !levelState.hasStew;
  }

  return false;
}

window.handleInline = function(action) {
  screenTextBlocks = []; 
  switch(action) {
    case 'pickup_wood': levelState.hasWood = true; setScene("firepit_pickup_wood"); break;
    case 'dig_up': levelState.hasVeggies = true; setScene("patch_dig"); break;
    case 'light_fire': setScene("firepit_light_fire"); break;
    case 'place_bowl':
      if (levelState.hasWater) { levelState.bowlPlaced = true; levelState.hasBowl = false; setScene("firepit_heat_water"); }
      else { setScene("firepit_empty_bowl"); }
      break;
    case 'use_veggies':
      if (!levelState.fireLit) setScene("firepit_veggies_no_fire");
      else if (!levelState.bowlPlaced) setScene("firepit_veggies_fail");
      else setScene("firepit_make_stew");
      break;
    case 'pickup_stew': levelState.bowlPlaced = false; setScene("firepit_pickup_stew"); break;
    case 'fill_bowl': levelState.hasWater = true; setScene("brook_fill_bowl"); break;
    case 'try_proceed': setScene("beaver_repel"); break;
  }
};

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
    }
    return;
  }

  if (!backdropLocationsShown.has(loc)) {
    backdropLocationsShown.add(loc);
    if (photoEl) {
      const preload = new Image();
      preload.onload = () => { root.style.setProperty("--scene-photo-opacity", String(photoOpacity)); };
      const match = image.match(/url\(["']?([^"')]+)["']?\)/);
      if (match) preload.src = match[1];
    }
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
        { text: "TO THE BROOK", hasUpdate: hasActionableObjective("brook"), action: () => {
          if (levelState.metBeaver && !levelState.hasWood && !levelState.hasBowl && !levelState.hasStew && !levelState.stewGiven) { setScene("home_blocked"); } 
          else { changeLocation("brook"); }
        }},
        { text: "TO THE PIT", hasUpdate: hasActionableObjective("firepit"), action: () => changeLocation("firepit") }
      ]);
      break;

    case "home_blocked":
      screenTextBlocks = [];
      appendText(`<em>It’s pointless to go back without so much as a bowl for the vegetable stew.</em>`);
      showText([ { text: "TO THE BROOK", hasUpdate: hasActionableObjective("brook"), action: () => setScene("home_blocked") }, { text: "TO THE PIT", hasUpdate: hasActionableObjective("firepit"), action: () => changeLocation("firepit") } ]);
      break;

    case "brook":
      if (!levelState.metBeaver) { setScene("beaver_dialogue_1"); return; }
      if (levelState.hasStew) { setScene("beaver_stew_approach"); return; }

      appendText(`<em>A fallen log over a brook. The <span class="interactable item-beaver" onclick="handleInline('try_proceed')">Beaver</span> rests inside the log, blocking your path.</em>`);
      
      let brookOptions = [{ text: "RETURN HOME", action: () => changeLocation("home") }];
      if (levelState.hasWood && !levelState.hasBowl) {
        brookOptions.unshift({ text: 'Myopus: "I need you to make a bowl for me..."', action: () => { screenTextBlocks = []; setScene("beaver_carve_bowl"); } });
      }
      if (levelState.hasBowl && !levelState.hasWater && !levelState.bowlPlaced) {
           appendText(`<em>The brook's <span class="interactable item-water" onclick="handleInline('fill_bowl')">water</span> looks clear enough to collect.</em>`);
      }
      showText(brookOptions);
      break;

    case "beaver_repel":
      appendText(`<em>You attempt to push past the Beaver, but it is many times your size, and easily repels you.</em>`);
      showText([ { text: "...", action: () => { screenTextBlocks = []; setScene("brook"); } } ]);
      break;

    case "brook_fill_bowl":
      appendText(`<em>You take the bowl down to the brook and fill it with water.</em>`);
      showText([ { text: "RETURN HOME", action: () => changeLocation("home") } ]);
      break;

    case "beaver_dialogue_1":
      appendText(`<em>A fallen log over a brook. You’ve crossed through the log a few times to avoid the brook and the thicket on each side, but today, you notice something unusual. A Beaver seems to have taken residence within the log.</em>`);
      showText([ { text: 'Myopus: "I must cross the brook. Please let me through."', action: () => setScene("beaver_dialogue_2") } ]);
      break;
    
    case "beaver_dialogue_2":
      appendText(`Myopus: "I must cross the brook. Please let me through."`);
      showText([ { text: "...", action: () => setScene("beaver_dialogue_2_b") } ]);
      break;

    case "beaver_dialogue_2_b":
      appendText(`Beaver: "I’m afraid not. This is my log."`);
      showText([ { text: 'Myopus: "You must be mistaken. I have crossed through this log many times before today, and—"', action: () => setScene("beaver_dialogue_3") } ]);
      break;

    case "beaver_dialogue_3":
      appendText(`Myopus: "You must be mistaken. I have crossed through this log many times before today, and—"`);
      showText([ { text: "...", action: () => setScene("beaver_dialogue_3_b") } ]);
      break;

    case "beaver_dialogue_3_b":
      appendText(`Beaver: "Yes, before today. This morning, my home was destroyed. The trees were shattered. The lake became cloudy and was filled with thick, foul water. Many of my cousins have fallen ill."`);
      showText([ { text: 'Myopus: "My partner is ill as well. You understand then that my time is limited. You must let me pass."', action: () => setScene("beaver_dialogue_4") } ]);
      break;

    case "beaver_dialogue_4":
      levelState.metBeaver = true;
      appendText(`Myopus: "My partner is ill as well. You understand then that my time is limited. You must let me pass."`);
      showText([ { text: "...", action: () => setScene("beaver_dialogue_4_b") } ]);
      break;

    case "beaver_dialogue_4_b":
      appendText(`Beaver: "I am far too tired from the morning’s journey to move now. If you wish to pass, you must help me regain my energy…perhaps a vegetable stew would do the trick."`);
      let d4Options = [
        { text: "TRY TO PROCEED", action: () => { screenTextBlocks = []; setScene("beaver_repel"); } },
        { text: "RETURN HOME", action: () => changeLocation("home") }
      ];
      if (levelState.hasWood) d4Options.unshift({ text: 'Myopus: "I need you to make a bowl for me, so I can make your soup."', action: () => { screenTextBlocks = []; setScene("beaver_carve_bowl"); } });
      showText(d4Options);
      break;

    case "beaver_carve_bowl":
      appendText(`Myopus: "I need you to make a bowl for me, so I can make your soup."`);
      showText([ { text: "...", action: () => setScene("beaver_carve_bowl_b") } ]);
      break;

    case "beaver_carve_bowl_b":
      appendText(`Beaver: "Very well. Give it here, and I shall gnaw it into a bowl."`);
      showText([ { text: "GIVE THE WOOD", action: () => setScene("beaver_carve_result") } ]);
      break;

    case "beaver_carve_result":
      levelState.hasWood = false; levelState.hasBowl = true; levelState.hasSticks = true;
      appendText(`<em>You take the wood, now shaped into a fine bowl, back from the Beaver.</em>`);
      showText([ { text: "...", action: () => setScene("beaver_carve_result_b") } ]);
      break;

    case "beaver_carve_result_b":
      appendText(`Beaver: "Here are the extra scraps. Come back when you have my soup."`);
      showText([ { text: "...", action: () => setScene("beaver_carve_result_c") } ]);
      break;

    case "beaver_carve_result_c":
      appendText(`<em>The Beaver gives you some extra twigs and splinters of wood. Maybe they could be useful somehow?</em>`);
      showText([ { text: "RETURN HOME", action: () => changeLocation("home") } ]);
      break;

    case "beaver_stew_approach":
      appendText(`Beaver: "I fear the myopus, even when bearing gifts."`);
      showText([
        { 
          text: "GIVE STEW", 
          action: () => { 
            levelState.hasStew = false; 
            setScene("beaver_give_stew"); 
          } 
        },
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
      appendText(`Myopus: "Save your breath."`);
      showText([ { text: "...", action: () => setScene("beaver_end_rude_b") } ]);
      break;

    case "beaver_end_rude_b":
      appendText(`Beaver: "Fine. I won’t be surprised to find your corpse on tomorrow’s walk."`);
      showText([ { text: "...", action: () => setScene("beaver_end_rude_c") } ]);
      break;

    case "beaver_end_rude_c":
      appendText(`<em>With that, the Beaver moves out of the log, and accepts the stew. You enter deeper into the forest.</em>`);
      showText([ { text: "Proceed to Chapter 2", action: () => transitionToLevel2() } ]);
      break;
    
    case "beaver_end_polite":
      levelState.stewGiven = true;
      appendText(`Myopus: "Go ahead."`);
      showText([ { text: "...", action: () => setScene("beaver_end_polite_b") } ]);
      break;

    case "beaver_end_polite_b":
      appendText(`Beaver: "If you seek the cure of cures, you may find more than you bargained for. A little thing like you…you ought to look after yourself carefully. Not all creatures are as friendly as I…"`);
      showText([ { text: "...", action: () => setScene("beaver_end_polite_c") } ]);
      break;

    case "beaver_end_polite_c":
      appendText(`<em>With that, the Beaver moves out of the log, and accepts the stew. You enter deeper into the forest.</em>`);
      showText([ { text: "Proceed to Chapter 2", action: () => transitionToLevel2() } ]);
      break;

    case "firepit":
      let fpText = "<em>";
      let itemUsed = levelState.hasWood || levelState.hasBowl || levelState.hasStew || levelState.stewGiven || levelState.bowlPlaced;
      
      if (levelState.fireLit) {
        fpText += "A stone surface sits over a fire-pit, now with a warm fire crackling underneath. ";
        if (levelState.bowlPlaced) {
            if (levelState.hasStew) fpText += "Your <span class='interactable item-stew' onclick='handleInline(\"pickup_stew\")'>vegetable stew</span> is bubbling on the hot stone.";
            else fpText += "Your bowl is sitting on the hot stone.";
        }
      } else {
        fpText += "A stone surface sits over a burned out fire-pit. ";
        if (!itemUsed) fpText += "There’s only a few embers still glowing, and a leftover, unused <span class='interactable item-wood' onclick='handleInline(\"pickup_wood\")'>chunk of wood</span>. You remember roasting blueberry leaves here with your partner...but that was so long ago.";
        else fpText += "There’s only a few embers still glowing.";
      }
      fpText += "</em>";

      if (levelState.hasSticks && !levelState.fireLit) fpText += "\n\n<em>You could use your <span class='interactable item-wood' onclick='handleInline(\"light_fire\")'>twigs and splinters</span> here.</em>";
      if (levelState.hasBowl && levelState.fireLit && !levelState.bowlPlaced) fpText += "\n\n<em>You could place your <span class='interactable item-wood' onclick='handleInline(\"place_bowl\")'>bowl</span> on the stone.</em>";
      if (levelState.hasVeggies) fpText += "\n\n<em>You could use your <span class='interactable item-veggies' onclick='handleInline(\"use_veggies\")'>wild onions and carrots</span> here.</em>";

      appendText(fpText);
      showText([ { text: "RETURN HOME", action: () => changeLocation("home") }, { text: "TO THE PATCH", hasUpdate: hasActionableObjective("patch"), action: () => changeLocation("patch") } ]);
      break;

    case "firepit_pickup_wood":
      appendText(`<em>You pick up the chunk of wood. Maybe someone could help you turn it into something useful?</em>`);
      showText([ { text: "RETURN HOME", action: () => changeLocation("home") }, { text: "TO THE PATCH", hasUpdate: hasActionableObjective("patch"), action: () => changeLocation("patch") } ]);
      break;
    case "firepit_light_fire":
      levelState.fireLit = true; levelState.hasSticks = false;
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
      levelState.hasVeggies = false; levelState.hasStew = true;
      appendText(`<em>You put the veggies in the bowl of hot water. Finally...vegetable stew.</em>`);
      showText([{ text: "...", action: () => { screenTextBlocks = []; setScene("firepit"); } }]);
      break;
    case "firepit_pickup_stew":
      appendText(`<em>You pick up the stew. Time to take it back to the Beaver.</em>`);
      showText([ { text: "RETURN HOME", action: () => changeLocation("home") }, { text: "TO THE PATCH", hasUpdate: hasActionableObjective("patch"), action: () => changeLocation("patch") } ]);
      break;

    case "patch":
      let veggiesGone = levelState.hasVeggies || levelState.hasStew || levelState.stewGiven;
      appendText(veggiesGone ? "<em>A few wild onions and carrots…used to be here. Now it’s just dirt.</em>" : "<em>A few <span class='interactable item-veggies' onclick='handleInline(\"dig_up\")'>wild onions and carrots</span>.</em>");
      showText([{ text: "TO THE PIT", action: () => changeLocation("firepit") }]);
      break;
    case "patch_dig":
      appendText(`<em>You dig some of the vegetables up from the dirt. You gather the smallest onions and carrots you can find and put them in your sack.</em>`);
      showText([{ text: "TO THE PIT", action: () => changeLocation("firepit") }]);
      break;
  }
}

function highlightGoldenMoss(html) {
  if (!html || typeof html !== "string") return html;
  return html.replace(/\bgolden\s+moss\b/gi, (match) => `<span class="golden-moss">${match}</span>`);
}

function normalizeStoryText(raw) {
  if (!raw) return "";
  return raw.replace(/\r\n/g, "\n").trim();
}

function parseDialogue(text) {
  let speaker = 'narrator';
  let cleanText = text;

  const myopusMatch = text.match(/^Myopus:\s*"?([\s\S]+)"?$/);
  if (myopusMatch) {
    speaker = 'myopus'; cleanText = myopusMatch[1].replace(/"$/, '');
  } else {
    const beaverMatch = text.match(/^Beaver:\s*"?([\s\S]+)"?$/);
    if (beaverMatch) {
      speaker = 'beaver'; cleanText = beaverMatch[1].replace(/"$/, '');
    }
  }
  return { speaker, text: cleanText };
}

function isActionHintText(text) {
  return [
    "You could use your",
    "You could place your",
    "water looks clear enough to collect",
    "vegetable stew is bubbling",
  ].some((phrase) => text.includes(phrase));
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

  let lines = screenTextBlocks.join('\n\n').split('\n\n').map(l => l.trim()).filter(l => l);
  const parsedLines = lines.map(parseDialogue);

  const titleHtml = `<div class="location-title">${LOC_TITLES[levelState.currentLocation] || ""}</div>`;
  const textCont = document.createElement('div');
  textCont.className = 'story-text-container';
  
  for (let i = 0; i < parsedLines.length - 1; i++) {
     const row = document.createElement('div');
     const keepVisible = isActionHintText(parsedLines[i].text);
     row.className = `dialogue-row ${parsedLines[i].speaker}${keepVisible ? "" : " read-text"}`;
     const bubble = document.createElement('div');
     bubble.className = `bubble ${parsedLines[i].speaker}`;
     bubble.innerHTML = highlightGoldenMoss(normalizeStoryText(parsedLines[i].text));
     row.appendChild(bubble);
     textCont.appendChild(row);
  }

  const currentLine = parsedLines[parsedLines.length - 1];
  const currRow = document.createElement('div');
  currRow.className = `dialogue-row ${currentLine.speaker}`;
  const currBubble = document.createElement('div');
  currBubble.className = `bubble ${currentLine.speaker}`;
  currRow.appendChild(currBubble);
  textCont.appendChild(currRow);

  const btnCont = document.createElement('div');
  btnCont.className = 'button-container';
  btnCont.style.display = 'none'; 
  options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = opt.text;
    if (opt.hasUpdate) btn.classList.add('has-update');
    btn.onclick = (e) => { e.stopPropagation(); opt.action(); };
    btnCont.appendChild(btn);
  });

  container.innerHTML = titleHtml;
  container.appendChild(textCont);
  container.appendChild(btnCont);

  currentTypingToken = {};
  skipTyping = false;
  const token = currentTypingToken;

  if (currentLine.speaker === 'narrator') {
    currBubble.innerHTML = highlightGoldenMoss(normalizeStoryText(currentLine.text));
    btnCont.style.display = 'flex';
    btnCont.scrollIntoView({ behavior: "smooth", block: "end" });
  } else {
    typeHTML(currBubble, currentLine.text, token).then(() => {
       if (token === currentTypingToken) {
         btnCont.style.display = 'flex';
         btnCont.scrollIntoView({ behavior: "smooth", block: "end" });
       }
    });
  }
}

function transitionToLevel2() {
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

  setTimeout(() => { window.location.href = "../level_2/level2.html"; }, 1500); 
}

function fadeInFromBlack(chapterText = "Tap to enter") {
  const overlay = document.createElement("div");
  overlay.style.cssText = "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: black; z-index: 9999; display: flex; justify-content: center; align-items: center; color: rgba(255, 235, 220, 0.7); font-family: 'Museo Slab 500', Georgia, serif; font-size: 1.2rem; letter-spacing: 0.2em; text-transform: uppercase; cursor: pointer; opacity: 1; transition: opacity 1.5s ease-in-out;";
  
  const content = document.createElement("div");
  content.style.cssText = "display: flex; flex-direction: column; align-items: center; gap: 2.4rem; text-align: center;";

  const textSpan = document.createElement("span");
  textSpan.textContent = chapterText;

  const promptSpan = document.createElement("span");
  promptSpan.textContent = "Press any key to continue";
  promptSpan.style.cssText = "font-size: 0.78rem; letter-spacing: 0.18em; color: rgba(255, 235, 220, 0.62); animation: tapFade 2.4s ease-in-out infinite;";

  content.appendChild(textSpan);
  content.appendChild(promptSpan);
  overlay.appendChild(content);
  document.body.appendChild(overlay);

  function continueChapter() {
    if (overlay.dataset.transitioning === "true") return;
    overlay.dataset.transitioning = "true";

    const bgMusic = document.getElementById("bg-music");
    if (bgMusic) {
      bgMusic.volume = 1;
      bgMusic.play().catch(e => console.error("Audio play failed:", e));
    }

    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";

    setTimeout(() => {
      window.removeEventListener("keydown", continueChapter);
      overlay.remove();
    }, 1500);
  }

  overlay.addEventListener("click", continueChapter, { once: true });
  window.addEventListener("keydown", continueChapter, { once: true });
}

function updateInventory() {
  const panel = document.getElementById("inventory-panel");
  const list = document.getElementById("inventory-list");
  if (!panel || !list) return;

  const items = [];
  if (levelState.hasWood) items.push("Chunk of Wood");
  if (levelState.hasSticks) items.push("Twigs and Splinters");
  if (levelState.hasVeggies) items.push("Wild Onions and Carrots");
  
  if (levelState.hasBowl) items.push(levelState.hasWater ? "Bowl of Water" : "Wooden Bowl");
  if (levelState.hasStew && !levelState.bowlPlaced && !levelState.stewGiven) items.push("Vegetable Stew");

  if (items.length === 0) {
    panel.style.display = "none";
  } else {
    panel.style.display = "block";
    list.innerHTML = items.map(item => `<li>${item}</li>`).join("");
  }
}

function initGame() {
  fadeInFromBlack("Chapter 1: The Mosslands");
  changeLocation("home");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initGame);
} else {
  initGame();
}
