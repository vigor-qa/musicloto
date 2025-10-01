// Пути к ресурсам
const BASE_AUDIO_PATH = 'audio/';
const BASE_IMAGE_PATH = 'photo/';

// Генерация путей для 10 элементов
const audioSrc = Array.from({ length: 10 }, (_, i) => `${BASE_AUDIO_PATH}${i + 1}.mp3`);
const photoSrc = Array.from({ length: 10 }, (_, i) => `${BASE_IMAGE_PATH}${i + 1}.jpg`);

let currentAudio = null;
let currentButton = null;

// DOM-элементы
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

// Воспроизведение трека
function playTrack(index, button) {
  // Остановить текущее аудио, если играет
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  // Создать новое аудио
  const audio = new Audio(audioSrc[index]);
  currentAudio = audio;
  currentButton = button;

  // Обновить изображение и показать модалку
  modalImage.src = photoSrc[index];
  modal.style.display = 'block';

  // Завершение воспроизведения
  audio.onended = finishTrack;

  // Воспроизвести
  audio.play().catch(err => {
    console.error('Ошибка воспроизведения аудио:', err);
    alert('Не удалось воспроизвести аудио. Проверьте файлы в папке audio/');
  });
}

// Остановка вручную
stopButton.addEventListener('click', stopAudio);

function stopAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  finishTrack();
}

// Завершение: закрыть модалку, удалить кнопку
function finishTrack() {
  modal.style.display = 'none';

  if (currentButton) {
    currentButton.remove();
    currentButton = null;
  }

  // Проверка завершения игры
  if (document.querySelectorAll('.number-btn').length === 0) {
    completionMessage.style.display = 'block';
  }
}

// Закрытие модалки по клику вне контента
window.addEventListener('click', (event) => {
  if (event.target === modal) {
    stopAudio();
  }
});