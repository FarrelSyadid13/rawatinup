// ══════════════════════════════════════════════
//  KicksWash Market – app.js
//  Fitur: Drop/Pickup toggle, WhatsApp submit
//  Ganti WA_PEKERJA dengan nomor WA pekerja
// ══════════════════════════════════════════════

const WA_PEKERJA = "6285881299795"; // ⬅️ GANTI INI dengan nomor WA pekerja, contoh: "6281234567890"

const prices = {
  "Express Clean":   35000,
  "Deep Clean":      65000,
  Unyellowing:       85000,
  "Leather Care":    75000,
  "Premium Repaint": 150000,
  "Family Bundle":   120000,
};

const formatRupiah = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

// ── Nav toggle ──
const navToggle = document.querySelector(".nav-toggle");
const navMenu   = document.querySelector(".nav-menu");

navToggle.addEventListener("click", () => {
  const expanded = navToggle.getAttribute("aria-expanded") === "true";
  navToggle.setAttribute("aria-expanded", String(!expanded));
  navMenu.classList.toggle("open");
});

document.querySelectorAll(".nav-menu a").forEach((link) => {
  link.addEventListener("click", () => {
    navToggle.setAttribute("aria-expanded", "false");
    navMenu.classList.remove("open");
  });
});

// ── Service filter chips ──
document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach((item) => item.classList.remove("active"));
    chip.classList.add("active");
    const filter = chip.dataset.filter;
    document.querySelectorAll(".service-card").forEach((card) => {
      card.hidden = !(filter === "all" || card.dataset.category === filter);
    });
  });
});

// ── Quick-select service from card ──
const serviceSelect = document.querySelector("#serviceSelect");
const totalEstimate = document.querySelector("#totalEstimate");
const orderForm     = document.querySelector("#orderForm");

document.querySelectorAll(".choose-service").forEach((button) => {
  button.addEventListener("click", () => {
    const card = button.closest(".service-card");
    serviceSelect.value = card.dataset.service;
    updateEstimate();
    document.querySelector("#order").scrollIntoView({ behavior: "smooth" });
  });
});

function updateEstimate() {
  const service = serviceSelect.value;
  const pairs   = Math.max(Number(orderForm.elements.pairs?.value || 1), 1);
  totalEstimate.textContent = formatRupiah((prices[service] || 0) * pairs);
}

serviceSelect.addEventListener("change", updateEstimate);
orderForm.elements.pairs.addEventListener("input", updateEstimate);

// ── Set tanggal minimum hari ini ──
(function () {
  const dateInput = orderForm.querySelector('[name="pickupDate"]');
  if (dateInput) dateInput.setAttribute("min", new Date().toISOString().split("T")[0]);
})();

updateEstimate();

// ══════════════════════════════
//  Pickup / Drop toggle
// ══════════════════════════════
let modePengambilan = "";

window.setPengambilan = function (mode) {
  modePengambilan = mode;

  const btnPickup     = document.getElementById("btnPickup");
  const btnDrop       = document.getElementById("btnDrop");
  const dropInfo      = document.getElementById("dropInfo");
  const pickupAddress = document.getElementById("pickupAddress");
  const dateText      = document.getElementById("pickupDateText");
  const addressField  = orderForm.querySelector('[name="address"]');
  const hiddenInput   = document.getElementById("pengambilanInput");

  btnPickup.classList.toggle("active", mode === "pickup");
  btnDrop.classList.toggle("active",   mode === "drop");

  if (mode === "pickup") {
    pickupAddress.removeAttribute("hidden");
    dropInfo.setAttribute("hidden", "");
    if (addressField) addressField.setAttribute("required", "");
    if (dateText) dateText.textContent = "Tanggal Jemput";
  } else {
    dropInfo.removeAttribute("hidden");
    pickupAddress.setAttribute("hidden", "");
    if (addressField) addressField.removeAttribute("required");
    if (dateText) dateText.textContent = "Tanggal Drop";
  }

  if (hiddenInput) hiddenInput.value = mode;
};

