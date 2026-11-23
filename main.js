/**
 * @module MainApplication
 * @description Enterprise entry point orchestrating 3D Menu Studio, Cart Vault, and UI Controller.
 */
import { DRINKS_CATALOG } from './data/drinksCatalog.js';
import { Drink3DEngine } from './engine/drink3DEngine.js';
import { initOceanBackdrop } from './engine/oceanBackdrop.js';
import { OceanAudioSynth } from './engine/oceanAudio.js';
import { CryptoVault } from './core/cryptoVault.js';
import { escapeHTML } from './core/sanitizer.js';

class BahrCafeApp {
  constructor() {
    this.engine3D = new Drink3DEngine();
    this.vault = new CryptoVault();
    this.audio = new OceanAudioSynth();

    this.state = {
      category: 'all',
      temp: 'all',
      search: '',
      cart: [],
      selectedDrink: null,
      customSize: 'M',
      customSizeDelta: 3,
      customMilk: 'كامل الدسم',
      customSugar: 'معتدل'
    };
  }

  async init() {
    initOceanBackdrop(document.getElementById('ambient-ocean-canvas'));
    this.state.cart = await this.vault.loadEncrypted('cart_items', []);
    this.updateCartBadge();

    // Mount Hero Signature 3D Cup
    const heroDrink = DRINKS_CATALOG.find((d) => d.id === 'sig-01') || DRINKS_CATALOG[0];
    this.engine3D.mountViewport(
      'hero-signature',
      document.getElementById('hero-cup-container'),
      heroDrink.model3D,
      { cameraZ: 3.7, autoRotate: true }
    );

    this.bindEvents();
    this.renderMenuGrid();
  }

