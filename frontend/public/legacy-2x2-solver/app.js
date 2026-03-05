// ===== MAIN APPLICATION - 2025 Edition =====
// Fixed layout: Current move shows INSIDE cube viewport, no scrolling
// Fixed: Correct 2x2 cube state representation

let cubeEngine;
let state = "WWWWRRRRGGGGOOOOBBBB";
let speed = 300;
let scrambleHistory = [];
let currentSolution = [];

// Move descriptions for hints
const MOVE_DESCRIPTIONS = {
  U: "Top face clockwise",
  "U'": "Top face counter-clockwise",
  R: "Right face clockwise",
  "R'": "Right face counter-clockwise",
  F: "Front face clockwise",
  "F'": "Front face counter-clockwise",
  D: "Bottom face clockwise",
  "D'": "Bottom face counter-clockwise",
  L: "Left face clockwise",
  "L'": "Left face counter-clockwise",
  B: "Back face clockwise",
  "B'": "Back face counter-clockwise"
};

document.addEventListener("DOMContentLoaded", () => {
  cubeEngine = new CubeEngine("cubeCanvas");

  // Button listeners
  document.getElementById("scrambleBtn").addEventListener("click", doScramble);
  document.getElementById("solveBtn").addEventListener("click", doSolve);
  document.getElementById("resetBtn").addEventListener("click", doReset);

  // Slider listeners
  document.getElementById("scrambleLength").addEventListener("input", (e) => {
    document.getElementById("scrambleLengthValue").textContent = e.target.value;
  });

  document.getElementById("speed").addEventListener("input", (e) => {
    speed = parseInt(e.target.value);
    document.getElementById("speedValue").textContent = e.target.value + "ms";
  });

  // Manual move buttons
  document.querySelectorAll(".move-btn").forEach((btn) => {
    btn.addEventListener("click", () => doMove(btn.dataset.move));
  });

  // Help modal
  document.getElementById("helpBtn").addEventListener("click", () => {
    document.getElementById("helpModal").classList.add("visible");
  });

  document.getElementById("closeHelpBtn").addEventListener("click", () => {
    document.getElementById("helpModal").classList.remove("visible");
  });

  document.getElementById("helpModal").addEventListener("click", (e) => {
    if (e.target.id === "helpModal") {
      document.getElementById("helpModal").classList.remove("visible");
    }
  });

  updateUI();

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;

    switch (e.key.toLowerCase()) {
      case " ":
        e.preventDefault();
        doScramble();
        break;
      case "enter":
        e.preventDefault();
        doSolve();
        break;
      case "r":
        if (e.ctrlKey || e.metaKey) return;
        doReset();
        break;
      case "h":
      case "?":
        document.getElementById("helpModal").classList.add("visible");
        break;
      case "escape":
        document.getElementById("helpModal").classList.remove("visible");
        break;
      case "arrowleft":
        cubeEngine.camera.position.x -= 0.5;
        break;
      case "arrowright":
        cubeEngine.camera.position.x += 0.5;
        break;
      case "arrowup":
        cubeEngine.camera.position.y += 0.5;
        break;
      case "arrowdown":
        cubeEngine.camera.position.y -= 0.5;
        break;
    }
  });
});

async function doScramble() {
  const len = parseInt(document.getElementById("scrambleLength").value);

  state = reset();
  scrambleHistory = generateScramble(len);
  currentSolution = [];

  document.getElementById("scrambleDisplay").textContent = scrambleHistory.join(" ");
  document.getElementById("solutionDisplay").textContent = "—";
  clearStats();
  resetSolutionStrip();
  hideMoveOverlay();

  setStatus("🔀 Scrambling...", "info");
  showProgress(true);

  for (let i = 0; i < scrambleHistory.length; i++) {
    state = applyMove(scrambleHistory[i], state);
    cubeEngine.renderState(state);
    updateUI();
    updateProgress(((i + 1) / scrambleHistory.length) * 100);
    await sleep(50);
  }

  showProgress(false);
  setStatus("✅ Scrambled! Ready to solve.", "success");
  console.log("Scrambled state:", state);
}

