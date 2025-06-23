const supabaseUrl = 'https://bxyvzyiepjtlyrahjsxk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4eXZ6eWllcGp0bHlyYWhqc3hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2NjY4MDcsImV4cCI6MjA2NjI0MjgwN30.zFGBiU0OzZ2Ix9WjrTMP_mNXawtQYZMgdQIg3-NFMTk';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// Định nghĩa và gán global showTab ngay đầu file
function showTab(tabName) {
  const contents = document.querySelectorAll('.tab-content');
  contents.forEach(content => content.classList.remove('active'));
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => tab.classList.remove('active'));
  document.getElementById(tabName).classList.add('active');
  event.target.classList.add('active');
}

// PRODUCTS CRUD
async function getProducts() {
  let { data, error } = await supabase.from('products').select('*').order('id', { ascending: true });
  if (error) { alert('Lỗi lấy sản phẩm: ' + error.message); return []; }
  return data || [];
}
async function addProduct(product) {
  const { error } = await supabase.from('products').insert([product]);
  if (error) { alert('Lỗi thêm sản phẩm: ' + error.message); return false; }
  return true;
}
async function updateProduct(id, updates) {
  const { error } = await supabase.from('products').update(updates).eq('id', id);
  if (error) { alert('Lỗi cập nhật sản phẩm: ' + error.message); return false; }
  return true;
}
async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) { alert('Lỗi xóa sản phẩm: ' + error.message); return false; }
  return true;
}

// IMPORTS CRUD
async function getImports() {
  let { data, error } = await supabase.from('imports').select('*').order('id', { ascending: true });
  if (error) { alert('Lỗi lấy phiếu nhập: ' + error.message); return []; }
  return data || [];
}
async function addImport(importItem) {
  const { error } = await supabase.from('imports').insert([importItem]);
  if (error) alert('Lỗi thêm phiếu nhập: ' + error.message);
}
async function deleteImport(id) {
  const { error } = await supabase.from('imports').delete().eq('id', id);
  if (error) alert('Lỗi xóa phiếu nhập: ' + error.message);
}

// EXPORTS CRUD
async function getExports() {
  let { data, error } = await supabase.from('exports').select('*').order('id', { ascending: true });
  if (error) { alert('Lỗi lấy phiếu bán: ' + error.message); return []; }
  return data || [];
}
async function addExport(exportItem) {
  const { error } = await supabase.from('exports').insert([exportItem]);
  if (error) { alert('Lỗi thêm phiếu bán: ' + error.message); return false; }
  return true;
}
async function updateExport(id, updates) {
  const { error } = await supabase.from('exports').update(updates).eq('id', id);
  if (error) { alert('Lỗi cập nhật phiếu bán: ' + error.message); return false; }
  return true;
}
async function deleteExport(id) {
  const { error } = await supabase.from('exports').delete().eq('id', id);
  if (error) { alert('Lỗi xóa phiếu bán: ' + error.message); return false; }
  if (error) alert('Lỗi xóa phiếu bán: ' + error.message);
}

// ===== UI & LOGIC LAYER =====
// Đảm bảo không dùng await ngoài hàm async
// Khởi tạo dữ liệu khi DOMContentLoaded

document.addEventListener('DOMContentLoaded', function() {
  (async () => {
    await loadProducts();
    await loadImports();
    await loadExports();
    await updateProductSelects();
    await updateStats();
  })();
});

