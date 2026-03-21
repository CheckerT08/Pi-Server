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
    const response = await apiCall('/api/vocab', 'POST', { text });

    response.added.forEach(entry => {
      const { name, other } = entry;

      const newRow = document.createElement('tr');
      newRow.dataset.id = name;

      newRow.style.opacity = "0";
      newRow.style.transform = "translateY(-20px)";
      newRow.style.transition = "all 0.4s ease";

      newRow.innerHTML = `
        <td>${name}</td>
        <td>${other}</td>
        <td>0</td>
        <td><button class="deleteBtn">DELETE</button></td>
      `;

      // Finde die erste Zeile, die alphabetisch nach der neuen kommt
      const rows = Array.from(tbody.querySelectorAll('tr'));
      let inserted = false;

      for (const row of rows) {
        if (name.localeCompare(row.dataset.id, undefined, { sensitivity: 'base' }) < 0) {
          tbody.insertBefore(newRow, row);
          inserted = true;
          break;
        }
      }

      // Wenn keine größere Zeile gefunden → ans Ende
      if (!inserted) {
        tbody.appendChild(newRow);
      }

      // Nur für neue Zeilen Animation starten
      setTimeout(() => {
        newRow.style.opacity = "1";
        newRow.style.transform = "translateY(0)";
      }, 50);
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
  const button = e.target;
  const tr = e.target.closest('tr');
  const id = tr.dataset.id;

  if (!confirm('Wirklich löschen?')) return;

  try {
    const response = await fetch(`/api/vocab/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error);
    }

    // Button deaktivieren, sodass er nicht mehr klickbar ist
    button.disabled = true;
    button.textContent = "Deleted"; // optional: Text ändern

    tr.style.transition = "all 0.4s ease";
    tr.style.opacity = "0";
    tr.style.transform = "translateX(30px)";
    setTimeout(() => tr.remove(), 400);
  } catch (err) {
    alert(err.message);
  }
});
