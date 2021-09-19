/*
<article class="search-result">
    <h3 class="titles"><a href="/books/whatever">Book Title</a></h3>
    <ul >
        <li>Whatever Series Name</li>
        <li class="authors">?Author(s): Nielsen, Gracenote, and Roasted Garlic</li>
        <li class="authors">?Editor(s): Jobs, Steve</li>
        <li>Published <time datetime="1997">1997</time>; 34-34-34-34 &euro;400</li>
    </ul>
</article>
*/

(function() {
    let fuse = null;
    let searchInitialized = false;
    let resultsPerPage = 10;

    const searchOptions = {
        keys: [
            {
                name: 'authors',
                weight: 0.4,
            },
            {
                name: 'editors',
                weight: 0.3,
            },
            {
                name: 'isbn',
                weight: 0.1,
            },
            {
                name: 'title',
                weight: 0.2,
            },
        ],
        minMatchCharLength: 3,
        shouldSort: true,
    };

    function init() {
        // maybe the search library isn't ready yet
        if (!window.Fuse) {
            window.setTimeout(init, 1000);
            return;
        }

        const searchForm = document.getElementById('imm-search-form');

        if (searchForm) {
            fetch('/static/json/searchIndex.json').then(response => {
                if (response.status !== 200) {
                    // TODO: properly report error
                    console.error(response);
                    return;
                }

                return response.json().then(data => {
                    fuse = new Fuse(data, searchOptions);
                    searchForm.onsubmit = handleSearch;

                    searchInitialized = true;
                    window.asdf = fuse;  // TODO: this is temporary
                });
            }).catch(err => {
                // TODO: properly report error
                console.error('There was an error', err);
            });
        }
    }

    function generateSearchResult(result) {
        const article = document.createElement('article');
        article.classList.add('search-result');

        // book title
        const title = document.createElement('h3');
        title.classList.add('titles');
        article.appendChild(title);

        const titleLink = document.createElement('a');
        titleLink.setAttribute('href', `/${result.url}`);
        titleLink.innerText = result.title;
        title.appendChild(titleLink);

        // details container
        const detailsDiv = document.createElement('div');
        detailsDiv.classList.add('item-details');
        article.appendChild(detailsDiv);

        // book information
        const infoList = document.createElement('ul');
        detailsDiv.appendChild(infoList);

        // series
        if (typeof result.series === 'string')  {
            const series = document.createElement('li');
            series.innerText = result.series;
            infoList.appendChild(series);
        }

        // authors and editors
        if (Array.isArray(result.authors) && Array.isArray(result.editors)) {
            // TODO: make sure we actually need this part
            if (result.authors.length > 0 && result.editors.length > 0) {
                const authors = document.createElement('li');
                authors.innerText = `Author${result.authors.length > 1 ? 's' : ''}: ${result.authors}`;
                infoList.appendChild(authors);
                const editors = document.createElement('li');
                // TODO: use the right field (that will format the editors correctly)
                editors.innerText = `Editor${result.editors.length > 1 ? 's' : ''}: ${result.editors}`;
                infoList.appendChild(editors);
            } else {
                const authors = document.createElement('li');
                authors.innerText = result.authors_bib;
                infoList.appendChild(authors);
            }
        }

        // publication information
        const pubList = document.createElement('ul');
        detailsDiv.appendChild(pubList);

        // publication date
        if (result.year && typeof result.year === 'string') {
            const year = document.createElement('li');
            // must pass a safety check in order to use innerHTML
            if (/^\d{4}$/.test(result.year)) {
                year.innerHTML = `Published <time datetime="${result.year}">${result.year}</time>`;
            } else {
                year.innerText = `Published ${result.year}`;
            }
            pubList.appendChild(year);
        }

        // ISBN
        if (result.isbn) {
            const isbn = document.createElement('li');
            isbn.innerText = result.isbn;
            pubList.appendChild(isbn);
        }

        // price
        if (result.price) {
            const price = document.createElement('li');
            price.innerText = `€ ${result.price}`;
            pubList.appendChild(price);
        }

        return article;
    }

    function handleSearch(event) {
        // TODO: set up a loading spinner?

        event.preventDefault();
        const searchBox = document.getElementById('imm-search-field');
        const value = searchBox.value;
        let results = fuse.search(value);

        // TODO: turn off the loading spinner?

        if (!Array.isArray(results)) {
            console.error('oh shit');  // TODO:
            return;
        }

        const resultsElem = document.getElementById('imm-search-result-list');

        resultsElem.innerHTML = null;

        if (results.length === 0) return;

        results = results.slice(0, resultsPerPage);

        const htmlOutput = results.map(generateSearchResult);

        htmlOutput.forEach(elem => {
            resultsElem.appendChild(elem);
        });
    }

    init();
})();
