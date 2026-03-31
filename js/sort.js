export function initializeSort() {
    const copperHeader = document.getElementById('sort-copper');
    const dataTableBody = document.querySelector('#data-table tbody');

    if (!copperHeader || !dataTableBody) return;

    let isSortedDescending = true;
    const initialRows = dataTableBody.querySelectorAll('tr');
    if (initialRows.length > 0) {
        sortTableByCopper(dataTableBody, isSortedDescending, copperHeader);
    } else {
        copperHeader.textContent = '铜钱';
    }

    copperHeader.style.cursor = 'pointer';
    copperHeader.title = '点击切换排序方式';

    copperHeader.addEventListener('click', () => {
        const currentRows = dataTableBody.querySelectorAll('tr');
        if (currentRows.length === 0) return;
        isSortedDescending = !isSortedDescending;
        sortTableByCopper(dataTableBody, isSortedDescending, copperHeader);
    });
}

function sortTableByCopper(tbody, sortDescending, copperHeader) {
    const rows = Array.from(tbody.querySelectorAll('tr'));
    if (copperHeader) {
        copperHeader.textContent = sortDescending ? '铜钱 ▼' : '铜钱 ▲';
    }

    rows.sort((rowA, rowB) => {
        const valueA = parseInt(rowA.cells[2]?.textContent) || 0;
        const valueB = parseInt(rowB.cells[2]?.textContent) || 0;
        return sortDescending ? valueB - valueA : valueA - valueB;
    });

    tbody.innerHTML = '';
    rows.forEach(row => tbody.appendChild(row));
}