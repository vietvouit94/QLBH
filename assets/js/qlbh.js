const supabaseUrl = 'https://bxyvzyiepjtlyrahjsxk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4eXZ6eWllcGp0bHlyYWhqc3hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2NjY4MDcsImV4cCI6MjA2NjI0MjgwN30.zFGBiU0OzZ2Ix9WjrTMP_mNXawtQYZMgdQIg3-NFMTk';
const { createClient } = supabase;
const supabaseClient = createClient(supabaseUrl, supabaseKey);

// Định nghĩa và gán global showTab ngay đầu file
function showTab(tabName) {
  const contents = document.querySelectorAll('.tab-content');
  contents.forEach(content => content.classList.remove('active'));
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => tab.classList.remove('active'));
  document.getElementById(tabName).classList.add('active');
  event.target.classList.add('active');
}

// Định nghĩa lại hàm refreshAllUI để tránh lỗi ReferenceError
async function refreshAllUI() {
    await loadProducts();
    await loadImports();
    await loadExports();
    await updateProductSelects();
    await updateStats();
    attachExportButtonHandler();
    attachImportButtonHandler();
}

// PRODUCTS CRUD
async function getProducts() {
  try {
    let { data, error } = await supabaseClient.from('products').select('*').order('id', { ascending: true });
    if (error) { alert('Lỗi lấy sản phẩm: ' + error.message); return []; }
    console.log('Products data:', data);
    if (!Array.isArray(data)) return [];
    return data;
  } catch (e) {
    alert('Lỗi kết nối Supabase: ' + e.message);
    return [];
  }
}
async function addProduct(product) {
  const { error } = await supabaseClient.from('products').insert([product]);
  if (error) { alert('Lỗi thêm sản phẩm: ' + error.message); return false; }
  return true;
}
async function updateProduct(id, updates) {
  const { error } = await supabaseClient.from('products').update(updates).eq('id', id);
  if (error) { alert('Lỗi cập nhật sản phẩm: ' + error.message); return false; }
  return true;
}
async function deleteProduct(id) {
  const { error } = await supabaseClient.from('products').delete().eq('id', id);
  if (error) { alert('Lỗi xóa sản phẩm: ' + error.message); return false; }
  await refreshAllUI();
  return true;
}

// IMPORTS CRUD
async function getImports() {
  try {
    let { data, error } = await supabaseClient.from('imports').select('*').order('id', { ascending: true });
    if (error) { alert('Lỗi lấy phiếu nhập: ' + error.message); return []; }
    console.log('Imports data:', data);
    if (!Array.isArray(data)) return [];
    return data;
  } catch (e) {
    alert('Lỗi kết nối Supabase: ' + e.message);
    return [];
  }
}
async function addImport() {
    try {
        // Lấy giá trị từ form
        const productCode = document.getElementById('importProduct').value;
        const quantity = parseInt(document.getElementById('importQuantity').value);
        const importPrice = parseFloat(document.getElementById('importUnitPrice').value);
        const date = document.getElementById('importDate').value;
        const note = document.getElementById('importNote').value || '';

        // Kiểm tra dữ liệu đầu vào
        if (!productCode || !quantity || !importPrice || !date) {
            alert('Vui lòng nhập đầy đủ thông tin!');
            return;
        }

        // Tính thành tiền
        const totalAmount = quantity * importPrice;

        // Tạo object insert đúng chuẩn bảng imports
        const importRecord = {
            product_code: productCode,
            quantity: quantity,
            import_price: importPrice,
            import_date: date,
            total_amount: totalAmount,
            note: note
        };

        // Insert vào Supabase
        const { data, error } = await supabaseClient
            .from('imports')
            .insert([importRecord])
            .select();

        if (error) {
            alert('Lỗi insert: ' + error.message);
            return;
        }

        alert('Thêm phiếu nhập thành công!');

        // Reset form
        document.getElementById('importProduct').value = '';
        document.getElementById('importQuantity').value = '';
        document.getElementById('importUnitPrice').value = '';
        document.getElementById('importDate').value = '';
        document.getElementById('importNote').value = '';
        document.getElementById('importTotal').value = '';

        // Cập nhật toàn bộ UI
        await refreshAllUI();
    } catch (error) {
        alert('Có lỗi xảy ra: ' + error.message);
    }
}
async function deleteImport(id) {
  const { error } = await supabaseClient.from('imports').delete().eq('id', id);
  if (error) alert('Lỗi xóa phiếu nhập: ' + error.message);
  await refreshAllUI();
}

