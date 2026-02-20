document
  .getElementById('searchForm')
  .addEventListener('submit', function (event) {
    event.preventDefault();

    const input = document.getElementById('searchInput');
    const search = input.value.trim();
    if (!search) return;

    //const query = encodeURIComponent(search);

    window.open(
      `https://www.google.com/search?udm=14&q=${search}`,
      '_blank'
    );
  });
