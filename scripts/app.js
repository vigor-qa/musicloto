// Пути к ресурсам
const BASE_AUDIO_PATH = 'audio/';
const BASE_IMAGE_PATH = 'images/';
const TOTAL_RESOURCES = 20; // 10 аудио + 10 изображений

let loadedCount = 0;
let audioCache = [];
let imageCache = [];

const loadingScreen = document.getElementById('loading-screen');
const gameContainer = document.getElementById('game-container');
const progressText = document.getElementById('progress');

// Функция обновления прогресса
function updateProgress() {
  loadedCount++;
  progressText.textContent = `${loadedCount} из ${TOTAL_RESOURCES}`;
  if (loadedCount === TOTAL_RESOURCES) {
    // Все ресурсы загружены — показываем игру
    setTimeout(() => {
      loadingScreen.style.display = 'none';
      gameContainer.style.display = 'block';
      initGame();
    }, 300); // небольшая задержка для плавности
  }
}

// Предзагрузка изображений
function preloadImages() {
  for (let i = 1; i <= 10; i++) {
    const img = new Image();
    img.src = `${BASE_IMAGE_PATH}${i}.jpg`;
    img.onload = updateProgress;
    img.onerror = () => {
      console.error(`Не удалось загрузить изображение: ${img.src}`);
      updateProgress(); // всё равно считаем как "загруженный"
    };
    imageCache.push(img);
  }
}

// Предзагрузка аудио
function preloadAudio() {
  for (let i = 1; i <= 10; i++) {
    const audio = new Audio();
    audio.src = `${BASE_AUDIO_PATH}${i}.mp3`;
    audio.preload = 'auto';
    audio.load(); // явная загрузка

    // Для кросс-браузерности: ждём события
    if (audio.readyState >= 2) {
      // Достаточно метаданных — считаем загруженным
      updateProgress();
    } else {
      audio.addEventListener('canplaythrough', () => updateProgress(), { once: true });
      audio.addEventListener('error', () => {
        console.error(`Не удалось загрузить аудио: ${audio.src}`);
        updateProgress();
      });
    }
    audioCache.push(audio);
  }
}

// Инициализация игры (создание кнопок и логики)
function initGame() {
  let playedCount = 0;
  const container = document.getElementById('buttons-container');
  const modal = document.getElementById('modal');
  const modalImage = document.getElementById('modal-image');
  const stopButton = document.querySelector('.stop-btn');
  const completionMessage = document.getElementById('completion-message');

  // Создание кнопок
  for (let i = 1; i <= 10; i++) {
    const btn = document.createElement('button');
    btn.className = 'number-btn';
    btn.textContent = i;
    btn.dataset.index = i - 1;
    btn.addEventListener('click', () => playTrack(i - 1, btn));
    container.appendChild(btn);
  }

  // Воспроизведение трека (используем предзагруженное аудио)
  function playTrack(index, button) {
    if (button.classList.contains('played')) return;

    // Остановить текущее аудио
    audioCache.forEach(a => {
      if (!a.paused) a.pause();
    });

    const audio = audioCache[index];
    audio.currentTime = 0; // сброс позиции

    modalImage.src = imageCache[index].src;
    modal.style.display = 'block';

    audio.onended = () => finishTrack(button);
    audio.play().catch(err => {
      console.error('Ошибка воспроизведения:', err);
    });
  }

  function finishTrack(button) {
    modal.style.display = 'none';
    if (!button.classList.contains('played')) {
      button.classList.add('played');
      playedCount++;
      if (playedCount === 10) {
        completionMessage.style.display = 'block';
      }
    }
  }

  stopButton.addEventListener('click', () => {
    audioCache.forEach(a => a.pause());
    modal.style.display = 'none';
    // Найти текущую активную кнопку (не played)
    const currentBtn = Array.from(document.querySelectorAll('.number-btn'))
      .find(btn => !btn.classList.contains('played'));
    if (currentBtn) finishTrack(currentBtn);
  });

  window.addEventListener('click', (e) => {
    if (e.target === modal) stopButton.click();
  });
}

// Запуск предзагрузки
preloadImages();
preloadAudio();