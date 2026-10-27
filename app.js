/* =========================================================
   SMART NOTA DINAS | KANIM JAKARTA BARAT
   1 ADMIN + 5 AKUN BIDANG
   Struktur dan fitur utama dipertahankan
   ========================================================= */

const $ = id => document.getElementById(id);

const ACCOUNTS = {
  admin: {
    username: "admin",
    password: "Admin#2026",
    role: "admin",
    bidang: null,
    label: "Administrator"
  },
  inteldakim: {
    username: "inteldakim",
    password: "Intel#2026",
    role: "bidang",
    bidang: "INTELDAKIM",
    label: "Bidang Intelijen dan Penindakan Keimigrasian"
  },
  intaltuskim: {
    username: "intaltuskim",
    password: "Izin#2026",
    role: "bidang",
    bidang: "INTALTUSKIM",
    label: "Bidang Izin Tinggal dan Status Keimigrasian"
  },
  tikkim: {
    username: "tikkim",
    password: "TIK#2026",
    role: "bidang",
    bidang: "TIKKIM",
    label: "Bidang Teknologi Informasi dan Komunikasi Keimigrasian"
  },
  tatausaha: {
    username: "tatausaha",
    password: "TU#2026",
    role: "bidang",
    bidang: "TATAUSAHA",
    label: "Bagian Tata Usaha"
  },
  yanverdokjal: {
    username: "yanverdokjal",
    password: "Yanver#2026",
    role: "bidang",
    bidang: "YANVERDOKJAL",
    label: "Bidang Pelayanan dan Verifikasi Dokumen Perjalanan"
  }
};

// Kredensial yang diubah Admin disimpan pada browser ini.
try {
  const savedAccounts = JSON.parse(localStorage.getItem("snd_accounts") || "{}");
  Object.keys(ACCOUNTS).forEach(key => {
    const saved = savedAccounts[key];
    if (saved && typeof saved === "object") {
      if (typeof saved.username === "string" && saved.username.trim()) ACCOUNTS[key].username = saved.username.trim();
      if (typeof saved.password === "string" && saved.password) ACCOUNTS[key].password = saved.password;
    }
  });
} catch (e) {
  console.warn("Pengaturan akun tersimpan tidak dapat dibaca.", e);
}

let currentUser = null;
let sel = null;
let notas = [];

const IMG = { qr: null, sig: null };
const NODES = {};
const TREE = {};

const rp = n => "Rp " + Math.round(Number(n) || 0).toLocaleString("id-ID");

const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;"
}[c]));

const fd = t => {
  if (!t) return "-";
  const d = new Date(t + "T00:00:00");
  return Number.isNaN(d.getTime())
    ? "-"
    : d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      });
};

try {
  const savedNotes = JSON.parse(localStorage.getItem("snd_notas") || "[]");
  notas = Array.isArray(savedNotes) ? savedNotes : [];
} catch {
  notas = [];
}

const save = () => {
  try {
    localStorage.setItem("snd_notas", JSON.stringify(notas));
  } catch (e) {
    alert("Penyimpanan browser penuh. Hapus nota lama atau kurangi ukuran gambar.");
  }
};

/* =========================================================
   MEMBACA DATA ANGGARAN DARI data.js
   ========================================================= */

(() => {
  let bidang = "";
  const stack = [];

  RAW.trim().split("\n").forEach(line => {
    if (!line.trim()) return;

    if (line[0] === "@") {
      bidang = line.slice(1).trim();
      TREE[bidang] = [];
      stack.length = 0;
      return;
    }

    const [depthText, code, name, paguText, realText, lockText] =
      line.split("|");

    const depth = Number(depthText);
    const parent = depth > 0 ? stack[depth - 1] : null;

    const node = {
      code,
      name,
      pagu: Number(paguText) || 0,
      real: Number(realText) || 0,
      lock: Number(lockText) || 0,
      kids: [],
      parent,
      bid: bidang,
      path: (parent ? parent.path : bidang) + "/" + code
    };

    stack[depth] = node;
    stack.length = depth + 1;

    NODES[node.path] = node;

    if (parent) {
      parent.kids.push(node);
    } else {
      TREE[bidang].push(node);
    }
  });
})();

// Terapkan data FA Detail terakhir yang diimpor Admin pada browser ini.
function applySavedFAData() {
  try {
    Object.values(NODES).forEach(node => { delete node.faImported; delete node.faRemaining; });
    const saved = JSON.parse(localStorage.getItem("snd_fa_detail") || "null");
    if (!saved || !saved.values) return;
    Object.entries(saved.values).forEach(([path, values]) => {
      const node = NODES[path];
      if (!node) return;
      if (Number.isFinite(Number(values.pagu))) node.pagu = Number(values.pagu);
      if (Number.isFinite(Number(values.real))) node.real = Number(values.real);
      if (Number.isFinite(Number(values.lock))) node.lock = Number(values.lock);
      if (values.faRemaining !== undefined && values.faRemaining !== null && values.faRemaining !== "" && Number.isFinite(Number(values.faRemaining))) node.faRemaining = Number(values.faRemaining);
      node.faImported = true;
    });
  } catch (e) {
    console.warn("Data FA Detail tersimpan tidak dapat diterapkan.", e);
  }
}
applySavedFAData();

/* =========================================================
   PERHITUNGAN ANGGARAN
   ========================================================= */

const used = node => notas
  .filter(n =>
    n.status !== "Ditolak" &&
    (
      n.path === node.path ||
      String(n.path || "").startsWith(node.path + "/")
    )
  )
  .reduce((sum, n) => sum + (Number(n.minta) || 0), 0);

// Jika baris akun memiliki sisa resmi dari FA Detail, tampilkan angka itu
// secara langsung. Jangan mengurangi lagi dengan nilai Nota Dinas karena
// angka sisa FA Detail sudah merupakan saldo pada periode laporan tersebut.
// Untuk node yang tidak tercakup dalam impor FA Detail, gunakan perhitungan
// dari data.js dan Nota Dinas seperti sebelumnya.
// Tandai baris yang benar-benar berasal dari snapshot FA Detail.
// Nilai induk dihitung dari anak jika saldo induk tidak diimpor langsung.
const hasImportedFA = node => !!node && (
  node.faImported === true || (node.kids || []).some(hasImportedFA)
);

const effectivePagu = node => {
  if (!node) return 0;
  if (node.faImported === true) return Number(node.pagu) || 0;
  if ((node.kids || []).some(hasImportedFA)) {
    return node.kids.reduce((sum, child) => sum + effectivePagu(child), 0);
  }
  return Number(node.pagu) || 0;
};

const sisa = node => {
  if (!node) return 0;
  const faRemaining = node.faRemaining;
  if (node.faImported === true && faRemaining !== null && faRemaining !== undefined && faRemaining !== "" && Number.isFinite(Number(faRemaining))) {
    return Number(faRemaining);
  }
  // Jika impor hanya berisi akun rincian, jumlahkan saldo rincian tersebut
  // sehingga ringkasan bidang dan akun induk ikut berubah.
  if ((node.kids || []).some(hasImportedFA)) {
    return node.kids.reduce((sum, child) => sum + sisa(child), 0);
  }
  return Number(node.pagu || 0) - Number(node.lock || 0) - Number(node.real || 0) - used(node);
};

const cls = value => value < 0 ? "neg" : "pos";

const akun = node => {
  let current = node;

  while (current && !/^5\d{5}$/.test(current.code)) {
    current = current.parent;
  }

  return current || node;
};

/* =========================================================
   TAMPILAN POHON ANGGARAN
   ========================================================= */

const row = (node, pick) => `
  <span class="c">${esc(node.code)}</span>
  <span>${esc(node.name)}</span>
  <span class="n">${rp(node.pagu)}</span>
  <span class="n ${cls(sisa(node))}">${rp(sisa(node))}</span>
  ${
    pick && !node.kids.length
      ? `<button type="button" class="pk" data-id="${esc(node.path)}">Pilih</button>`
      : "<span></span>"
  }
`;

const tree = (node, pick) => node.kids.length
  ? `
    <details>
      <summary class="r">${row(node, pick)}</summary>
      <div class="in">${node.kids.map(child => tree(child, pick)).join("")}</div>
    </details>
  `
  : `<div class="r leaf">${row(node, pick)}</div>`;

/* =========================================================
   LOGIN DAN HAK AKSES
   ========================================================= */

const keys = Object.keys(BIDANG);

const opts = keys.map(bidang =>
  `<option value="${esc(bidang)}">${esc(bidang)} – ${esc(BIDANG[bidang])}</option>`
).join("");

$("mb").innerHTML = opts;
$("ib").innerHTML = '<option value="">Pilih bidang</option>' + opts;

function isAdmin() {
  return currentUser?.role === "admin";
}

function canAccessNote(note) {
  return isAdmin() || note.bidang === currentUser?.bidang;
}

function applyRole() {
  if (!currentUser) return;

  if (!isAdmin()) {
    $("ib").value = currentUser.bidang;
    $("ib").disabled = true;

    $("ib").querySelectorAll("option").forEach(option => {
      option.disabled =
        option.value !== currentUser.bidang && option.value !== "";
    });

    $("mb").value = currentUser.bidang;

    $("mb").querySelectorAll("option").forEach(option => {
      option.disabled = option.value !== currentUser.bidang;
    });
  } else {
    $("ib").disabled = false;

    $("ib").querySelectorAll("option").forEach(option => {
      option.disabled = false;
    });

    $("mb").querySelectorAll("option").forEach(option => {
      option.disabled = false;
    });
  }

  $("mb").disabled = false;

  document.querySelectorAll("[data-pg]").forEach(button => {
    button.hidden = false;
  });

  const brand = document.querySelector(".top b");

  if (brand) {
    brand.textContent = "Smart Nota Dinas — " + currentUser.label;
  }
}

function enter() {
  $("login").hidden = true;
  $("app").hidden = false;
  applyRole();
  go("mon");
}

function logout() {
  sessionStorage.removeItem("snd_in");
  sessionStorage.removeItem("snd_user");
  currentUser = null;
  location.reload();
}

try {
  const savedUser = sessionStorage.getItem("snd_user");

  if (savedUser) {
    const parsed = JSON.parse(savedUser);
    const account = Object.values(ACCOUNTS).find(a => a.username.toLowerCase() === String(parsed.username || "").toLowerCase());

    if (
      account &&
      account.role === parsed.role &&
      sessionStorage.getItem("snd_in") === "1"
    ) {
      currentUser = account;
      enter();
    }
  }
} catch (e) {
  sessionStorage.removeItem("snd_in");
  sessionStorage.removeItem("snd_user");
}

