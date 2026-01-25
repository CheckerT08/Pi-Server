async function apiCall(url, method, data) {
  const options = {
    method: method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (data) options.body = JSON.stringify(data);
  const res = await fetch(url, options);
  if(!res.ok) throw new Error('API Error: ' + res.status);
  return res.json();
};

document.getElementById('addTaskForm')
  .addEventListener('submit', async(event) => {
  event.preventDefault();
  const form = event.target;
  const data = {
    name: form.name.value,
    description: form.description.value,
    dueDate: form.dueDate.value,
    subject: form.subject.value
  };
  try {
    await apiCall('/api/homework', 'POST', data);
    location.reload();
  } catch (e) {
    alert(e.message);
  }
});

document.getElementById('tasksTable')
  .addEventListener('click', async (e) => {
  const tr = e.target.closest('tr');
  if(!tr) return;
  const id = tr.dataset.id;

  if (e.target.classList.contains('completeBtn')) {
    try { 
      await apiCall(`/api/homework/${id}/complete`, 'POST'); 
      location.reload(); 
    } catch(err) { 
      alert(err.message); 
    }
  }

  if (e.target.classList.contains('deleteBtn')) {
    if (confirm('Wirklich löschen?')) {
      try { 
        await apiCall(`/api/homework/${id}`, 'DELETE'); 
        location.reload(); 
      } catch(err) { 
        alert(err.message); 
      }
  } }
});

document.querySelectorAll('.editField').forEach(input => {
  input.addEventListener('change', async (e) => {
    const tr = e.target.closest('tr');
    const id = tr.dataset.id;
    const field = e.target.dataset.field;
    const value = e.target.value;
    try { 
      await apiCall(`/api/homework/${id}`, 'PUT', { [field]: value }); 
      location.reload(); 
    } catch(err) { 
      alert(err.message); 
    }
  });
});