// Inisialisasi default: pickup
setPengambilan("pickup");

// ══════════════════════════════
//  Kirim pesanan via WhatsApp
// ══════════════════════════════
window.kirimWA = function () {
  const f        = orderForm;
  const nama     = f.elements.customerName?.value.trim();
  const nowa     = f.elements.phone?.value.trim();
  const alamat   = f.elements.address?.value.trim();
  const layanan  = f.elements.service?.value;
  const shoeType = f.elements.shoeType?.value;
  const pairs    = f.elements.pairs?.value;
  const tanggal  = f.elements.pickupDate?.value;
  const catatan  = f.elements.notes?.value.trim();
  const formMsg  = document.getElementById("formMessage");

  // Validasi
  const errors = [];
  if (!nama)     errors.push("Nama pelanggan");
  if (!nowa)     errors.push("Nomor WhatsApp");
  if (modePengambilan === "pickup" && !alamat) errors.push("Alamat penjemputan");
  if (!layanan)  errors.push("Layanan");
  if (!shoeType) errors.push("Jenis sepatu");
  if (!tanggal)  errors.push("Tanggal");

  if (errors.length) {
    formMsg.textContent = `⚠️ Lengkapi: ${errors.join(", ")}`;
    formMsg.className = "form-message error";
    return;
  }

  const layananMap = {
    "Express Clean":   "Express Clean – Rp35.000/pasang",
    "Deep Clean":      "Deep Clean – Rp65.000/pasang",
    Unyellowing:       "Unyellowing – Rp85.000/pasang",
    "Leather Care":    "Leather Care – Rp75.000/pasang",
    "Premium Repaint": "Premium Repaint – Rp150.000/pasang",
    "Family Bundle":   "Family Bundle – Rp120.000/pasang",
  };

  const tglFmt = new Date(tanggal).toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });
  const total = formatRupiah((prices[layanan] || 0) * Number(pairs));

  const metodeTeks = modePengambilan === "pickup"
    ? `🛵 *PICKUP* – Kurir menjemput ke alamat pelanggan\n   Alamat: ${alamat}`
    : `📍 *DROP* – Pelanggan mengantar ke toko\n   Toko: Jl. Moch. Toha No. 47, Soreang, Kab. Bandung`;

  let pesan = `👟 *PESANAN MASUK – KicksWash Market*\n`;
  pesan += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  pesan += `👤 *Data Pelanggan*\n`;
  pesan += `Nama   : ${nama}\n`;
  pesan += `WA     : ${nowa}\n\n`;
  pesan += `👟 *Detail Layanan*\n`;
  pesan += `Layanan : ${layananMap[layanan] || layanan}\n`;
  pesan += `Jenis   : ${shoeType}\n`;
  pesan += `Pasang  : ${pairs} pasang\n`;
  pesan += `Total   : ${total}\n`;
  if (catatan) pesan += `Catatan : ${catatan}\n`;
  pesan += `\n`;
  pesan += `🚚 *Metode Pengambilan*\n${metodeTeks}\n\n`;
  pesan += `📅 *Jadwal*\n`;
  pesan += `Tanggal : ${tglFmt}\n\n`;
  pesan += `━━━━━━━━━━━━━━━━━━━━\n`;
  pesan += `_Dikirim otomatis via KicksWash Market App_`;

  const url = "https://wa.me/" + WA_PEKERJA + "?text=" + encodeURIComponent(pesan);
  const popup = window.open(url, "_blank");
  if (!popup || popup.closed || typeof popup.closed === "undefined") {
    // Popup diblokir browser — buka via link biasa
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  formMsg.textContent = "✅ Pesanan berhasil dikirim ke WhatsApp pekerja!";
  formMsg.className = "form-message success";

  setTimeout(() => {
    orderForm.reset();
    updateEstimate();
    setPengambilan("pickup");
    formMsg.textContent = "";
    formMsg.className = "form-message";
  }, 3000);
};