$("loginForm").onsubmit = event => {
  event.preventDefault();

  const username = $("u").value.trim().toLowerCase();
  const password = $("p").value;
  let account = Object.values(ACCOUNTS).find(a => a.username.toLowerCase() === username);

  /*
   * PEMULIHAN AKSES ADMIN:
   * Jika kredensial Admin tersimpan di browser berbeda dari akun bawaan,
   * izinkan login pemulihan menggunakan admin / Admin#2026. Hanya kredensial
   * Admin yang dipulihkan; akun bidang, riwayat Nota Dinas, dan FA Detail
   * tidak dihapus atau diubah.
   */
  const adminAccount = ACCOUNTS.admin;
  const isAdminRecovery = username === "admin" && password === "Admin#2026";

  if (isAdminRecovery && adminAccount) {
    adminAccount.username = "admin";
    adminAccount.password = "Admin#2026";
    adminAccount.role = "admin";
    account = adminAccount;

    try {
      const saved = JSON.parse(localStorage.getItem("snd_accounts") || "{}");
      const preserved = saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
      preserved.admin = { username: "admin", password: "Admin#2026" };
      localStorage.setItem("snd_accounts", JSON.stringify(preserved));
    } catch (e) {
      console.warn("Kredensial Admin dipulihkan untuk sesi ini, tetapi tidak dapat disimpan.", e);
    }
  } else if (!account || account.password !== password) {
    $("err").textContent = "Username atau password salah. Untuk pemulihan Admin, gunakan username admin dan password Admin#2026.";
    return;
  }

  currentUser = account;

  sessionStorage.setItem("snd_in", "1");
  sessionStorage.setItem("snd_user", JSON.stringify({
    username: account.username,
    role: account.role
  }));

  $("err").textContent = "";
  enter();
};

$("out").onclick = logout;

document.querySelectorAll("[data-pg]").forEach(button => {
  button.onclick = () => {
    if (currentUser) go(button.dataset.pg);
  };
});

function go(page) {
  document.querySelectorAll(".pg").forEach(section => {
    section.hidden = section.id !== page;
  });

  document.querySelectorAll("[data-pg]").forEach(button => {
    button.classList.toggle("on", button.dataset.pg === page);
  });

  if (page === "mon") renderMon();
  if (page === "inp") prep();
  if (page === "his") his();
}

/* =========================================================
   MONITORING ANGGARAN
   ========================================================= */

function renderMon() {
  if (!currentUser) return;

  const bidangRincian = isAdmin()
    ? $("mb").value
    : currentUser.bidang;

  if (!isAdmin()) $("mb").value = bidangRincian;

  $("cards").innerHTML = keys.map(bidang => {
    const roots = TREE[bidang] || [];
    const pagu = roots.reduce((sum, node) => sum + effectivePagu(node), 0);
    const remaining = roots.reduce((sum, node) => sum + sisa(node), 0);

    return `
      <button type="button"
        data-b="${esc(bidang)}"
        ${isAdmin() ? "" : 'aria-disabled="true" class="summary-only"'}>
        <b>${esc(bidang)}</b>
        <small>Pagu ${rp(pagu)}</small>
        <small>Sisa anggaran</small>
        <strong class="${cls(remaining)}">${rp(remaining)}</strong>
      </button>
    `;
  }).join("");

  $("mtree").innerHTML =
    (TREE[bidangRincian] || []).map(node => tree(node, false)).join("");
}

$("mb").onchange = () => {
  if (!isAdmin()) $("mb").value = currentUser?.bidang || "";
  renderMon();
};

$("cards").onclick = event => {
  if (!isAdmin()) return;

  const button = event.target.closest("[data-b]");
  if (!button) return;

  $("mb").value = button.dataset.b;
  renderMon();
};

/* =========================================================
   INPUT NOTA DINAS
   ========================================================= */

const JENIS_NOTA_OPTIONS = [
  "Nota Pengajuan Pencairan Anggaran",
  "Nota Dinas Revisi POK",
  "Nota Dinas Lain-Lain"
];

const YTH_OPTIONS = [
  "Kepala Kantor Selaku Kuasa Pengguna Anggaran",
  "Kabag Tata Usaha Anggaran",
  "Kasubag Keuangan",
  "Pejabat Pembuat Komitmen"
];

const DARI_OPTIONS = [
  "Kepala Bidang Inteldakim",
  "Kepala Bidang Intaltuskim",
  "Kepala Bidang Tikkim",
  "Kepala Bidang Yanverdokjal",
  "Kepala Bagian Tata Usaha"
];

function ensureJenisNotaField() {
  if (!$("f") || $("jenisNodin")) return;

  const bidangLabel = $("ib")?.closest("label");
  if (!bidangLabel) return;

  const label = document.createElement("label");
  label.id = "jenisNodinLabel";
  label.innerHTML = 'Jenis Nota Dinas<select id="jenisNodin" name="jenisNodin" required><option value="">Pilih jenis nota dinas</option>' +
    JENIS_NOTA_OPTIONS.map(item => `<option value="${esc(item)}">${esc(item)}</option>`).join("") +
    '</select>';

  bidangLabel.parentNode.insertBefore(label, bidangLabel);
}

function ensureMultiEntryField(id, title, choices, defaultValue) {
  const original = $(id);
  if (!original || original.dataset.multiReady === "1") return;
  original.dataset.multiReady = "1";

  const wrapper = document.createElement("div");
  wrapper.className = "multi-entry-field";
  wrapper.style.display = "grid";
  wrapper.style.gap = "7px";

  const select = document.createElement("select");
  select.id = id + "Choices";
  select.multiple = true;
  select.setAttribute("aria-label", title + " — pilih satu atau beberapa");
  select.size = Math.min(choices.length, 4);
  select.style.minHeight = "92px";
  select.innerHTML = choices.map(item => `<option value="${esc(item)}">${esc(item)}</option>`).join("");

  // YTH hanya boleh dipilih dari dropdown; bidang lain tetap boleh memiliki input manual.
  const allowManual = id !== "yth";
  let custom = null;
  if (allowManual) {
    custom = document.createElement("input");
    custom.type = "text";
    custom.id = id + "Custom";
    custom.placeholder = "Tambahkan nama/jabatan lain (pisahkan dengan titik koma jika lebih dari satu)";
    custom.setAttribute("aria-label", title + " tambahan manual");
  }

  const hint = document.createElement("small");
  hint.textContent = allowManual
    ? "Untuk memilih beberapa pilihan, tahan Ctrl (Windows) saat memilih. Pilihan manual dipisahkan dengan titik koma (;)."
    : "Pilih satu atau beberapa tujuan. Tahan Ctrl (Windows) sambil mengeklik untuk memilih beberapa pilihan.";
  hint.style.color = "#4c6a7d";

  original.insertAdjacentElement("afterend", wrapper);
  wrapper.append(select);
  if (custom) wrapper.append(custom);
  wrapper.append(hint);
  original.style.display = "none";
  original.setAttribute("aria-hidden", "true");

  const sync = () => {
    const selected = Array.from(select.selectedOptions).map(option => option.value);
    const extra = custom ? custom.value.split(";").map(value => value.trim()).filter(Boolean) : [];
    original.value = [...new Set([...selected, ...extra])].join("; ");
  };

  select.addEventListener("change", sync);
  if (custom) custom.addEventListener("input", sync);

  original._setMultiValues = values => {
    const list = String(values || "").split(";").map(value => value.trim()).filter(Boolean);
    Array.from(select.options).forEach(option => {
      option.selected = list.includes(option.value);
    });
    if (custom) custom.value = list.filter(value => !choices.includes(value)).join("; ");
    sync();
  };

  original._getMultiValues = () => {
    sync();
    return original.value;
  };

  if (defaultValue) original._setMultiValues(defaultValue);
}

ensureJenisNotaField();

ensureMultiEntryField(
  "yth",
  "YTH",
  YTH_OPTIONS,
  "Kepala Kantor Selaku Kuasa Pengguna Anggaran"
);

ensureMultiEntryField("dari", "Dari", DARI_OPTIONS, "");

function prep() {
  if (!currentUser) return;

  if (!$("tgl").value) {
    $("tgl").value = new Date().toISOString().slice(0, 10);
  }

  if (!$("nomor").value) {
    $("nomor").value =
      "WIM.10.IMI.2-PB.02.01 – " + (notas.length + 1);
  }

  if (isAdmin()) {
    $("ib").disabled = false;
  } else {
    $("ib").value = currentUser.bidang;
    $("ib").disabled = true;

    if ($("dari")._setMultiValues) {
      const kepalaByBidang = {
        INTELDAKIM: "Kepala Bidang Inteldakim",
        INTALTUSKIM: "Kepala Bidang Intaltuskim",
        TIKKIM: "Kepala Bidang Tikkim",
        YANVERDOKJAL: "Kepala Bidang Yanverdokjal",
        TATAUSAHA: "Kepala Bagian Tata Usaha"
      };

      $("dari")._setMultiValues(kepalaByBidang[currentUser.bidang] || "");
    } else {
      $("dari").value = "Kepala " + BIDANG[currentUser.bidang];
    }
  }

  if ($("yth")._setMultiValues) {
    if (!$("yth").value) {
      $("yth")._setMultiValues("Kepala Kantor Selaku Kuasa Pengguna Anggaran");
    }
  } else if (!$("yth").value) {
    $("yth").value = "Kepala Kantor Selaku Kuasa Pengguna Anggaran";
  }

  renderIn();
}

function renderIn() {
  if (!currentUser) return;

  let bidang = $("ib").value;

  if (!isAdmin() && bidang !== currentUser.bidang) {
    bidang = currentUser.bidang;
    $("ib").value = bidang;
    sel = null;
  }

  $("itree").innerHTML = bidang
    ? (TREE[bidang] || []).map(node => tree(node, true)).join("")
    : "";

  showSel();
}

$("ib").onchange = () => {
  if (!isAdmin()) {
    $("ib").value = currentUser?.bidang || "";
  }

  sel = null;

  if ($("ib").value) {
    const kepalaByBidang = {
      INTELDAKIM: "Kepala Bidang Inteldakim",
      INTALTUSKIM: "Kepala Bidang Intaltuskim",
      TIKKIM: "Kepala Bidang Tikkim",
      YANVERDOKJAL: "Kepala Bidang Yanverdokjal",
      TATAUSAHA: "Kepala Bagian Tata Usaha"
    };

    const namaKepala = kepalaByBidang[$("ib").value] ||
      ("Kepala " + BIDANG[$("ib").value]);

    if ($("dari")._setMultiValues) {
      $("dari")._setMultiValues(namaKepala);
    } else {
      $("dari").value = namaKepala;
    }
  }

  renderIn();
};