async function doSolve() {
  if (isSolved(state)) {
    setStatus("✅ Already solved!", "success");
    return;
  }

  const algo = document.getElementById("algorithm").value;
  const algoName = algo === "bfs" ? "BFS" : algo === "astar" ? "A*" : "IDS";

  setStatus(`🔍 Solving with ${algoName}...`, "info");
  showProgress(true);
  hideMoveOverlay();

  const t0 = Date.now();
  let result;

  try {
    if (algo === "bfs") {
      result = await solveBFS(state, (msg) => setStatus(`🔍 ${msg}`, "info"));
    } else if (algo === "astar") {
      result = await solveAStar(state, (msg) => setStatus(`🔍 ${msg}`, "info"));
    } else {
      result = await solveIDS(state, (msg) => setStatus(`🔍 ${msg}`, "info"));
    }

    const time = ((Date.now() - t0) / 1000).toFixed(3);

    if (result.solution) {
      currentSolution = result.solution;

      document.getElementById("solutionDisplay").textContent =
        result.solution.length > 0 ? result.solution.join(" ") : "(Already solved)";
      document.getElementById("algoUsed").textContent = algoName;
      document.getElementById("moveCount").textContent = result.solution.length;
      document.getElementById("nodesExplored").textContent = result.nodesExplored.toLocaleString();
      document.getElementById("solveTime").textContent = time + "s";

      // Populate solution strip
      populateSolutionStrip(result.solution);

      if (result.solution.length > 0) {
        setStatus("🎯 Executing solution...", "info");

        for (let i = 0; i < result.solution.length; i++) {
          const move = result.solution[i];

          // Show current move in overlay
          showMoveOverlay(move, i, result.solution.length);

          // Highlight in solution strip
          highlightSolutionMove(i);

          // Apply move
          state = applyMove(move, state);
          cubeEngine.renderState(state);
          updateUI();
          updateProgress(((i + 1) / result.solution.length) * 100);

          await sleep(speed);
        }

        hideMoveOverlay();
      }

      // Verify
      if (isSolved(state)) {
        setStatus(`🎉 Solved in ${result.solution.length} moves!`, "success");
        markAllSolutionMovesCompleted();
        createConfetti();
      } else {
        setStatus(`⚠️ Verification failed`, "error");
      }
    } else {
      setStatus(`❌ ${result.error}`, "error");
    }
  } catch (e) {
    setStatus(`❌ Error: ${e.message}`, "error");
    console.error(e);
  }

  showProgress(false);
}

function doReset() {
  state = reset();
  scrambleHistory = [];
  currentSolution = [];
  cubeEngine.renderState(state);

  document.getElementById("scrambleDisplay").textContent = "—";
  document.getElementById("solutionDisplay").textContent = "—";
  clearStats();
  resetSolutionStrip();
  hideMoveOverlay();

  updateUI();
  setStatus("↺ Reset complete", "info");
}

async function doMove(move) {
  state = applyMove(move, state);
  cubeEngine.renderState(state);
  updateUI();
}

function updateUI() {
  document.getElementById("stateDisplay").textContent = state;

  const s = state;
  const c = (ch) => `<span class="${ch}">${ch}</span>`;
  document.getElementById("asciiCube").innerHTML = `      ${c(s[0])} ${c(s[1])}
      ${c(s[2])} ${c(s[3])}
 ${c(s[16])} ${c(s[17])}  ${c(s[8])} ${c(s[9])}  ${c(s[4])} ${c(s[5])}  ${c(s[20])} ${c(s[21])}
 ${c(s[18])} ${c(s[19])}  ${c(s[10])} ${c(s[11])}  ${c(s[6])} ${c(s[7])}  ${c(s[22])} ${c(s[23])}
      ${c(s[12])} ${c(s[13])}
      ${c(s[14])} ${c(s[15])}`;
}

function setStatus(msg, type) {
  const statusEl = document.getElementById("status");
  const iconEl = document.getElementById("statusIcon");
  const badgeEl = document.getElementById("statusBadge");

  statusEl.textContent = msg;
  badgeEl.classList.remove("success", "error");

  if (type === "success") {
    iconEl.textContent = "✨";
    badgeEl.classList.add("success");
  } else if (type === "error") {
    iconEl.textContent = "❌";
    badgeEl.classList.add("error");
  } else {
    iconEl.textContent = "⚡";
  }
}

