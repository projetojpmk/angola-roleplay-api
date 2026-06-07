import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { db } from "./db.js";
import { sendVIPCode } from "./discordBot.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

/**
 * 🌐 STATUS API
 */
app.get("/", (req, res) => {
    res.json({
        status: "OK",
        message: "VIP API está a funcionar 🚀",
        time: new Date()
    });
});

/**
 * 🧪 TESTE DB
 */
app.get("/test-db", (req, res) => {
    db.query("SELECT 1", (err, result) => {
        if (err) return res.status(500).json(err);

        res.json({
            status: "OK",
            result
        });
    });
});

/**
 * 💳 CRIAR PEDIDO VIP
 */
app.post("/vip/order", (req, res) => {
    const { username, mta_id, discord_id, vip_type, amount } = req.body;

    if (!username || !mta_id || !discord_id || !vip_type || !amount) {
        return res.status(400).json({
            error: "Dados incompletos"
        });
    }

    const sql = `
        INSERT INTO vip_orders 
        (user_id, username, discord_id, vip_type, amount, payment_status)
        VALUES (?, ?, ?, ?, ?, 'pending')
    `;

    db.query(
        sql,
        [mta_id, username, discord_id, vip_type, amount],
        (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).json({
                    error: "Erro ao criar pedido",
                    details: err
                });
            }

            res.json({
                message: "Pedido criado com sucesso",
                order_id: result.insertId,
                status: "pending"
            });
        }
    );
});

/**
 * 📋 VER PEDIDOS PENDENTES
 */
app.get("/admin/vip/pending", (req, res) => {
    const sql = "SELECT * FROM vip_orders WHERE payment_status = 'pending'";

    db.query(sql, (err, result) => {
        if (err) return res.status(500).json(err);

        res.json(result);
    });
});

/**
 * ✔ APROVAR VIP
 */
app.post("/admin/vip/approve", (req, res) => {
    const { order_id } = req.body;

    const getOrder = "SELECT * FROM vip_orders WHERE id = ?";

    db.query(getOrder, [order_id], (err, result) => {
        if (err) return res.status(500).json(err);

        if (result.length === 0) {
            return res.status(404).json({ error: "Pedido não encontrado" });
        }

        const order = result[0];
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // atualizar status
        db.query(
            "UPDATE vip_orders SET payment_status = 'approved' WHERE id = ?",
            [order_id]
        );

        // guardar código
        db.query(
            "INSERT INTO vip_codes (user_id, code, vip_type, used) VALUES (?, ?, ?, false)",
            [order.user_id, code, order.vip_type]
        );

        // enviar Discord
        sendVIPCode(
            order.discord_id,
            code,
            order.username,
            order.vip_type
        );

        res.json({
            message: "VIP aprovado com sucesso",
            code
        });
    });
});

/**
 * ❌ REJEITAR VIP
 */
app.post("/admin/vip/reject", (req, res) => {
    const { order_id } = req.body;

    const sql = "UPDATE vip_orders SET payment_status = 'rejected' WHERE id = ?";

    db.query(sql, [order_id], (err) => {
        if (err) return res.status(500).json(err);

        res.json({
            message: "Pedido rejeitado"
        });
    });
});

/**
 * 🚀 START SERVER
 */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("🔥 API running on port " + PORT);
});