$("itree").onclick = event => {
  const button = event.target.closest(".pk");
  if (!button) return;

  const node = NODES[button.dataset.id];
  if (!node) return;

  if (!isAdmin() && node.bid !== currentUser?.bidang) {
    alert("Anda hanya dapat memilih anggaran bidang sendiri.");
    return;
  }

  sel = node;
  showSel();
};

function showSel() {
  if (!sel) {
    $("sel").textContent = "Belum ada kode akun dipilih.";
  } else {
    const chain = [];

    for (let node = sel; node; node = node.parent) {
      chain.unshift(node.code);
    }

    const account = akun(sel);

    $("sel").innerHTML = `
      <b>Dipilih:</b> ${esc(chain.join(" › "))} – ${esc(sel.name)}
      <br>
      Kode akun: <b>${esc(account.code)}</b> – ${esc(account.name)}
    `;
  }

  calc();
}

function calc() {
  const amount = Number($("minta").value) || 0;
  const target = sel ? akun(sel) : null;
  const before = target ? sisa(target) : 0;

  $("cP").textContent = rp(target ? target.pagu : 0);
  $("cB").textContent = rp(before);
  $("cA").textContent = rp(before - amount);
  $("cA").className = before - amount < 0 ? "neg" : "";
}

$("minta").oninput = calc;

/* =========================================================
   SIMPAN NOTA DINAS
   ========================================================= */

$("f").onsubmit = event => {
  event.preventDefault();

  const msg = text => {
    $("msg").textContent = text;
  };

  if (!currentUser) {
    alert("Silakan login terlebih dahulu.");
    return;
  }

  if (!isAdmin() && $("ib").value !== currentUser.bidang) {
    alert("Anda hanya dapat mengajukan nota untuk bidang sendiri.");
    return;
  }

  if (!sel) {
    msg("Pilih kode akun atau item dari tabel terlebih dahulu.");
    return;
  }

  if (!isAdmin() && sel.bid !== currentUser.bidang) {
    alert("Kode anggaran tidak sesuai dengan bidang akun Anda.");
    return;
  }

  const amount = Number($("minta").value);
  const account = akun(sel);
  const before = sisa(account);

  if (!Number.isFinite(amount) || amount <= 0) {
    msg("Masukkan nilai anggaran yang diminta lebih besar dari Rp0.");
    return;
  }

  if (amount > before) {
    msg(
      "Permintaan melebihi sisa anggaran pada kode akun " +
      account.code + " (" + rp(before) + ")."
    );
    return;
  }

  msg("");

  if ($("yth")._getMultiValues) $("yth")._getMultiValues();
  if ($("dari")._getMultiValues) $("dari")._getMultiValues();

  const note = {
    id: Date.now(),
    jenisNodin: $("jenisNodin")?.value || "",
    tanggal: $("tgl").value,
    nomor: $("nomor").value.trim(),
    yth: $("yth").value.trim(),
    dari: $("dari").value.trim(),
    hal: $("hal").value.trim(),
    lampiran: $("lamp").value.trim(),
    kep: $("kep").value.trim(),
    rab: $("rab").value,
    qr: IMG.qr,
    sig: IMG.sig,
    blank: $("blank").checked,
    ttd: $("ttd").value.trim(),
    bidang: sel.bid,
    path: account.path,
    kode: account.code,
    uraian: account.name,
    item: sel === account ? "" : sel.code + " " + sel.name,
    pagu: account.pagu,
    sebelum: before,
    minta: amount,
    sesudah: before - amount,
    status: "Diajukan",
    ownerUsername: currentUser.username
  };

  notas.push(note);
  save();

  pdf(note);

  $("f").reset();

  IMG.qr = null;
  IMG.sig = null;

  $("qrp").removeAttribute("src");
  $("sigp").removeAttribute("src");

  $("ib").value = note.bidang;
  sel = null;

  prep();
  go("his");
};

/* =========================================================
   RIWAYAT NOTA DINAS
   ========================================================= */

function his() {
  if (!currentUser) return;

  const list = notas.filter(canAccessNote).slice().reverse();

  $("hb").innerHTML = list.length
    ? list.map(note => `
      <tr>
        <td>${esc(note.tanggal || "")}</td>
        <td>${esc(note.nomor || "")}</td>
        <td>${esc(note.bidang || "")}</td>
        <td>${esc(note.kode || "")}</td>
        <td>${rp(note.minta || 0)}</td>
        <td>
          <select data-s="${note.id}" ${isAdmin() ? "" : "disabled"}>
            ${["Draft", "Diajukan", "Disetujui", "Ditolak"]
              .map(status =>
                `<option${status === note.status ? " selected" : ""}>${status}</option>`
              ).join("")}
          </select>
        </td>
        <td>
          <button type="button" class="mini" data-pdf="${note.id}">PDF</button>
          <button type="button" class="mini" data-doc="${note.id}">Word</button>
          ${isAdmin()
            ? `<button type="button" class="mini d" data-del="${note.id}">Hapus</button>`
            : ""}
        </td>
      </tr>
    `).join("")
    : '<tr><td colspan="7">Belum ada nota dinas yang dapat ditampilkan.</td></tr>';
}

$("hb").onclick = event => {
  const element = event.target;
  const id = element.dataset.pdf || element.dataset.doc || element.dataset.del;
  const note = id ? notas.find(item => String(item.id) === String(id)) : null;

  if (id && (!note || !canAccessNote(note))) {
    alert("Anda tidak memiliki akses ke nota dinas tersebut.");
    return;
  }

  if (element.dataset.pdf && note) {
    pdf(note);
    return;
  }

  if (element.dataset.doc && note) {
    word(note);
    return;
  }

  if (element.dataset.del && isAdmin() && note &&
      confirm("Hapus nota dinas ini?")) {
    notas = notas.filter(item => String(item.id) !== String(id));
    save();
    his();
    renderMon();
  }
};

$("hb").onchange = event => {
  const id = event.target.dataset.s;
  if (!id) return;

  if (!isAdmin()) {
    alert("Perubahan status hanya dapat dilakukan Admin.");
    his();
    return;
  }

  const note = notas.find(item => String(item.id) === String(id));
  if (!note) return;

  note.status = event.target.value;
  save();
  renderMon();
  his();
};

/* =========================================================
   PDF NOTA DINAS
   ========================================================= */

