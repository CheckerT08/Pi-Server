import { apiCall } from "./api.js";

const taskTable = document.getElementById('tasksTable');
const addForm = document.getElementById('addTaskForm');

// Funktion zum Erstellen einer Tabellenzeile (DRY - Don't Repeat Yourself)
function createTaskRow(task) {
  const tr = document.createElement('tr');
  tr.dataset.id = task.id;
  tr.className = task.done ? 'done' : '';
  
  // Animation Styles
  tr.style.opacity = "0";
  tr.style.transform = "translateY(-10px)";
  tr.style.transition = "all 0.4s ease";

  tr.innerHTML = `
    <td><input type="text" value="${task.name}" class="editField" data-field="name" ${task.done ? 'disabled' : ''}></td>
    <td><input type="text" value="${task.description || ''}" class="editField" data-field="description" ${task.done ? 'disabled' : ''}></td>
    <td><input type="date" value="${new Date(task.dueDate).toISOString().slice(0,10)}" class="editField" data-field="dueDate" ${task.done ? 'disabled' : ''}></td>
    <td><input type="text" value="${task.subject || ''}" class="editField" data-field="subject" ${task.done ? 'disabled' : ''}></td>
    <td>${task.done ? 'Erledigt' : 'Offen'}</td>
    <td>
      ${!task.done 
        ? '<button class="completeBtn">COMPLETE</button>' 
        : '<button class="deleteBtn">DELETE</button>'}
    </td>
  `;
  return tr;
}

// 1. Hinzufügen
addForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(addForm);
  const data = Object.fromEntries(formData.entries());

  try {
    const newTask = await apiCall('/api/homework', 'POST', data);
    const newRow = createTaskRow(newTask);

    taskTable.prepend(newRow); // Ganz oben einfügen
    
    // Animation triggern
    setTimeout(() => {
      newRow.style.opacity = "1";
      newRow.style.transform = "translateY(0)";
    }, 10);

    addForm.reset();
  } catch (e) {
    alert("Fehler beim Erstellen: " + e.message);
  }
});

// 2. Click-Aktionen (Delete & Complete) via Event Delegation
taskTable.addEventListener('click', async (e) => {
  const tr = e.target.closest('tr');
  if (!tr) return;
  const id = tr.dataset.id;

  // Complete
  if (e.target.classList.contains('completeBtn')) {
    try {
      await apiCall(`/api/homework/${id}/complete`, 'POST');
      tr.classList.add('done');
      tr.querySelectorAll('input').forEach(i => i.disabled = true);
      tr.cells[4].textContent = 'Erledigt';
      e.target.className = 'deleteBtn';
      e.target.textContent = 'DELETE';
    } catch (err) { alert(err.message); }
  }

  // Delete
  if (e.target.classList.contains('deleteBtn')) {
    if (!confirm('Löschen?')) return;
    try {
      await apiCall(`/api/homework/${id}`, 'DELETE');
      tr.style.opacity = "0";
      tr.style.transform = "scale(0.95)";
      setTimeout(() => tr.remove(), 400);
    } catch (err) { alert(err.message); }
  }
});

// 3. Inline Edit
taskTable.addEventListener('change', async (e) => {
  if (!e.target.classList.contains('editField')) return;
  const tr = e.target.closest('tr');
  const field = e.target.dataset.field;
  try {
    await apiCall(`/api/homework/${tr.dataset.id}`, 'PUT', { [field]: e.target.value });
    e.target.style.backgroundColor = "#d4edda";
    setTimeout(() => e.target.style.backgroundColor = "", 500);
  } catch (err) { alert(err.message); }
});
