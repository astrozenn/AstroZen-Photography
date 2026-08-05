import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {

    try {

        console.log("FUNCTION START");

        console.log({
            url: !!process.env.SUPABASE_URL,
            key: !!process.env.SUPABASE_SERVICE_ROLE_KEY
        });

        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        console.log("SUPABASE CREATED");


        if (req.method !== "POST") {
            return res.status(405).json({
                error:"Method not allowed"
            });
        }


        const body = req.body || {};

        console.log("BODY:", body);


        return res.json({
            test:true
        });


    } catch(error) {

        console.log("ERROR:", error);

        return res.status(500).json({
            error:error.message
        });

    }

}