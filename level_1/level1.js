<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Level 1 — The Mosslands</title>
  <style>
    * { box-sizing: border-box; }
    :root {
      --scene-bg-image: none;
      --scene-img-position: center center;
      --scene-img-size: cover;
      --scene-edge-vignette: radial-gradient(
        ellipse 80% 80% at 50% 50%,
        rgba(0, 0, 0, 0) 45%,
        rgba(70, 50, 30, 0.4) 100%
      );
      --scene-photo-opacity: 0.55;
      --scene-photo-fade-duration: 2s;
    }
    body {
      margin: 0;
      min-height: 100vh;
      position: relative;
      background: #e6dfd3;
      color: #2c1e16;
      font-family: "Georgia", "Times New Roman", serif;
      overflow-x: hidden;
    }
    
    /* --- INVENTORY --- */
    #inventory-panel {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(10, 24, 32, 0.85);
      color: rgba(255, 235, 220, 0.9);
      padding: 15px 25px;
      border: 1px solid rgba(255, 235, 220, 0.3);
      display: none;
      z-index: 100;
      font-family: "Museo Slab 500", serif;
      border-radius: 8px;
    }
    #inventory-panel h3 {
      margin: 0 0 10px 0;
      font-size: 1.2rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      border-bottom: 1px solid rgba(255, 235, 220, 0.3);
      padding-bottom: 5px;
    }
    #inventory-list { list-style-type: square; margin: 0; padding: 0 0 0 15px; }
    #inventory-list li { margin-bottom: 6px; font-size: 1rem; }

    /* --- SCENE BACKDROP --- */
    #sceneBackdrop {
      position: fixed;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      background-color: #e6dfd3;
    }
    .scene-backdrop-photo {
      position: absolute;
      inset: 0;
      background-image: var(--scene-bg-image);
      background-size: var(--scene-img-size);
      background-position: var(--scene-img-position);
      background-repeat: no-repeat;
      opacity: var(--scene-photo-opacity);
      transition: opacity var(--scene-photo-fade-duration, 2s) ease-in-out;
    }
    .scene-backdrop-photo.scene-backdrop-photo--no-transition { transition: none; }
    .scene-backdrop-overlays {
      position: absolute;
      inset: 0;
      background-image: var(--scene-bg-gradient), var(--scene-edge-vignette);
      background-size: cover, cover;
      background-position: center center, center center;
      background-repeat: no-repeat, no-repeat;
    }

    /* --- VN PORTRAITS --- */
    #vn-portraits {
      position: fixed;
      inset: 0;
      z-index: 1;
      pointer-events: none;
    }
    .vn-portrait {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 300px;
      height: 450px;
      transition: opacity 0.5s, transform 0.5s;
    }
    .vn-portrait.left { left: 5vw; }
    .vn-portrait.right { right: 5vw; }
    .vn-portrait.hidden { opacity: 0; transform: translateY(calc(-50% + 40px)); }
    
    /* Bouncing Animation */
    .vn-portrait.speaking { animation: vn-bounce 0.4s infinite alternate ease-in-out; }
    @keyframes vn-bounce {
      from { transform: translateY(-50%); }
      to { transform: translateY(calc(-50% - 15px)); }
    }

    .vn-portrait img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      object-position: bottom;
    }
    
    /* Temporary placeholders */
    .portrait-placeholder {
      position: absolute; bottom: 80px; left: 0; right: 0;
      text-align: center; background: rgba(0,0,0,0.6); color: white;
      padding: 10px; border-radius: 8px; font-family: sans-serif;
    }
    .vn-portrait img[style*="display: none"] + .portrait-placeholder { display: block; }
    .vn-portrait img + .portrait-placeholder { display: none; }

    /* --- STORY PANEL & BUBBLES --- */
    #storyPanel {
      position: relative;
      z-index: 2;
      max-width: 44rem;
      margin: 4rem auto;
      padding: 3rem 2.5rem;
      background: rgba(230, 223, 211, 0.85);
      border-radius: 12px;
      border: 1px solid rgba(44, 30, 22, 0.15);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      backdrop-filter: blur(4px);
    }
    .location-title {
      text-align: center;
      font-weight: bold;
      font-size: 2.2rem;
      margin-bottom: 2rem;
      letter-spacing: 2px;
      font-family: "Palatino Linotype", "Book Antiqua", Palatino, serif;
    }

    .story-text-container {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      margin-bottom: 2.5rem;
    }

    .dialogue-row { display: flex; width: 100%; }
    .dialogue-row.myopus { justify-content: flex-start; }
    .dialogue-row.beaver { justify-content: flex-end; }
    .dialogue-row.narrator { justify-content: center; }

    /* Dim previous text blocks */
    .dialogue-row.read-text { opacity: 0.45; transition: opacity 0.4s ease; }

    .bubble {
      position: relative;
      max-width: 85%;
      padding: 1rem 1.5rem;
      line-height: 1.65;
      font-size: 1.15rem;
      border-radius: 12px;
    }

    .bubble.narrator {
      background: transparent;
      text-align: center;
      max-width: 100%;
      padding: 0.5rem;
    }

    /* Player Bubble */
    .bubble.myopus {
      background: #fcf4e8;
      border: 1px solid rgba(44, 30, 22, 0.2);
      border-bottom-left-radius: 0;
      box-shadow: 2px 2px 8px rgba(0,0,0,0.05);
    }
    .bubble.myopus::after {
      content: ''; position: absolute; bottom: -1px; left: -12px;
      border-width: 12px 12px 0 0; border-style: solid;
      border-color: #fcf4e8 transparent transparent transparent;
      filter: drop-shadow(-1px 1px 0px rgba(44,30,22,0.2));
    }

    /* NPC Bubble */
    .bubble.beaver {
      background: #f0f4ec;
      border: 1px solid rgba(44, 30, 22, 0.2);
      border-bottom-right-radius: 0;
      box-shadow: 2px 2px 8px rgba(0,0,0,0.05);
    }
    .bubble.beaver::after {
      content: ''; position: absolute; bottom: -1px; right: -12px;
      border-width: 12px 0 0 12px; border-style: solid;
      border-color: #f0f4ec transparent transparent transparent;
      filter: drop-shadow(1px 1px 0px rgba(44,30,22,0.2));
    }

    .golden-moss {
      color: #b8860b;
      font-weight: 600;
      text-shadow: 0 0 6px rgba(255, 230, 140, 0.95), 0 0 14px rgba(255, 200, 80, 0.85);
    }
    
    .interactable { font-weight: bold; text-decoration: underline; cursor: pointer; transition: opacity 0.2s; }
    .interactable:hover { opacity: 0.7; }
    .item-wood { color: #8b5a2b; }
    .item-veggies { color: #4f634c; }
    .item-beaver { color: #8c4631; }
    .item-water { color: #4a7c82; }
    .item-stew { color: #b07d3b; }

    .button-container {
      display: flex;
      justify-content: center;
      gap: 1.5rem;
      flex-wrap: wrap;
    }
    #storyPanel button {
      flex: 0 1 auto; width: auto; padding: 0.5rem 1rem;
      font-size: 0.95rem; border: none;
      border-top: 1px solid rgba(44, 30, 22, 0.3); border-bottom: 1px solid rgba(44, 30, 22, 0.3);
      background: transparent; color: #2c1e16; cursor: pointer;
      font-family: inherit; text-transform: uppercase; letter-spacing: 1px; transition: background 0.2s;
    }
    #storyPanel button:hover { background: rgba(44, 30, 22, 0.05); }

    /* Overlay pulse animation */
    @keyframes tapFade {
      0% { opacity: 0.25; }
      50% { opacity: 0.9; }
      100% { opacity: 0.25; }
    }
  </style>
</head>
<body>
<audio id="bg-music" src="../music/Setting Off.mp3" loop></audio>
  <div id="inventory-panel">
    <h3>Inventory</h3>
    <ul id="inventory-list"></ul>
  </div>

  <div id="sceneBackdrop" aria-hidden="true">
    <div class="scene-backdrop-photo"></div>
    <div class="scene-backdrop-overlays"></div>
  </div>

  <div id="vn-portraits">
    <div id="portrait-myopus" class="vn-portrait left hidden">
      <img src="images/myopus.png" alt="Myopus" onerror="this.style.display='none'">
      <div class="portrait-placeholder">Myopus</div>
    </div>
    <div id="portrait-beaver" class="vn-portrait right hidden">
      <img src="images/beaver.png" alt="Beaver" onerror="this.style.display='none'">
      <div class="portrait-placeholder">Beaver</div>
    </div>
  </div>

  <div id="storyPanel">
    <div id="adventureBox"></div>
  </div>

  <script>
    const BACKDROP_IMAGES = {
      home: "images/home_bg.png",
      brook: "images/brook_bg.png",
      firepit: "images/firepit_bg.png",
      patch: "images/patch_bg.png"
    };

    const LOC_TITLES = { home: "Home", brook: "The