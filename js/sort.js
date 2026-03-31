export function initializeSort() {
    const header = document.getElementById('sort-copper');
    const tbody = document.querySelector('#data-table tbody');
    if (!header || !tbody) return;

    let isSortedDescending = true;
    const sortRows = (desc) => {
        const rows = [...tbody.rows];
        header.textContent = `铜钱 ${desc ? '▼' : '▲'}`;
        rows.sort((a, b) => (desc ? -1 : 1) * ((+b.cells[2]?.textContent || 0) - (+a.cells[2]?.textContent || 0)));
        tbody.append(...rows);
    };

    tbody.rows.length ? sortRows(isSortedDescending) : header.textContent = '铜钱';
    header.style.cursor = 'pointer';
    header.title = '点击切换排序方式';
    header.addEventListener('click', () => tbody.rows.length && sortRows(isSortedDescending = !isSortedDescending));
}