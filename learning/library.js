(() => {
    const search = document.getElementById('library-search');
    const buttons = Array.from(document.querySelectorAll('[data-filter]'));
    const cards = Array.from(document.querySelectorAll('.library-card'));
    const status = document.getElementById('library-status');
    const isEnglish = document.documentElement.lang === 'en';
    let category = ['papers', 'notes'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'all';
    function update() {
        const query = search.value.trim().toLocaleLowerCase();
        let count = 0;
        cards.forEach(card => {
            const visible = (category === 'all' || card.dataset.category === category) && card.dataset.search.toLocaleLowerCase().includes(query);
            card.hidden = !visible;
            if (visible) count++;
        });
        buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === category)));
        status.textContent = isEnglish ? `${count} of ${cards.length} resources` : `显示 ${count} / ${cards.length} 篇内容`;
        document.getElementById('library-empty').hidden = count !== 0;
    }
    buttons.forEach(button => button.addEventListener('click', () => {
        category = button.dataset.filter;
        location.hash = category;
        update();
    }));
    addEventListener('hashchange', () => {
        category = ['papers', 'notes'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'all';
        update();
    });
    search.addEventListener('input', update);
    update();
})();
