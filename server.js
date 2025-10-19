// ローカル開発用サーバー
// Vercel CLIを使わずにNode.jsで直接実行

const http = require('http');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// API handler をインポート
const playersHandler = require('./api/players-api.js');
const clanHandler = require('./api/clan-api.js');

const PORT = process.env.PORT || 3000;

// MIMEタイプのマッピング
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
};

// レスポンスオブジェクトのラッパー（Vercel互換）
function createResponseWrapper(res) {
    return {
        status: (code) => {
            res.statusCode = code;
            return {
                json: (data) => {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(data));
                },
                end: () => {
                    res.end();
                }
            };
        },
        setHeader: (key, value) => {
            res.setHeader(key, value);
        }
    };
}

const server = http.createServer(async (req, res) => {
    console.log(`${req.method} ${req.url}`);

    // API エンドポイント
    if (req.url.startsWith('/api/playerapi')) {
        const wrappedRes = createResponseWrapper(res);
        await playersHandler(req, wrappedRes);
        return;
    }

    if (req.url.startsWith('/api/clan-api')) {
        const wrappedRes = createResponseWrapper(res);
        await clanHandler(req, wrappedRes);
        return;
    }

    // 静的ファイルの配信
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - File Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log('');
    console.log('🚀 Local development server started!');
    console.log('');
    console.log(`   Local:    http://localhost:${PORT}`);
    console.log('');
    console.log('Press Ctrl+C to stop');
    console.log('');
});
