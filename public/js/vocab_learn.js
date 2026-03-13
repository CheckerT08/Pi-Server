import { apiCall } from "./api.js";

const learnForm = document.getElementById('learnForm');
const input = document.querySelector("input");
const solutionText = document.getElementById('solutionText');
const button = document.getElementById('submitButton');

// Hinzufügen mit Animation
learnForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const text = input.value.toLowerCase().trim();
  solution = solution.toLowerCase();
  console.log('check...')

  // solution durch ejs übergeben
  console.log(`text: ${text}, other: ${solution}`)
  if (text === solution) {
    win();
  } else {
    lose();
  }
  button.textContent = 'Erneut...'
  button.onclick = () => {
    location.reload();
  }
  console.log('ende');
});

function win() {
  solutionText.textContent = 'Richtig!';
  button.style.backgroundColor = 'green';
  console.log('ja');
}

function lose() {
  solutionText.textContent = `Falsch! Richtig wäre: "${solution}"`;
  button.style.backgroundColor = 'red';
  console.log('ne');
}