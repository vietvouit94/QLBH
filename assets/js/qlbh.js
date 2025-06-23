// ===== DATA LAYER: CRUD localStorage =====
function getProducts() {
    return JSON.parse(localStorage.getItem('products') || '[]');
}
function saveProducts(products) {
    localStorage.setItem('products', JSON.stringify(products));
}
function getImports() {
    return JSON.parse(localStorage.getItem('imports') || '[]');
}
function saveImports(imports) {
    localStorage.setItem('imports', JSON.stringify(imports));
}
function getExports() {
    return JSON.parse(localStorage.getItem('exports') || '[]');
}
function saveExports(exports) {
    localStorage.setItem('exports', JSON.stringify(exports));
}

// ===== UI & LOGIC LAYER =====
let products = getProducts();
let imports = getImports();
let exports = getExports();

// Biến tạm lưu index đang sửa phiếu bán
let editingExportIndex = null;
// Biến tạm lưu index đang sửa phiếu nhập và sản phẩm
let editingImportIndex = null;
let editingProductIndex = null;

document.addEventListener('DOMContentLoaded', function() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('importDate').value = today;
    document.getElementById('exportDate').value = today;
    document.getElementById('reportFromDate').value = today;
    document.getElementById('reportToDate').value = today;
    loadProducts();
    loadImports();
    loadExports();
    updateProductSelects();
    updateStats();
    document.getElementById('importProduct').addEventListener('change', updateImportPrice);
    document.getElementById('importQuantity').addEventListener('input', calculateImportTotal);
    document.getElementById('exportProduct').addEventListener('change', updateExportPrice);
    document.getElementById('exportQuantity').addEventListener('input', calculateExportTotal);
    document.getElementById('restoreFile').addEventListener('change', restoreData);
});

function showTab(tabName) {
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => content.classList.remove('active'));
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

// ===== PRODUCT CRUD =====
function addProduct() {
    products = getProducts();
    const code = document.getElementById('productCode').value.trim();
    const name = document.getElementById('productName').value.trim();
    const unit = document.getElementById('productUnit').value;
    const importPrice = parseFloat(document.getElementById('importPrice').value) || 0;
    const sellPrice = parseFloat(document.getElementById('sellPrice').value) || 0;
    const minStock = parseInt(document.getElementById('minStock').value) || 10;
    if (!code || !name) {
        alert('Vui lòng nhập mã và tên sản phẩm!');
        return;
    }
    if (editingProductIndex !== null) {
        // Sửa sản phẩm
        // Kiểm tra nếu đổi mã mà bị trùng mã khác
        if (products.some((p, i) => p.code === code && i !== editingProductIndex)) {
            alert('Mã sản phẩm đã tồn tại!');
            return;
        }
        products[editingProductIndex] = {
            ...products[editingProductIndex],
            code, name, unit, importPrice, sellPrice, minStock
        };
        editingProductIndex = null;
        document.querySelector('#products .btn-primary').textContent = "➕ Thêm sản phẩm";
    } else {
        if (products.find(p => p.code === code)) {
            alert('Mã sản phẩm đã tồn tại!');
            return;
        }
        const product = { code, name, unit, importPrice, sellPrice, minStock, stock: 0, totalImport: 0, totalExport: 0 };
        products.push(product);
    }
    saveProducts(products);
    loadProducts();
    updateProductSelects();
    updateStats();
    document.getElementById('productCode').value = '';
    document.getElementById('productName').value = '';
    document.getElementById('importPrice').value = '';
    document.getElementById('sellPrice').value = '';
    document.getElementById('minStock').value = '10';
}
function deleteProduct(index) {
    products = getProducts();
    const product = products[index];
    const imports = getImports();
    const exports = getExports();
    if (imports.some(i => i.code === product.code) || exports.some(e => e.code === product.code)) {
        alert('Không thể xóa sản phẩm đã có phiếu nhập/xuất!');
        return;
    }
    if (confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
        products.splice(index, 1);
        saveProducts(products);
        loadProducts();
        updateProductSelects();
        updateStats();
    }
}
function editProduct(index) {
    products = getProducts();
    const product = products[index];
    document.getElementById('productCode').value = product.code;
    document.getElementById('productName').value = product.name;
    document.getElementById('productUnit').value = product.unit;
    document.getElementById('importPrice').value = product.importPrice;
    document.getElementById('sellPrice').value = product.sellPrice;
    document.getElementById('minStock').value = product.minStock;
    document.querySelector('#products .btn-primary').textContent = "💾 Cập nhật sản phẩm";
    editingProductIndex = index;
}

