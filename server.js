const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const KMeans = require('node-kmeans');
const path = require('path');
const cors = require('cors'); // Tambahkan CORS jika dibutuhkan

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors()); // Izinkan semua permintaan (opsional)
app.use(express.static(path.join(__dirname, 'public'))); // Melayani file statis dari folder 'public'

// Rute untuk mengambil data penduduk dari JSON
app.get('/data', (req, res) => {
    fs.readFile('./data/penduduk_data.json', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).send('Gagal membaca file.');
        }
        res.json(JSON.parse(data));
    });
});

// Rute untuk melakukan clustering dengan K-Means
app.post('/cluster', (req, res) => {
    const { k } = req.body; // Ambil nilai K dari permintaan
    console.log(`Received K: ${k}`); // Log nilai K yang diterima

    // Baca file JSON dengan data penduduk
    fs.readFile('./data/penduduk_data.json', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).send('Gagal membaca file.');
        }

        const pendudukData = JSON.parse(data); // Parse data JSON

        // Periksa jika jumlah data cukup untuk clustering
        if (pendudukData.length < k) {
            return res.status(400).send(`Jumlah data (${pendudukData.length}) kurang dari jumlah cluster (${k}).`);
        }

        const coords = pendudukData.map(p => [p.X, p.Y]); // Koordinat untuk clustering

        // Lakukan clustering dengan K-Means
        KMeans.clusterize(coords, { k: k }, (err, clusters) => {
            if (err) {
                console.error('Error during clustering:', err);
                return res.status(500).send('Gagal melakukan clustering.');
            }

            // Tambahkan properti 'cluster' ke setiap objek penduduk
            clusters.forEach((cluster, index) => {
                cluster.clusterInd.forEach((pointIndex) => {
                    pendudukData[pointIndex].cluster = index; // Tambahkan cluster
                });
            });

            console.log('Clustered Data:', pendudukData); // Log hasil clustering
            res.json({ penduduk: pendudukData, clusters }); // Kirim data ke frontend
        });
    });
});

// Rute untuk melayani file HTML utama
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Jalankan server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
