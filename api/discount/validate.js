import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);


export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }


    const body = req.body || {};

    const code = String(body.code || "").trim().toUpperCase();
    const email = String(body.email || "").trim().toLowerCase();


    if (!code || !email) {
        return res.status(400).json({
            valid: false,
            error: "Lipsesc datele"
        });
    }


    const discounts = {
        MAJORAT10: {
            code: "MAJORAT10",
            percent: 10,
            active: true
        },
        MAJORAT20: {
            code: "MAJORAT20",
            percent: 20,
            active: true
        },
        BRILA25: {
            code: "BRILA25",
            percent: 25,
            active: true
        }
    };


    const discount = discounts[code];


    if (!discount || !discount.active) {
        return res.status(404).json({
            valid: false,
            error: "Cod invalid"
        });
    }


    // verifică dacă acest email a folosit deja codul
    const { data: existing, error } = await supabase
        .from("discount_redemptions")
        .select("*")
        .eq("code", code)
        .eq("email", email)
        .maybeSingle();


    if (error) {
        return res.status(500).json({
            valid: false,
            error: "Database error"
        });
    }


    if (existing) {
        return res.status(409).json({
            valid: false,
            error: "Ai folosit deja acest cod"
        });
    }


    return res.json({
        valid: true,
        code: discount.code,
        percent: discount.percent
    });

}