function loadProducts(list) {
    products = getProducts();
    const tbody = document.getElementById('productsTableBody');
    tbody.innerHTML = '';
    const showList = list || products;
    showList.forEach((product, index) => {
        const stock = product.stock || 0;
        const profit = (product.sellPrice - product.importPrice) * (product.totalExport || 0);
        let stockStatus = 'in-stock';
        let stockBadge = '<span class="badge badge-success">Còn hàng</span>';
        if (stock === 0) {
            stockStatus = 'out-of-stock';
            stockBadge = '<span class="badge badge-danger">Hết hàng</span>';
        } else if (stock <= product.minStock) {
            stockStatus = 'low-stock';
            stockBadge = '<span class="badge badge-warning">Sắp hết</span>';
        }
        const row = `
            <tr class="${stockStatus === 'low-stock' ? 'low-stock' : stockStatus === 'out-of-stock' ? 'out-of-stock' : ''}">
                <td>${product.code}</td>
                <td>${product.name}</td>
                <td>${product.unit}</td>
                <td class="text-right">${formatCurrency(product.importPrice)}</td>
                <td class="text-right">${formatCurrency(product.sellPrice)}</td>
                <td class="text-right">${stock}</td>
                <td class="text-right">${formatCurrency(profit)}</td>
                <td class="text-center">${stockBadge}</td>
                <td class="text-center">
                    <button class="btn btn-warning btn-sm" onclick="editProduct(${index})">✏️</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteProduct(${index})">🗑️</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// ===== IMPORT CRUD =====
function editImport(index) {
    imports = getImports();
    const importItem = imports[index];
    document.getElementById('importDate').value = importItem.date;
    document.getElementById('importProduct').value = importItem.code;
    document.getElementById('importQuantity').value = importItem.quantity;
    document.getElementById('importUnitPrice').value = importItem.unitPrice;
    document.getElementById('importTotal').value = importItem.total;
    document.getElementById('importNote').value = importItem.note;
    document.querySelector('#import .btn-success').textContent = "💾 Cập nhật phiếu nhập";
    editingImportIndex = index;
}

function addImport() {
    products = getProducts();
    imports = getImports();
    const date = document.getElementById('importDate').value;
    const productCode = document.getElementById('importProduct').value;
    const quantity = parseInt(document.getElementById('importQuantity').value) || 0;
    const note = document.getElementById('importNote').value;
    const product = products.find(p => p.code === productCode);
    if (!date || !productCode || quantity <= 0) {
        alert('Vui lòng nhập đầy đủ thông tin!');
        return;
    }
    if (!product) {
        alert('Sản phẩm không tồn tại!');
        return;
    }
    if (editingImportIndex !== null) {
        // Sửa phiếu nhập
        const oldImport = imports[editingImportIndex];
        const oldProduct = products.find(p => p.code === oldImport.code);
        if (oldProduct) {
            oldProduct.stock -= oldImport.quantity;
            oldProduct.totalImport -= oldImport.quantity;
        }
        product.stock += quantity;
        product.totalImport += quantity;
        imports[editingImportIndex] = {
            date, code: productCode, name: product.name, quantity,
            unitPrice: product.importPrice, total: product.importPrice * quantity, note
        };
        editingImportIndex = null;
        document.querySelector('#import .btn-success').textContent = "➕ Thêm phiếu nhập";
    } else {
        product.stock += quantity;
        product.totalImport += quantity;
        imports.push({
            date, code: productCode, name: product.name, quantity,
            unitPrice: product.importPrice, total: product.importPrice * quantity, note
        });
    }
    saveProducts(products);
    saveImports(imports);
    loadImports();
    loadProducts();
    updateProductSelects();
    updateStats();
    document.getElementById('importQuantity').value = '';
    document.getElementById('importNote').value = '';
    document.getElementById('importUnitPrice').value = '';
    document.getElementById('importTotal').value = '';
}

function deleteImport(index) {
    imports = getImports();
    products = getProducts();
    if (confirm('Bạn có chắc muốn xóa phiếu nhập này?')) {
        const importItem = imports[index];
        const product = products.find(p => p.code === importItem.code);
        if (product) {
            product.stock -= importItem.quantity;
            product.totalImport -= importItem.quantity;
        }
        imports.splice(index, 1);
        saveImports(imports);
        saveProducts(products);
        loadImports();
        loadProducts();
        updateStats();
    }
}

function loadImports() {
    imports = getImports();
    const tbody = document.getElementById('importTableBody');
    tbody.innerHTML = '';
    imports.forEach((importItem, index) => {
        const row = `
            <tr>
                <td>${importItem.date}</td>
                <td>${importItem.code}</td>
                <td>${importItem.name}</td>
                <td class="text-right">${importItem.quantity}</td>
                <td class="text-right">${formatCurrency(importItem.unitPrice)}</td>
                <td class="text-right">${formatCurrency(importItem.total)}</td>
                <td>${importItem.note}</td>
                <td class="text-center">
                    <button class="btn btn-warning btn-sm" onclick="editImport(${index})">✏️</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteImport(${index})">🗑️</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// ===== EXPORT CRUD =====
function editExport(index) {
    exports = getExports();
    const exportItem = exports[index];
    document.getElementById('exportDate').value = exportItem.date;
    document.getElementById('exportProduct').value = exportItem.code;
    document.getElementById('exportQuantity').value = exportItem.quantity;
    document.getElementById('exportUnitPrice').value = exportItem.unitPrice;
    document.getElementById('exportTotal').value = exportItem.total;
    document.getElementById('exportCustomer').value = exportItem.customer;
    // Đổi nút
    document.querySelector('#export .btn-success').textContent = "💾 Cập nhật phiếu bán";
    editingExportIndex = index;
}

function addExport() {
    products = getProducts();
    exports = getExports();
    const date = document.getElementById('exportDate').value;
    const productCode = document.getElementById('exportProduct').value;
    const quantity = parseInt(document.getElementById('exportQuantity').value) || 0;
    const customer = document.getElementById('exportCustomer').value;

    if (!date || !productCode || quantity <= 0 || !customer) {
        alert('Vui lòng nhập đầy đủ thông tin!');
        return;
    }

    const product = products.find(p => p.code === productCode);
    if (!product) {
        alert('Sản phẩm không tồn tại!');
        return;
    }

    if (editingExportIndex !== null) {
        // Sửa phiếu bán
        const oldExport = exports[editingExportIndex];
        const oldProduct = products.find(p => p.code === oldExport.code);
        if (oldProduct) {
            oldProduct.stock += oldExport.quantity;
            oldProduct.totalExport -= oldExport.quantity;
        }
        // Trừ tồn kho mới
        if (product.stock < quantity) {
            alert('Không đủ tồn kho để bán!');
            return;
        }
        product.stock -= quantity;
        product.totalExport += quantity;
        exports[editingExportIndex] = {
            date, code: productCode, name: product.name, quantity,
            unitPrice: product.sellPrice, total: product.sellPrice * quantity, customer
        };
        editingExportIndex = null;
        document.querySelector('#export .btn-success').textContent = "➕ Thêm phiếu bán";
    } else {
        // Thêm mới như cũ
        if (product.stock < quantity) {
            alert('Không đủ tồn kho để bán!');
            return;
        }
        product.stock -= quantity;
        product.totalExport += quantity;
        exports.push({
            date, code: productCode, name: product.name, quantity,
            unitPrice: product.sellPrice, total: product.sellPrice * quantity, customer
        });
    }

    saveProducts(products);
    saveExports(exports);
    loadExports();
    loadProducts();
    updateProductSelects();
    updateStats();
    document.getElementById('exportQuantity').value = '';
    document.getElementById('exportCustomer').value = '';
    document.getElementById('exportUnitPrice').value = '';
    document.getElementById('exportTotal').value = '';
}

function deleteExport(index) {
    exports = getExports();
    products = getProducts();
    if (confirm('Bạn có chắc muốn xóa phiếu bán này?')) {
        const exportItem = exports[index];
        const product = products.find(p => p.code === exportItem.code);
        if (product) {
            product.stock += exportItem.quantity;
            product.totalExport -= exportItem.quantity;
        }
        exports.splice(index, 1);
        saveExports(exports);
        saveProducts(products);
        loadExports();
        loadProducts();
        updateStats();
    }
}

function loadExports() {
    exports = getExports();
    const tbody = document.getElementById('exportTableBody');
    tbody.innerHTML = '';
    exports.forEach((exportItem, index) => {
        const row = `
            <tr>
                <td>${exportItem.date}</td>
                <td>${exportItem.code}</td>
                <td>${exportItem.name}</td>
                <td class="text-right">${exportItem.quantity}</td>
                <td class="text-right">${formatCurrency(exportItem.unitPrice)}</td>
                <td class="text-right">${formatCurrency(exportItem.total)}</td>
                <td>${exportItem.customer}</td>
                <td class="text-center">
                    <button class="btn btn-warning btn-sm" onclick="editExport(${index})">✏️</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteExport(${index})">🗑️</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// ===== UI/UX & FILTER =====
function updateProductSelects() {
    products = getProducts();
    const productSelect = document.getElementById('importProduct');
    productSelect.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Chọn sản phẩm';
    productSelect.appendChild(defaultOption);
    products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.code;
        option.textContent = product.name;
        productSelect.appendChild(option);
    });
    const exportSelect = document.getElementById('exportProduct');
    exportSelect.innerHTML = '';
    const defaultOption2 = document.createElement('option');
    defaultOption2.value = '';
    defaultOption2.textContent = 'Chọn sản phẩm';
    exportSelect.appendChild(defaultOption2);
    products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.code;
        option.textContent = product.name;
        exportSelect.appendChild(option);
    });
    productSelect.disabled = products.length === 0;
    exportSelect.disabled = products.length === 0;
}
function updateStats() {
    products = getProducts();
    imports = getImports();
    exports = getExports();
    const totalProducts = products.length;
    const totalImportValue = imports.reduce((total, importItem) => total + importItem.total, 0);
    const totalExportValue = exports.reduce((total, exportItem) => total + exportItem.total, 0);
    const totalProfit = totalExportValue - totalImportValue;
    document.getElementById('totalProducts').textContent = totalProducts;
    document.getElementById('totalImportValue').textContent = formatCurrency(totalImportValue);
    document.getElementById('totalExportValue').textContent = formatCurrency(totalExportValue);
    document.getElementById('totalProfit').textContent = formatCurrency(totalProfit);
}
function formatCurrency(value) {
    return '₫' + value.toLocaleString();
}
function filterProducts() {
    products = getProducts();
    const searchProduct = document.getElementById('searchProduct').value.toLowerCase();
    const stockFilter = document.getElementById('stockFilter').value;
    const sortProduct = document.getElementById('sortProduct').value;
    let filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchProduct) || product.code.toLowerCase().includes(searchProduct);
        const matchesStock = stockFilter === '' || (stockFilter === 'in-stock' && product.stock > 0) || (stockFilter === 'low-stock' && product.stock <= product.minStock) || (stockFilter === 'out-of-stock' && product.stock === 0);
        return matchesSearch && matchesStock;
    });
    filteredProducts.sort((a, b) => {
        if (sortProduct === 'name') {
            return a.name.localeCompare(b.name);
        } else if (sortProduct === 'code') {
            return a.code.localeCompare(b.code);
        } else if (sortProduct === 'stock') {
            return (b.stock || 0) - (a.stock || 0);
        } else if (sortProduct === 'profit') {
            const profitA = (a.sellPrice - a.importPrice) * (a.totalExport || 0);
            const profitB = (b.sellPrice - b.importPrice) * (b.totalExport || 0);
            return profitB - profitA;
        }
    });
    loadProducts(filteredProducts);
}
function updateImportPrice() {
    const productCode = document.getElementById('importProduct').value;
    const product = products.find(p => p.code === productCode);
    if (product) {
        document.getElementById('importUnitPrice').value = product.importPrice.toFixed(2);
    }
}
function calculateImportTotal() {
    const quantity = parseInt(document.getElementById('importQuantity').value) || 0;
    const unitPrice = parseFloat(document.getElementById('importUnitPrice').value) || 0;
    const total = quantity * unitPrice;
    document.getElementById('importTotal').value = total.toFixed(2);
}
function updateExportPrice() {
    const productCode = document.getElementById('exportProduct').value;
    const product = products.find(p => p.code === productCode);
    if (product) {
        document.getElementById('exportUnitPrice').value = product.sellPrice.toFixed(2);
    }
}
function calculateExportTotal() {
    const quantity = parseInt(document.getElementById('exportQuantity').value) || 0;
    const unitPrice = parseFloat(document.getElementById('exportUnitPrice').value) || 0;
    const total = quantity * unitPrice;
    document.getElementById('exportTotal').value = total.toFixed(2);
}

function exportToExcel(type) {
    let data, filename, sheetName;
    if (type === 'products') {
        data = getProducts();
        filename = 'DanhMucSanPham.xlsx';
        sheetName = 'Sản phẩm';
    } else if (type === 'import') {
        data = getImports();
        filename = 'NhapHang.xlsx';
        sheetName = 'Nhập hàng';
    } else if (type === 'export') {
        data = getExports();
        filename = 'BanHang.xlsx';
        sheetName = 'Bán hàng';
    } else {
        data = [
            ...getProducts().map(d => ({...d, _type: 'Sản phẩm'})),
            ...getImports().map(d => ({...d, _type: 'Nhập hàng'})),
            ...getExports().map(d => ({...d, _type: 'Bán hàng'}))
        ];
        filename = 'TatCaDuLieu.xlsx';
        sheetName = 'Tất cả';
    }
    if (!data.length) {
        alert('Không có dữ liệu để xuất!');
        return;
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename);
}

function backupData() {
    const data = { products: getProducts(), imports: getImports(), exports: getExports() };
    const json = JSON.stringify(data);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'backup.json';
    link.click();
    URL.revokeObjectURL(link.href);
}

function restoreData(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const json = e.target.result;
            const data = JSON.parse(json);
            localStorage.setItem('products', JSON.stringify(data.products || []));
            localStorage.setItem('imports', JSON.stringify(data.imports || []));
            localStorage.setItem('exports', JSON.stringify(data.exports || []));
            loadProducts();
            loadImports();
            loadExports();
            updateProductSelects();
            updateStats();
        };
        reader.readAsText(file);
    }
}

function generateReport() {
    const fromDate = document.getElementById('reportFromDate').value;
    const toDate = document.getElementById('reportToDate').value;
    const reportType = document.getElementById('reportType').value;

    if (!fromDate || !toDate || !reportType) {
        alert('Vui lòng nhập đầy đủ thông tin!');
        return;
    }

    const reportResult = document.getElementById('reportResult');
    reportResult.style.display = 'block';

    const reportTableBody = document.getElementById('reportTableBody');
    reportTableBody.innerHTML = '';

    const reportTableHead = document.getElementById('reportTableHead');
    reportTableHead.innerHTML = '';

    // Thêm header báo cáo
    const headerRow = document.createElement('tr');
    const headerTh1 = document.createElement('th');
    headerTh1.textContent = 'Mã SP';
    headerRow.appendChild(headerTh1);
    const headerTh2 = document.createElement('th');
    headerTh2.textContent = 'Tên sản phẩm';
    headerRow.appendChild(headerTh2);
    const headerTh3 = document.createElement('th');
    headerTh3.textContent = 'Đơn vị';
    headerRow.appendChild(headerTh3);
    const headerTh4 = document.createElement('th');
    headerTh4.textContent = 'Số lượng';
    headerRow.appendChild(headerTh4);
    const headerTh5 = document.createElement('th');
    headerTh5.textContent = 'Đơn giá';
    headerRow.appendChild(headerTh5);
    const headerTh6 = document.createElement('th');
    headerTh6.textContent = 'Thành tiền';
    headerRow.appendChild(headerTh6);
    reportTableHead.appendChild(headerRow);

    // Tạo báo cáo theo loại
    if (reportType === 'summary') {
        // Báo cáo tổng quan
        const summaryRow = document.createElement('tr');
        const summaryTh1 = document.createElement('th');
        summaryTh1.colSpan = 5;
        summaryTh1.textContent = 'Tổng sản phẩm';
        const summaryTd1 = document.createElement('td');
        summaryTd1.colSpan = 5;
        summaryTd1.textContent = getProducts().length;
        summaryRow.appendChild(summaryTh1);
        summaryRow.appendChild(summaryTd1);
        reportTableBody.appendChild(summaryRow);

        const summaryRow2 = document.createElement('tr');
        const summaryTh2 = document.createElement('th');
        summaryTh2.colSpan = 5;
        summaryTh2.textContent = 'Tổng nhập (VND)';
        const summaryTd2 = document.createElement('td');
        summaryTd2.colSpan = 5;
        summaryTd2.textContent = formatCurrency(getImports().reduce((total, importItem) => total + importItem.total, 0));
        summaryRow2.appendChild(summaryTh2);
        summaryRow2.appendChild(summaryTd2);
        reportTableBody.appendChild(summaryRow2);

        const summaryRow3 = document.createElement('tr');
        const summaryTh3 = document.createElement('th');
        summaryTh3.colSpan = 5;
        summaryTh3.textContent = 'Tổng bán (VND)';
        const summaryTd3 = document.createElement('td');
        summaryTd3.colSpan = 5;
        summaryTd3.textContent = formatCurrency(getExports().reduce((total, exportItem) => total + exportItem.total, 0));
        summaryRow3.appendChild(summaryTh3);
        summaryRow3.appendChild(summaryTd3);
        reportTableBody.appendChild(summaryRow3);

        const summaryRow4 = document.createElement('tr');
        const summaryTh4 = document.createElement('th');
        summaryTh4.colSpan = 5;
        summaryTh4.textContent = 'Lợi nhuận (VND)';
        const summaryTd4 = document.createElement('td');
        summaryTd4.colSpan = 5;
        const totalProfit = getExports().reduce((total, exportItem) => total + exportItem.total, 0) - getImports().reduce((total, importItem) => total + importItem.total, 0);
        summaryTd4.textContent = formatCurrency(totalProfit);
        summaryRow4.appendChild(summaryTh4);
        summaryRow4.appendChild(summaryTd4);
        reportTableBody.appendChild(summaryRow4);
    } else if (reportType === 'product') {
        // Báo cáo theo sản phẩm
        getProducts().forEach(product => {
            const row = document.createElement('tr');
            const td1 = document.createElement('td');
            td1.textContent = product.code;
            row.appendChild(td1);
            const td2 = document.createElement('td');
            td2.textContent = product.name;
            row.appendChild(td2);
            const td3 = document.createElement('td');
            td3.textContent = product.unit;
            row.appendChild(td3);
            const td4 = document.createElement('td');
            td4.textContent = product.stock || 0;
            row.appendChild(td4);
            const td5 = document.createElement('td');
            td5.textContent = formatCurrency(product.importPrice);
            row.appendChild(td5);
            const td6 = document.createElement('td');
            td6.textContent = formatCurrency(product.sellPrice);
            row.appendChild(td6);
            reportTableBody.appendChild(row);
        });
    } else if (reportType === 'daily') {
        // Báo cáo theo ngày
        const dailyReport = {};
        getImports().forEach(importItem => {
            if (!dailyReport[importItem.date]) {
                dailyReport[importItem.date] = { totalImport: 0, totalExport: 0 };
            }
            dailyReport[importItem.date].totalImport += importItem.total;
        });
        getExports().forEach(exportItem => {
            if (!dailyReport[exportItem.date]) {
                dailyReport[exportItem.date] = { totalImport: 0, totalExport: 0 };
            }
            dailyReport[exportItem.date].totalExport += exportItem.total;
        });
        Object.entries(dailyReport).forEach(([date, report]) => {
            const row = document.createElement('tr');
            const td1 = document.createElement('td');
            td1.textContent = date;
            row.appendChild(td1);
            const td2 = document.createElement('td');
            td2.textContent = formatCurrency(report.totalImport);
            row.appendChild(td2);
            const td3 = document.createElement('td');
            td3.textContent = formatCurrency(report.totalExport);
            row.appendChild(td3);
            const td4 = document.createElement('td');
            td4.textContent = formatCurrency(report.totalExport - report.totalImport);
            row.appendChild(td4);
            reportTableBody.appendChild(row);
        });
    }
}

// Các hàm backupData, restoreData, clearAllData, exportToExcel, generateReport giữ nguyên như cũ nếu có trong HTML gốc. 