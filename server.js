const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 10000;

// Serve tutti i file statici (HTML, CSS, JS) nella directory corrente
app.use(express.static(__dirname));

// Gestisci tutte le altre rotte inviando l'index.html principale
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server divino attivato sulla porta ${port}`);
});
