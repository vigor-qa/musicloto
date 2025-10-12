// === КОНФИГУРАЦИЯ ===
const TOTAL_TRACKS = 70; // ← 70 кнопок
const BASE_AUDIO_PATH = 'audio/';
const BASE_IMAGE_PATH = 'images/';
const AUDIO_EXTENSION = '.opus';
const IMAGE_EXTENSION = '.jpg';
const modalTrackNumber = document.getElementById('modal-track-number');

// Состояние ресурсов
const resources = Array.from({ length: TOTAL_TRACKS }, (_, i) => ({
  index: i,
  loaded: false,
  audio: null,
  image: null,
  loadPromise: null
}));

let playedCount = 0;

// DOM
const container = document.getElementById('buttons-container');
const modal = document.getElementById('modal');
const modalImage = document.getElementById('modal-image');
const modalLoader = document.getElementById('modal-loader');
const stopButton = document.querySelector('.stop-btn');
const completionMessage = document.getElementById('completion-message');

// === Создание 70 кнопок ===
for (let i = 1; i <= TOTAL_TRACKS; i++) {
  const btn = document.createElement('button');
  btn.className = 'number-btn';
  btn.textContent = i;
  btn.dataset.index = i - 1;
  btn.addEventListener('click', () => handleButtonClick(i - 1, btn));
  container.appendChild(btn);
}

// === Фоновая загрузка всех ресурсов ===
resources.forEach(res => {
  res.loadPromise = loadResource(res.index);
});

// === Загрузка одного ресурса ===
function loadResource(index) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = `${BASE_IMAGE_PATH}${index + 1}${IMAGE_EXTENSION}`;

    const audio = new Audio();
    audio.src = `${BASE_AUDIO_PATH}${index + 1}${AUDIO_EXTENSION}`;
    audio.preload = 'auto';
    audio.load();

    let imgLoaded = false;
    let audioLoaded = false;

    const checkComplete = () => {
      if (imgLoaded && audioLoaded) {
        resources[index].loaded = true;
        resources[index].image = img;
        resources[index].audio = audio;
        resolve();
      }
    };

    img.onload = img.onerror = () => {
      imgLoaded = true;
      checkComplete();
    };

    if (audio.readyState >= 2) {
      audioLoaded = true;
      checkComplete();
    } else {
      audio.addEventListener('canplaythrough', () => {
        audioLoaded = true;
        checkComplete();
      }, { once: true });
      audio.addEventListener('error', () => {
        console.warn(`⚠️ Не загружено: ${audio.src}`);
        audioLoaded = true;
        checkComplete();
      });
    }
  });
}

// === Обработка клика ===
async function handleButtonClick(index, button) {
  if (button.classList.contains('played')) return;

  // Показать модалку с загрузкой
  modalLoader.style.display = 'block';
  modalTrackNumber.style.display = 'none';
  modalImage.style.display = 'none';
  stopButton.style.display = 'none';
  modal.style.display = 'block';

  await resources[index].loadPromise;

  // Отобразить номер трека (на 1 больше индекса)
  const trackNumber = index + 1;
  modalTrackNumber.textContent = `№${trackNumber}`;
  modalTrackNumber.style.display = 'block';

  modalLoader.style.display = 'none';
  modalImage.src = resources[index].image.src;
  modalImage.style.display = 'block';
  stopButton.style.display = 'inline-block';

  const audio = resources[index].audio;
  audio.currentTime = 0;
  try {
    await audio.play();
  } catch (err) {
    console.error('Ошибка воспроизведения:', err);
    alert('Браузер не поддерживает OPUS или файл повреждён.');
  }

  const onEnded = () => {
    finishTrack(button);
    audio.removeEventListener('ended', onEnded);
  };
  audio.addEventListener('ended', onEnded);

  const stopHandler = () => {
    audio.pause();
    finishTrack(button);
    stopButton.removeEventListener('click', stopHandler);
  };
  stopButton.addEventListener('click', stopHandler, { once: true });

  const clickOutside = (e) => {
    if (e.target === modal) {
      stopButton.click();
      modal.removeEventListener('click', clickOutside);
    }
  };
  modal.addEventListener('click', clickOutside);
}

// === Завершение трека ===
function finishTrack(button) {
  modal.style.display = 'none';
  if (!button.classList.contains('played')) {
    button.classList.add('played');
    playedCount++;
    if (playedCount === TOTAL_TRACKS) {
      completionMessage.style.display = 'block';
    }
  }
}