function pdf(note) {
  note = withAuto(note);

  const JsPDF = window.jspdf && window.jspdf.jsPDF;
  if (!JsPDF) {
    alert("Pustaka PDF belum termuat. Pastikan perangkat terhubung internet.");
    return;
  }

  const doc = new JsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const W = 210, L = 18, R = 192, width = R - L;
  const isPok = /revisi\s*pok/i.test(note.jenisNodin || "");
  const isPencairan = /pencairan/i.test(note.jenisNodin || "");
  const halLabel = isPencairan ? "Perihal" : "Hal";
  const bidangNama = BIDANG[note.bidang] || note.bidang || "-";
  const bodySubject = String(note.hal || note.kep || "kebutuhan operasional").trim();
  const amount = Number(note.minta) || 0;
  let y = 48;

  const setNormal = () => {
    doc.setFont("times", "normal");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
  };

  const addParagraph = (text, options = {}) => {
    const indent = options.indent === false ? 0 : 7;
    const fontSize = options.fontSize || 11;
    const lineHeight = options.lineHeight || 5.2;
    doc.setFont("times", "normal");
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(String(text || ""), width - indent);
    const height = lines.length * lineHeight + (options.after ?? 2.5);
    if (y + height > 265) {
      doc.addPage();
      y = 22;
    }
    doc.text(lines, L + indent, y, { maxWidth: width - indent });
    y += height;
  };

  const addPageFooter = () => {
    const total = doc.getNumberOfPages();
    for (let page = 1; page <= total; page++) {
      doc.setPage(page);
      doc.setFont("times", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(
        "Smart Nota Dinas | Kantor Imigrasi Jakarta Barat",
        W / 2, 289, { align: "center" }
      );
    }
  };

  // Kop surat dan judul mengikuti contoh Nota Dinas kantor.
  doc.setFont("times", "bold");
  doc.setFontSize(11);
  doc.text("KEMENTERIAN IMIGRASI DAN PEMASYARAKATAN RI", W / 2, 15, { align: "center" });
  doc.text("KANTOR IMIGRASI KELAS I KHUSUS NON TPI JAKARTA BARAT", W / 2, 21, { align: "center" });
  doc.setLineWidth(0.5);
  doc.line(L, 25, R, 25);

  doc.setFontSize(12);
  doc.text("NOTA DINAS", W / 2, 33, { align: "center" });
  doc.setFont("times", "normal");
  doc.setFontSize(10.5);
  doc.text("Nomor : " + (note.nomor || "-"), W / 2, 39, { align: "center" });

  // Metadata menggunakan tata letak label, titik dua, dan isi yang konsisten.
  const info = [
    ["Yth", note.yth || "-"],
    ["Dari", note.dari || "-"],
    [halLabel, note.hal || "-"],
    ["Lampiran", note.lampiran || "-"],
    ["Tanggal", fd(note.tanggal)]
  ];
  setNormal();
  info.forEach(([label, value]) => {
    const labelWidth = 25;
    const valueWidth = width - labelWidth - 5;
    const lines = doc.splitTextToSize(String(value || "-"), valueWidth);
    const lineHeight = 4.7;
    if (y + lines.length * lineHeight + 1 > 265) {
      doc.addPage();
      y = 22;
    }
    doc.text(label, L, y);
    doc.text(":", L + labelWidth - 3, y);
    doc.text(lines, L + labelWidth + 1, y);
    y += Math.max(lineHeight, lines.length * lineHeight) + 1;
  });
  doc.setLineWidth(0.25);
  doc.line(L, y, R, y);
  y += 6;

  if (isPok) {
    addParagraph(
      `Dalam rangka menunjang pelaksanaan tugas dan fungsi serta kegiatan operasional pada ${bidangNama}, bersama ini disampaikan usulan revisi Petunjuk Operasional Kegiatan (POK) Tahun Anggaran 2026.`
    );
    addParagraph(
      `Sehubungan dengan hal tersebut, mohon kiranya usulan revisi POK dimaksud dapat ditelaah dan diberikan persetujuan sesuai dengan ketentuan yang berlaku. Rincian anggaran sebagai berikut:`
    );
  } else if (isPencairan) {
    addParagraph(
      `Dalam rangka menunjang kelancaran pelaksanaan tugas dan fungsi pada Kantor Imigrasi Kelas I Khusus Non TPI Jakarta Barat, bersama ini disampaikan permohonan pencairan anggaran untuk ${bodySubject}.`
    );
    addParagraph(
      `Sehubungan dengan hal tersebut, biaya dimaksud dibebankan pada DIPA Kantor Imigrasi Kelas I Khusus Non TPI Jakarta Barat Tahun Anggaran berjalan dengan memperhatikan ketersediaan pagu dan ketentuan yang berlaku. Rincian anggaran sebagai berikut:`
    );
  } else {
    addParagraph(
      `Dalam rangka menunjang kelancaran pelaksanaan tugas dan fungsi serta kegiatan operasional pada Kantor Imigrasi Kelas I Khusus Non TPI Jakarta Barat, bersama ini disampaikan nota dinas mengenai ${bodySubject}.`
    );
    addParagraph(
      `Sehubungan dengan hal tersebut, mohon kiranya hal dimaksud dapat ditindaklanjuti sesuai kebutuhan dan ketentuan yang berlaku. Rincian anggaran sebagai berikut:`
    );
  }

  const account = NODES[note.path] || null;
  const accountText = [note.kode || "", note.uraian || ""].filter(Boolean).join(" – ");
  const activityText = [note.item || "", note.kep || ""].filter(Boolean).join("\n");
  const tableBody = [[
    note.kode || "-",
    (note.uraian || "-") + (activityText ? "\n" + activityText : ""),
    rp(note.pagu),
    rp(amount),
    rp(note.sebelum),
    rp(note.sesudah)
  ]];

  // Tabel enam kolom seperti pada contoh pencairan dana dan revisi POK.
  doc.autoTable({
    startY: y,
    theme: "grid",
    margin: { left: L, right: W - R, top: 18, bottom: 25 },
    head: [[
      "Kode Akun",
      "Uraian Kegiatan",
      "Total Pagu Anggaran",
      "Anggaran yang Diminta",
      "Sisa Anggaran Sebelum Pengajuan",
      "Sisa Anggaran Setelah Pengajuan"
    ]],
    body: tableBody,
    styles: {
      font: "times",
      fontSize: 7.2,
      cellPadding: 1.6,
      overflow: "linebreak",
      valign: "middle",
      textColor: [0, 0, 0],
      lineColor: [70, 70, 70],
      lineWidth: 0.2
    },
    headStyles: {
      font: "times",
      fontStyle: "bold",
      fontSize: 7.1,
      fillColor: [230, 230, 230],
      textColor: [0, 0, 0],
      halign: "center",
      valign: "middle"
    },
    columnStyles: {
      0: { cellWidth: 19, halign: "center" },
      1: { cellWidth: 37, halign: "left" },
      2: { cellWidth: 25, halign: "right" },
      3: { cellWidth: 25, halign: "right" },
      4: { cellWidth: 34, halign: "right" },
      5: { cellWidth: 34, halign: "right" }
    },
    didDrawPage: () => {
      doc.setFont("times", "bold");
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
    }
  });
  y = doc.lastAutoTable.finalY + 7;

  if (isPok) {
    addParagraph(
      "Demikian disampaikan, atas perhatian dan kerja samanya diucapkan terima kasih."
    );
  } else {
    addParagraph(
      "Demikian disampaikan, atas arahan dan perhatian Bapak Kepala Kantor diucapkan terima kasih."
    );
  }

  // Blok pejabat dan ruang tanda tangan. Jika opsi ruang tanda tangan dicentang,
  // ruang dikosongkan untuk tanda tangan elektronik resmi; tidak membuat stempel otomatis.
  const signTitle = String(note.dari || "-");
  const signName = String(note.ttd || "").trim();
  const signGap = note.blank ? 30 : (note.sig ? 25 : 18);
  const needed = 8 + signGap + (note.blank ? 0 : (signName ? 8 : 0)) + 17;
  if (y + needed > 270) {
    doc.addPage();
    y = 22;
  }
  y += 5;
  const signX = 124;
  const signW = 68;
  const titleLines = doc.splitTextToSize(signTitle, signW);
  doc.setFont("times", "normal");
  doc.setFontSize(10.5);
  doc.text(titleLines, signX, y, { maxWidth: signW });
  y += titleLines.length * 4.8 + 2;

  if (note.blank) {
    // Ruang kosong yang cukup untuk tanda tangan elektronik di kemudian hari.
    y += signGap;
  } else if (note.sig) {
    const imgW = 35;
    const imgH = Math.min(20, imgW * note.sig.h / note.sig.w);
    doc.addImage(note.sig.d, fmt(note.sig.d), signX, y, imgW, imgH);
    y += imgH + 2;
    if (signName) {
      doc.setFont("times", "bold");
      doc.text(signName, signX, y);
      doc.setFont("times", "normal");
      y += 5;
    }
  } else {
    y += signGap;
    if (signName) {
      doc.setFont("times", "bold");
      doc.text(signName, signX, y);
      doc.setFont("times", "normal");
      y += 5;
    }
  }

  y += 5;
  if (y > 278) {
    doc.addPage();
    y = 22;
  }
  doc.setFont("times", "normal");
  doc.setFontSize(9.5);
  doc.text("Tembusan:", L, y);
  doc.text("- " + (BIDANG[note.bidang] || note.bidang || "-"), L, y + 5);

  const items = parseRab(note.rab || "");
  if (items.length) {
    doc.addPage();
    doc.setFont("times", "normal");
    doc.setFontSize(10);
    doc.text("Lampiran Nodin Nomor : " + (note.nomor || "-"), R, 20, { align: "right" });
    doc.text("Tanggal Surat : " + fd(note.tanggal), R, 26, { align: "right" });
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text("RINCIAN RENCANA ANGGARAN BIAYA", W / 2, 39, { align: "center" });
    doc.setFont("times", "normal");
    doc.autoTable({
      startY: 46,
      theme: "grid",
      margin: { left: 17, right: 17, top: 18, bottom: 20 },
      head: [["No", "Nama Barang", "Volume", "Perkiraan Harga", "Perkiraan Jumlah Harga"]],
      body: items.map((item, index) => [
        (index + 1) + ".",
        item.nama,
        item.vol + " " + item.sat,
        rp(item.harga),
        rp(item.vol * item.harga)
      ]),
      foot: [["", "Total", "", "", rp(items.reduce((sum, item) => sum + item.vol * item.harga, 0))]],
      styles: {
        font: "times",
        fontSize: 9,
        cellPadding: 2,
        textColor: [0, 0, 0],
        lineColor: [70, 70, 70],
        lineWidth: 0.2
      },
      headStyles: {
        font: "times",
        fontStyle: "bold",
        fillColor: [230, 230, 230],
        textColor: [0, 0, 0],
        halign: "center"
      },
      footStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 12, halign: "center" },
        1: { cellWidth: 72, halign: "left" },
        2: { cellWidth: 24, halign: "center" },
        3: { cellWidth: 35, halign: "right" },
        4: { cellWidth: 40, halign: "right" }
      }
    });
  }

  addPageFooter();
  doc.save(fn(note) + ".pdf");
}

/* =========================================================
   RAB DAN CONTOH NOTA DINAS
   ========================================================= */

const parseRab = text => text.split("\n")
  .map(line => line.split("|").map(value => value.trim()))
  .filter(row => row[0] && Number(row[1]) > 0 && Number(row[3]) > 0)
  .map(row => ({
    nama: row[0],
    vol: Number(row[1]),
    sat: row[2] || "",
    harga: Number(row[3])
  }));

$("rab").oninput = () => {
  const total = parseRab($("rab").value)
    .reduce((sum, item) => sum + item.vol * item.harga, 0);

  if (total) $("minta").value = total;
  calc();
};

$("demo").onclick = () => {
  if (!isAdmin() && currentUser?.bidang !== "YANVERDOKJAL") {
    alert(
      "Contoh nota dinas ini menggunakan anggaran Yanverdokjal. " +
      "Gunakan akun Admin atau akun Yanverdokjal untuk mencoba contoh."
    );
    return;
  }

  $("ib").value = "YANVERDOKJAL";
  sel = NODES["YANVERDOKJAL/BAA.001/051/521811/000022"];

  if (!sel) {
    alert("Kode anggaran contoh tidak ditemukan dalam data.js.");
    return;
  }

  renderIn();

  const values = {
    tgl: "2026-09-07",
    nomor: "WIM.10.IMI.2-PB.02.01 – 66",
    yth: "Kepala Kantor selaku Kuasa Pengguna Anggaran",
    dari: "Kepala Bagian Tata Usaha",
    hal: "Kebutuhan Belanja Supplies Komputer",
    lamp: "1 berkas (RAB)",
    kep: "kegiatan administrasi dan operasional kantor secara umum",
    ttd: "INDRA AGUSWANTI",
    rab: [
      "Tinta Epson T08F1 (AM-C4000) Black|6|Buah|4560000",
      "Tinta Epson T08F2 (AM-C4000) Cyan|6|Buah|4560000",
      "Tinta Epson T08F1 (AM-C4000) Magenta|6|Buah|4560000",
      "Tinta Epson T08F1 (AM-C4000) Yellow|6|Buah|4560000",
      "Maintenance Box Epson L15150|3|Buah|640000",
      "TZE-251 24mm Black|7|Buah|450000",
      "Tinta Epson Black T05A1|4|Buah|1700000",
      "Tinta Epson Magenta T05a3|2|Buah|1700000",
      "Tinta Epson Yellow T05a4|2|Buah|1500000",
      "Tinta Epson Cyan T05a2|2|Buah|1500000"
    ].join("\n")
  };

  Object.keys(values).forEach(key => {
    $(key).value = values[key];
  });

  if ($("jenisNodin")) {
    $("jenisNodin").value = "Nota Pengajuan Pencairan Anggaran";
  }

  if ($("yth")._setMultiValues) $("yth")._setMultiValues(values.yth);
  if ($("dari")._setMultiValues) $("dari")._setMultiValues(values.dari);

  $("rab").oninput();
  $("sel").scrollIntoView({ behavior: "smooth", block: "center" });
};

