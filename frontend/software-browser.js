/**
* Software browser UI
*/

const SOFTWARE_INDEX = 'software/software.json'
const SOFTWARE_BASE = 'software/';

const SOFTWARE_CATGORIES = Object.freeze({
  'Category: All': [],
  'Demoscene': ['demo-scene'],
  'Education': ['education'],
  'Games' : ['game'],
  '(Ex) commercial games': ['game', '!demo', '!public-domain'],
  'Public Domain': ['public-domain'],
  'Music': ['music'],
  'Utilities': ['utility']
});


function showSoftware(softwareId) {
  let meta = window.software[softwareId];
  let details = document.getElementById('software-details');
  let title = meta['title'];
  if ('year' in meta) 
    title += ' (' + meta['year'] + ')';
  details.querySelector('h3').textContent = title;

  let dl = details.querySelector('dl');
  removeAllChildNodes(dl);

  if ('author' in meta) appendDl(dl, 'Author', meta['author']);
  if ('publisher' in meta) appendDl(dl, 'Publisher', meta['publisher']);

  if ('description' in meta) {
    details.querySelector('.description').style.display = 'block';
    details.querySelector('.description').textContent = meta['description'];
  } else {
    details.querySelector('.description').style.display = 'none';
  }

  let archiveButton = details.querySelector('button.archive');
  let discButton = details.querySelector('button.disc');
 

  if ('archive' in meta) {
    archiveButton.style.display = 'inline-block';
    archiveButton.onclick = () => {
      closeModal('software-browser');
      loadSoftwareFromUrl(SOFTWARE_BASE+meta['archive']);
      window.currentSoftwareId = meta.id;
    }
  } else {
    archiveButton.style.display = 'none';
  }

  if ('disc' in meta) {
    discButton.style.display = 'inline-block';
    discButton.onclick = () => {
      closeModal('software-browser');
      loadSoftwareFromUrl(SOFTWARE_BASE+meta['disc'], true);
      window.currentSoftwareId = meta.id;
    }
  } else {
    discButton.style.diplay = 'none';
  }
  
  details.querySelector('.autoboot').style.display = ('autoboot' in meta) ? 'inline' : 'none';
  
}


async function showSoftwareBrowser() {
  showModal('software-browser');
  if (typeof window.software == 'undefined') {
    let response = await fetch(SOFTWARE_INDEX);
    let json = await response.json();
    window.software = json;
    populateSoftwareCategories();
  }
  populateSoftwareList();
  
}

function populateSoftwareCategories() {
  let sel = document.getElementById('software-category');
  removeAllChildNodes(sel);
  for (const [title, tags] of Object.entries(SOFTWARE_CATGORIES)) {
    let opt = document.createElement('option');
    opt.text = title;
    opt.value = tags.join(',');
    sel.add(opt);
  }
}

function populateSoftwareList(search = '', tags=null) {
  let ul = document.querySelector('#software-browser-cols ul');
  removeAllChildNodes(ul);
  search = search.toLowerCase();
  let titles = [];
  for (const [softwareId, software] of Object.entries(window.software)) {
    let title = software['title'];
    if ('year' in software) 
      title += ' (' + software['year'] + ')';
    let searchMatch = search == '' || title.toLowerCase().includes(search);
    let tagsMatch = true;
    if (tags) {
      for (let t of tags) {
        if (t.startsWith('!') && software.tags.indexOf(t) >= 0 || software.tags.indexOf(t) < 0) {
          tagsMatch = false;
        }
      }
    }
    if (searchMatch && tagsMatch)
      titles.push([softwareId, title]);
  }
  titles.sort((a,b) => { return (a[1] > b[1]) ? 1 : -1});
  for (const [softwareId, title] of titles) {
    let li = document.createElement('li');
    li.textContent = title;
    li.onclick = () => showSoftware(softwareId);
    ul.appendChild(li);
  }
}

function filterSoftware() {
  let searchText = document.querySelector('#software-browser .search').value;
  let tags = document.getElementById('software-category').selectedOptions[0].value;
  if (tags == '') {
    tags = null;
  } else {
    tags = tags.split(',');
  }
  populateSoftwareList(searchText, tags);

}

showSoftwareBrowser().then(() => {});