  bindEvents() {
    // Category Tabs
    document.querySelectorAll('.cat-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.cat-tab').forEach((t) => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        this.state.category = tab.dataset.category;
        this.renderMenuGrid();
      });
    });

    // Temperature Filter Chips
    document.querySelectorAll('.filter-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        this.state.temp = chip.dataset.temp;
        this.renderMenuGrid();
      });
    });

    // Search Input
    const searchInput = document.getElementById('drink-search-input');
    searchInput.addEventListener('input', (e) => {
      this.state.search = e.target.value.trim().toLowerCase();
      this.renderMenuGrid();
    });

    // Ambient Audio Toggle
    const soundBtn = document.getElementById('sound-toggle-btn');
    soundBtn.addEventListener('click', () => {
      const active = this.audio.toggle();
      soundBtn.classList.toggle('playing', active);
      this.showToast(active ? '🌊 تم تشغيل صوت أمواج البحر الهادئة' : '🔇 تم كتم الصوت المحيطي');
    });

    // Modal Controls
    document.getElementById('modal-close-btn').addEventListener('click', () => this.closeModal());
    document.getElementById('drink-modal').addEventListener('click', (e) => {
      if (e.target.id === 'drink-modal') this.closeModal();
    });

    document.getElementById('rotate-toggle-btn').addEventListener('click', (e) => {
      const isRot = this.engine3D.toggleAutoRotate('modal-inspector');
      e.target.classList.toggle('active', isRot);
    });

    document.getElementById('wireframe-toggle-btn').addEventListener('click', (e) => {
      const next = !e.target.classList.contains('active');
      e.target.classList.toggle('active', next);
      this.engine3D.setWireframe('modal-inspector', next);
    });

    // Customizer Option Pills
    this.#bindOptionGroup('size-options', (btn) => {
      this.state.customSize = btn.dataset.size;
      this.state.customSizeDelta = Number(btn.dataset.delta || 0);
      this.updateModalPrice();
    });
    this.#bindOptionGroup('milk-options', (btn) => {
      this.state.customMilk = btn.dataset.milk;
    });
    this.#bindOptionGroup('sugar-options', (btn) => {
      this.state.customSugar = btn.dataset.sugar;
    });

    document.getElementById('modal-add-to-cart').addEventListener('click', () => {
      if (!this.state.selectedDrink) return;
      this.addToCart(this.state.selectedDrink, {
        size: this.state.customSize,
        delta: this.state.customSizeDelta,
        milk: this.state.customMilk,
        sugar: this.state.customSugar
      });
      this.closeModal();
    });

    // Cart Drawer
    document.getElementById('cart-open-btn').addEventListener('click', () => this.openCart());
    document.getElementById('cart-close-btn').addEventListener('click', () => this.closeCart());
    document.getElementById('checkout-btn').addEventListener('click', () => this.submitOrder());

    // VIP Reservation
    document.getElementById('reservation-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('res-name').value.trim();
      const zone = document.getElementById('res-zone').value;
      const guests = document.getElementById('res-guests').value;
      await this.vault.saveEncrypted('latest_reservation', { name, zone, guests, ts: Date.now() });
      this.showToast(`👑 تم تأكيد حجزك الملكي باسم ${escapeHTML(name)} بنجاح!`);
      e.target.reset();
    });
  }

  #bindOptionGroup(containerId, callback) {
    const container = document.getElementById(containerId);
    container.querySelectorAll('.opt-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.opt-pill').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        callback(btn);
      });
    });
  }

  getFilteredDrinks() {
    return DRINKS_CATALOG.filter((drink) => {
      const catMatch = this.state.category === 'all' || drink.category === this.state.category;
      const tempMatch = this.state.temp === 'all' || drink.temp === this.state.temp;
      const searchMatch =
        !this.state.search ||
        drink.name.toLowerCase().includes(this.state.search) ||
        drink.description.toLowerCase().includes(this.state.search);
      return catMatch && tempMatch && searchMatch;
    });
  }

  renderMenuGrid() {
    const grid = document.getElementById('drinks-grid');
    this.engine3D.clearCardViewports();
    const drinks = this.getFilteredDrinks();

    if (drinks.length === 0) {
      grid.innerHTML = `<div class="glass-panel" style="grid-column: 1/-1; padding: 3rem; text-align: center;">
        <h3>لم يتم العثور على مشروب مطابق</h3>
        <p style="color: var(--text-secondary);">جرّب اختيار تبويب آخر أو مسح نص البحث.</p>
      </div>`;
      return;
    }

    grid.innerHTML = drinks
      .map(
        (drink) => `
      <article class="drink-card" data-id="${escapeHTML(drink.id)}">
        <div class="card-3d-viewport" data-inspect="${escapeHTML(drink.id)}">
          <span class="card-badge-top">${escapeHTML(drink.badge)}</span>
          <div id="vp-${escapeHTML(drink.id)}" style="width:100%; height:100%;"></div>
          <span class="inspect-3d-hint">مجسم 3D • اضغط للتخصيص</span>
        </div>
        <div>
          <h3 class="drink-title">${escapeHTML(drink.name)}</h3>
          <p class="drink-subtitle">${escapeHTML(drink.description)}</p>
        </div>
        <div class="card-bottom-row">
          <span class="drink-price">${drink.price} ر.س</span>
          <div class="card-actions">
            <button type="button" class="btn-3d-view" data-inspect="${escapeHTML(drink.id)}">معاينة 3D</button>
            <button type="button" class="btn-quick-add" data-quick="${escapeHTML(drink.id)}">+ أضف</button>
          </div>
        </div>
      </article>
    `
      )
      .join('');

    // Mount individual 3D Cup models on every card
    drinks.forEach((drink) => {
      const host = document.getElementById(`vp-${drink.id}`);
      this.engine3D.mountViewport(`card-${drink.id}`, host, drink.model3D, {
        cameraZ: 4.5,
        autoRotate: true
      });
    });

    // Attach Card Listeners
    grid.querySelectorAll('[data-inspect]').forEach((el) => {
      el.addEventListener('click', () => {
        const drink = DRINKS_CATALOG.find((d) => d.id === el.dataset.inspect);
        if (drink) this.openModal(drink);
      });
    });

    grid.querySelectorAll('[data-quick]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const drink = DRINKS_CATALOG.find((d) => d.id === btn.dataset.quick);
        if (drink) {
          this.addToCart(drink, { size: 'M', delta: 0, milk: 'كامل الدسم', sugar: 'معتدل' });
        }
      });
    });
  }

  openModal(drink) {
    this.state.selectedDrink = drink;
    this.state.customSize = 'M';
    this.state.customSizeDelta = 3;

    document.getElementById('modal-category-badge').textContent = drink.categoryLabel;
    document.getElementById('modal-drink-title').textContent = drink.name;
    document.getElementById('modal-drink-desc').textContent = drink.description;
    document.getElementById('modal-calories').textContent = drink.calories;
    document.getElementById('modal-caffeine').textContent = `كافيين: ${drink.caffeine}`;
    document.getElementById('modal-volume').textContent = drink.volume;
    this.updateModalPrice();

    const modal = document.getElementById('drink-modal');
    modal.hidden = false;

    this.engine3D.mountViewport(
      'modal-inspector',
      document.getElementById('modal-canvas-host'),
      drink.model3D,
      { cameraZ: 3.6, autoRotate: true }
    );
  }

  closeModal() {
    this.engine3D.unmountViewport('modal-inspector');
    document.getElementById('drink-modal').hidden = true;
  }

  updateModalPrice() {
    if (!this.state.selectedDrink) return;
    const total = this.state.selectedDrink.price + this.state.customSizeDelta;
    document.getElementById('modal-price').textContent = `${total} ر.س`;
  }

  async addToCart(drink, custom) {
    const unitPrice = drink.price + (custom.delta || 0);
    const sig = `${drink.id}-${custom.size}-${custom.milk}-${custom.sugar}`;
    const existing = this.state.cart.find((item) => item.sig === sig);

    if (existing) {
      existing.qty += 1;
    } else {
      this.state.cart.push({
        sig,
        id: drink.id,
        name: drink.name,
        unitPrice,
        qty: 1,
        meta: `${custom.size} • ${custom.milk} • سكر ${custom.sugar}`
      });
    }

    await this.vault.saveEncrypted('cart_items', this.state.cart);
    this.updateCartBadge();
    this.showToast(`☕ تمت إضافة "${drink.name}" إلى سلة الطلبات`);
  }

  updateCartBadge() {
    const count = this.state.cart.reduce((acc, item) => acc + item.qty, 0);
    document.getElementById('cart-badge').textContent = count;
  }

  openCart() {
    this.renderCartItems();
    document.getElementById('cart-drawer').hidden = false;
  }

  closeCart() {
    document.getElementById('cart-drawer').hidden = true;
  }

  renderCartItems() {
    const container = document.getElementById('cart-items-container');
    if (this.state.cart.length === 0) {
      container.innerHTML = `<p style="text-align:center; color: var(--text-secondary); margin-top: 2rem;">سلة الطلبات فارغة حالياً</p>`;
      document.getElementById('cart-total-amount').textContent = '0 ر.س';
      return;
    }

    let grandTotal = 0;
    container.innerHTML = this.state.cart
      .map((item, idx) => {
        grandTotal += item.unitPrice * item.qty;
        return `
        <div class="cart-item">
          <div>
            <strong>${escapeHTML(item.name)}</strong>
            <div class="cart-item-meta">${escapeHTML(item.meta)}</div>
            <div style="color: var(--gold-light); font-weight:700; margin-top:4px;">${item.unitPrice * item.qty} ر.س</div>
          </div>
          <div class="qty-controls">
            <button class="qty-btn" data-act="dec" data-idx="${idx}">-</button>
            <span>${item.qty}</span>
            <button class="qty-btn" data-act="inc" data-idx="${idx}">+</button>
          </div>
        </div>
      `;
      })
      .join('');

    document.getElementById('cart-total-amount').textContent = `${grandTotal} ر.س`;

    container.querySelectorAll('.qty-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const idx = Number(btn.dataset.idx);
        if (btn.dataset.act === 'inc') this.state.cart[idx].qty += 1;
        else {
          this.state.cart[idx].qty -= 1;
          if (this.state.cart[idx].qty <= 0) this.state.cart.splice(idx, 1);
        }
        await this.vault.saveEncrypted('cart_items', this.state.cart);
        this.updateCartBadge();
        this.renderCartItems();
      });
    });
  }

  async submitOrder() {
    if (this.state.cart.length === 0) {
      this.showToast('يرجى إضافة مشروب واحد على الأقل أولاً.');
      return;
    }
    const table = document.getElementById('table-number-input').value.trim() || 'الاستلام السريع';
    this.state.cart = [];
    await this.vault.saveEncrypted('cart_items', []);
    this.updateCartBadge();
    this.closeCart();
    this.showToast(`✨ تم إرسال طلبك المشفر إلى البار (الوجهة: ${escapeHTML(table)})!`);
  }

  showToast(message) {
    const host = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.textContent = message;
    host.appendChild(toast);
    setTimeout(() => toast.remove(), 3600);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const app = new BahrCafeApp();
  app.init();
});