// EXPORTS CRUD
async function getExports() {
  try {
    let { data, error } = await supabaseClient.from('exports').select('*').order('id', { ascending: true });
    if (error) { alert('Lỗi lấy phiếu bán: ' + error.message); return []; }
    console.log('Exports data:', data);
    if (!Array.isArray(data)) return [];
    return data;
  } catch (e) {
    alert('Lỗi kết nối Supabase: ' + e.message);
    return [];
  }
}
async function insertExport(exportItem) {
  const { data, error } = await supabaseClient.from('exports').insert([exportItem]);
  console.log('Supabase insert result:', { data, error });
  if (error) {
    console.error('Supabase error details:', error, exportItem);
    alert('Lỗi thêm phiếu bán: ' + error.message);
    return false;
  }
  await refreshAllUI();
  return true;
}
async function updateExport(id, updates) {
  const { error } = await supabaseClient.from('exports').update(updates).eq('id', id);
  if (error) { alert('Lỗi cập nhật phiếu bán: ' + error.message); return false; }
  return true;
}
async function deleteExport(index) {
    const exports = await getExports();
    const exportItem = exports[index];
    if (!exportItem || !exportItem.id) {
        alert('Không xác định được phiếu bán để xóa!');
        return;
    }
    if (confirm('Bạn có chắc muốn xóa phiếu bán này?')) {
        const { error } = await supabaseClient.from('exports').delete().eq('id', exportItem.id);
        if (error) {
            alert('Lỗi xóa phiếu bán: ' + error.message);
            return;
        }
        alert('Đã xóa phiếu bán!');
        await refreshAllUI();
    }
}

// ===== UI & LOGIC LAYER =====
// Đảm bảo không dùng await ngoài hàm async
// Khởi tạo dữ liệu khi DOMContentLoaded

document.addEventListener('DOMContentLoaded', function() {
  (async () => {
    await refreshAllUI();
    attachExportButtonHandler();
    attachImportButtonHandler();
  })();
});

