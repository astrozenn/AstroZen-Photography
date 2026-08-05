import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {

    try {

        console.log("FUNCTION START");

        const supabaseUrl = process.env.KEY_SUPABASE_URL;
        const supabaseKey = process.env.KEY_SUPABASE_SERVICE_ROLE_KEY;

        console.log({
            url: !!supabaseUrl,
            key: !!supabaseKey
        });


        if (!supabaseUrl) {
            return res.status(500).json({
                error: "KEY_SUPABASE_URL missing"
            });
        }


        if (!supabaseKey) {
            return res.status(500).json({
                error: "KEY_SUPABASE_SERVICE_ROLE_KEY missing"
            });
        }


        const supabase = createClient(
            supabaseUrl,
            supabaseKey
        );


        console.log("SUPABASE CREATED");


        if (req.method !== "POST") {
            return res.status(405).json({
                error: "Method not allowed"
            });
        }


        const body = req.body || {};

        console.log("BODY:", body);


        const code = String(body.code || "")
            .trim()
            .toUpperCase();

        const email = String(body.email || "")
            .trim()
            .toLowerCase();


        if (!code || !email) {
            return res.status(400).json({
                valid:false,
                error:"Lipsesc datele"
            });
        }


        return res.status(200).json({
            valid:true,
            message:"API merge",
            code,
            email
        });


    } catch(error) {

        console.log("ERROR:", error);

        return res.status(500).json({
            error:error.message
        });

    }

}