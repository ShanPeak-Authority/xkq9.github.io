export function initializeSort() {
    console.log('开始初始化表格排序功能...');

    const copperHeader = document.getElementById('sort-copper');
    const dataTableBody = document.querySelector('#data-table tbody');

    // 增强错误检查
    if (!copperHeader) {
        console.error('排序功能初始化失败：未找到ID为“sort-copper”的表头元素。请检查HTML结构。');
        return;
    }
    if (!dataTableBody) {
        console.error('排序功能初始化失败：未找到选择器“#data-table tbody”对应的表格体元素。请检查HTML结构。');
        return;
    }

    console.log('成功获取排序表头与表格体元素。', copperHeader, dataTableBody);

    let isSortedDescending = true;

    // 只在有数据行时才执行初始排序
    const initialRows = dataTableBody.querySelectorAll('tr');
    if (initialRows.length > 0) {
        console.log(`找到${initialRows.length}行数据，执行初始排序。`);
        sortTableByCopper(dataTableBody, isSortedDescending, copperHeader);
    } else {
        console.warn('表格中没有数据行，跳过初始排序。');
        copperHeader.textContent = '铜钱';
    }

    copperHeader.style.cursor = 'pointer';
    copperHeader.title = '点击切换排序方式';

    copperHeader.addEventListener('click', () => {
        console.log('用户点击了铜钱表头，切换排序方向。');
        const currentRows = dataTableBody.querySelectorAll('tr');
        if (currentRows.length === 0) {
            console.warn('当前表格无数据，点击排序无效。');
        }
        isSortedDescending = !isSortedDescending;
        sortTableByCopper(dataTableBody, isSortedDescending, copperHeader);
    });

    console.log('表格排序功能初始化完成。');
}

function sortTableByCopper(tbody, sortDescending, copperHeader) {
    const rows = Array.from(tbody.querySelectorAll('tr'));
    console.log(`开始对${rows.length}行数据进行排序，排序方式：${sortDescending ? '降序' : '升序'}`);

    // 更新表头指示符
    if (copperHeader) {
        copperHeader.textContent = sortDescending ? '铜钱 ▼' : '铜钱 ▲';
    }

    rows.sort((rowA, rowB) => {
        const valueA = parseInt(rowA.cells[2]?.textContent) || 0;
        const valueB = parseInt(rowB.cells[2]?.textContent) || 0;
        return sortDescending ? valueB - valueA : valueA - valueB;
    });

    // 重新插入行
    tbody.innerHTML = '';
    rows.forEach(row => tbody.appendChild(row));
    console.log('表格排序完成并已更新DOM。');
}