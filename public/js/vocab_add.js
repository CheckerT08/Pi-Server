import { apiCall } from "./api.js";

document.getElementById('addVocabForm')
  .addEventListener('submit', async(event) => {
    event.preventDefault();
    const form = event.target;
    const data = {
      text: form.vocab.value
    }
    try {
      await apiCall('/api/vocab', 'POST', data);
      location.reload();
    } catch (err) {
      alert(err.message);
    }
});
