/* =====================================================
   FoodieMenu – script.js
   Giữ nguyên toàn bộ logic gốc, bổ sung cart badge
   ===================================================== */

/* ---- Dữ liệu mẫu (localStorage) ---- */
let categories = JSON.parse(localStorage.getItem('fm_categories')) || [
  { id: 1, name: 'Món chính' },
  { id: 2, name: 'Khai vị' },
  { id: 3, name: 'Tráng miệng' },
  { id: 4, name: 'Đồ uống' }
];

let dishes = JSON.parse(localStorage.getItem('fm_dishes')) || [
  { id: 1, name: 'Phở Bò', price: 65000, image: 'https://tarasmulticulturaltable.com/wp-content/uploads/2013/06/Pho-Bo-Vietnamese-Beef-Noodle-Soup-2-of-3.jpg', description: 'Phở bò truyền thống thơm ngon', categoryId: 1, active: true },
  { id: 2, name: 'Bún Bò Huế', price: 60000, image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRBB6Za60XMWyGPOpLpJ8gu-wa8-rpic49kduoWngIxAw&s=10', description: 'Bún bò đậm đà đặc trưng Huế', categoryId: 5, active: true },
  { id: 3, name: 'Gỏi Cuốn', price: 40000, image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcStNE3HrPBN6BAVOp0nfdBE_2EXM4xBetzhyFhMhwVaHg&s=10', description: 'Gỏi cuốn tươi mát kèm nước chấm', categoryId: 2, active: true },
  { id: 4, name: 'Chè Ba Màu', price: 30000, image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSe46Khsj4eodrI1pkEOKDOkv5vyCVbZ_RXUgGaJLMFIg&s=10', description: 'Chè ba màu mát lạnh', categoryId: 3, active: true },
  { id: 5, name: 'Cà Phê Sữa Đá', price: 25000, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/A_small_cup_of_coffee.JPG/1280px-A_small_cup_of_coffee.JPG', description: 'Cà phê sữa đá đậm đà', categoryId: 4, active: true }
];

let cart = JSON.parse(localStorage.getItem('fm_cart')) || [];

/* ---- Helpers ---- */
function saveCategories() { localStorage.setItem('fm_categories', JSON.stringify(categories)); }
function saveDishes()     { localStorage.setItem('fm_dishes',     JSON.stringify(dishes)); }
function saveCart()       { localStorage.setItem('fm_cart',       JSON.stringify(cart)); }

function getCategoryName(id) {
  const c = categories.find(c => c.id === id);
  return c ? c.name : 'Không rõ';
}

function formatPrice(p) {
  return p.toLocaleString('vi-VN') + ' VNĐ';
}

/* ---- Cart badge ---- */
function updateCartBadge() {
  const total = cart.reduce((s, i) => s + i.qty, 0);
  $('#cartBadge').text(total);
}

/* ========== RENDER DISH LIST (index.html) ========== */
function renderDishList() {
  if (!$('#dishList').length) return;

  const keyword  = ($('#searchInput').val() || '').toLowerCase();
  const catFilter = $('#filterCategory').val() || 'all';

  const filtered = dishes.filter(d => {
    if (!d.active) return false;
    if (keyword && !d.name.toLowerCase().includes(keyword)) return false;
    if (catFilter !== 'all' && String(d.categoryId) !== catFilter) return false;
    return true;
  });

  let html = '';
  filtered.forEach(d => {
    html += `
      <div class="col-sm-6 col-lg-4 col-xl-3">
        <div class="dish-card">
          <img src="${d.image || 'https://via.placeholder.com/400x240?text=No+Image'}"
               alt="${d.name}"
               onerror="this.src='https://via.placeholder.com/400x240?text=No+Image'">
          <div class="dish-card-body">
            <div class="dish-card-cat">${getCategoryName(d.categoryId)}</div>
            <div class="dish-card-name">${d.name}</div>
            <div class="dish-card-price">${formatPrice(d.price)}</div>
            <div class="dish-card-actions">
              <button class="btn btn-outline-secondary btn-sm" onclick="showDetail(${d.id})">Chi tiết</button>
              <button class="btn btn-danger btn-sm" onclick="addToCart(${d.id})">🛒 Thêm</button>
            </div>
          </div>
        </div>
      </div>`;
  });

  if (!html) html = '<div class="col"><p class="text-muted">Không tìm thấy món nào.</p></div>';
  $('#dishList').html(html);
}

/* ========== CATEGORY FILTER DROPDOWN (index.html) ========== */
function renderFilterCategory() {
  if (!$('#filterCategory').length) return;
  let html = '<option value="all">Tất cả</option>';
  categories.forEach(c => { html += `<option value="${c.id}">${c.name}</option>`; });
  $('#filterCategory').html(html);
}

/* ========== CART ========== */
function addToCart(dishId) {
  const dish = dishes.find(d => d.id === dishId);
  if (!dish) return;

  const item = cart.find(i => i.dishId === dishId);
  if (item) {
    item.qty++;
  } else {
    cart.push({ dishId, qty: 1 });
  }
  saveCart();
  renderCart();
  updateCartBadge();

  // open drawer if on index page
  $('#cartDrawer, #cartOverlay').addClass('open');
}

function removeFromCart(dishId) {
  cart = cart.filter(i => i.dishId !== dishId);
  saveCart();
  renderCart();
  updateCartBadge();
}

function changeQty(dishId, delta) {
  const item = cart.find(i => i.dishId === dishId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) { removeFromCart(dishId); return; }
  saveCart();
  renderCart();
  updateCartBadge();
}

function renderCart() {
  if (!$('#cartTable').length) return;

  let total = 0;
  let html = '';

  cart.forEach(item => {
    const dish = dishes.find(d => d.id === item.dishId);
    if (!dish) return;
    const sub = dish.price * item.qty;
    total += sub;
    html += `
      <tr>
        <td>${dish.name}</td>
        <td>
          <div class="d-flex align-items-center gap-1">
            <button class="btn btn-sm btn-outline-secondary py-0 px-1" onclick="changeQty(${dish.id},-1)">−</button>
            <span>${item.qty}</span>
            <button class="btn btn-sm btn-outline-secondary py-0 px-1" onclick="changeQty(${dish.id},1)">+</button>
          </div>
        </td>
        <td>${formatPrice(dish.price)}</td>
        <td>${formatPrice(sub)}</td>
        <td><button class="btn btn-sm btn-danger py-0" onclick="removeFromCart(${dish.id})">✕</button></td>
      </tr>`;
  });

  if (!html) html = '<tr><td colspan="5" class="text-center text-muted">Giỏ hàng trống</td></tr>';
  $('#cartTable').html(html);
  $('#cartTotal').text(formatPrice(total));
}

/* ========== DETAIL MODAL ========== */
function showDetail(dishId) {
  const dish = dishes.find(d => d.id === dishId);
  if (!dish) return;

  $('#modalContent').html(`
    <img src="${dish.image || ''}" class="img-fluid rounded mb-3"
         onerror="this.style.display='none'" alt="${dish.name}">
    <h5 class="fw-bold">${dish.name}</h5>
    <p class="text-muted mb-1">${getCategoryName(dish.categoryId)}</p>
    <p class="fs-5 text-danger fw-bold mb-2">${formatPrice(dish.price)}</p>
    <p>${dish.description || 'Chưa có mô tả.'}</p>
    <button class="btn btn-danger w-100 mt-2" onclick="addToCart(${dish.id});bootstrap.Modal.getInstance(document.getElementById('detailModal')).hide()">
      🛒 Thêm vào giỏ
    </button>
  `);

  new bootstrap.Modal(document.getElementById('detailModal')).show();
}

/* ========== ADMIN – DISH ========== */
function renderAdminTable() {
  if (!$('#adminTable').length) return;
  let html = '';
  dishes.forEach(d => {
    html += `
      <tr>
        <td>${d.id}</td>
        <td>${d.name}</td>
        <td>${formatPrice(d.price)}</td>
        <td>
          <span class="badge ${d.active ? 'bg-success' : 'bg-secondary'}">
            ${d.active ? 'Đang bán' : 'Ẩn'}
          </span>
        </td>
        <td>
          <button class="btn btn-sm btn-warning me-1" onclick="editDish(${d.id})">Sửa</button>
          <button class="btn btn-sm ${d.active ? 'btn-secondary' : 'btn-success'}" onclick="toggleDish(${d.id})">
            ${d.active ? 'Ẩn' : 'Hiện'}
          </button>
          <button class="btn btn-sm btn-danger ms-1" onclick="deleteDish(${d.id})">Xoá</button>
        </td>
      </tr>`;
  });
  $('#adminTable').html(html || '<tr><td colspan="5" class="text-center text-muted">Chưa có món</td></tr>');
}

function renderDishCategorySelect() {
  if (!$('#dishCategory').length) return;
  let html = '';
  categories.forEach(c => { html += `<option value="${c.id}">${c.name}</option>`; });
  $('#dishCategory').html(html);
}

$('#btnSave').on('click', function () {
  const id    = $('#dishId').val();
  const name  = $('#dishName').val().trim();
  const price = parseFloat($('#dishPrice').val());
  const image = $('#dishImage').val().trim();
  const desc  = $('#dishDescription').val().trim();
  const catId = parseInt($('#dishCategory').val());

  if (!name || isNaN(price)) return alert('Vui lòng nhập tên và giá.');

  if (id) {
    const dish = dishes.find(d => d.id === parseInt(id));
    if (dish) Object.assign(dish, { name, price, image, description: desc, categoryId: catId });
    $('#btnSave').text('Thêm món');
    $('#dishId').val('');
  } else {
    const newId = dishes.length ? Math.max(...dishes.map(d => d.id)) + 1 : 1;
    dishes.push({ id: newId, name, price, image, description: desc, categoryId: catId, active: true });
  }

  ['#dishName','#dishPrice','#dishImage','#dishDescription'].forEach(s => $(s).val(''));
  saveDishes();
  renderAdminTable();
});

function editDish(id) {
  const d = dishes.find(x => x.id === id);
  if (!d) return;
  $('#dishId').val(d.id);
  $('#dishName').val(d.name);
  $('#dishPrice').val(d.price);
  $('#dishImage').val(d.image);
  $('#dishDescription').val(d.description);
  $('#dishCategory').val(d.categoryId);
  $('#btnSave').text('Cập nhật món');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleDish(id) {
  const d = dishes.find(x => x.id === id);
  if (d) { d.active = !d.active; saveDishes(); renderAdminTable(); }
}

function deleteDish(id) {
  if (!confirm('Xoá món này?')) return;
  dishes = dishes.filter(d => d.id !== id);
  saveDishes();
  renderAdminTable();
}

/* ========== ADMIN – CATEGORY ========== */
function renderCategoryTable() {
  if (!$('#categoryTable').length) return;
  let html = '';
  categories.forEach(c => {
    html += `
      <tr>
        <td>${c.id}</td>
        <td>${c.name}</td>
        <td>
          <button class="btn btn-sm btn-warning me-1" onclick="editCategory(${c.id})">Sửa</button>
          <button class="btn btn-sm btn-danger" onclick="deleteCategory(${c.id})">Xoá</button>
        </td>
      </tr>`;
  });
  $('#categoryTable').html(html || '<tr><td colspan="3" class="text-center text-muted">Chưa có danh mục</td></tr>');
}

$('#btnCategory').on('click', function () {
  const id   = $('#categoryId').val();
  const name = $('#categoryName').val().trim();
  if (!name) return alert('Nhập tên danh mục.');

  if (id) {
    const cat = categories.find(c => c.id === parseInt(id));
    if (cat) cat.name = name;
    $('#btnCategory').text('Thêm danh mục');
    $('#categoryId').val('');
  } else {
    const newId = categories.length ? Math.max(...categories.map(c => c.id)) + 1 : 1;
    categories.push({ id: newId, name });
  }

  $('#categoryName').val('');
  saveCategories();
  renderCategoryTable();
  renderDishCategorySelect();
  renderFilterCategory();
});

function editCategory(id) {
  const c = categories.find(x => x.id === id);
  if (!c) return;
  $('#categoryId').val(c.id);
  $('#categoryName').val(c.name);
  $('#btnCategory').text('Cập nhật danh mục');
}

function deleteCategory(id) {
  if (!confirm('Xoá danh mục này?')) return;
  categories = categories.filter(c => c.id !== id);
  saveCategories();
  renderCategoryTable();
  renderDishCategorySelect();
  renderFilterCategory();
}

/* ========== SEARCH & FILTER ========== */
$(document).on('input', '#searchInput', renderDishList);
$(document).on('change', '#filterCategory', renderDishList);

/* ========== INIT ========== */
$(function () {
  renderFilterCategory();
  renderDishCategorySelect();
  renderDishList();
  renderAdminTable();
  renderCategoryTable();
  renderCart();
  updateCartBadge();
});