// ===== PRODUCT CRUD =====
async function loadProducts(list) {
    const products = await getProducts();
    const tbody = document.getElementById('productsTableBody');
    tbody.innerHTML = '';
    const showList = list || products;
    showList.forEach((product) => {
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
                    <button class="btn btn-warning btn-sm" onclick="editProduct(${product.id})">✏️</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteProduct(${product.id})">🗑️</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

async function editProduct(id) {
    const products = await getProducts();
    const product = products.find(p => p.id === id);
    if (!product) return;
    document.getElementById('productCode').value = product.code;
    document.getElementById('productName').value = product.name;
    document.getElementById('productUnit').value = product.unit;
    document.getElementById('importPrice').value = product.importPrice;
    document.getElementById('sellPrice').value = product.sellPrice;
    document.getElementById('minStock').value = product.minStock;
    document.querySelector('#products .btn-primary').textContent = "💾 Cập nhật sản phẩm";
    window.editingProductId = id;
}

// ===== IMPORT CRUD =====
async function editImport(index) {
    imports = await getImports();
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

async function addImport() {
    products = await getProducts();
    imports = await getImports();
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
    await updateProduct(editingProductIndex || products.length - 1, product);
    await updateProduct(editingImportIndex || imports.length - 1, imports[editingImportIndex]);
    loadImports();
    loadProducts();
    updateProductSelects();
    updateStats();
    document.getElementById('importQuantity').value = '';
    document.getElementById('importNote').value = '';
    document.getElementById('importUnitPrice').value = '';
    document.getElementById('importTotal').value = '';
}

async function deleteImport(index) {
    imports = await getImports();
    products = await getProducts();
    if (confirm('Bạn có chắc muốn xóa phiếu nhập này?')) {
        const importItem = imports[index];
        const product = products.find(p => p.code === importItem.code);
        if (product) {
            product.stock -= importItem.quantity;
            product.totalImport -= importItem.quantity;
        }
        imports.splice(index, 1);
        await updateProduct(editingProductIndex || products.length - 1, product);
        await updateProduct(editingImportIndex || imports.length - 1, imports[editingImportIndex]);
        loadImports();
        loadProducts();
        updateStats();
    }
}

async function loadImports() {
    imports = await getImports();
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
async function editExport(index) {
    exports = await getExports();
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

async function addExport() {
    products = await getProducts();
    exports = await getExports();
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

    await updateProduct(editingProductIndex || products.length - 1, product);
    await updateProduct(editingExportIndex || exports.length - 1, exports[editingExportIndex]);
    loadExports();
    loadProducts();
    updateProductSelects();
    updateStats();
    document.getElementById('exportQuantity').value = '';
    document.getElementById('exportCustomer').value = '';
    document.getElementById('exportUnitPrice').value = '';
    document.getElementById('exportTotal').value = '';
}

async function deleteExport(index) {
    exports = await getExports();
    products = await getProducts();
    if (confirm('Bạn có chắc muốn xóa phiếu bán này?')) {
        const exportItem = exports[index];
        const product = products.find(p => p.code === exportItem.code);
        if (product) {
            product.stock += exportItem.quantity;
            product.totalExport -= exportItem.quantity;
        }
        exports.splice(index, 1);
        await updateProduct(editingProductIndex || products.length - 1, product);
        await updateProduct(editingExportIndex || exports.length - 1, exports[editingExportIndex]);
        loadExports();
        loadProducts();
        updateStats();
    }
}

async function loadExports() {
    exports = await getExports();
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
async function updateProductSelects() {
    products = await getProducts();
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
async function updateStats() {
    products = await getProducts();
    imports = await getImports();
    exports = await getExports();
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
async function filterProducts() {
    products = await getProducts();
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

async function exportToExcel(type) {
    let data, filename, sheetName;
    if (type === 'products') {
        data = (await getProducts()).map(({id, ...rest}) => rest);
        filename = 'DanhMucSanPham.xlsx';
        sheetName = 'Sản phẩm';
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, filename);
    } else if (type === 'import') {
        data = (await getImports()).map(({id, ...rest}) => rest);
        filename = 'NhapHang.xlsx';
        sheetName = 'Nhập hàng';
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, filename);
    } else if (type === 'export') {
        data = (await getExports()).map(({id, ...rest}) => rest);
        filename = 'BanHang.xlsx';
        sheetName = 'Bán hàng';
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, filename);
    } else {
        // Xuất tất cả: mỗi loại 1 sheet
        const products = (await getProducts()).map(({id, ...rest}) => rest);
        const imports = (await getImports()).map(({id, ...rest}) => rest);
        const exports = (await getExports()).map(({id, ...rest}) => rest);
        filename = 'TatCaDuLieu.xlsx';
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(products), 'Sản phẩm');
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(imports), 'Nhập hàng');
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(exports), 'Bán hàng');
        XLSX.writeFile(wb, filename);
    }
}

async function backupData() {
    const data = { products: await getProducts(), imports: await getImports(), exports: await getExports() };
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
        reader.onload = async function(e) {
            const json = e.target.result;
            const data = JSON.parse(json);
            localStorage.setItem('products', JSON.stringify(data.products || []));
            localStorage.setItem('imports', JSON.stringify(data.imports || []));
            localStorage.setItem('exports', JSON.stringify(data.exports || []));
            products = await getProducts();
            imports = await getImports();
            exports = await getExports();
            loadProducts();
            loadImports();
            loadExports();
            updateProductSelects();
            updateStats();
        };
        reader.readAsText(file);
    }
}

async function generateReport() {
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
        summaryTd1.textContent = await getProducts().length;
        summaryRow.appendChild(summaryTh1);
        summaryRow.appendChild(summaryTd1);
        reportTableBody.appendChild(summaryRow);

        const summaryRow2 = document.createElement('tr');
        const summaryTh2 = document.createElement('th');
        summaryTh2.colSpan = 5;
        summaryTh2.textContent = 'Tổng nhập (VND)';
        const summaryTd2 = document.createElement('td');
        summaryTd2.colSpan = 5;
        summaryTd2.textContent = formatCurrency(await getImports().reduce((total, importItem) => total + importItem.total, 0));
        summaryRow2.appendChild(summaryTh2);
        summaryRow2.appendChild(summaryTd2);
        reportTableBody.appendChild(summaryRow2);

        const summaryRow3 = document.createElement('tr');
        const summaryTh3 = document.createElement('th');
        summaryTh3.colSpan = 5;
        summaryTh3.textContent = 'Tổng bán (VND)';
        const summaryTd3 = document.createElement('td');
        summaryTd3.colSpan = 5;
        summaryTd3.textContent = formatCurrency(await getExports().reduce((total, exportItem) => total + exportItem.total, 0));
        summaryRow3.appendChild(summaryTh3);
        summaryRow3.appendChild(summaryTd3);
        reportTableBody.appendChild(summaryRow3);

        const summaryRow4 = document.createElement('tr');
        const summaryTh4 = document.createElement('th');
        summaryTh4.colSpan = 5;
        summaryTh4.textContent = 'Lợi nhuận (VND)';
        const summaryTd4 = document.createElement('td');
        summaryTd4.colSpan = 5;
        const totalProfit = await getExports().reduce((total, exportItem) => total + exportItem.total, 0) - await getImports().reduce((total, importItem) => total + importItem.total, 0);
        summaryTd4.textContent = formatCurrency(totalProfit);
        summaryRow4.appendChild(summaryTh4);
        summaryRow4.appendChild(summaryTd4);
        reportTableBody.appendChild(summaryRow4);
    } else if (reportType === 'product') {
        // Báo cáo theo sản phẩm
        await getProducts().forEach(async product => {
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
        await getImports().forEach(async importItem => {
            if (!dailyReport[importItem.date]) {
                dailyReport[importItem.date] = { totalImport: 0, totalExport: 0 };
            }
            dailyReport[importItem.date].totalImport += importItem.total;
        });
        await getExports().forEach(async exportItem => {
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

async function addProductFromForm() {
  const code = document.getElementById('productCode').value;
  const name = document.getElementById('productName').value;
  const unit = document.getElementById('productUnit').value;
  const importPrice = parseFloat(document.getElementById('importPrice').value) || 0;
  const sellPrice = parseFloat(document.getElementById('sellPrice').value) || 0;
  const minStock = parseInt(document.getElementById('minStock').value) || 10;
  const product = { code, name, unit, importPrice, sellPrice, minStock, stock: 0, totalImport: 0, totalExport: 0 };
  let ok = false;
  if (window.editingProductId) {
    ok = await updateProduct(window.editingProductId, product);
    window.editingProductId = null;
    document.querySelector('#products .btn-primary').textContent = "➕ Thêm sản phẩm";
  } else {
    ok = await addProduct(product);
  }
  if (ok) {
    alert('Đã lưu sản phẩm!');
    loadProducts();
  }
} 