import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { db } from "./db.js";
import { client, sendVIPCode } from "./discordBot.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

/* =====================================================
   🌐 STATUS DA API
===================================================== */
app.get("/", (req, res) => {
    res.send("Angola RP API ONLINE 🚀");
});

/* =====================================================
   🧪 TESTE DE CONEXÃO COM DB
===================================================== */
app.get("/test-db", (req, res) => {
    db.query("SELECT 1", (err, result) => {
        if (err) return res.status(500).json(err);

        res.json({
            status: "OK",
            result
        });
    });
});

/* =====================================================
   💳 CRIAR PEDIDO VIP (MULTICAIXA EXPRESS)
===================================================== */
app.post("/vip/order", (req, res) => {
    const { username, mta_id, discord_id, vip_type, amount } = req.body;

    if (!username || !mta_id || !discord_id || !vip_type || !amount) {
        return res.status(400).json({
            error: "Dados incompletos"
        });
    }

    const sql = `
        INSERT INTO vip_orders (user_id, vip_type, amount, payment_status)
        VALUES (?, ?, ?, 'pending')
    `;

    db.query(sql, [mta_id, vip_type, amount], (err, result) => {
        if (err) {
            return res.status(500).json({
                error: "Erro ao criar pedido",
                details: err
            });
        }

        res.json({
            message: "Pedido VIP criado com sucesso",
            order_id: result.insertId,
            status: "pending"
        });
    });
});

/* =====================================================
   🧪 TESTE VIP
===================================================== */
app.get("/vip/test", (req, res) => {
    res.json({
        status: "OK",
        message: "VIP API está a funcionar 🚀",
        time: new Date()
    });
});

/* =====================================================
   👨‍💼 ADMIN - LISTAR PEDIDOS PENDENTES
===================================================== */
app.get("/admin/vip/pending", (req, res) => {
    const sql = "SELECT * FROM vip_orders WHERE payment_status = 'pending'";

    db.query(sql, (err, result) => {
        if (err) return res.status(500).json(err);

        res.json(result);
    });
});

/* =====================================================
   🔑 GERADOR DE CÓDIGO VIP
===================================================== */
function generateVIPCode() {
    const random = Math.floor(10000 + Math.random() * 90000);
    return `VIP-${random}-ARP`;
}

/* =====================================================
   ✔ APROVAR PEDIDO + GERAR CÓDIGO VIP
===================================================== */
app.post("/admin/vip/approve", (req, res) => {
    const { order_id } = req.body;

    db.query("SELECT * FROM vip_orders WHERE id = ?", [order_id], (err, result) => {
        if (err) return res.status(500).json(err);

        if (result.length === 0) {
            return res.status(404).json({ error: "Pedido não encontrado" });
        }

        const order = result[0];
        const code = generateVIPCode();

        // Atualizar pedido
        db.query(
            "UPDATE vip_orders SET payment_status = 'approved' WHERE id = ?",
            [order_id]
        );

        // Criar código VIP
        db.query(
            "INSERT INTO vip_codes (user_id, code, vip_type, used) VALUES (?, ?, ?, false)",
            [order.user_id, code, order.vip_type]
        );

        res.json({
            message: "Pedido aprovado com sucesso",
            code: code
        });
    });
});

/* =====================================================
   ❌ REJEITAR PEDIDO
===================================================== */
app.post("/admin/vip/reject", (req, res) => {
    const { order_id } = req.body;

    const sql = "UPDATE vip_orders SET payment_status = 'rejected' WHERE id = ?";

    db.query(sql, [order_id], (err, result) => {
        if (err) return res.status(500).json(err);

        res.json({
            message: "Pedido rejeitado",
            order_id
        });
    });
});

/* =====================================================
   🚀 START SERVER
===================================================== */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("🔥 API running on port " + PORT);
});
client.login(process.env.DISCORD_TOKEN);