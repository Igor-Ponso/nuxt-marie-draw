<template>
  <div class="page">
    <main class="shell">
      <section class="hero">
        <div class="tag">Lucky Day Toolkit</div>
        <h1 class="hero__title">Marie Draw</h1>
        <p class="hero__subtitle">
          Built because Marie is as indecisive as I am — we needed a tiny machine to choose for us
          when the options start piling up.
        </p>
      </section>

      <section class="board">
        <div class="panel entries">
          <header class="panel__header">
            <h2>Entrants</h2>
            <p class="panel__hint">Create your roster — duplicate names increase odds automatically.</p>
          </header>

          <form class="entry-form" @submit.prevent="addEntry">
            <label class="sr-only" for="entrant">Entrant name</label>
            <input
              id="entrant"
              v-model="entryName"
              class="entry-form__input"
              type="text"
              name="entrant"
              placeholder="Add a person, team, or prize"
              autocomplete="off"
              maxlength="60"
            />
            <button class="entry-form__button" type="submit" :disabled="!entryName.trim()">
              <span>Add</span>
            </button>
          </form>

          <TransitionGroup name="list" tag="ul" class="entry-list">
            <li v-for="(entry, index) in entries" :key="entry + index" class="entry-item">
              <span class="entry-item__name">{{ entry }}</span>
              <button class="entry-item__remove" type="button" @click="removeEntry(index)">
                <span class="sr-only">Remove {{ entry }}</span>
                ×
              </button>
            </li>
          </TransitionGroup>

          <p v-if="entries.length === 0" class="empty-state">
            Start by adding a few entrants. We'll keep them saved locally for you.
          </p>
        </div>

        <div class="panel draw">
          <header class="panel__header">
            <h2>Live Draw</h2>
            <p class="panel__hint">Playful anticipation with a cinematic reveal.</p>
          </header>

          <div class="stage">
            <div class="stage__glow"></div>
            <div class="stage__content">
              <Transition name="fade" mode="out-in">
                <div v-if="!result && entries.length === 0" key="empty" class="stage__placeholder">
                  <p>Add at least one entrant to start the draw.</p>
                </div>
                <div v-else key="roller" class="roller">
                  <div class="roller__window">
                    <ul class="roller__list">
                      <li
                        v-for="(entry, index) in animatedEntries"
                        :key="entry + '-' + index"
                        class="roller__item"
                        :class="{
                          'roller__item--active': index === highlightIndex,
                          'roller__item--winner': result && entry === result
                        }"
                      >
                        {{ entry }}
                      </li>
                    </ul>
                  </div>
                </div>
              </Transition>

              <Transition name="fade">
                <div v-if="result" key="result" class="result-banner" role="status" aria-live="polite">
                  <div class="result-banner__label">Winner</div>
                  <div class="result-banner__name">{{ result }}</div>
                </div>
              </Transition>

              <div class="confetti">
                <span
                  v-for="piece in confettiPieces"
                  :key="piece.id"
                  class="confetti__piece"
                  :style="{
                    left: piece.left,
                    animationDelay: piece.delay,
                    background: piece.color,
                    width: piece.size,
                    height: piece.size
                  }"
                ></span>
              </div>
            </div>
          </div>

          <div class="actions">
            <button class="draw-button" type="button" :disabled="entries.length === 0 || drawing" @click="startDraw">
              <span v-if="!drawing">Draw now</span>
              <span v-else>Drawing...</span>
            </button>
            <button
              class="reset-button"
              type="button"
              :disabled="entries.length === 0"
              @click="resetDraw"
            >
              Reset list
            </button>
          </div>

          <p class="microcopy">
            Tip: Share your screen, pump up the music, and let Marie Draw build unforgettable anticipation.
          </p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
const STORAGE_KEY = 'marie-draw-entries';

const entryName = ref('');
const entries = ref<string[]>([]);
const animatedEntries = computed(() => (entries.value.length ? entries.value : ['Waiting...']));
const highlightIndex = ref<number | null>(null);
const drawing = ref(false);
const result = ref<string | null>(null);
const confettiPieces = ref<
  Array<{ id: string; left: string; delay: string; color: string; size: string }>
>([]);
// Using ReturnType<typeof setTimeout> for broader compatibility without depending on NodeJS namespace types.
let highlightTimer: ReturnType<typeof setInterval> | null = null;
let drawTimeout: ReturnType<typeof setTimeout> | null = null;
let confettiTimeout: ReturnType<typeof setTimeout> | null = null;

onMounted(() => {
  if (import.meta.client) {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          entries.value = parsed.filter((value) => typeof value === 'string');
        }
      } catch (error) {
        console.warn('Unable to read stored entries', error);
      }
    }
  }
});

watch(
  entries,
  (value) => {
    if (import.meta.client) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    }
  },
  { deep: true }
);

function addEntry() {
  const trimmed = entryName.value.trim();
  if (!trimmed) return;
  entries.value.push(trimmed);
  entryName.value = '';
  focusInput();
}

