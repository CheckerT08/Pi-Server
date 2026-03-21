import { apiCall } from "./api.js";

const learnForm = document.getElementById('learnForm');
const input = document.querySelector("input");
const solutionText = document.getElementById('solutionText');
const button = document.getElementById('submitButton');

let isFinished = false; // Status-Variable
console.log(`Word: ${word}, Sol: ${solution}`)

learnForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  
  // Wenn wir schon fertig sind, lade einfach neu
  if (isFinished) {
    location.reload();
    return; // Beendet die Funktion hier
  }
  
  const text = input.value.toLowerCase().trim();
  const sol = solution.toLowerCase();

  if (text === sol) {
    win();
  } else {
    lose();
  }

  // Jetzt in den "Reload-Modus" wechseln
  button.textContent = 'Erneut...';
  isFinished = true;
});


function win() {
  solutionText.textContent = 'Richtig!';
  apiCall('/api/vocab', 'PUT', { german: word, correct: true });
  button.style.backgroundColor = 'green';
}

function lose() {
  solutionText.textContent = `Falsch! Richtig wäre: "${solution}"`;
  apiCall('/api/vocab', 'PUT', { german: word, correct: false });
  button.style.backgroundColor = 'red';
}