/* =========================================================
   GAMBAR QR DAN TANDA TANGAN MANUAL
   ========================================================= */

const fn = note =>
  "Nodin_" + String(note.nomor || "").replace(/[^\w]+/g, "_") + "_" + note.bidang;

const fmt = data => data.startsWith("data:image/png") ? "PNG" : "JPEG";

const u8 = data =>
  Uint8Array.from(atob(data.split(",")[1]), character => character.charCodeAt(0));

["qr", "sig"].forEach(key => {
  $(key).onchange = event => {
    const file = event.target.files[0];

    if (!file) {
      IMG[key] = null;
      $(key + "p").removeAttribute("src");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        IMG[key] = {
          d: reader.result,
          w: image.width,
          h: image.height
        };

        $(key + "p").src = reader.result;
      };

      image.src = reader.result;
    };

    reader.readAsDataURL(file);
  };
});

/* =========================================================
   WORD (.DOCX)
   ========================================================= */

async function word(note) {
  // Muat pustaka DOCX saat dibutuhkan agar tombol Word tetap berfungsi
  // meskipun index.html tidak memuat pustaka Word secara terpisah.
  try {
    if (!window.docx) {
      await new Promise((resolve, reject) => {
        const existing = document.querySelector('script[data-snd-docx="1"]');
        if (existing) {
          if (window.docx) return resolve();
          existing.addEventListener("load", resolve, { once: true });
          existing.addEventListener("error", () => reject(new Error("Pustaka Word gagal dimuat.")), { once: true });
          return;
        }
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js";
        script.dataset.sndDocx = "1";
        script.onload = resolve;
        script.onerror = () => reject(new Error("Pustaka Word gagal dimuat. Periksa koneksi internet lalu coba lagi."));
        document.head.appendChild(script);
      });
    }
  } catch (error) {
    console.error("Gagal memuat pustaka Word:", error);
    alert("Fitur unduh Word tidak dapat memuat pustaka DOCX. Periksa koneksi internet, lalu muat ulang website dan coba lagi.");
    return;
  }

  const D = window.docx;
  if (!D || !D.Document || !D.Packer) {
    alert("Pustaka Word belum siap. Muat ulang website dan coba kembali.");
    return;
  }

  note = withAuto(note);

  const {
    Document, Packer, Paragraph, TextRun, Table, TableRow,
    TableCell, ImageRun, WidthType, AlignmentType: A, BorderStyle: B
  } = D;

  const textRun = (text, options = {}) =>
    new TextRun({ text: String(text ?? ""), size: 22, font: "Arial", ...options });

  const P = (text, options = {}) => new Paragraph({
    alignment: options.al || A.JUSTIFIED,
    spacing: { after: options.after ?? 120 },
    indent: options.ind,
    pageBreakBefore: options.pb,
    children: [textRun(text, { bold: options.b })]
  });

  const none = { style: B.NONE, size: 0, color: "FFFFFF" };
  const noBorders = { top: none, bottom: none, left: none, right: none };
  const line = { style: B.SINGLE, size: 8, color: "000000" };
  const borders = { top: line, bottom: line, left: line, right: line };

  const C = (children, width, options = {}) => new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: options.br || noBorders,
    shading: options.fill ? { fill: options.fill } : undefined,
    children
  });

  const T = (widths, rows) => new Table({
    width: { size: 9600, type: WidthType.DXA },
    columnWidths: widths,
    rows
  });

  const h = String(note.hal || "").toLowerCase();
  const L = A.LEFT, R = A.RIGHT, M = A.CENTER;

  const info = [
    ["Jenis Nota Dinas", note.jenisNodin || "-"],
    ["Yth", note.yth],
    ["Dari", note.dari],
    ["Hal", note.hal],
    ["Lampiran", note.lampiran || "-"],
    ["Tanggal", fd(note.tanggal)]
  ];

  const infoTable = T([1400, 300, 7900], info.map((row, index) => {
    const border = index === info.length - 1
      ? { ...noBorders, bottom: line }
      : noBorders;

    return new TableRow({
      children: [
        C([P(row[0], { al: L, after: 60 })], 1400, { br: border }),
        C([P(":", { al: L, after: 60 })], 300, { br: border }),
        C([P(row[1], { al: L, after: 60 })], 7900, { br: border })
      ]
    });
  }));

  const widths = [2800, 1700, 1700, 1700, 1700];

  const headers = [
    "Kode Akun",
    "Total Pagu Anggaran",
    "Anggaran yang Diminta",
    "Sisa Anggaran Sebelum Pengajuan",
    "Sisa Anggaran Setelah Pengajuan"
  ];

  const anggaranTable = T(widths, [
    new TableRow({
      tableHeader: true,
      children: headers.map((text, index) =>
        C([P(text, { al: M, b: true, after: 0 })], widths[index], {
          br: borders,
          fill: "BFBFBF"
        })
      )
    }),
    new TableRow({
      children: [
        note.kode + " – " + note.uraian + (note.item ? " (" + note.item + ")" : ""),
        rp(note.pagu),
        rp(note.minta),
        rp(note.sebelum),
        rp(note.sesudah)
      ].map((text, index) =>
        C([P(text, { al: index ? R : L, after: 0 })], widths[index], {
          br: borders
        })
      )
    })
  ]);

  const qrChildren = note.qr
    ? [new Paragraph({
        children: [
          new ImageRun({
            data: u8(note.qr.d),
            transformation: { width: 105, height: 105 }
          })
        ]
      })]
    : [P("")];

  const signChildren = [P(note.dari, { al: L, after: 60 })];

  if (note.sig) {
    signChildren.push(new Paragraph({
      children: [
        new ImageRun({
          data: u8(note.sig.d),
          transformation: {
            width: 220,
            height: Math.round(220 * note.sig.h / note.sig.w)
          }
        })
      ]
    }));
  } else {
    signChildren.push(P(""));

    if (!note.blank) {
      signChildren.push(P(""), P(note.ttd, { al: L, b: true }));
    }
  }

  const signatureTable = T([4800, 4800], [
    new TableRow({
      children: [
        C(qrChildren, 4800),
        C(signChildren, 4800)
      ]
    })
  ]);

  const items = parseRab(note.rab || "");
  const attachments = [];

  if (items.length) {
    const W = [700, 3900, 1300, 1800, 1900];

    const makeRow = (values, bold, fill) => new TableRow({
      children: values.map((value, index) =>
        C([
          P(value, {
            al: index > 2 ? R : index === 1 ? L : M,
            b: bold,
            after: 0
          })
        ], W[index], { br: borders, fill })
      )
    });

    attachments.push(
      P("Lampiran Nodin Nomor : " + note.nomor, { al: R, after: 0, pb: true }),
      P("Tanggal Surat : " + fd(note.tanggal), { al: R }),
      P("RAB " + String(note.hal || "").toUpperCase(), { al: M, b: true }),
      T(W, [
        makeRow([
          "No", "Nama Barang", "Volume",
          "Perkiraan Harga", "Perkiraan Jumlah Harga"
        ], true, "BFBFBF"),
        ...items.map((item, index) => makeRow([
          (index + 1) + ".",
          item.nama,
          item.vol + " " + item.sat,
          rp(item.harga),
          rp(item.vol * item.harga)
        ])),
        makeRow([
          "", "Total", "", "",
          rp(items.reduce((sum, item) => sum + item.vol * item.harga, 0))
        ], true)
      ])
    );
  }

  const indent = { firstLine: 567 };

  const wordDocument = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1134,
            right: 1134,
            bottom: 1134,
            left: 1134
          }
        }
      },
      children: [
        P("KEMENTERIAN IMIGRASI DAN PEMASYARAKATAN RI", { al: M, after: 0 }),
        P("DIREKTORAT JENDERAL IMIGRASI", { al: M, after: 0 }),
        P("KANTOR IMIGRASI KELAS I KHUSUS NON TPI JAKARTA BARAT", { al: M, after: 240 }),
        P("NOTA DINAS", { al: M, b: true, after: 60 }),
        P("Nomor : " + note.nomor, { al: M, after: 240 }),
        infoTable,
        P("", { after: 120 }),
        P(
          `Dalam rangka menunjang kelancaran pelaksanaan tugas dan fungsi serta kegiatan operasional perkantoran pada Kantor Imigrasi Kelas I Khusus Non TPI Jakarta Barat, diperlukan pemenuhan ${h} untuk mendukung ${note.kep}.`,
          { ind: indent }
        ),
        P(
          `Sehubungan dengan hal tersebut, ${h} dimaksud direncanakan menggunakan anggaran pada ${BIDANG[note.bidang]} dengan Kode Akun ${note.kode} – ${note.uraian}${note.item ? " (" + note.item + ")" : ""}, dengan memperhatikan ketersediaan anggaran serta ketentuan dan peruntukan anggaran yang berlaku. Rincian anggaran sebagai berikut:`,
          { ind: indent }
        ),
        anggaranTable,
        P("", { after: 120 }),
        P(
          `Berkenaan dengan hal tersebut, mohon kiranya Bapak Kepala Kantor dapat memberikan persetujuan atas pemenuhan ${h} untuk kebutuhan operasional kantor, agar selanjutnya dapat diproses sesuai dengan mekanisme dan ketentuan yang berlaku.`,
          { ind: indent }
        ),
        P(
          "Demikian disampaikan, atas arahan dan perhatian Bapak Kepala Kantor diucapkan terima kasih.",
          { ind: indent }
        ),
        P("", { after: 120 }),
        signatureTable,
        P("Tembusan:", { al: L, after: 0 }),
        P("- Kepala " + BIDANG[note.bidang], { al: L }),
        ...(note.auto ? [
          P(
            "Dokumen internal Smart Nota Dinas: QR dan tanda tangan dibuat otomatis oleh sistem, bukan sertifikat elektronik BSrE.",
            { al: L }
          )
        ] : []),
        ...attachments
      ]
    }]
  });

  try {
    const blob = await Packer.toBlob(wordDocument);
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = fn(note) + ".docx";
    anchor.style.display = "none";
    window.document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    // Beri browser waktu menyelesaikan unduhan sebelum URL dibersihkan.
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (error) {
    console.error("Gagal membuat dokumen Word:", error);
    alert("Dokumen Word gagal dibuat atau diunduh. Coba lagi setelah memuat ulang website.");
  }
}

/* =========================================================
   QR DAN TANDA TANGAN OTOMATIS INTERNAL
   Bukan pengganti tanda tangan elektronik resmi.
   ========================================================= */