function focusInput() {
  requestAnimationFrame(() => {
    const input = document.getElementById('entrant') as HTMLInputElement | null;
    input?.focus();
  });
}

function removeEntry(index: number) {
  entries.value.splice(index, 1);
  if (entries.value.length === 0) {
    stopHighlighting();
    result.value = null;
  }
}

function startDraw() {
  if (drawing.value || entries.value.length === 0) return;

  drawing.value = true;
  result.value = null;
  launchHighlightSequence();

  const duration = Math.max(2600, 900 + entries.value.length * 120);
  drawTimeout = setTimeout(() => {
    stopHighlighting();
    const winner = entries.value[Math.floor(Math.random() * entries.value.length)];
    result.value = winner;
    drawing.value = false;
    triggerConfetti();
  }, duration);
}

function launchHighlightSequence() {
  let iteration = 0;
  stopHighlighting();
  highlightTimer = setInterval(() => {
    if (entries.value.length === 0) return;
    highlightIndex.value = Math.floor(Math.random() * entries.value.length);
    iteration += 1;

    if (iteration > 10) {
      const slowDown = Math.min(350, 120 + iteration * 8);
      if (highlightTimer) {
        clearInterval(highlightTimer);
      }
      highlightTimer = setInterval(() => {
        if (entries.value.length === 0) return;
        highlightIndex.value = Math.floor(Math.random() * entries.value.length);
      }, slowDown);
    }
  }, 120);
}

function stopHighlighting() {
  if (highlightTimer) {
    clearInterval(highlightTimer);
    highlightTimer = null;
  }
  if (drawTimeout) {
    clearTimeout(drawTimeout);
    drawTimeout = null;
  }
}

