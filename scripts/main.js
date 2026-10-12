/*
 * Ponto de entrada do projeto. Este arquivo usa JavaScript puro e classes para
 * que os alunos possam estudar encapsulamento, responsabilidade e composição.
 * Os dados ficam no navegador (localStorage); autenticação real exige backend.
 */
class StorageRepository {
  constructor(storage = window.localStorage) { this.storage = storage; }
  get(key, fallback = []) {
    try { return JSON.parse(this.storage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  }
  save(key, value) { this.storage.setItem(key, JSON.stringify(value)); }
}

class LoginController {
  constructor(form, repository) {
    this.form = form;
    this.repository = repository;
    this.form?.addEventListener("submit", (event) => this.login(event));
  }
  login(event) {
    event.preventDefault();
    const email = this.form.elements.email.value.trim().toLowerCase();
    const password = this.form.elements.password.value;
    if (email !== "aluno@fullstack.dev" || password !== "123456") {
      window.alert("Credenciais inválidas. Use o acesso de demonstração indicado na página.");
      return;
    }
    this.repository.save("training-session", { email, signedInAt: new Date().toISOString() });
    window.location.href = "pages/dashboard/dashboard.html";
  }
}

class DashboardController {
  constructor(repository) {
    this.repository = repository;
    document.querySelector(".toggle-btn")?.addEventListener("click", () => {
      document.querySelector(".sidebar")?.classList.toggle("is-collapsed");
    });
    this.bindUserForm();
    this.bindProductForm();
    this.bindSettingsForm();
    this.renderOverview();
  }
  getSampleUsers() {
    return [{ name: "Leo Gomes", email: "teste@teste.com", isAdmin: false }];
  }
  getSampleProducts() {
    return [{ id: 1001, name: "Curso Fullstack React", price: 499, quantity: 12 }];
  }
  renderOverview() {
    const users = this.repository.get("training-users", this.getSampleUsers());
    const products = this.repository.get("training-products", this.getSampleProducts());
    const stockCount = products.reduce((total, product) => total + Number(product.quantity || 0), 0);
    const stockValue = products.reduce((total, product) => total + Number(product.price || 0) * Number(product.quantity || 0), 0);
    const userCount = document.querySelector("#dashboard-user-count");
    const productCount = document.querySelector("#dashboard-product-count");
    const stockElement = document.querySelector("#dashboard-stock-count");
    const valueElement = document.querySelector("#dashboard-stock-value");
    if (userCount) userCount.textContent = users.length;
    if (productCount) productCount.textContent = products.length;
    if (stockElement) stockElement.textContent = stockCount.toLocaleString("pt-BR");
    if (valueElement) valueElement.textContent = stockValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const usersPageCount = document.querySelector("#count-users");
    const adminsPageCount = document.querySelector("#count-admins");
    if (usersPageCount) usersPageCount.textContent = users.length;
    if (adminsPageCount) adminsPageCount.textContent = users.filter((user) => user.isAdmin).length;
  }
  bindUserForm() {
    const form = document.querySelector("#user-form");
    const body = document.querySelector("#table-users-body");
    if (!form || !body) return;
    const users = this.repository.get("training-users", this.getSampleUsers());
    users.forEach((user) => this.addUserRow(body, user));
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const user = { name: form.querySelector("#user-name").value.trim(), email: form.querySelector("#user-email").value.trim(), isAdmin: false };
      if (!user.name || !user.email) return;
      users.push(user);
      this.repository.save("training-users", users);
      this.addUserRow(body, user);
      form.reset();
      this.renderOverview();
    });
    body.addEventListener("click", (event) => {
      const button = event.target.closest(".btn-delete");
      if (!button) return;
      const row = button.closest("tr");
      if (!row.dataset.email) return;
      const index = users.findIndex((item) => item.email === row.dataset.email);
      if (index >= 0) users.splice(index, 1);
      this.repository.save("training-users", users);
      row.remove();
      this.renderOverview();
    });
  }
  addUserRow(body, user) {
    const row = document.createElement("tr");
    row.dataset.email = user.email;
    const initials = user.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
    [initials, user.name, user.email, user.isAdmin ? "Sim" : "Não"].forEach((value, index) => {
      const cell = document.createElement("td");
      if (index === 0) { const avatar = document.createElement("span"); avatar.className = "table-avatar"; avatar.textContent = value; cell.append(avatar); }
      else cell.textContent = value;
      row.append(cell);
    });
    const actions = document.createElement("td");
    const remove = document.createElement("button");
    remove.type = "button"; remove.className = "btn-box btn-delete"; remove.textContent = "Excluir"; remove.setAttribute("aria-label", `Excluir ${user.name}`);
    actions.append(remove); row.append(actions); body.append(row);
  }
  bindProductForm() {
    const form = document.querySelector("#product-form");
    const body = document.querySelector("#table-products-body");
    if (!form || !body) return;
    const products = this.repository.get("training-products", this.getSampleProducts());
    products.forEach((product) => this.addProductRow(body, product));
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const product = { id: Date.now(), name: form.querySelector("#prod-name").value.trim(), price: Number(form.querySelector("#prod-price").value), quantity: Number(form.querySelector("#prod-qty").value) };
      if (!product.name || product.price < 0 || product.quantity < 0) return;
      products.push(product); this.repository.save("training-products", products);
      this.addProductRow(body, product); form.reset(); this.renderOverview();
    });
    body.addEventListener("click", (event) => {
      const button = event.target.closest(".btn-delete"); if (!button) return;
      const row = button.closest("tr");
      if (!row.dataset.productId) return;
      const index = products.findIndex((item) => String(item.id) === row.dataset.productId);
      if (index >= 0) products.splice(index, 1);
      this.repository.save("training-products", products); row.remove(); this.renderOverview();
    });
  }
  addProductRow(body, product) {
    const row = document.createElement("tr");
    row.dataset.productId = String(product.id);
    const values = [`#${String(product.id).slice(-4)}`, product.name, Number(product.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }), `${product.quantity} unidade(s)`];
    values.forEach((value) => { const cell = document.createElement("td"); cell.textContent = value; row.append(cell); });
    const actions = document.createElement("td"); const remove = document.createElement("button");
    remove.type = "button"; remove.className = "btn-box btn-delete"; remove.textContent = "Excluir"; remove.setAttribute("aria-label", `Excluir ${product.name}`);
    actions.append(remove); row.append(actions); body.append(row);
  }
  bindSettingsForm() {
    const form = document.querySelector("#config-form"); if (!form) return;
    const settings = this.repository.get("training-settings", {});
    if (settings.appName) form.querySelector("#config-app-name").value = settings.appName;
    if (settings.theme) form.querySelector("#config-theme").value = settings.theme;
    if (typeof settings.notifications === "boolean") form.querySelector("#config-notifications").checked = settings.notifications;
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      this.repository.save("training-settings", {
        appName: form.querySelector("#config-app-name").value.trim(),
        theme: form.querySelector("#config-theme").value,
        notifications: form.querySelector("#config-notifications").checked,
      });
      window.alert("Preferências salvas neste navegador.");
    });
  }
}

class TrainingApp {
  constructor() {
    this.repository = new StorageRepository();
    new LoginController(document.querySelector("#login-form"), this.repository);
    new DashboardController(this.repository);
  }
}

document.addEventListener("DOMContentLoaded", () => new TrainingApp());
