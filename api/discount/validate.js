import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {

    console.log("START VALIDATE");

    try {

        if (req.method !== "POST") {
            return res.status(405).json({
                valid: false,
                error: "Method not allowed"
            });
        }


        console.log({
            url: !!process.env.SUPABASE_URL,
            key: !!process.env.SUPABASE_SERVICE_ROLE_KEY
        });



        if (!process.env.SUPABASE_URL) {
            return res.status(500).json({
                valid: false,
                error: "SUPABASE_URL missing"
            });
        }


        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return res.status(500).json({
                valid: false,
                error: "SUPABASE_SERVICE_ROLE_KEY missing"
            });
        }



        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );


        console.log("SUPABASE CREATED");



        const body = req.body || {};

        console.log("BODY:", body);



        const code = String(body.code || "")
            .trim()
            .toUpperCase();


        const email = String(body.email || "")
            .trim()
            .toLowerCase();



        if (!code) {
            return res.status(400).json({
                valid:false,
                error:"Lipseste codul"
            });
        }



        const discounts = {
            MAJORAT10: 10,
            MAJORAT20: 20,
            BRILA25: 25
        };



        const percent = discounts[code];



        if (!percent) {

            return res.status(404).json({
                valid:false,
                error:"Cod invalid"
            });

        }



        if (email) {

            const { data: existing, error } = await supabase
                .from("discount_redemptions")
                .select("*")
                .eq("code", code)
                .eq("email", email)
                .maybeSingle();



            if (error) {

                console.log("SUPABASE CHECK ERROR:", error);

                return res.status(500).json({
                    valid:false,
                    error:error.message
                });

            }



            if (existing) {

                return res.status(409).json({
                    valid:false,
                    error:"Ai folosit deja acest cod"
                });

            }

        }



        return res.status(200).json({

            valid:true,
            code,
            percent

        });



    } catch(error) {


        console.log("REAL ERROR:", error);


        return res.status(500).json({

            valid:false,
            error:error.message,
            stack:error.stack

        });

    }

}