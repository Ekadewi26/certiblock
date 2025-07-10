import { useState } from 'react';
import { ethers } from 'ethers';
import jsPDF from 'jspdf';
import './index.css';
import abi from './contracts/abi.json';
import ijazahTemplate from './assets/ijazah.png';

const CONTRACT_ADDRESS = "0xeBA2A5058eA816A1Da29a22C8ef33Afe789e049A";

function App() {
  const [account, setAccount] = useState(null);
  const [formData, setFormData] = useState({
    name: '', nim: '', program: '', year: '', ipfsHash: ''
  });
  const [verifyInput, setVerifyInput] = useState('');
  const [verifyResult, setVerifyResult] = useState('');
  const [verifiedData, setVerifiedData] = useState(null);

  // 🔌 Sambungkan ke Wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Metamask tidak terdeteksi.");
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setAccount(address);
    } catch (error) {
      alert("Gagal menyambungkan wallet.");
    }
  };

  // 📥 Input data form
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 📝 Tambahkan ijazah ke blockchain
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!window.ethereum) throw new Error("MetaMask tidak terdeteksi");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

      const tx = await contract.addCertificate(
        formData.nim,
        formData.name,
        formData.program,
        parseInt(formData.year),
        formData.ipfsHash
      );
      await tx.wait();
      alert("✅ Data ijazah berhasil ditambahkan ke blockchain!");
    } catch (err) {
      alert("❌ Gagal menambahkan: " + err.message);
    }
  };

  // 🔍 Verifikasi ijazah berdasarkan NIM
  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      if (!window.ethereum) throw new Error("MetaMask tidak terdeteksi");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

      const data = await contract.verifyCertificate(verifyInput.trim());

      if (!data.name || data.year.toString() === "0") {
        setVerifyResult("❌ Data ijazah tidak ditemukan.");
        setVerifiedData(null);
      } else {
        setVerifyResult("✅ Data Ditemukan!");
        setVerifiedData({
          name: data.name,
          nim: verifyInput.trim(),
          program: data.program,
          year: data.year,
          ipfsHash: data.ipfsHash
        });
      }
    } catch (err) {
      setVerifyResult("Terjadi kesalahan: " + err.message);
      setVerifiedData(null);
    }
  };

  // ⬇️ Unduh sebagai PDF
const handleDownloadPDF = () => {
  if (!verifiedData) return;

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: [842, 595],
  });

  const img = new Image();
  img.src = ijazahTemplate;

  img.onload = () => {
    doc.addImage(img, "PNG", 0, 0, 842, 595);

    doc.setFont("Times", "normal");
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);

    // Isi otomatis sesuai posisi titik dua di template
    doc.text(`${verifiedData.name}`, 380, 185);
    doc.text(`${verifiedData.nim}`, 380, 215);
    doc.text(`${verifiedData.program}`, 380, 245);
    doc.text(`${verifiedData.year}`, 380, 275);

    // ➕ Keterangan tambahan otomatis
    const description = `telah menyelesaikan studi pada Program Sarjana Fakultas Sains dan Teknologi dengan gelar S.Kom.`;
    doc.setFontSize(16);
    doc.text(description, 100, 320); // atur posisinya agar pas

    // ➕ IPFS link (jika ada)
    if (verifiedData.ipfsHash) {
      doc.setTextColor(0, 102, 204);
      doc.textWithLink(`https://ipfs.io/ipfs/${verifiedData.ipfsHash}`, 280, 370, {
        url: `https://ipfs.io/ipfs/${verifiedData.ipfsHash}`,
      });
    }

    doc.save(`Ijazah-${verifiedData.nim}.pdf`);
  };
};


  return (
    <div className="min-h-screen bg-gray-100 py-10 px-6">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-red-600">CertiBlock</h1>
        <button
          onClick={connectWallet}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {account ? `Wallet: ${account.slice(0, 6)}...` : "Sambungkan Wallet"}
        </button>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Form Tambah */}
        <div className="bg-white shadow rounded p-6">
          <h2 className="text-xl font-semibold mb-4">Tambah Ijazah</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input name="name" onChange={handleChange} placeholder="Nama Mahasiswa" className="w-full p-2 border rounded" required />
            <input name="nim" onChange={handleChange} placeholder="NIM" className="w-full p-2 border rounded" required />
            <input name="program" onChange={handleChange} placeholder="Program Studi" className="w-full p-2 border rounded" required />
            <input name="year" type="number" onChange={handleChange} placeholder="Tahun Lulus" className="w-full p-2 border rounded" required />
            <input name="ipfsHash" onChange={handleChange} placeholder="IPFS Hash (opsional)" className="w-full p-2 border rounded" />
            <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
              Unggah ke Blockchain
            </button>
          </form>
        </div>

        {/* Form Verifikasi */}
        <div className="bg-white shadow rounded p-6">
          <h2 className="text-xl font-semibold mb-4">Verifikasi Ijazah</h2>
          <form onSubmit={handleVerify} className="space-y-3">
            <input value={verifyInput} onChange={(e) => setVerifyInput(e.target.value)} placeholder="Masukkan NIM" className="w-full p-2 border rounded" required />
            <button type="submit" className="w-full bg-blue-700 text-white py-2 rounded hover:bg-blue-800">
              Verifikasi
            </button>
          </form>

          {verifyResult && (
            <div className="mt-4 bg-gray-50 p-3 rounded border text-green-700 font-medium space-y-2">
              <p>{verifyResult}</p>
              {verifiedData && (
                <>
                  <p>• Nama: {verifiedData.name}</p>
                  <p>• Program: {verifiedData.program}</p>
                  <p>• Tahun: {verifiedData.year}</p>
                  <p>• IPFS: {verifiedData.ipfsHash ? (
                    <a href={`https://ipfs.io/ipfs/${verifiedData.ipfsHash}`} className="text-blue-600 underline" target="_blank">
                      {verifiedData.ipfsHash}
                    </a>
                  ) : "(tidak tersedia)"}</p>

                  <button
                    onClick={handleDownloadPDF}
                    className="mt-4 bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
                  >
                    Unduh PDF
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <footer className="mt-10 text-center text-sm text-gray-500">
        © 2025 CertiBlock. Sistem Verifikasi Ijazah Berbasis Blockchain.
      </footer>
    </div>
  );
}

export default App;
