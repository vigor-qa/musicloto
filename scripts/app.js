// Пути
const BASE_AUDIO_PATH = 'audio/';
const BASE_IMAGE_PATH = 'images/';

// Состояние ресурсов: { loaded: false, audio: null, image: null, promise: Promise }
const resources = Array.from({ length: 10 }, (_, i) => ({
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

// === 1. Создаём кнопки сразу ===
for (let i = 1; i <= 10; i++) {
  const btn = document.createElement('button');
  btn.className = 'number-btn';
  btn.textContent = i;
  btn.dataset.index = i - 1;
  btn.addEventListener('click', () => handleButtonClick(i - 1, btn));
  container.appendChild(btn);
}

// === 2. Начинаем фоновую загрузку ВСЕХ ресурсов ===
resources.forEach(res => {
  res.loadPromise = loadResource(res.index);
});

// === Функция загрузки одного ресурса ===
function loadResource(index) {
  return new Promise((resolve, reject) => {
    // Загрузка изображения
    const img = new Image();
    img.src = `${BASE_IMAGE_PATH}${index + 1}.jpg`;
    
    // Загрузка аудио
    const audio = new Audio();
    audio.src = `${BASE_AUDIO_PATH}${index + 1}.mp3`;
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

    img.onload = () => {
      imgLoaded = true;
      checkComplete();
    };
    img.onerror = () => {
      console.warn(`Изображение ${index + 1} не загружено`);
      imgLoaded = true;
      checkComplete();
    };

    // Аудио: ждём готовности к воспроизведению
    if (audio.readyState >= 2) {
      audioLoaded = true;
      checkComplete();
    } else {
      audio.addEventListener('canplaythrough', () => {
        audioLoaded = true;
        checkComplete();
      }, { once: true });
      audio.addEventListener('error', () => {
        console.warn(`Аудио ${index + 1} не загружено`);
        audioLoaded = true;
        checkComplete();
      });
    }
  });
}

// === 3. Обработка клика по кнопке ===
async function handleButtonClick(index, button) {
  if (button.classList.contains('played')) return;

  // Показать модалку с загрузкой
  modalLoader.style.display = 'block';
  modalImage.style.display = 'none';
  stopButton.style.display = 'none';
  modal.style.display = 'block';

  // Ждём, пока ресурс загрузится (даже если он уже грузится)
  await resources[index].loadPromise;

  // Теперь ресурс готов
  modalLoader.style.display = 'none';
  modalImage.src = resources[index].image.src;
  modalImage.style.display = 'block';
  stopButton.style.display = 'inline-block';

  // Воспроизведение
  const audio = resources[index].audio;
  audio.currentTime = 0;
  audio.play().catch(err => console.error('Ошибка воспроизведения:', err));

  // Обработка завершения
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

  // Закрытие по клику вне
  const clickOutside = (e) => {
    if (e.target === modal) {
      stopButton.click();
      modal.removeEventListener('click', clickOutside);
    }
  };
  modal.addEventListener('click', clickOutside);
}

// === 4. Завершение трека ===
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