import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://pfjyvskpoygmjctszoeq.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmanl2c2twb3lnbWpjdHN6b2VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5Mjc0ODcsImV4cCI6MjA2NjUwMzQ4N30.ieU9djwHI2jYx6W811fQJj5yPoITwC0FhbjKB0i2wBY"
);
const TABLE = "catatanbarang";

const form = document.getElementById("form-barang");
const namaBarang = document.getElementById("nama_barang");
const typeBelanja = document.getElementById("type");
const stokEl = document.getElementById("stok");
const hargaEl = document.getElementById("harga");
const totalEl = document.getElementById("total_harga");
const hasilEl = document.getElementById("hasil-belanja");
const notifEl = document.getElementById("notif-area");

const rupiah = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);

const calcTotal = () => {
  totalEl.textContent = rupiah((+stokEl.value || 0) * (+hargaEl.value || 0));
};

// Event listeners for calculating total price
stokEl.addEventListener("input", calcTotal);
hargaEl.addEventListener("input", calcTotal);

// Step navigation
document.getElementById("next-step").addEventListener("click", () => {
  document.getElementById("step-1").classList.add("hidden");
  document.getElementById("step-2").classList.remove("hidden");
});

// Function to load data from Supabase
async function load() {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("tanggal", { ascending: false });

  if (error) {
    console.error("Error loading data:", error);
    return;
  }

  render(data || []);
}

// Function to render data
const render = (data) => {
  hasilEl.innerHTML = "";
  notifEl.innerHTML = "";

  if (!data.length) {
    notifEl.innerHTML = '<div class="text-gray-500">Belum ada data Kendaraan.</div>';
    return;
  }

  const now = new Date();
  const bulanKey = now.toLocaleString("id-ID", { month: "long", year: "numeric" });

  if (!data.some((i) => new Date(i.tanggal).getMonth() === now.getMonth() && new Date(i.tanggal).getFullYear() === now.getFullYear())) {
    notifEl.innerHTML = `<div class="bg-red-100 text-red-800 p-4 rounded-lg shadow">💡 Anda belum belanja di bulan ${bulanKey}.</div>`;
  }

  const byBulan = data.reduce((acc, item) => {
    const d = new Date(item.tanggal);
    const k = d.toLocaleString("id-ID", { month: "long", year: "numeric" });
    (acc[k] = acc[k] || []).push(item);
    return acc;
  }, {});

  hasilEl.innerHTML = Object.entries(byBulan).map(([bulan, items]) => {
    const cards = items.map(it => `
      <div class="bg-white/80 p-4 rounded-xl shadow transition hover:shadow-lg">
        <h4 class="font-semibold text-sky-700">${it.nama_barang}</h4>
        <p class="text-sm text-gray-500">${it.stok} × ${rupiah(it.harga)}</p>
        <p class="text-sm mb-2"><span class="font-semibold">Tipe:</span> ${it.type}</p>
        <div class="flex justify-between items-center">
          <span class="text-pink-600 font-bold">${rupiah(it.total)}</span>
          <div class="flex gap-2">
            <button onclick='editItem(${JSON.stringify(it).replace(/"/g, "&quot;")})' class="text-yellow-500 hover:text-yellow-600">✏️</button>
            <button onclick='hapusItem(${it.id})' class="text-red-500 hover:text-red-600">🗑️</button>
          </div>
        </div>
      </div>
    `).join("");

    const totalBulan = items.reduce((sum, i) => sum + i.total, 0);

    return `
      <div class="bg-white border border-sky-100 rounded-2xl shadow-md p-5 space-y-4">
        <h3 class="text-xl font-bold text-sky-600 flex justify-between items-center">
          <span>${bulan}</span>
          <button onclick='hapusBulan("${bulan}", ${JSON.stringify(items).replace(/"/g, "&quot;")})' class="text-red-400 hover:text-red-600 text-sm">🗑️</button>
        </h3>
        <div class="max-h-[270px] overflow-y-auto space-y-3 pr-2">${cards}</div>
        <div class="text-right text-sm text-sky-700 font-semibold pt-2 border-t">Total: ${rupiah(totalBulan)}</div>
      </div>`;
  }).join("");
};

// Delete item function
window.hapusItem = async (id) => {
  if (confirm("Hapus item?")) {
    await supabase.from(TABLE).delete().eq("id", id);
    load();
  }
};

// Delete all items in the month
window.hapusBulan = async (bulan, items) => {
  if (confirm(`Hapus semua data bulan ${bulan}?`)) {
    const ids = items.map(i => i.id);
    await supabase.from(TABLE).delete().in("id", ids);
    load();
  }
};

// Edit item function
window.editItem = async (item) => {
  const nama = prompt("Nama Barang", item.nama_barang);
  if (nama === null) return;
  const stok = parseInt(prompt("Stok", item.stok));
  const harga = parseInt(prompt("Harga", item.harga));
  const tipe = prompt("Tipe (Motor/Mobil)", item.type);
  if (!nama || isNaN(stok) || isNaN(harga)) return alert("Input tidak valid");
  
  await supabase
    .from(TABLE)
    .update({
      nama_barang: nama,
      stok,
      harga,
      total: stok * harga,
      type: tipe,
    })
    .eq("id", item.id);
  load();
};

// Load data on page load
load();

// Form submission
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const stok = +stokEl.value,
    harga = +hargaEl.value;
  const payload = {
    nama_barang: namaBarang.value,
    stok,
    harga,
    total: stok * harga,
    type: typeBelanja.value,
    tanggal: new Date().toISOString().split("T")[0],
  };
  await supabase.from(TABLE).insert(payload);
  form.reset();
  totalEl.textContent = "Rp 0";

  // Show SweetAlert success message
  Swal.fire({
    title: 'Sukses!',
    text: 'Barang berhasil disimpan.',
    icon: 'success',
    confirmButtonText: 'Ok'
  });

  load();
});