const hash = text => {
  let a = 0xdeadbeef, b = 0x41c6ce57;

  for (let i = 0, c; i < text.length; i++) {
    c = text.charCodeAt(i);
    a = Math.imul(a ^ c, 2654435761);
    b = Math.imul(b ^ c, 1597334677);
  }

  a = Math.imul(a ^ (a >>> 16), 2246822507) ^
      Math.imul(b ^ (b >>> 13), 3266489909);

  b = Math.imul(b ^ (b >>> 16), 2246822507) ^
      Math.imul(a ^ (a >>> 13), 3266489909);

  return (
    4294967296 * (2097151 & b) + (a >>> 0)
  ).toString(36).toUpperCase();
};

const ascii = text => String(text).replace(/[^\x20-\x7E]/g, "-");

function makeQR(text) {
  if (typeof window.qrcode !== "function") return null;

  const qr = window.qrcode(0, "M");
  qr.addData(text);
  qr.make();

  const modules = qr.getModuleCount();
  const scale = 8, border = 2;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = canvas.height = (modules + 2 * border) * scale;

  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#000";

  for (let row = 0; row < modules; row++) {
    for (let col = 0; col < modules; col++) {
      if (qr.isDark(row, col)) {
        context.fillRect(
          (col + border) * scale,
          (row + border) * scale,
          scale,
          scale
        );
      }
    }
  }

  return {
    d: canvas.toDataURL("image/png"),
    w: canvas.width,
    h: canvas.height
  };
}

function makeStamp(note, code) {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 250;

  const context = canvas.getContext("2d");

  context.fillStyle = "#fff";
  context.fillRect(0, 0, 640, 250);

  context.strokeStyle = "#0a4a5c";
  context.lineWidth = 4;
  context.strokeRect(4, 4, 632, 242);

  context.fillStyle = "#0a4a5c";
  context.fillRect(4, 4, 632, 46);

  context.fillStyle = "#fff";
  context.font = "bold 24px Arial";
  context.fillText("TANDA TANGAN DIGITAL INTERNAL", 18, 36);

  context.fillStyle = "#000";
  context.font = "20px Arial";
  context.fillText("Ditandatangani oleh:", 18, 84);

  context.font = "bold 30px Arial";
  context.fillText(note.ttd || "-", 18, 128);

  context.font = "20px Arial";
  context.fillText(
    note.dari.length > 52 ? note.dari.slice(0, 52) + "..." : note.dari,
    18,
    160
  );

  context.fillText("Tanggal: " + fd(note.tanggal), 18, 196);
  context.fillText("Kode verifikasi: " + code, 18, 228);

  return {
    d: canvas.toDataURL("image/png"),
    w: canvas.width,
    h: canvas.height
  };
}

function withAuto(note) {
  if (note.blank) {
    return { ...note, qr: null, sig: null, auto: false };
  }

  const code = hash([
    note.nomor,
    note.tanggal,
    note.bidang,
    note.kode,
    note.minta,
    note.hal
  ].join("|"));

  const auto = !note.qr || !note.sig;

  const payload = ascii([
    "SMARTNODIN",
    note.nomor,
    note.tanggal,
    note.bidang,
    note.kode,
    note.minta,
    code
  ].join("|"));

  return {
    ...note,
    auto,
    qr: note.qr || makeQR(payload),
    sig: note.sig || makeStamp(note, code)
  };
}

/* =========================================================
   PENGATURAN ADMIN + IMPOR FA DETAIL HARIAN
   Catatan: penyimpanan browser lokal; impor FA Detail dilakukan oleh Admin.
   ========================================================= */
