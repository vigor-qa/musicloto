// Пути к ресурсам
const BASE_AUDIO_PATH = 'audio/';
const BASE_IMAGE_PATH = 'images/';

// Генерация путей для 10 элементов
const audioSrc = Array.from({ length: 10 }, (_, i) => `${BASE_AUDIO_PATH}${i + 1}.mp3`);
const imageSrc = Array.from({ length: 10 }, (_, i) => `${BASE_IMAGE_PATH}${i + 1}.jpg`);

let currentAudio = null;
let playedCount = 0; // Счётчик сыгранных уникальных кнопок

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
  // Если уже сыграно — не реагировать
  if (button.classList.contains('played')) {
    return;
  }

  // Остановить текущее аудио
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  const audio = new Audio(audioSrc[index]);
  currentAudio = audio;

  // Показать модалку
  modalImage.src = imageSrc[index];
  modal.style.display = 'block';

  // Обработка завершения
  audio.onended = () => finishTrack(button);

  // Воспроизвести
  audio.play().catch(err => {
    console.error('Ошибка воспроизведения:', err);
    alert('Не удалось воспроизвести аудио. Проверьте папку audio/');
  });
}

// Остановка вручную
stopButton.addEventListener('click', () => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  // Закрыть модалку и пометить кнопку как сыгранную
  const buttons = document.querySelectorAll('.number-btn');
  const currentBtn = Array.from(buttons).find(btn =>
    !btn.classList.contains('played')
  );
  if (currentBtn) finishTrack(currentBtn);
});

// Завершение: пометить кнопку и проверить победу
function finishTrack(button) {
  modal.style.display = 'none';

  // Пометить как сыгранную (только если ещё не помечена)
  if (!button.classList.contains('played')) {
    button.classList.add('played');
    playedCount++;

    // Проверка завершения
    if (playedCount === 10) {
      completionMessage.style.display = 'block';
    }
  }
}

// Закрытие модалки по клику вне контента
window.addEventListener('click', (event) => {
  if (event.target === modal) {
    stopButton.click(); // триггерим остановку
  }
});