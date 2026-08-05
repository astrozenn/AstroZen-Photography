import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }


    try {

        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );


        const body = req.body || {};


        const code = String(body.code || "")
            .trim()
            .toUpperCase();


        const email = String(body.email || "")
            .trim()
            .toLowerCase();



        if (!code || !email) {
            return res.status(400).json({
                valid: false,
                error: "Lipsesc datele"
            });
        }



        const discounts = {
            MAJORAT10: 10,
            MAJORAT20: 20,
            BRILA25: 25
        };


        const discountPercent = discounts[code];


        if (!discountPercent) {
            return res.status(404).json({
                valid: false,
                error: "Cod invalid"
            });
        }



        // verifică dacă email-ul a mai folosit codul
        const { data: existing, error: checkError } = await supabase
            .from("discount_redemptions")
            .select("*")
            .eq("code", code)
            .eq("email", email)
            .maybeSingle();



        if (checkError) {

            console.log("SUPABASE CHECK ERROR:", checkError);

            return res.status(500).json({
                valid: false,
                error: checkError.message
            });

        }



        if (existing) {

            return res.status(409).json({
                valid: false,
                error: "Ai folosit deja acest cod"
            });

        }



        // salvează folosirea codului
        const { error: insertError } = await supabase
            .from("discount_redemptions")
            .insert([
                {
                    code,
                    email
                }
            ]);



        if (insertError) {

            console.log("SUPABASE INSERT ERROR:", insertError);

            return res.status(500).json({
                valid: false,
                error: insertError.message
            });

        }



        return res.json({
            success: true,
            code,
            percent: discountPercent
        });



    } catch (error) {

        console.log("ERROR:", error);

        return res.status(500).json({
            valid: false,
            error: error.message
        });

    }

}