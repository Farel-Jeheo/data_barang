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
    notifEl.innerHTML =
      '<div class="text-gray-400">Belum ada data Kendaraan.</div>';
    return;
  }

  const now = new Date();
  const bulanKey = now.toLocaleString("id-ID", {
    month: "long",
    year: "numeric",
  });

  if (
    !data.some(
      (i) =>
        new Date(i.tanggal).getMonth() === now.getMonth() &&
        new Date(i.tanggal).getFullYear() === now.getFullYear()
    )
  ) {
    notifEl.innerHTML = `<div class="bg-red-900/60 text-red-300 p-4 rounded-lg shadow-md">💡 Belum ada data kendaraan Bulan ${bulanKey}.</div>`;
  }

  const byBulan = data.reduce((acc, item) => {
    const d = new Date(item.tanggal);
    const k = d.toLocaleString("id-ID", { month: "long", year: "numeric" });
    (acc[k] = acc[k] || []).push(item);
    return acc;
  }, {});

  hasilEl.innerHTML = Object.entries(byBulan)
    .map(([bulan, items]) => {
      const cards = items
        .map(
          (it) => `
      <div class="bg-gray-800/70 min-h-[130px] p-5 rounded-2xl shadow-md backdrop-blur ring-1 ring-white/10 flex flex-col justify-between transition hover:shadow-xl hover:ring-2 hover:ring-blue-500/40">
        <h4 class="font-semibold text-blue-400 text-lg">${it.nama_barang}</h4>
        <p class="text-sm text-gray-400">${it.stok} × ${rupiah(it.harga)}</p>
        <p class="text-sm text-gray-300 mb-2"><span class="font-semibold text-white">Tipe:</span> ${
          it.type
        }</p>
        <div class="flex justify-between items-center">
          <span class="text-pink-400 font-bold">${rupiah(it.total)}</span>
          <div class="flex gap-2">
            <button onclick='editItem(${JSON.stringify(it).replace(
              /"/g,
              "&quot;"
            )})' class="text-yellow-400 hover:text-yellow-300">✏️</button>
            <button onclick='hapusItem(${
              it.id
            })' class="text-red-400 hover:text-red-300">🗑️</button>
          </div>
        </div>
      </div>
    `
        )
        .join("");

      const totalBulan = items.reduce((sum, i) => sum + i.total, 0);

      return `
      <div class="bg-gray-900/70 border border-blue-900/40 rounded-2xl shadow-md p-5 mb-6 space-y-4 ring-1 ring-white/10 backdrop-blur">
        <h3 class="text-xl font-bold text-blue-400 flex justify-between items-center">
          <span>${bulan}</span>
          <button onclick='hapusBulan("${bulan}", ${JSON.stringify(
        items
      ).replace(
        /"/g,
        "&quot;"
      )})' class="text-red-400 hover:text-red-600 text-sm">🗑️</button>
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2">
          ${cards}
        </div>
        <div class="text-right text-sm text-blue-300 font-semibold pt-2 border-t border-white/10">Total: ${rupiah(
          totalBulan
        )}</div>
      </div>`;
    })
    .join("");
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
    const ids = items.map((i) => i.id);
    await supabase.from(TABLE).delete().in("id", ids);

    // Show SweetAlert success message after deletion
    Swal.fire({
      title: "Sukses!",
      text: "Semua data bulan berhasil dihapus.",
      icon: "success",
      confirmButtonText: "Ok",
    }).then(() => {
      load(); // Reload the data after the alert is closed
    });
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
    title: "Sukses!",
    text: "Barang berhasil disimpan.",
    icon: "success",
    confirmButtonText: "Ok",
  }).then(() => {
    // Reset to Step 1 after closing the alert
    document.getElementById("step-1").classList.remove("hidden");
    document.getElementById("step-2").classList.add("hidden");
  });

  load();
});