// ===== PRODUCT CRUD =====
async function loadProducts(list) {
    const products = await getProducts();
    const tbody = document.getElementById('productsTableBody');
    tbody.innerHTML = '';
    const showList = list || products;
    showList.forEach((product) => {
        const stock = Number(product.stock) || 0;
        const importPrice = Number(product.import_price) || 0;
        const sellPrice = Number(product.sell_price) || 0;
        let stockStatus = 'in-stock';
        let stockBadge = '<span class="badge badge-success">Còn hàng</span>';
        if (stock === 0) {
            stockStatus = 'out-of-stock';
            stockBadge = '<span class="badge badge-danger">Hết hàng</span>';
        } else if (stock <= (Number(product.min_stock) || 0)) {
            stockStatus = 'low-stock';
            stockBadge = '<span class="badge badge-warning">Sắp hết</span>';
        }
        const row = `
            <tr class="${stockStatus === 'low-stock' ? 'low-stock' : stockStatus === 'out-of-stock' ? 'out-of-stock' : ''}">
                <td>${product.code || ''}</td>
                <td>${product.name || ''}</td>
                <td>${product.unit || ''}</td>
                <td class="text-right">${formatCurrency(importPrice)}</td>
                <td class="text-right">${formatCurrency(sellPrice)}</td>
                <td class="text-right">${stock}</td>
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

async function editProduct(index) {
    const products = await getProducts();
    const product = products[index];
    document.getElementById('productCode').value = product.code;
    document.getElementById('productName').value = product.name;
    document.getElementById('productUnit').value = product.unit;
    document.getElementById('importPrice').value = product.import_price;
    document.getElementById('sellPrice').value = product.sell_price;
    document.getElementById('minStock').value = product.min_stock;
    window.editingProductId = product.id;
    document.querySelector('#products .btn-primary').textContent = "💾 Cập nhật sản phẩm";
}

async function updateProductFromForm() {
    const id = window.editingProductId;
    if (!id) {
        alert('Không xác định được sản phẩm để cập nhật!');
        return;
    }
    const code = document.getElementById('productCode').value;
    const name = document.getElementById('productName').value;
    const unit = document.getElementById('productUnit').value;
    const import_price = parseFloat(document.getElementById('importPrice').value) || 0;
    const sell_price = parseFloat(document.getElementById('sellPrice').value) || 0;
    const min_stock = parseInt(document.getElementById('minStock').value) || 10;
    const updates = { code, name, unit, import_price, sell_price, min_stock };
    const { error } = await supabaseClient.from('products').update(updates).eq('id', id);
    if (error) {
        alert('Lỗi cập nhật sản phẩm: ' + error.message);
        return;
    }
    alert('Đã cập nhật sản phẩm!');
    window.editingProductId = null;
    document.querySelector('#products .btn-primary').textContent = "+ Thêm sản phẩm";
    await refreshAllUI();
}

async function deleteProduct(index) {
    const products = await getProducts();
    const product = products[index];
    if (!product || !product.id) {
        alert('Không xác định được sản phẩm để xóa!');
        return;
    }
    if (confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
        const { error } = await supabaseClient.from('products').delete().eq('id', product.id);
        if (error) {
            alert('Lỗi xóa sản phẩm: ' + error.message);
            return;
        }
        alert('Đã xóa sản phẩm!');
        await refreshAllUI();
    }
}

// ===== IMPORT CRUD =====
async function loadImports() {
    imports = await getImports();
    products = await getProducts();
    const tbody = document.getElementById('importTableBody');
    tbody.innerHTML = '';
    imports.forEach((importItem, index) => {
        const product = products.find(p => p.code === importItem.product_code);
        const productName = product ? product.name : '';
        const row = `
            <tr>
                <td>${importItem.import_date || ''}</td>
                <td>${importItem.product_code || ''}</td>
                <td>${productName}</td>
                <td class="text-right">${importItem.quantity || 0}</td>
                <td class="text-right">${formatCurrency(importItem.import_price)}</td>
                <td class="text-right">${formatCurrency(importItem.total_amount)}</td>
                <td>${importItem.note || ''}</td>
                <td class="text-center">
                    <button class="btn btn-warning btn-sm" onclick="editImport(${index})">✏️</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteImport(${index})">🗑️</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

async function editImport(index) {
    const imports = await getImports();
    const importItem = imports[index];
    document.getElementById('importDate').value = importItem.import_date;
    document.getElementById('importProduct').value = importItem.product_code;
    document.getElementById('importQuantity').value = importItem.quantity;
    document.getElementById('importUnitPrice').value = importItem.import_price;
    document.getElementById('importTotal').value = importItem.total_amount;
    document.getElementById('importNote').value = importItem.note;
    window.editingImportId = importItem.id;
    const btn = document.getElementById('importSaveBtn') || document.querySelector('#import .btn-success');
    if (btn) btn.textContent = "💾 Cập nhật phiếu nhập";
}

async function updateImportFromForm() {
    console.log('Gọi updateImportFromForm với id:', window.editingImportId);
    const id = window.editingImportId;
    if (!id) {
        alert('Không xác định được phiếu nhập để cập nhật!');
        return;
    }
    const import_date = document.getElementById('importDate').value;
    const product_code = document.getElementById('importProduct').value;
    const quantity = parseInt(document.getElementById('importQuantity').value) || 0;
    const import_price = parseFloat(document.getElementById('importUnitPrice').value) || 0;
    const total_amount = parseFloat(document.getElementById('importTotal').value) || 0;
    const note = document.getElementById('importNote').value;
    const updates = { import_date, product_code, quantity, import_price, total_amount, note };
    const { error } = await supabaseClient.from('imports').update(updates).eq('id', id);
    console.log('Kết quả update:', { error, updates, id });
    if (error) {
        alert('Lỗi cập nhật phiếu nhập: ' + error.message);
        return;
    }
    alert('Đã cập nhật phiếu nhập!');
    window.editingImportId = null;
    const btn = document.getElementById('importSaveBtn') || document.querySelector('#import .btn-success');
    if (btn) btn.textContent = "+ THÊM PHIẾU NHẬP";
    // Reset form
    document.getElementById('importDate').value = '';
    document.getElementById('importProduct').value = '';
    document.getElementById('importQuantity').value = '';
    document.getElementById('importUnitPrice').value = '';
    document.getElementById('importTotal').value = '';
    document.getElementById('importNote').value = '';
    await refreshAllUI();
}

async function deleteImport(index) {
    const imports = await getImports();
    const importItem = imports[index];
    if (!importItem || !importItem.id) {
        alert('Không xác định được phiếu nhập để xóa!');
        return;
    }
    if (confirm('Bạn có chắc muốn xóa phiếu nhập này?')) {
        const { error } = await supabaseClient.from('imports').delete().eq('id', importItem.id);
        if (error) {
            alert('Lỗi xóa phiếu nhập: ' + error.message);
            return;
        }
        alert('Đã xóa phiếu nhập!');
        await refreshAllUI();
    }
}

// ===== EXPORT CRUD =====
async function loadExports() {
    exports = await getExports();
    products = await getProducts();
    const tbody = document.getElementById('exportTableBody');
    tbody.innerHTML = '';
    exports.forEach((exportItem, index) => {
        const product = products.find(p => p.code === exportItem.product_code);
        const productName = product ? product.name : '';
        const row = `
            <tr>
                <td>${exportItem.export_date || ''}</td>
                <td>${exportItem.product_code || ''}</td>
                <td>${productName}</td>
                <td class="text-right">${exportItem.quantity || 0}</td>
                <td class="text-right">${formatCurrency(exportItem.sell_price)}</td>
                <td class="text-right">${formatCurrency(exportItem.total_amount)}</td>
                <td>${exportItem.customer || ''}</td>
                <td class="text-center">
                    <button class="btn btn-warning btn-sm" onclick="editExport(${index})">✏️</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteExport(${index})">🗑️</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

async function editExport(index) {
    const exports = await getExports();
    const exportItem = exports[index];
    document.getElementById('exportDate').value = exportItem.export_date;
    document.getElementById('exportProduct').value = exportItem.product_code;
    document.getElementById('exportQuantity').value = exportItem.quantity;
    document.getElementById('exportUnitPrice').value = exportItem.sell_price;
    document.getElementById('exportTotal').value = exportItem.total_amount;
    document.getElementById('exportCustomer').value = exportItem.customer;
    window.editingExportId = exportItem.id;
    const btn = document.querySelector('#export .btn-success');
    if (btn) btn.textContent = "💾 Cập nhật phiếu bán";
}

async function updateExportFromForm() {
    console.log('Gọi updateExportFromForm với id:', window.editingExportId);
    const id = window.editingExportId;
    if (!id) {
        alert('Không xác định được phiếu bán để cập nhật!');
        return;
    }
    const export_date = document.getElementById('exportDate').value;
    const product_code = document.getElementById('exportProduct').value;
    const quantity = parseInt(document.getElementById('exportQuantity').value) || 0;
    const sell_price = parseFloat(document.getElementById('exportUnitPrice').value) || 0;
    const total_amount = parseFloat(document.getElementById('exportTotal').value) || 0;
    const customer = document.getElementById('exportCustomer').value;
    const updates = { export_date, product_code, quantity, sell_price, total_amount, customer };
    const { error } = await supabaseClient.from('exports').update(updates).eq('id', id);
    console.log('Kết quả update:', { error, updates, id });
    if (error) {
        alert('Lỗi cập nhật phiếu bán: ' + error.message);
        return;
    }
    alert('Đã cập nhật phiếu bán!');
    window.editingExportId = null;
    const btn = document.querySelector('#export .btn-success');
    if (btn) btn.textContent = "➕ Thêm phiếu bán";
    // Reset form
    document.getElementById('exportDate').value = '';
    document.getElementById('exportProduct').value = '';
    document.getElementById('exportQuantity').value = '';
    document.getElementById('exportUnitPrice').value = '';
    document.getElementById('exportTotal').value = '';
    document.getElementById('exportCustomer').value = '';
    await refreshAllUI();
}

async function deleteExport(index) {
    const exports = await getExports();
    const exportItem = exports[index];
    if (!exportItem || !exportItem.id) {
        alert('Không xác định được phiếu bán để xóa!');
        return;
    }
    if (confirm('Bạn có chắc muốn xóa phiếu bán này?')) {
        const { error } = await supabaseClient.from('exports').delete().eq('id', exportItem.id);
        if (error) {
            alert('Lỗi xóa phiếu bán: ' + error.message);
            return;
        }
        alert('Đã xóa phiếu bán!');
        await refreshAllUI();
    }
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
    // Gắn lại sự kiện sau khi đã có products và DOM
    exportSelect.onchange = updateExportPrice;
    const exportQuantityInput = document.getElementById('exportQuantity');
    if (exportQuantityInput) {
        exportQuantityInput.oninput = calculateExportTotal;
    }
}
async function updateStats() {
    products = await getProducts();
    imports = await getImports();
    exports = await getExports();
    const totalProducts = Array.isArray(products) ? products.length : 0;
    const totalImportValue = (Array.isArray(imports) ? imports : []).reduce((total, importItem) => total + (importItem?.total_amount || 0), 0);
    const totalExportValue = (Array.isArray(exports) ? exports : []).reduce((total, exportItem) => total + (exportItem?.total_amount || 0), 0);
    const totalProfit = totalExportValue - totalImportValue;
    document.getElementById('totalProducts').textContent = totalProducts;
    document.getElementById('totalImportValue').textContent = formatCurrency(totalImportValue);
    document.getElementById('totalExportValue').textContent = formatCurrency(totalExportValue);
    document.getElementById('totalProfit').textContent = formatCurrency(totalProfit);
}
function formatCurrency(value) {
    value = Number(value);
    if (isNaN(value)) value = 0;
    return value.toLocaleString('vi-VN') + '₫';
}
async function filterProducts() {
    products = await getProducts();
    const searchProduct = document.getElementById('searchProduct').value.toLowerCase();
    const stockFilter = document.getElementById('stockFilter').value;
    const sortProduct = document.getElementById('sortProduct').value;
    let filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchProduct) || product.code.toLowerCase().includes(searchProduct);
        const matchesStock = stockFilter === '' || (stockFilter === 'in-stock' && product.stock > 0) || (stockFilter === 'low-stock' && product.stock <= product.min_stock) || (stockFilter === 'out-of-stock' && product.stock === 0);
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
            const profitA = (a.sell_price - a.import_price) * (a.total_export || 0);
            const profitB = (b.sell_price - b.import_price) * (b.total_export || 0);
            return profitB - profitA;
        }
    });
    loadProducts(filteredProducts);
}
function updateImportPrice() {
    const productCode = document.getElementById('importProduct').value;
    const product = products.find(p => p.code === productCode);
    if (product) {
        document.getElementById('importUnitPrice').value = product.import_price.toFixed(2);
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
        document.getElementById('exportUnitPrice').value = product.sell_price;
        calculateExportTotal();
    } else {
        document.getElementById('exportUnitPrice').value = 0;
        document.getElementById('exportTotal').value = 0;
    }
}
function calculateExportTotal() {
    const quantity = parseInt(document.getElementById('exportQuantity').value) || 0;
    const productCode = document.getElementById('exportProduct').value;
    const product = products.find(p => p.code === productCode);
    const unitPrice = product ? parseFloat(product.sell_price) : 0;
    const total = quantity * unitPrice;
    document.getElementById('exportTotal').value = total;
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
        summaryTd1.textContent = (await getProducts()).length;
        summaryRow.appendChild(summaryTh1);
        summaryRow.appendChild(summaryTd1);
        reportTableBody.appendChild(summaryRow);

        // Sửa lỗi await getImports().reduce(...)
        const imports = await getImports();
        const exports = await getExports();
        const totalImportValue = (Array.isArray(imports) ? imports : []).reduce((total, importItem) => total + (importItem?.total || 0), 0);
        const totalExportValue = (Array.isArray(exports) ? exports : []).reduce((total, exportItem) => total + (exportItem?.total || 0), 0);
        const totalProfit = totalExportValue - totalImportValue;

        const summaryRow2 = document.createElement('tr');
        const summaryTh2 = document.createElement('th');
        summaryTh2.colSpan = 5;
        summaryTh2.textContent = 'Tổng nhập (VND)';
        const summaryTd2 = document.createElement('td');
        summaryTd2.colSpan = 5;
        summaryTd2.textContent = formatCurrency(totalImportValue);
        summaryRow2.appendChild(summaryTh2);
        summaryRow2.appendChild(summaryTd2);
        reportTableBody.appendChild(summaryRow2);

        const summaryRow3 = document.createElement('tr');
        const summaryTh3 = document.createElement('th');
        summaryTh3.colSpan = 5;
        summaryTh3.textContent = 'Tổng bán (VND)';
        const summaryTd3 = document.createElement('td');
        summaryTd3.colSpan = 5;
        summaryTd3.textContent = formatCurrency(totalExportValue);
        summaryRow3.appendChild(summaryTh3);
        summaryRow3.appendChild(summaryTd3);
        reportTableBody.appendChild(summaryRow3);

        const summaryRow4 = document.createElement('tr');
        const summaryTh4 = document.createElement('th');
        summaryTh4.colSpan = 5;
        summaryTh4.textContent = 'Lợi nhuận (VND)';
        const summaryTd4 = document.createElement('td');
        summaryTd4.colSpan = 5;
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
            td5.textContent = formatCurrency(product.import_price);
            row.appendChild(td5);
            const td6 = document.createElement('td');
            td6.textContent = formatCurrency(product.sell_price);
            row.appendChild(td6);
            reportTableBody.appendChild(row);
        });
    } else if (reportType === 'daily') {
        // Báo cáo theo ngày
        const dailyReport = {};
        await getImports().forEach(async importItem => {
            if (!dailyReport[importItem.date]) {
                dailyReport[importItem.date] = { total_import: 0, total_export: 0 };
            }
            dailyReport[importItem.date].total_import += importItem.total;
        });
        await getExports().forEach(async exportItem => {
            if (!dailyReport[exportItem.date]) {
                dailyReport[exportItem.date] = { total_import: 0, total_export: 0 };
            }
            dailyReport[exportItem.date].total_export += exportItem.total;
        });
        Object.entries(dailyReport).forEach(([date, report]) => {
            const row = document.createElement('tr');
            const td1 = document.createElement('td');
            td1.textContent = date;
            row.appendChild(td1);
            const td2 = document.createElement('td');
            td2.textContent = formatCurrency(report.total_import);
            row.appendChild(td2);
            const td3 = document.createElement('td');
            td3.textContent = formatCurrency(report.total_export);
            row.appendChild(td3);
            const td4 = document.createElement('td');
            td4.textContent = formatCurrency(report.total_export - report.total_import);
            row.appendChild(td4);
            reportTableBody.appendChild(row);
        });
    }
}

async function addProductFromForm() {
  const code = document.getElementById('productCode').value;
  const name = document.getElementById('productName').value;
  const unit = document.getElementById('productUnit').value;
  const import_price = parseFloat(document.getElementById('importPrice').value) || 0;
  const sell_price = parseFloat(document.getElementById('sellPrice').value) || 0;
  const min_stock = parseInt(document.getElementById('minStock').value) || 10;
  const product = { code, name, unit, import_price, sell_price, min_stock, stock: 0, total_import: 0, total_export: 0 };
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

// Hàm cập nhật tồn kho sản phẩm dựa trên tổng số lượng nhập và xuất
async function updateAllProductStocks() {
    const products = await getProducts();
    const imports = await getImports();
    const exports = await getExports();
    for (const product of products) {
        const totalImport = imports
            .filter(imp => imp.product_code === product.code)
            .reduce((sum, imp) => sum + (imp.quantity || 0), 0);
        const totalExport = exports
            .filter(exp => exp.code === product.code)
            .reduce((sum, exp) => sum + (exp.quantity || 0), 0);
        const stock = totalImport - totalExport;
        await updateProduct(product.id, { stock });
    }
    await loadProducts();
}

// Gắn sự kiện onchange cho select sản phẩm và input số lượng
if (document.getElementById('exportProduct')) {
    document.getElementById('exportProduct').onchange = updateExportPrice;
}
if (document.getElementById('exportQuantity')) {
    document.getElementById('exportQuantity').oninput = calculateExportTotal;
}

// Gắn lại sự kiện cho nút lưu/cập nhật phiếu bán
if (document.querySelector('#export .btn-success')) {
    document.querySelector('#export .btn-success').onclick = function() {
        if (window.editingExportId) {
            updateExportFromForm();
        } else {
            addExport();
        }
    };
}

// Gắn lại sự kiện cho nút lưu/cập nhật sản phẩm
if (document.querySelector('#products .btn-primary')) {
    document.querySelector('#products .btn-primary').onclick = function() {
        if (window.editingProductId) {
            updateProductFromForm();
        } else {
            addProductFromForm();
        }
    };
}

function attachExportButtonHandler() {
    const btn = document.getElementById('exportSaveBtn');
    if (btn) {
        btn.onclick = function() {
            if (window.editingExportId) {
                updateExportFromForm();
            } else {
                addExport();
            }
        };
    }
}

function attachImportButtonHandler() {
    const btn = document.getElementById('importSaveBtn');
    if (btn) {
        btn.onclick = function() {
            if (window.editingImportId) {
                updateImportFromForm();
            } else {
                addImport();
            }
        };
    }
}

async function addExport() {
    try {
        // Lấy giá trị từ form
        const productCode = document.getElementById('exportProduct').value;
        const quantity = parseInt(document.getElementById('exportQuantity').value);
        const sellPrice = parseFloat(document.getElementById('exportUnitPrice').value);
        const date = document.getElementById('exportDate').value;
        const customer = document.getElementById('exportCustomer').value || '';

        // Kiểm tra dữ liệu đầu vào
        if (!productCode || !quantity || !sellPrice || !date) {
            alert('Vui lòng nhập đầy đủ thông tin!');
            return;
        }

        // Tính thành tiền
        const totalAmount = quantity * sellPrice;

        // Tạo object insert đúng chuẩn bảng exports
        const exportRecord = {
            product_code: productCode,
            quantity: quantity,
            sell_price: sellPrice,
            export_date: date,
            total_amount: totalAmount,
            customer: customer
        };

        // Insert vào Supabase
        const { data, error } = await supabaseClient
            .from('exports')
            .insert([exportRecord])
            .select();

        if (error) {
            alert('Lỗi insert: ' + error.message);
            return;
        }

        alert('Thêm phiếu bán thành công!');

        // Reset form
        document.getElementById('exportProduct').value = '';
        document.getElementById('exportQuantity').value = '';
        document.getElementById('exportUnitPrice').value = '';
        document.getElementById('exportDate').value = '';
        document.getElementById('exportCustomer').value = '';
        document.getElementById('exportTotal').value = '';

        // Cập nhật toàn bộ UI
        await refreshAllUI();
    } catch (error) {
        alert('Có lỗi xảy ra: ' + error.message);
    }
} 