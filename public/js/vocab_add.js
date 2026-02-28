import { apiCall } from "./api.js";

const addForm = document.getElementById('addVocabForm');
const tbody = document.querySelector('tbody');
const textarea = document.querySelector("textarea");

// Textarea Auto-Resize
textarea.addEventListener("input", () => {
  textarea.style.height = "auto";
  textarea.style.height = textarea.scrollHeight + "px";
});

// Hinzufügen mit Animation
addForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const text = addForm.vocab.value;
  
  try {
    // 1. Server-Antwort abwarten (enthält das 'added' Objekt mit allen neuen Paaren)
    const response = await apiCall('/api/vocab', 'POST', { text });

    // 2. Über alle tatsächlich neu hinzugefügten Einträge loopen
    Object.entries(response.added).forEach(([de, other], index) => {
      
      const newRow = document.createElement('tr');
      newRow.dataset.id = de;
      
      // Animation vorbereiten
      newRow.style.opacity = "0";
      newRow.style.transform = "translateY(-20px)";
      newRow.style.transition = "all 0.4s ease";
      
      newRow.innerHTML = `
        <td>${de}</td>
        <td>${other}</td>
        <td><button class="deleteBtn">DELETE</button></td>
      `;

      // Oben in die Tabelle einfügen
      tbody.prepend(newRow);

      // Zeitlich versetzt einblenden für einen coolen Effekt
      setTimeout(() => {
        newRow.style.opacity = "1";
        newRow.style.transform = "translateY(0)";
      }, index * 100); 
    });

    addForm.reset();
    textarea.style.height = "auto";
  } catch (err) {
    alert(err.message);
  }
});

// Löschen mit Animation (Event Delegation)
tbody.addEventListener('click', async (e) => {
  if (!e.target.classList.contains('deleteBtn')) return;
  
  const tr = e.target.closest('tr');
  const id = tr.dataset.id;

  try {
    const response = await fetch(`/api/vocab/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error);
    }

    tr.style.transition = "all 0.4s ease";
    tr.style.opacity = "0";
    tr.style.transform = "translateX(30px)";
    setTimeout(() => tr.remove(), 400);
  } catch (err) {
    alert(err.message);
  }
});
