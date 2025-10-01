// === КОНФИГУРАЦИЯ ===
const TOTAL_TRACKS = 34;
const BASE_AUDIO_PATH = 'audio/';
const BASE_IMAGE_PATH = 'images/';
const AUDIO_EXTENSION = '.opus'; // ← теперь .opus
const IMAGE_EXTENSION = '.jpg';  // можно изменить на .webp, если используете

// Состояние ресурсов
const resources = Array.from({ length: TOTAL_TRACKS }, (_, i) => ({
  index: i,
  loaded: false,
  audio: null,
  image: null,
  loadPromise: null
}));

let playedCount = 0;

// DOM элементы
const container = document.getElementById('buttons-container');
const modal = document.getElementById('modal');
const modalImage = document.getElementById('modal-image');
const modalLoader = document.getElementById('modal-loader');
const stopButton = document.querySelector('.stop-btn');
const completionMessage = document.getElementById('completion-message');

// === 1. Создание кнопок (1 до 34) ===
for (let i = 1; i <= TOTAL_TRACKS; i++) {
  const btn = document.createElement('button');
  btn.className = 'number-btn';
  btn.textContent = i;
  btn.dataset.index = i - 1;
  btn.addEventListener('click', () => handleButtonClick(i - 1, btn));
  container.appendChild(btn);
}

// === 2. Фоновая загрузка всех ресурсов ===
resources.forEach(res => {
  res.loadPromise = loadResource(res.index);
});

// === Загрузка одного ресурса ===
function loadResource(index) {
  return new Promise((resolve) => {
    // Изображение
    const img = new Image();
    img.src = `${BASE_IMAGE_PATH}${index + 1}${IMAGE_EXTENSION}`;

    // Аудио в формате .opus
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

    // Обработка изображения
    img.onload = img.onerror = () => {
      imgLoaded = true;
      checkComplete();
    };

    // Обработка аудио
    if (audio.readyState >= 2) {
      audioLoaded = true;
      checkComplete();
    } else {
      // canplaythrough — достаточно данных для воспроизведения без пауз
      audio.addEventListener('canplaythrough', () => {
        audioLoaded = true;
        checkComplete();
      }, { once: true });

      // На случай ошибки (например, неподдерживаемый формат)
      audio.addEventListener('error', () => {
        console.warn(`⚠️ Не удалось загрузить аудио: ${audio.src}`);
        audioLoaded = true; // всё равно разблокируем, чтобы не зависнуть
        checkComplete();
      });
    }
  });
}

// === Обработка клика по кнопке ===
async function handleButtonClick(index, button) {
  if (button.classList.contains('played')) return;

  // Показать модалку с загрузкой
  modalLoader.style.display = 'block';
  modalImage.style.display = 'none';
  stopButton.style.display = 'none';
  modal.style.display = 'block';

  // Ждём, пока именно этот ресурс загрузится
  await resources[index].loadPromise;

  // Отображаем изображение
  modalLoader.style.display = 'none';
  modalImage.src = resources[index].image.src;
  modalImage.style.display = 'block';
  stopButton.style.display = 'inline-block';

  // Воспроизведение аудио
  const audio = resources[index].audio;
  audio.currentTime = 0; // сброс позиции
  try {
    await audio.play();
  } catch (err) {
    console.error('Не удалось воспроизвести аудио:', err);
    alert('Браузер не поддерживает формат OPUS или аудио повреждено.');
  }

  // Обработка завершения воспроизведения
  const onEnded = () => {
    finishTrack(button);
    audio.removeEventListener('ended', onEnded);
  };
  audio.addEventListener('ended', onEnded);

  // Кнопка СТОП
  const stopHandler = () => {
    audio.pause();
    finishTrack(button);
    stopButton.removeEventListener('click', stopHandler);
  };
  stopButton.addEventListener('click', stopHandler, { once: true });

  // Закрытие модалки по клику вне контента
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