function triggerConfetti() {
  const palette = ['#6c4cff', '#ff72d6', '#ffd166', '#4cc9f0', '#48f3a6'];
  const pieces = Array.from({ length: 36 }).map((_, index) => ({
    id: `${Date.now()}-${index}`,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 0.6}s`,
    color: palette[Math.floor(Math.random() * palette.length)],
    size: `${8 + Math.random() * 8}px`
  }));
  confettiPieces.value = pieces;

  if (confettiTimeout) {
    clearTimeout(confettiTimeout);
  }
  confettiTimeout = setTimeout(() => {
    confettiPieces.value = [];
  }, 2200);
}

function resetDraw() {
  entries.value = [];
  result.value = null;
  highlightIndex.value = null;
  stopHighlighting();
  if (import.meta.client) {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

onBeforeUnmount(() => {
  stopHighlighting();
  if (confettiTimeout) {
    clearTimeout(confettiTimeout);
  }
});
</script>

<style scoped>
.page {
  display: flex;
  justify-content: center;
  padding: clamp(2rem, 5vw, 4rem) clamp(1.5rem, 4vw, 4rem);
  min-height: 100vh;
}

.shell {
  display: flex;
  flex-direction: column;
  gap: clamp(2.5rem, 6vw, 4rem);
  width: min(1200px, 100%);
}

.hero {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  text-align: left;
}

.tag {
  align-self: flex-start;
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  background: rgba(108, 76, 255, 0.12);
  color: var(--accent-strong);
  font-size: 0.9rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 600;
}

.hero__title {
  font-size: clamp(2.5rem, 6vw, 3.75rem);
  margin: 0;
  line-height: 1.05;
}

.hero__subtitle {
  font-size: clamp(1rem, 2.2vw, 1.3rem);
  color: var(--text-muted);
  max-width: 680px;
  margin: 0;
}

.board {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: clamp(1.5rem, 4vw, 2.4rem);
}

.panel {
  position: relative;
  padding: clamp(1.75rem, 4vw, 2.5rem);
  border-radius: var(--border-radius);
  background: var(--card-gradient);
  box-shadow: var(--shadow-elevated);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.panel__header h2 {
  margin: 0;
  font-size: 1.6rem;
}

.panel__hint {
  margin: 0.25rem 0 0;
  color: var(--text-muted);
  font-size: 0.95rem;
}

.entry-form {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.75rem;
  background: rgba(255, 255, 255, 0.65);
  padding: 0.55rem 0.55rem 0.55rem 1rem;
  border-radius: calc(var(--border-radius) - 12px);
  border: 1px solid rgba(255, 255, 255, 0.7);
  box-shadow: inset 0 0 0 1px rgba(108, 76, 255, 0.08);
}

.entry-form__input {
  background: transparent;
  border: none;
  font-size: 1rem;
  outline: none;
  color: var(--text-main);
}

.entry-form__input::placeholder {
  color: rgba(74, 78, 104, 0.55);
}

.entry-form__button {
  padding: 0.65rem 1.6rem;
  border-radius: 999px;
  background: linear-gradient(120deg, var(--accent), var(--accent-strong));
  color: white;
  font-weight: 600;
  letter-spacing: 0.02em;
  box-shadow: 0 16px 30px rgba(84, 70, 255, 0.26);
}

.entry-form__button:hover:not(:disabled) {
  transform: translateY(-1px) scale(1.02);
}

.entry-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  max-height: 320px;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.entry-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1rem;
  border-radius: calc(var(--border-radius) - 18px);
  background: rgba(255, 255, 255, 0.8);
  box-shadow: inset 0 0 0 1px rgba(108, 76, 255, 0.08);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.entry-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(84, 70, 255, 0.15);
}

.entry-item__name {
  font-weight: 500;
}

.entry-item__remove {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(108, 76, 255, 0.14);
  color: var(--accent-strong);
  font-size: 1.1rem;
  display: grid;
  place-items: center;
}

.entry-item__remove:hover {
  background: rgba(108, 76, 255, 0.22);
}

.empty-state {
  margin: 1rem 0 0;
  color: var(--text-muted);
  font-size: 0.98rem;
}

.stage {
  position: relative;
  padding: clamp(1.4rem, 3vw, 2rem);
  border-radius: calc(var(--border-radius) - 10px);
  background: rgba(255, 255, 255, 0.72);
  box-shadow: inset 0 0 0 1px rgba(108, 76, 255, 0.1);
  overflow: hidden;
}

.stage__glow {
  position: absolute;
  inset: -30% -30% auto -30%;
  height: 65%;
  background: radial-gradient(circle, rgba(108, 76, 255, 0.35), transparent 70%);
  filter: blur(30px);
  opacity: 0.85;
  pointer-events: none;
}

.stage__content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.stage__placeholder {
  font-size: 1rem;
  color: var(--text-muted);
  text-align: center;
  min-height: 140px;
  display: grid;
  place-items: center;
}

.roller {
  width: min(420px, 100%);
  display: flex;
  justify-content: center;
}

.roller__window {
  width: 100%;
  max-width: 420px;
  border-radius: calc(var(--border-radius) - 18px);
  background: rgba(255, 255, 255, 0.96);
  padding: 1.1rem;
  box-shadow: inset 0 0 0 2px rgba(108, 76, 255, 0.12);
  overflow: hidden;
}

.roller__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.65rem;
}

.roller__item {
  padding: 0.9rem 1rem;
  border-radius: calc(var(--border-radius) - 20px);
  background: rgba(108, 76, 255, 0.08);
  color: var(--text-main);
  font-weight: 500;
  text-align: center;
  transition: transform 0.35s ease, background 0.35s ease, box-shadow 0.35s ease;
  box-shadow: inset 0 0 0 1px rgba(108, 76, 255, 0.12);
}

.roller__item--active {
  transform: scale(1.03);
  background: rgba(108, 76, 255, 0.25);
  box-shadow: 0 12px 24px rgba(108, 76, 255, 0.25);
}

.roller__item--winner {
  background: linear-gradient(120deg, #ffd166, #ff9a62);
  color: #5b3200;
  box-shadow: 0 25px 45px rgba(255, 161, 97, 0.35);
}

.result-banner {
  text-align: center;
  background: linear-gradient(120deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7));
  padding: 1rem 1.5rem;
  border-radius: calc(var(--border-radius) - 16px);
  box-shadow: inset 0 0 0 1px rgba(108, 76, 255, 0.18);
  animation: pulseGlow 2.4s ease-in-out infinite;
}

.result-banner__label {
  font-size: 0.9rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(108, 76, 255, 0.85);
  margin-bottom: 0.25rem;
}

.result-banner__name {
  font-size: 1.6rem;
  font-weight: 600;
}

.confetti {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.confetti__piece {
  position: absolute;
  top: calc(100% - 30px);
  border-radius: 999px;
  animation: confettiFloat 2.2s ease-in forwards;
}

.actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.draw-button {
  flex: 1;
  min-width: 160px;
  padding: 0.85rem 1.5rem;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--accent), #8a63ff);
  color: white;
  font-weight: 600;
  letter-spacing: 0.03em;
  box-shadow: 0 20px 40px rgba(96, 79, 255, 0.3);
  position: relative;
  overflow: hidden;
}

.draw-button::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0));
  opacity: 0;
  transition: opacity 0.3s ease;
  mix-blend-mode: screen;
}

.draw-button:hover:not(:disabled) {
  transform: translateY(-1px) scale(1.01);
}

.draw-button:hover:not(:disabled)::after {
  opacity: 1;
  animation: shimmer 1.2s linear infinite;
  background-size: 200% auto;
}

.reset-button {
  padding: 0.85rem 1.3rem;
  border-radius: 999px;
  background: rgba(108, 76, 255, 0.12);
  color: var(--accent-strong);
  font-weight: 500;
}

.microcopy {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-muted);
  line-height: 1.4;
}

.list-enter-active,
.list-leave-active {
  transition: all 0.35s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.list-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 768px) {
  .page {
    padding: 2rem 1.1rem 3rem;
  }

  .panel {
    gap: 1.25rem;
  }

  .entry-form {
    grid-template-columns: 1fr;
    padding: 0.75rem;
  }

  .entry-form__button {
    width: 100%;
  }

  .actions {
    flex-direction: column;
  }

  .reset-button {
    width: 100%;
    text-align: center;
  }
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
</style>