function showProgress(show) {
  const container = document.getElementById("progressContainer");
  container.classList.toggle("visible", show);
}

function updateProgress(pct) {
  document.getElementById("progressFill").style.width = pct + "%";
}

function clearStats() {
  document.getElementById("algoUsed").textContent = "—";
  document.getElementById("moveCount").textContent = "—";
  document.getElementById("nodesExplored").textContent = "—";
  document.getElementById("solveTime").textContent = "—";
}

// ===== Current Move Overlay (inside cube viewport) =====
function showMoveOverlay(move, stepIndex, totalSteps) {
  const overlay = document.getElementById("moveOverlay");
  const stepNum = document.getElementById("currentStepNum");
  const moveName = document.getElementById("currentMoveName");
  const moveDesc = document.getElementById("currentMoveDesc");
  const progressText = document.getElementById("moveProgressText");

  stepNum.textContent = stepIndex + 1;
  moveName.textContent = move;
  moveDesc.textContent = MOVE_DESCRIPTIONS[move] || "Execute move";
  progressText.textContent = `Step ${stepIndex + 1} of ${totalSteps}`;

  overlay.classList.add("visible");
}

function hideMoveOverlay() {
  document.getElementById("moveOverlay").classList.remove("visible");
}

// ===== Solution Strip (below cube) =====
function resetSolutionStrip() {
  const movesContainer = document.getElementById("solutionMoves");
  const countEl = document.getElementById("solutionMoveCount");

  movesContainer.innerHTML =
    '<span class="solution-placeholder">Scramble the cube, then click Solve</span>';
  countEl.textContent = "";
}

function populateSolutionStrip(solution) {
  const movesContainer = document.getElementById("solutionMoves");
  const countEl = document.getElementById("solutionMoveCount");

  if (solution.length === 0) {
    movesContainer.innerHTML = '<span class="solution-placeholder">Already solved!</span>';
    countEl.textContent = "";
    return;
  }

  countEl.textContent = `${solution.length} moves`;

  let html = "";
  solution.forEach((move, index) => {
    html += `<span class="solution-move" id="sol-move-${index}">${move}</span>`;
  });
  movesContainer.innerHTML = html;
}

function highlightSolutionMove(index) {
  // Remove active from all
  document.querySelectorAll(".solution-move").forEach((el) => {
    el.classList.remove("active");
  });

  // Mark previous as completed
  for (let i = 0; i < index; i++) {
    const el = document.getElementById(`sol-move-${i}`);
    if (el) el.classList.add("completed");
  }

  // Highlight current
  const currentEl = document.getElementById(`sol-move-${index}`);
  if (currentEl) {
    currentEl.classList.add("active");
  }
}

function markAllSolutionMovesCompleted() {
  document.querySelectorAll(".solution-move").forEach((el) => {
    el.classList.remove("active");
    el.classList.add("completed");
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ===== Confetti Effect =====
function createConfetti() {
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const colors = ["#22c55e", "#3b82f6", "#f97316", "#eab308", "#ef4444", "#8b5cf6"];

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 4;

    for (let i = 0; i < particleCount; i++) {
      const confetti = document.createElement("div");
      confetti.style.position = "fixed";
      confetti.style.width = randomInRange(8, 14) + "px";
      confetti.style.height = randomInRange(8, 14) + "px";
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.left = randomInRange(0, window.innerWidth) + "px";
      confetti.style.top = "-20px";
      confetti.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
      confetti.style.pointerEvents = "none";
      confetti.style.zIndex = "10000";
      confetti.style.opacity = "1";
      confetti.style.transition = "all 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
      confetti.style.transform = `rotate(${randomInRange(0, 360)}deg)`;

      document.body.appendChild(confetti);

      requestAnimationFrame(() => {
        confetti.style.top = window.innerHeight + "px";
        confetti.style.left = parseFloat(confetti.style.left) + randomInRange(-150, 150) + "px";
        confetti.style.opacity = "0";
        confetti.style.transform = `rotate(${randomInRange(0, 720)}deg)`;
      });

      setTimeout(() => confetti.remove(), 2500);
    }
  }, 80);
}