(function installAdminTools() {
  if (!$("app")) return;

  const navButton = document.createElement("button");
  navButton.type = "button";
  navButton.id = "adminSettingsNav";
  navButton.className = "navbtn";
  navButton.textContent = "Pengaturan Admin";
  navButton.hidden = true;
  navButton.addEventListener("click", () => {
    if (!isAdmin()) return alert("Menu ini hanya dapat diakses oleh Admin.");
    go("adminSettings");
    renderAdminTools();
  });
  const navParent = document.querySelector("[data-pg]")?.parentElement;
  const logoutButton = $("out");
  // Letakkan Pengaturan Admin tepat sebelum Keluar agar Keluar selalu menjadi menu terakhir.
  if (navParent) {
    if (logoutButton && logoutButton.parentElement === navParent) {
      navParent.insertBefore(navButton, logoutButton);
    } else {
      navParent.appendChild(navButton);
    }
  }

  const panel = document.createElement("section");
  panel.id = "adminSettings";
  panel.className = "pg";
  panel.hidden = true;
  panel.innerHTML = `
    <div class="panel" style="max-width:1100px;margin:0 auto;padding:22px;border-radius:14px;background:var(--panel,#fff);">
      <h2>Pengaturan Administrator</h2>
      <p>Ubah username dan password akun melalui menu khusus Admin. Gunakan password yang kuat dan simpan di tempat aman.</p>
      <div class="card" style="margin:14px 0;padding:14px;overflow-x:auto;">
        <h3>Daftar akun yang dikelola</h3>
        <p style="font-size:.9em;">Daftar ini menampilkan username dan password akun yang tersimpan pada browser/perangkat ini. Karena password ditampilkan sebagai teks biasa, jangan gunakan menu ini pada perangkat umum atau membagikan tampilan/screenshot-nya.</p>
        <table style="width:100%;border-collapse:collapse;min-width:480px;">
          <thead><tr><th style="text-align:left;padding:8px;border-bottom:1px solid #ddd;">Peran</th><th style="text-align:left;padding:8px;border-bottom:1px solid #ddd;">Username saat ini</th><th style="text-align:left;padding:8px;border-bottom:1px solid #ddd;">Password saat ini</th></tr></thead>
          <tbody id="accountListBody"></tbody>
        </table>
      </div>
      <form id="accountSettingsForm">
        <h3>Ubah username dan password akun</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;">
          <label>Akun
            <select id="accountKey" required style="display:block;width:100%;padding:10px;margin-top:5px;">
              <option value="admin">Administrator</option>
              <option value="inteldakim">Bidang Inteldakim</option>
              <option value="intaltuskim">Bidang Intaltuskim</option>
              <option value="tikkim">Bidang Tikkim</option>
              <option value="tatausaha">Bagian Tata Usaha</option>
              <option value="yanverdokjal">Bidang Yanverdokjal</option>
            </select>
          </label>
          <label>Username baru
            <input id="accountUsername" autocomplete="off" required maxlength="60" style="display:block;width:100%;padding:10px;margin-top:5px;">
          </label>
          <label>Password baru
            <input id="accountPassword" type="password" autocomplete="new-password" required minlength="8" maxlength="120" style="display:block;width:100%;padding:10px;margin-top:5px;">
          </label>
          <label>Ulangi password baru
            <input id="accountPassword2" type="password" autocomplete="new-password" required minlength="8" maxlength="120" style="display:block;width:100%;padding:10px;margin-top:5px;">
          </label>
        </div>
        <p style="font-size:.9em;">Password minimal 8 karakter. Perubahan ini disimpan pada browser/perangkat ini.</p>
        <button type="submit">Simpan Akun</button>
        <span id="accountSettingsMessage" role="status" style="margin-left:10px;"></span>
      </form>
      <hr style="margin:26px 0;">
      <h2>Impor Data FA Detail Harian</h2>
      <div class="fa-upload-guide" style="line-height:1.65;margin:12px 0 16px;">
        <p><strong>Upload FA Detail Anggaran</strong></p>
        <p>Admin dapat mengunggah laporan FA Detail setiap pagi sebelum aplikasi digunakan. Format file yang didukung: Excel (.xlsx/.xls), Word (.docx), atau PDF (.pdf).</p>
        <p><strong>Ketentuan file:</strong></p>
        <ul style="padding-left:22px;">
          <li><strong>Excel:</strong> disarankan memiliki kolom kode akun, uraian, pagu, realisasi, dan/atau blokir.</li>
          <li><strong>Word/PDF:</strong> sistem dapat membaca kode akun yang tercantum di awal baris maupun pada kolom kode akun, dengan syarat teks dapat dipilih dan struktur tabel terbaca dengan jelas.</li>
          <li>Untuk laporan FA Detail, sistem menggunakan data <strong>Pagu Revisi</strong>, <strong>Realisasi s.d. Periode</strong>, dan <strong>Lock Pagu</strong> apabila tersedia.</li>
          <li>Baris rincian kegiatan dan subtotal harus dibedakan dari baris kode akun agar tidak terjadi kesalahan pembacaan.</li>
        </ul>
        <p>Setelah impor berhasil, admin perlu memeriksa hasil pembacaan sebelum data digunakan untuk monitoring anggaran.</p>
      </div>
      <p><strong>Penting:</strong> pada versi GitHub Pages statis ini, file yang diunggah hanya tersimpan di browser/perangkat tempat Admin mengunggah. Data impor hanya tersimpan di browser/perangkat Admin dan belum otomatis tersinkron ke perangkat lain.</p>
      <label>File FA Detail (Excel, Word, atau PDF)
        <input id="faDetailFile" type="file" accept=".xlsx,.xls,.docx,.pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf" style="display:block;width:100%;padding:10px;margin-top:8px;">
      </label>
      <div id="faImportMapping" style="margin-top:14px;"></div>
      <div id="faImportMessage" role="status" style="margin-top:12px;"></div>
      <p id="faLastImport" style="font-size:.9em;"></p>
    </div>`;
  $("app").appendChild(panel);

  function renderAdminTools() {
    if (!isAdmin()) {
      alert("Akses ditolak. Pengaturan hanya untuk Admin.");
      go("mon");
      return;
    }
    $("adminSettingsNav").hidden = false;
    const key = $("accountKey").value || "admin";
    $("accountUsername").value = ACCOUNTS[key].username;
    $("accountPassword").value = "";
    $("accountPassword2").value = "";
    const accountListBody = $("accountListBody");
    if (accountListBody) {
      accountListBody.innerHTML = Object.entries(ACCOUNTS).map(([accountKey, account]) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee;">${esc(account.label)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;word-break:break-word;">${esc(account.username)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;word-break:break-word;font-family:monospace;">${esc(account.password)}</td>
        </tr>`).join("");
    }
    const last = (() => { try { return JSON.parse(localStorage.getItem("snd_fa_detail") || "null"); } catch { return null; } })();
    $("faLastImport").textContent = last?.importedAt ? `Impor terakhir: ${new Date(last.importedAt).toLocaleString("id-ID")} — ${last.fileName || "FA Detail"}` : "Belum ada data FA Detail yang diimpor pada browser ini.";
  }

  $("accountKey").addEventListener("change", () => {
    const key = $("accountKey").value;
    $("accountUsername").value = ACCOUNTS[key].username;
    $("accountPassword").value = "";
    $("accountPassword2").value = "";
  });

  $("accountSettingsForm").addEventListener("submit", event => {
    event.preventDefault();
    if (!isAdmin()) return alert("Hanya Admin yang dapat mengubah akun.");
    const key = $("accountKey").value;
    const username = $("accountUsername").value.trim();
    const password = $("accountPassword").value;
    const password2 = $("accountPassword2").value;
    if (!username || !password) return alert("Username dan password wajib diisi.");
    if (password.length < 8) return alert("Password minimal 8 karakter.");
    if (password !== password2) return alert("Konfirmasi password tidak sama.");
    const duplicate = Object.entries(ACCOUNTS).some(([otherKey, account]) => otherKey !== key && account.username.toLowerCase() === username.toLowerCase());
    if (duplicate) return alert("Username sudah dipakai akun lain.");
    ACCOUNTS[key].username = username;
    ACCOUNTS[key].password = password;
    const stored = {};
    Object.keys(ACCOUNTS).forEach(accountKey => {
      stored[accountKey] = { username: ACCOUNTS[accountKey].username, password: ACCOUNTS[accountKey].password };
    });
    try {
      localStorage.setItem("snd_accounts", JSON.stringify(stored));
    } catch (e) {
      return alert("Pengaturan gagal disimpan. Penyimpanan browser mungkin penuh.");
    }
    if (key === "admin") {
      // Perbarui sesi aktif agar username baru dikenali setelah halaman dimuat ulang.
      sessionStorage.setItem("snd_user", JSON.stringify({ username: ACCOUNTS.admin.username, role: "admin" }));
      currentUser = ACCOUNTS.admin;
    }
    renderAdminTools();
    $("accountSettingsMessage").textContent = `Akun ${ACCOUNTS[key].label} berhasil diperbarui pada browser ini.`;
    alert("Akun berhasil diperbarui pada browser ini. Jika kredensial perlu berlaku lintas perangkat, aplikasi memerlukan server/database bersama.");
  });

  function normHeader(value) {
    return String(value ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  }
  function parseNumber(value) {
    if (typeof value === "number") return value;
    let text = String(value ?? "").trim().replace(/rp/ig, "").replace(/\s/g, "");
    if (!text) return null;
    // Format laporan Indonesia: 1.234.567,00 atau 1,234,567.00.
    if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(text)) text = text.replace(/\./g, "").replace(",", ".");
    else if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(text)) text = text.replace(/,/g, "");
    else text = text.replace(/,/g, ".");
    const n = Number(text);
    return Number.isFinite(n) ? n : null;
  }
  function findColumn(headers, patterns) {
    return headers.findIndex(h => patterns.some(pattern => pattern.test(normHeader(h))));
  }
  function loadScript(src, readyCheck, label) {
    // Jangan memuat pustaka yang sama lebih dari sekali.
    if (readyCheck()) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-snd-lib="${label}"]`);
      const fail = () => reject(new Error(`Pustaka ${label} gagal dimuat. Periksa koneksi internet atau pemblokiran CDN, lalu muat ulang halaman.`));
      const verify = () => {
        if (readyCheck()) resolve();
        else reject(new Error(`Pustaka ${label} selesai diunduh tetapi tidak tersedia. Periksa koneksi internet atau pemblokiran CDN, lalu muat ulang halaman.`));
      };
      if (existing) {
        if (readyCheck()) { resolve(); return; }
        if (existing.dataset.sndLoaded === "true") { verify(); return; }
        existing.addEventListener("load", verify, { once: true });
        existing.addEventListener("error", fail, { once: true });
        return;
      }
      const script = document.createElement("script");
      script.dataset.sndLib = label;
      script.src = src;
      script.async = true;
      script.onload = () => {
        script.dataset.sndLoaded = "true";
        verify();
      };
      script.onerror = fail;
      document.head.appendChild(script);
    });
  }
  async function loadXlsx() {
    await loadScript("https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js", () => !!window.XLSX, "xlsx");
  }
  async function loadJSZip() {
    await loadScript("https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js", () => !!window.JSZip, "jszip");
  }
  async function loadPdfJs() {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js", () => !!window.pdfjsLib, "pdfjs");
    if (window.pdfjsLib?.GlobalWorkerOptions) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    }
  }
  async function docxRows(file) {
    await loadJSZip();
    const zip = await window.JSZip.loadAsync(await file.arrayBuffer());
    const xmlFile = zip.file("word/document.xml");
    if (!xmlFile) throw new Error("Isi dokumen Word tidak ditemukan. Gunakan format .docx, bukan .doc.");
    const xmlText = await xmlFile.async("text");
    const xml = new DOMParser().parseFromString(xmlText, "application/xml");
    if (xml.querySelector("parsererror")) throw new Error("Struktur dokumen Word tidak dapat dibaca.");
    const tableRows = [...xml.getElementsByTagNameNS("*", "tr")].map(tr =>
      [...tr.getElementsByTagNameNS("*", "tc")].map(tc =>
        [...tc.getElementsByTagNameNS("*", "t")].map(t => t.textContent || "").join(" ").trim()
      )
    ).filter(row => row.some(cell => cell));
    if (tableRows.length >= 2) return tableRows;
    const paragraphs = [...xml.getElementsByTagNameNS("*", "p")]
      .map(p => [...p.getElementsByTagNameNS("*", "t")].map(t => t.textContent || "").join(" ").trim())
      .filter(Boolean);
    if (paragraphs.length >= 2) return paragraphs.map(line => line.split(/\t+|\s{2,}/));
    throw new Error("Tidak ditemukan tabel/baris data pada dokumen Word. Pastikan FA Detail disajikan sebagai tabel.");
  }
  async function pdfRows(file) {
    await loadPdfJs();
    const pdf = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    const allRows = [];
    for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
      const page = await pdf.getPage(pageNo);
      const content = await page.getTextContent();
      const items = content.items.filter(item => item.str && item.str.trim()).map(item => ({
        text: item.str.trim(), x: item.transform?.[4] || 0, y: item.transform?.[5] || 0,
        width: item.width || 0
      }));
      // Gabungkan teks yang berada pada garis horizontal sama, lalu pisahkan kolom berdasarkan jarak posisi.
      items.sort((a,b) => Math.abs(b.y-a.y) > 2 ? b.y-a.y : a.x-b.x);
      const lines = [];
      for (const item of items) {
        let line = lines.find(row => Math.abs(row.y - item.y) <= 2);
        if (!line) { line = { y: item.y, items: [] }; lines.push(line); }
        line.items.push(item);
      }
      lines.sort((a,b) => b.y-a.y);
      for (const line of lines) {
        line.items.sort((a,b) => a.x-b.x);
        if (!line.items.length) continue;
        const cells = [];
        let cellText = line.items[0].text;
        let prev = line.items[0];
        for (let i=1; i<line.items.length; i++) {
          const cur = line.items[i];
          const gap = cur.x - (prev.x + prev.width);
          if (gap > 16) { cells.push(cellText.trim()); cellText = cur.text; }
          else cellText += " " + cur.text;
          prev = cur;
        }
        cells.push(cellText.trim());
        allRows.push(cells);
      }
    }
    if (allRows.length < 2) throw new Error("PDF tidak memiliki teks tabel yang dapat dibaca. Jika PDF hasil scan/foto, lakukan OCR atau unggah versi Excel/Word yang berisi teks.");
    return allRows;
  }
  function importRows(rows, fileName) {
    if (!Array.isArray(rows) || rows.length < 2) throw new Error("File tidak memiliki baris data yang cukup.");

    // Format khusus PDF FA Detail: impor kode kegiatan (mis. BAA.001)
    // dan kode akun 6 digit. Monitoring pada tingkat kegiatan harus mengikuti
    // angka s.d. Periode yang tercantum langsung pada baris kegiatan FA Detail.
    const faRows = [];
    for (const row of rows) {
      const cells = (Array.isArray(row) ? row : [row]).map(v => String(v ?? "").trim()).filter(Boolean);
      const line = cells.join(" ").replace(/\s+/g, " ").trim();
      // Dukungan kode seperti BAA.001, 051, 051.0A, dan 521211.
      const match = line.match(/^\s*([A-Z]{2,5}\.\d{3}|\d{3}(?:\.[A-Z0-9]+)?|\d{6})\s+(.+?)\s+(?=-?\d[\d,.]*(?:\s|$))/i);
      if (!match) continue;
      const code = match[1].toUpperCase();
      // Kode rincian 000017, 000018, dst. adalah baris data yang sah dan
      // harus ikut dipetakan ke node yang sama di data.js.
      const afterDescription = line.slice(match[0].length).trim();
      const tokens = afterDescription.match(/-?\d[\d,]*(?:\.\d+)?/g) || [];
      const numbers = tokens.map(parseNumber).filter(n => n !== null && Number.isFinite(n));
      // Pagu Revisi, Lock Pagu, Periode Lalu, Periode Ini, s.d. Periode, %, Sisa.
      // Minimal kolom numerik: pagu, lock, periode lalu, periode ini,
      // s.d. periode. Persentase (mis. 55.38) bukan saldo; sisa hanya
      // diambil jika ada setidaknya 7 nilai numerik pada baris.
      if (numbers.length < 5) continue;
      const remaining = numbers.length >= 7 ? numbers[numbers.length - 1] : null;
      faRows.push({ code, description: match[2].trim(), pagu: numbers[0], lock: numbers[1], real: numbers[4], remaining });
    }

    if (faRows.length) {
      const normalizeName = value => normHeader(value).replace(/\b(ri|di|dan|ke|yang)\b/g, " ").replace(/\s+/g, " ").trim();
      const nodes = Object.values(NODES);
      const savedValues = {};
      let updated = 0;
      let skipped = 0;
      let unmatched = 0;
      for (const item of faRows) {
        let candidates = nodes.filter(node => String(node.code || "").toUpperCase() === item.code);
        if (!candidates.length) { unmatched++; continue; }
        // Bila kode berulang, cocokkan uraian terlebih dahulu. Jangan pernah
        // menyalin satu baris FA ke beberapa node sekaligus.
        const desc = normalizeName(item.description);
        const exact = candidates.filter(node => normalizeName(node.name) === desc);
        if (exact.length === 1) candidates = exact;
        else if (candidates.length > 1) {
          const partial = candidates.filter(node => {
            const name = normalizeName(node.name);
            return name && desc && (name.includes(desc) || desc.includes(name));
          });
          if (partial.length === 1) candidates = partial;
          else { skipped++; continue; }
        }
        if (candidates.length !== 1) { skipped++; continue; }
        const node = candidates[0];
        const values = { pagu: item.pagu, lock: item.lock, real: item.real };
        // Simpan sisa resmi FA Detail bila terdeteksi pada baris. Sisa ini
        // dipakai untuk tampilan monitoring; pengajuan nota tetap dihitung terpisah.
        if (item.remaining !== null && Number.isFinite(item.remaining)) values.faRemaining = item.remaining;
        savedValues[node.path] = { ...(savedValues[node.path] || {}), ...values };
        node.pagu = item.pagu;
        node.lock = item.lock;
        node.real = item.real;
        if (values.faRemaining !== undefined) node.faRemaining = values.faRemaining;
        else delete node.faRemaining;
        node.faImported = true;
        updated++;
      }
      if (updated) {
        // Terapkan snapshot baru secara konsisten dan lepaskan penanda impor lama.
        Object.values(NODES).forEach(node => { delete node.faImported; delete node.faRemaining; });
        Object.entries(savedValues).forEach(([path, values]) => {
          const node = NODES[path];
          if (!node) return;
          node.faImported = true;
          if (values.pagu !== undefined) node.pagu = values.pagu;
          if (values.real !== undefined) node.real = values.real;
          if (values.lock !== undefined) node.lock = values.lock;
          if (values.faRemaining !== undefined) node.faRemaining = values.faRemaining;
        });
        const record = { importedAt: new Date().toISOString(), fileName, values: savedValues, updatedRows: updated };
        try { localStorage.setItem("snd_fa_detail", JSON.stringify(record)); }
        catch (e) { throw new Error("Data berhasil dibaca tetapi tidak dapat disimpan: penyimpanan browser penuh."); }
        renderMon();
        renderAdminTools();
        $("faImportMessage").textContent = `Impor FA Detail selesai: ${updated} baris berhasil dipetakan.${unmatched ? ` ${unmatched} baris tidak cocok dengan kode pada data.js.` : ""}${skipped ? ` ${skipped} baris berkode ganda dilewati agar tidak salah akun.` : ""} Sisa Monitoring memakai kolom SISA ANGGARAN pada baris yang cocok; jika kolom sisa tidak terbaca, aplikasi menghitung pagu − lock − realisasi. Data tersimpan pada browser ini.`;
        return;
      }
    }
    // FA Detail kadang memiliki beberapa baris judul; cari baris header yang paling mungkin.
    let headerIndex = 0, bestScore = -1;
    for (let i = 0; i < Math.min(rows.length, 30); i++) {
      const headers = rows[i].map(normHeader);
      const score = [
        /kode akun|akun belanja|account code|kode rekening|kode akun belanja|kode sub akun|kode subakun|^akun$|^kode$/,
        /pagu|anggaran|jumlah dana|nilai pagu/,
        /realisasi|realisasi belanja/,
        /blokir|diblokir/
      ].reduce((n, re) => n + (headers.some(h => re.test(h)) ? 1 : 0), 0);
      if (score > bestScore) { bestScore = score; headerIndex = i; }
      if (score >= 3) break;
    }
    const headers = rows[headerIndex].map(v => String(v ?? "").trim());
    const dataRows = rows.slice(headerIndex + 1).filter(r => r.some(v => String(v ?? "").trim()));
    const codeCol = findColumn(headers, [
      /kode akun/, /akun belanja/, /kode rekening/, /account code/,
      /kode sub akun/, /kode subakun/, /^akun$/, /^kode$/
    ]);
    const paguCol = findColumn(headers, [
      /pagu.*(dipa|anggaran)?/, /jumlah pagu/, /total anggaran/,
      /pagu efektif/, /pagu awal/, /^anggaran$/, /jumlah dana/
    ]);
    const realCol = findColumn(headers, [/realisasi.*s\.d\.?\s*periode/, /realisasi.*sampai.*periode/, /realisasi/, /realisasi.*anggaran/, /realisasi belanja/]);
    const lockCol = findColumn(headers, [/lock pagu/, /pagu.*lock/, /blokir/, /diblokir/, /pagu.*blokir/, /cadangan/]);
    const remainingCol = findColumn(headers, [/sisa.*pagu/, /sisa.*anggaran/, /sisa dana/, /saldo tersedia/, /pagu tersedia/, /^sisa$/, /remaining/]);
    const bidangCol = findColumn(headers, [/bidang/, /unit kerja/, /nama satker/, /^satker$/, /unit organisasi/]);
    if (codeCol < 0) throw new Error("Kolom kode akun tidak terdeteksi. Pastikan file memiliki header Kode Akun/Akun/Kode.");
    if (paguCol < 0 && realCol < 0 && lockCol < 0 && remainingCol < 0) throw new Error("Kolom Pagu, Realisasi, Blokir/Lock, atau Sisa Anggaran tidak terdeteksi pada header file.");
    const savedValues = {};
    let updated = 0;
    const byCode = {};
    Object.values(NODES).forEach(node => { (byCode[node.code] ||= []).push(node); });
    const normalizeCode = v => String(v ?? "").replace(/\.0$/, "").replace(/[^0-9A-Za-z.]/g, "").trim();
    for (const row of dataRows) {
      const code = normalizeCode(row[codeCol]);
      if (!code) continue;
      const candidates = byCode[code] || byCode[code.replace(/\./g, "")];
      if (!candidates?.length) continue;
      let chosen = candidates;
      if (bidangCol >= 0 && row[bidangCol]) {
        const b = normHeader(row[bidangCol]);
        const filtered = candidates.filter(n => normHeader(n.bid).includes(b) || b.includes(normHeader(n.bid)) || normHeader(BIDANG[n.bid] || "").includes(b) || b.includes(normHeader(BIDANG[n.bid] || "")));
        if (filtered.length) chosen = filtered;
      }
      for (const node of chosen) {
        const values = {};
        if (paguCol >= 0) { const n = parseNumber(row[paguCol]); if (n !== null) values.pagu = n; }
        if (realCol >= 0) { const n = parseNumber(row[realCol]); if (n !== null) values.real = n; }
        if (lockCol >= 0) { const n = parseNumber(row[lockCol]); if (n !== null) values.lock = n; }
        if (remainingCol >= 0) { const n = parseNumber(row[remainingCol]); if (n !== null) values.faRemaining = n; }
        if (!Object.keys(values).length) continue;
        savedValues[node.path] = { ...(savedValues[node.path] || {}), ...values };
        if (values.pagu !== undefined) node.pagu = values.pagu;
        if (values.real !== undefined) node.real = values.real;
        if (values.lock !== undefined) node.lock = values.lock;
        if (values.faRemaining !== undefined) node.faRemaining = values.faRemaining;
        node.faImported = true;
        updated++;
      }
    }
    if (!updated) throw new Error("Tidak ada akun yang cocok dengan data anggaran aplikasi. Periksa format FA Detail, kode akun, dan nama kolomnya.");
    // Snapshot baru menggantikan impor sebelumnya; bersihkan penanda lama agar akun
    // yang tidak ada di file baru kembali memakai data dasar, bukan saldo impor usang.
    Object.values(NODES).forEach(node => {
      delete node.faImported;
      delete node.faRemaining;
    });
    Object.entries(savedValues).forEach(([path, values]) => {
      const node = NODES[path];
      if (!node) return;
      node.faImported = true;
      if (values.pagu !== undefined) node.pagu = values.pagu;
      if (values.real !== undefined) node.real = values.real;
      if (values.lock !== undefined) node.lock = values.lock;
      if (values.faRemaining !== undefined) node.faRemaining = values.faRemaining;
    });
    const record = { importedAt: new Date().toISOString(), fileName, values: savedValues, updatedRows: updated };
    try { localStorage.setItem("snd_fa_detail", JSON.stringify(record)); }
    catch (e) { throw new Error("Data berhasil dibaca tetapi tidak dapat disimpan: penyimpanan browser penuh."); }
    renderMon();
    renderAdminTools();
    $("faImportMessage").textContent = `Berhasil memproses ${updated} baris akun. Pagu/realisasi/lock dan kolom sisa anggaran yang tersedia telah diterapkan ke monitoring pada browser ini. Periksa label kolom sisa pada file bila saldo masih tidak sesuai.`;
  }

  $("faDetailFile").addEventListener("change", async event => {
    if (!isAdmin()) { event.target.value = ""; return alert("Hanya Admin yang dapat mengunggah FA Detail."); }
    const file = event.target.files?.[0];
    if (!file) return;
    $("faImportMessage").textContent = "Membaca file…";
    try {
      let rows;
      const name = file.name.toLowerCase();
      if (name.endsWith(".docx")) {
        rows = await docxRows(file);
      } else if (name.endsWith(".pdf")) {
        rows = await pdfRows(file);
      } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
        await loadXlsx();
        const buffer = await file.arrayBuffer();
        const workbook = window.XLSX.read(buffer, { type: "array", cellDates: false });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        rows = window.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
      } else {
        throw new Error("Format tidak didukung. Pilih Excel (.xlsx/.xls), Word (.docx), atau PDF (.pdf). Format Word .doc lama tidak didukung.");
      }
      importRows(rows, file.name);
    } catch (error) {
      $("faImportMessage").textContent = "Gagal mengimpor: " + (error?.message || "format file tidak dikenali.");
    }
  });

  // Batasi panel dan tombol pengaturan hanya untuk akun Admin.
  const originalApplyRole = applyRole;
  applyRole = function() {
    originalApplyRole();
    if ($("adminSettingsNav")) $("adminSettingsNav").hidden = !isAdmin();
  };
  const originalGo = go;
  go = function(page) {
    if (page === "adminSettings" && !isAdmin()) {
      alert("Pengaturan ini hanya dapat diakses Admin.");
      return originalGo("mon");
    }
    originalGo(page);
    if (page === "adminSettings") renderAdminTools();
  };

  // Tampilkan menu baru untuk Admin yang sudah login sebelum kontrol ini dibuat.
  if (isAdmin()) navButton.hidden = false;
  renderAdminToolsIfAdmin();
  function renderAdminToolsIfAdmin() { if (isAdmin()) renderAdminTools(); }
})();
